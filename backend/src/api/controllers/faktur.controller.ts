import { Router, Request, Response } from 'express';
import { PrismaClient, FakturStatus } from '@prisma/client';
import { FakturService } from '../../domain/sales/faktur.service';

const prisma = new PrismaClient();
const router = Router();
const fakturService = new FakturService();

// GET /api/fakturs
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const status = req.query.status as string;
        const customerId = req.query.customerId as string;

        const skip = (page - 1) * limit;

        const where: any = {};

        if (customerId && customerId !== 'All') {
            where.customerId = customerId;
        }

        if (search) {
            where.OR = [
                { fakturNumber: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        if (status && status !== 'All') {
            if (status.includes(',')) {
                where.status = { in: status.split(',') as FakturStatus[] };
            } else {
                where.status = status as FakturStatus;
            }
        }

        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        if (startDate || endDate) {
            where.fakturDate = {};
            if (startDate) {
                where.fakturDate.gte = new Date(startDate);
            }
            if (endDate) {
                // Set to end of day or simply use the date if time is not stored. 
                // Assuming fakturDate is DateTime in Prisma, we want inclusive up to end of that day.
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.fakturDate.lte = end;
            }
        }

        const total = await prisma.faktur.count({ where });

        const fakturs = await prisma.faktur.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                fakturDate: 'desc',
            },
            include: {
                customer: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Shape data for frontend
        const formattedFakturs = fakturs.map(faktur => ({
            id: faktur.id,
            fakturNumber: faktur.fakturNumber,
            customerName: faktur.customer.name,
            description: faktur.notes || faktur.customer.name,
            fakturDate: faktur.fakturDate.toISOString().split('T')[0],
            salesPerson: faktur.createdBy || 'Unknown',
            total: Number(faktur.totalAmount),
            status: faktur.status
        }));

        res.json({
            data: formattedFakturs,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching fakturs:', error);
        res.status(500).json({ error: 'Failed to fetch fakturs' });
    }
});

// GET /api/fakturs/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const faktur = await prisma.faktur.findUnique({
            where: { id },
            include: {
                customer: true,
                lines: {
                    include: {
                        item: true
                    }
                },
                salesOrder: true
            }
        });

        if (!faktur) {
            return res.status(404).json({ error: 'Faktur not found' });
        }

        res.json(faktur);
    } catch (error) {
        console.error('Error fetching faktur:', error);
        res.status(500).json({ error: 'Failed to fetch faktur' });
    }
});

// POST /api/fakturs
router.post('/', async (req: Request, res: Response) => {
    try {
        const companyId = req.body.companyId || (await prisma.company.findFirst())?.id;
        if (!companyId) return res.status(400).json({ error: 'No company found. Please create a company first.' });

        // User ID handling (mock or from request body if no auth middleware yet)
        const userId = req.body.createdBy || 'SYSTEM';

        const faktur = await fakturService.create(companyId, req.body, userId);
        res.status(201).json(faktur);
    } catch (error: any) {
        console.error('Error creating faktur:', error);
        res.status(500).json({ error: error.message || 'Failed to create faktur' }); // Use 500 or 400 depending on error, safe default
    }
});

// PUT /api/fakturs/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.body.createdBy || 'SYSTEM';

        const faktur = await fakturService.update(id, req.body, userId);
        res.json(faktur);
    } catch (error: any) {
        console.error('Error updating faktur:', error);
        res.status(500).json({ error: error.message || 'Failed to update faktur' });
    }
});

// DELETE /api/fakturs/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await fakturService.delete(id);
        res.json(result);
    } catch (error: any) {
        console.error('Error deleting faktur:', error);
        res.status(500).json({ error: error.message || 'Failed to delete faktur' });
    }
});

export default router;
