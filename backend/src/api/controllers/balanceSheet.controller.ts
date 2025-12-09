import { Request, Response } from 'express';
import prisma from '../../infrastructure/database';
import { AccountType } from '@prisma/client';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        companyId: string;
        role: string;
    };
}

export class BalanceSheetController {
    static async getBalanceSheet(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const { endDate } = req.query;
            const companyId = authReq.user?.companyId;

            // Optional: If companyId is present, filter by it. If not, fetch all active accounts (like Income Statement).
            const whereClause: any = {
                isActive: true,
            };

            if (companyId) {
                whereClause.companyId = companyId;
            }

            const dateLimit = endDate ? new Date(endDate as string) : new Date();
            // Set to end of day
            dateLimit.setHours(23, 59, 59, 999);

            // 1. Fetch all accounts
            const accounts = await prisma.account.findMany({
                where: whereClause,
                include: {
                    journalLines: {
                        where: {
                            journal: {
                                transactionDate: {
                                    lte: dateLimit,
                                },
                            },
                        },
                        select: {
                            debit: true,
                            credit: true,
                        },
                    },
                },
            });

            // 2. Initialize structure
            const result = {
                assets: {
                    current: [] as any[],
                    fixed: [] as any[],
                    total: 0,
                },
                liabilities: {
                    current: [] as any[],
                    longTerm: [] as any[],
                    total: 0,
                },
                equity: {
                    items: [] as any[],
                    total: 0,
                },
                summary: {
                    totalAssets: 0,
                    totalLiabilitiesAndEquity: 0,
                    isBalanced: false,
                },
            };

            let retainedEarnings = 0;

            // 3. Process accounts
            for (const account of accounts) {
                // Calculate raw balance from journal lines
                const totalDebit = account.journalLines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
                const totalCredit = account.journalLines.reduce((sum: number, line: any) => sum + Number(line.credit), 0);

                let netBalance = 0;
                let category: 'current' | 'fixed' | 'longTerm' | 'items' | '' = '';
                let section: 'assets' | 'liabilities' | 'equity' | '' = '';

                // Determine if P&L account (for Retained Earnings) or Balance Sheet account
                const isPnL = ([
                    AccountType.REVENUE,
                    AccountType.OTHER_INCOME,
                    AccountType.COGS,
                    AccountType.EXPENSE,
                    AccountType.OTHER_EXPENSE,
                ] as AccountType[]).includes(account.type);

                if (isPnL) {
                    // Add to Retained Earnings
                    // Revenue/Income is Credit normal (+Credit -Debit)
                    // Expense is Debit normal (+Debit -Credit) so contribution to profit is -Debit +Credit
                    retainedEarnings += (totalCredit - totalDebit);
                    continue;
                }

                // Handle Balance Sheet Accounts
                switch (account.type) {
                    // ASSETS (Normal Debit)
                    case AccountType.CASH_AND_BANK:
                    case AccountType.ACCOUNTS_RECEIVABLE:
                    case AccountType.INVENTORY:
                    case AccountType.OTHER_CURRENT_ASSETS:
                        netBalance = totalDebit - totalCredit;
                        category = 'current';
                        section = 'assets';
                        break;
                    case AccountType.FIXED_ASSETS:
                    case AccountType.OTHER_ASSETS:
                        netBalance = totalDebit - totalCredit;
                        category = 'fixed';
                        section = 'assets';
                        break;
                    case AccountType.ACCUMULATED_DEPRECIATION:
                        // Contra asset
                        netBalance = (totalCredit - totalDebit) * -1; // Make it negative for asset section
                        category = 'fixed';
                        section = 'assets';
                        break;

                    // LIABILITIES (Normal Credit)
                    case AccountType.ACCOUNTS_PAYABLE:
                    case AccountType.OTHER_CURRENT_LIABILITIES:
                        netBalance = totalCredit - totalDebit;
                        category = 'current';
                        section = 'liabilities';
                        break;
                    case AccountType.LONG_TERM_LIABILITIES:
                        netBalance = totalCredit - totalDebit;
                        category = 'longTerm';
                        section = 'liabilities';
                        break;

                    // EQUITY (Normal Credit)
                    case AccountType.EQUITY:
                        netBalance = totalCredit - totalDebit;
                        category = 'items';
                        section = 'equity';
                        break;
                }

                if (section && Math.abs(netBalance) > 0) {
                    if (section === 'assets') {
                        if (category === 'current' || category === 'fixed') {
                            result.assets[category].push({
                                code: account.code,
                                name: account.name,
                                amount: netBalance
                            });
                            result.assets.total += netBalance;
                        }
                    } else if (section === 'liabilities') {
                        if (category === 'current' || category === 'longTerm') {
                            result.liabilities[category].push({
                                code: account.code,
                                name: account.name,
                                amount: netBalance
                            });
                            result.liabilities.total += netBalance;
                        }
                    } else if (section === 'equity') {
                        if (category === 'items') {
                            result.equity.items.push({
                                code: account.code,
                                name: account.name,
                                amount: netBalance
                            });
                            result.equity.total += netBalance;
                        }
                    }
                }
            }

            // 4. Add Retained Earnings to Equity
            if (retainedEarnings !== 0) {
                result.equity.items.push({
                    code: '3999',
                    name: 'Laba Ditahan (Retained Earnings)',
                    amount: retainedEarnings
                });
                result.equity.total += retainedEarnings;
            }

            // 5. Final Totals
            result.summary.totalAssets = result.assets.total;
            result.summary.totalLiabilitiesAndEquity = result.liabilities.total + result.equity.total;

            result.summary.isBalanced = Math.abs(result.summary.totalAssets - result.summary.totalLiabilitiesAndEquity) < 0.01;

            return res.json(result);

        } catch (error) {
            console.error('Error getting balance sheet:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}
