
import { Router, Request, Response } from 'express';
import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/accounts/dropdown - Lightweight endpoint for dropdowns (no pagination)
router.get('/dropdown', async (req: Request, res: Response) => {
    try {
        const type = req.query.type as string;

        const where: any = { isActive: true };

        if (type && type !== 'Semua') {
            if (type.includes(',')) {
                const types = type.split(',').map(t => t.trim()) as AccountType[];
                where.type = { in: types };
            } else {
                where.type = type as AccountType;
            }
        }

        const accounts = await prisma.account.findMany({
            where,
            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                isHeader: true,
                parentId: true
            },
            orderBy: { code: 'asc' }
        });

        res.json({ data: accounts });
    } catch (error) {
        console.error('Error fetching accounts dropdown:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// GET /api/accounts - Paginated list for tables
router.get('/', async (req: Request, res: Response) => {
    try {
        const type = req.query.type as string;
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (type && type !== 'Semua') {
            if (type.includes(',')) {
                const types = type.split(',').map(t => t.trim()) as AccountType[];
                where.type = { in: types };
            } else {
                where.type = type as AccountType;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [total, accounts] = await Promise.all([
            prisma.account.count({ where }),
            prisma.account.findMany({
                where,
                skip,
                take: limit,
                orderBy: { code: 'asc' },
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    _count: {
                        select: { children: true }
                    }
                }
            })
        ]);

        // Calculate Balances dynamically from JournalLines
        const accountIds = accounts.map(a => a.id);
        const journalAggregates = await prisma.journalLine.groupBy({
            by: ['accountId'],
            where: {
                accountId: { in: accountIds }
            },
            _sum: {
                debit: true,
                credit: true
            }
        });

        // Map aggregates to accounts
        const balanceMap = new Map<string, { debit: number, credit: number }>();
        journalAggregates.forEach(agg => {
            const debit = Number(agg._sum.debit || 0);
            const credit = Number(agg._sum.credit || 0);
            balanceMap.set(agg.accountId, { debit, credit });
        });

        const accountsWithBalance = accounts.map(acc => {
            const stats = balanceMap.get(acc.id) || { debit: 0, credit: 0 };

            // Determine Normal Balance based on Type
            // ASSET, EXPENSE, COGS = Normal DEBIT
            // LIABILITY, EQUITY, INCOME/REVENUE = Normal CREDIT
            const typeStr = String(acc.type);

            const isDebitNormal =
                typeStr.includes('ASSET') ||
                typeStr.includes('EXPENSE') ||
                typeStr === 'COGS' ||
                typeStr === 'CASH_AND_BANK' ||
                typeStr === 'ACCOUNTS_RECEIVABLE' ||
                typeStr === 'INVENTORY';

            let normalBalance = 0;
            if (isDebitNormal) {
                normalBalance = stats.debit - stats.credit;
            } else {
                normalBalance = stats.credit - stats.debit;
            }

            return {
                ...acc,
                balance: normalBalance,
                debitTotal: stats.debit,
                creditTotal: stats.credit
            };
        });

        res.json({
            data: accountsWithBalance,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + limit < total
        });

    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// GET /api/accounts/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true
            }
        });

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({ data: account });
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

// POST /api/accounts
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            code,
            name,
            type, // Expecting AccountType enum value
            parentId,
            isHeader,
            balance
        } = req.body;

        if (!code || !name || !type) {
            return res.status(400).json({ error: 'Kode, Nama, dan Tipe Akun wajib diisi' });
        }

        // Check duplicate code
        const existing = await prisma.account.findFirst({
            where: { code }
        });
        if (existing) {
            return res.status(400).json({ error: 'Kode Akun sudah digunakan' });
        }

        // Get Company (default)
        const company = await prisma.company.findFirst();
        if (!company) return res.status(500).json({ error: 'Company not found' });

        // Calculate Level
        let level = 0;
        if (parentId) {
            const parent = await prisma.account.findUnique({ where: { id: parentId } });
            if (parent) {
                level = parent.level + 1;
            }
        }

        const newAccount = await prisma.account.create({
            data: {
                id: crypto.randomUUID(),
                companyId: company.id,
                code,
                name,
                type: type as AccountType,
                parentId: parentId || null,
                isHeader: isHeader || false,
                level,
                isActive: true
            }
        });

        res.status(201).json({
            data: newAccount,
            message: 'Akun berhasil dibuat'
        });

    } catch (error: any) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Gagal membuat akun' });
    }
});

// PUT /api/accounts/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            code,
            name,
            type,
            parentId,
            isHeader,
            description,
            balance,
            isActive
        } = req.body;

        // Calculate Level if parent changes
        let level = undefined;
        if (parentId) {
            const parent = await prisma.account.findUnique({ where: { id: parentId } });
            if (parent) {
                level = parent.level + 1;
            }
        } else if (parentId === null) {
            level = 0;
        }

        const updatedAccount = await prisma.account.update({
            where: { id },
            data: {
                code,
                name,
                type: type as AccountType,
                parentId,
                isHeader,
                level,
                isActive
            }
        });

        res.json({
            data: updatedAccount,
            message: 'Akun berhasil diupdate'
        });

    } catch (error: any) {
        console.error('Error updating account:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Kode Akun sudah digunakan' });
        }
        res.status(500).json({ error: 'Gagal mengupdate akun' });
    }
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for children
        const childrenCount = await prisma.account.count({
            where: { parentId: id }
        });

        if (childrenCount > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus akun yang memiliki sub-akun (anak).' });
        }

        // Check for usage in transactions (JournalLine)
        // const usageCount = await prisma.journalLine.count({ where: { accountId: id } });
        // if (usageCount > 0) return res.status(400).json({ error: 'Akun sudah digunakan dalam transaksi.' });

        await prisma.account.delete({ where: { id } });

        res.json({ message: 'Akun berhasil dihapus' });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Gagal menghapus akun' });
    }
});

export default router;
