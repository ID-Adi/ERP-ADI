
import { Router, Request, Response } from 'express';
// controller wrapper
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { BalanceSheetController } from './balanceSheet.controller';

const prisma = new PrismaClient();
const router = Router();

// Validation schema for trial balance query
const trialBalanceSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
});

// GET /api/reports/trial-balance
router.get('/trial-balance', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate query params
        const validation = trialBalanceSchema.safeParse({ startDate, endDate });
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        // Adjust end date to include the entire day if needed, but usually dates are treated as inclusive 00:00 to 23:59 if time is involved.
        // For date comparison in Prisma with simple dates, let's assume valid ISO strings.
        // If DB stores DateTime, we might need to handle time part. 
        // Usually "toDate" should be end of that day.
        const endOfDay = new Date(endDate as string);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all accounts
        const accounts = await prisma.account.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                code: 'asc',
            },
        });

        // We need to calculate balances for each account
        // Optimization: Fetch all journal lines grouped by account id and aggregated
        // But we need to split by date range (before start, and between start-end)

        // 1. Initial Balance (Before Start Date)
        const initialBalances = await prisma.journalLine.groupBy({
            by: ['accountId'],
            where: {
                journal: {
                    transactionDate: {
                        lt: start,
                    },
                },
            },
            _sum: {
                debit: true,
                credit: true,
            },
        });

        // 2. Movements (Between Start and End Date)
        const movements = await prisma.journalLine.groupBy({
            by: ['accountId'],
            where: {
                journal: {
                    transactionDate: {
                        gte: start,
                        lte: endOfDay,
                    },
                },
            },
            _sum: {
                debit: true,
                credit: true,
            },
        });

        // Map results to accounts
        const reportData = accounts.map((account) => {
            const initial = initialBalances.find((b) => b.accountId === account.id);
            const move = movements.find((m) => m.accountId === account.id);

            const initDebit = Number(initial?._sum.debit || 0);
            const initCredit = Number(initial?._sum.credit || 0);
            const moveDebit = Number(move?._sum.debit || 0);
            const moveCredit = Number(move?._sum.credit || 0);

            // Determine Opening Balance net position
            // Usually Trial Balance displays Opening Debit/Credit, Mutation Debit/Credit, Ending Debit/Credit

            // Net Opening
            const netOpening = initDebit - initCredit;
            const openingDebit = netOpening > 0 ? netOpening : 0;
            const openingCredit = netOpening < 0 ? Math.abs(netOpening) : 0;

            // Net Ending
            const endingNet = netOpening + (moveDebit - moveCredit);
            const endingDebit = endingNet > 0 ? endingNet : 0;
            const endingCredit = endingNet < 0 ? Math.abs(endingNet) : 0;

            return {
                id: account.id,
                code: account.code,
                name: account.name,
                type: account.type, // Useful for grouping
                opening: {
                    debit: openingDebit,
                    credit: openingCredit,
                    net: netOpening
                },
                mutation: {
                    debit: moveDebit,
                    credit: moveCredit,
                    net: moveDebit - moveCredit
                },
                ending: {
                    debit: endingDebit,
                    credit: endingCredit,
                    net: endingNet
                }
            };
        });

        // Filter out accounts with all zeros? Optionally. 
        // Usually accountants want to see all active accounts or valid accounts.
        // Let's keep them for now, or maybe filter if "filter=nonZero" is passed.

        res.json({ data: reportData });

    } catch (error) {
        console.error('Error generating trial balance:', error);
        res.status(500).json({ error: 'Failed to generate trial balance' });
    }
});

// GET /api/reports/balance-sheet
router.get('/balance-sheet', BalanceSheetController.getBalanceSheet);

// GET /api/reports/income-statement
router.get('/income-statement', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate query params (reuse trialBalanceSchema as it has same fields)
        const validation = trialBalanceSchema.safeParse({ startDate, endDate });
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const start = new Date(startDate as string);
        const endOfDay = new Date(endDate as string);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch accounts relevant to Income Statement
        // REVENUE, COGS, EXPENSE, OTHER_INCOME, OTHER_EXPENSE
        const incomeStatementTypes = [
            'REVENUE',
            'COGS',
            'EXPENSE',
            'OTHER_INCOME',
            'OTHER_EXPENSE'
        ];

        const accounts = await prisma.account.findMany({
            where: {
                type: {
                    in: incomeStatementTypes as any // Cast to any to avoid strict enum typing issues in simple query if types are imported differently
                },
                isActive: true,
            },
            orderBy: {
                code: 'asc',
            },
        });

        // Fetch movements for these accounts within the period
        const movements = await prisma.journalLine.groupBy({
            by: ['accountId'],
            where: {
                account: {
                    type: {
                        in: incomeStatementTypes as any
                    }
                },
                journal: {
                    transactionDate: {
                        gte: start,
                        lte: endOfDay,
                    },
                },
            },
            _sum: {
                debit: true,
                credit: true,
            },
        });

        // Aggregate data
        const accountData = accounts.map(account => {
            const move = movements.find(m => m.accountId === account.id);
            const debit = Number(move?._sum.debit || 0);
            const credit = Number(move?._sum.credit || 0);

            // For Income Statement:
            // Revenue/Income: Credit balance (Credit - Debit)
            // Expense/COGS: Debit balance (Debit - Credit)

            let amount = 0;
            if (['REVENUE', 'OTHER_INCOME'].includes(account.type)) {
                amount = credit - debit;
            } else {
                amount = debit - credit;
            }

            return {
                id: account.id,
                code: account.code,
                name: account.name,
                type: account.type,
                amount: amount
            };
        });

        // Group by section
        const revenue = accountData.filter(a => a.type === 'REVENUE');
        const cogs = accountData.filter(a => a.type === 'COGS');
        const expenses = accountData.filter(a => a.type === 'EXPENSE');
        const otherCheck = accountData.filter(a => ['OTHER_INCOME', 'OTHER_EXPENSE'].includes(a.type));

        // Calculate Totals
        const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
        const totalCOGS = cogs.reduce((sum, item) => sum + item.amount, 0);
        const grossProfit = totalRevenue - totalCOGS; // COGS is positive number here (Debit balance), so Revenue - COGS

        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const operatingIncome = grossProfit - totalExpenses;

        const totalOtherIncome = otherCheck
            .filter(a => a.type === 'OTHER_INCOME')
            .reduce((sum, item) => sum + item.amount, 0);

        const totalOtherExpense = otherCheck
            .filter(a => a.type === 'OTHER_EXPENSE')
            .reduce((sum, item) => sum + item.amount, 0);

        const netIncome = operatingIncome + totalOtherIncome - totalOtherExpense;

        res.json({
            data: {
                period: {
                    from: startDate,
                    to: endDate
                },
                sections: {
                    revenue: {
                        items: revenue,
                        total: totalRevenue
                    },
                    cogs: {
                        items: cogs,
                        total: totalCOGS
                    },
                    grossProfit,
                    expenses: {
                        items: expenses,
                        total: totalExpenses
                    },
                    operatingIncome,
                    otherItems: {
                        items: otherCheck,
                        totalIncome: totalOtherIncome,
                        totalExpense: totalOtherExpense,
                        net: totalOtherIncome - totalOtherExpense
                    },
                    netIncome
                }
            }
        });

    } catch (error) {
        console.error('Error generating income statement:', error);
        res.status(500).json({ error: 'Failed to generate income statement' });
    }
});

export default router;
