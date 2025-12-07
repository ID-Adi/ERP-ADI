import { Router, Request, Response } from 'express';
import { PrismaClient, FakturStatus } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/fakturs
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const status = req.query.status as string;

        const skip = (page - 1) * limit;

        const where: any = {};

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
            where.status = status as FakturStatus;
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
        const {
            companyId,
            fakturNumber,
            fakturDate,
            dueDate,
            customerId,
            salesOrderId,
            currency,
            subtotal,
            discountPercent,
            discountAmount,
            taxPercent,
            taxAmount,
            totalAmount,
            amountPaid,
            balanceDue,
            notes,
            createdBy,
            lines
        } = req.body;

        const faktur = await prisma.faktur.create({
            data: {
                companyId,
                fakturNumber,
                fakturDate: new Date(fakturDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                customerId,
                salesOrderId,
                currency: currency || 'IDR',
                subtotal,
                discountPercent: discountPercent || 0,
                discountAmount: discountAmount || 0,
                taxPercent: taxPercent || 0,
                taxAmount: taxAmount || 0,
                totalAmount,
                amountPaid: amountPaid || 0,
                balanceDue,
                notes,
                createdBy,
                lines: {
                    create: lines?.map((line: any) => ({
                        itemId: line.itemId,
                        description: line.description,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discountPercent: line.discountPercent || 0,
                        amount: line.amount
                    }))
                }
            },
            include: {
                customer: true,
                lines: true
            }
        });

        res.status(201).json(faktur);
    } catch (error) {
        console.error('Error creating faktur:', error);
        res.status(500).json({ error: 'Failed to create faktur' });
    }
});

// PUT /api/fakturs/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            fakturNumber,
            fakturDate,
            dueDate,
            customerId,
            status,
            currency,
            subtotal,
            discountPercent,
            discountAmount,
            taxPercent,
            taxAmount,
            totalAmount,
            amountPaid,
            balanceDue,
            notes,
            lines
        } = req.body;

        // Delete existing lines
        await prisma.fakturLine.deleteMany({
            where: { fakturId: id }
        });

        const faktur = await prisma.faktur.update({
            where: { id },
            data: {
                fakturNumber,
                fakturDate: new Date(fakturDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                customerId,
                status,
                currency,
                subtotal,
                discountPercent,
                discountAmount,
                taxPercent,
                taxAmount,
                totalAmount,
                amountPaid,
                balanceDue,
                notes,
                lines: {
                    create: lines?.map((line: any) => ({
                        itemId: line.itemId,
                        description: line.description,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discountPercent: line.discountPercent || 0,
                        amount: line.amount
                    }))
                }
            },
            include: {
                customer: true,
                lines: true
            }
        });

        res.json(faktur);
    } catch (error) {
        console.error('Error updating faktur:', error);
        res.status(500).json({ error: 'Failed to update faktur' });
    }
});

// DELETE /api/fakturs/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.faktur.delete({
            where: { id }
        });

        res.json({ message: 'Faktur deleted successfully' });
    } catch (error) {
        console.error('Error deleting faktur:', error);
        res.status(500).json({ error: 'Failed to delete faktur' });
    }
});

export default router;
