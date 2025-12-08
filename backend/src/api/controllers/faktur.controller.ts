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

// Helper function to generate faktur number
async function generateFakturNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get the count of fakturs created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await prisma.faktur.count({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `FKT-${dateStr}-${sequence}`;
}

// Helper to validate stock availability
const validateStock = async (lines: any[]) => {
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) return; // Skip if no warehouse

    for (const line of lines) {
        if (!line.itemId || !line.quantity) continue;
        const quantity = Number(line.quantity);

        const stock = await prisma.itemStock.findUnique({
            where: {
                itemId_warehouseId: {
                    itemId: line.itemId,
                    warehouseId: warehouse.id
                }
            },
            include: { item: true }
        });

        const available = stock ? Number(stock.availableStock) : 0;

        if (available < quantity) {
            const itemName = stock?.item?.name || 'Item';
            throw new Error(`Stok tidak mencukupi untuk item: ${itemName}. Tersedia: ${available}, Diminta: ${quantity}`);
        }
    }
};

// Helper to update stock
const updateStock = async (lines: any[], direction: 'IN' | 'OUT') => {
    // 1. Find default warehouse (or uses a specific one if added to schema later)
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) return; // No warehouse, skip stock update

    for (const line of lines) {
        if (!line.itemId || !line.quantity) continue;

        const quantity = Number(line.quantity);
        const change = direction === 'IN' ? quantity : -quantity;

        // 2. Find or Create ItemStock
        const stock = await prisma.itemStock.findUnique({
            where: {
                itemId_warehouseId: {
                    itemId: line.itemId,
                    warehouseId: warehouse.id
                }
            }
        });

        if (stock) {
            await prisma.itemStock.update({
                where: { id: stock.id },
                data: {
                    currentStock: { increment: change },
                    availableStock: { increment: change }
                }
            });
        } else {
            // If stock record doesn't exist, create it (assuming start from 0 + change)
            if (direction === 'IN') {
                await prisma.itemStock.create({
                    data: {
                        itemId: line.itemId,
                        warehouseId: warehouse.id,
                        currentStock: quantity,
                        availableStock: quantity
                    }
                });
            } else {
                await prisma.itemStock.create({
                    data: {
                        itemId: line.itemId,
                        warehouseId: warehouse.id,
                        currentStock: -quantity,
                        availableStock: -quantity
                    }
                });
            }
        }
    }
}

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
            lines,
            status
        } = req.body;

        // Auto-generate fakturNumber if not provided
        const finalFakturNumber = fakturNumber || await generateFakturNumber();

        // Validate companyId or fetch default
        let finalCompanyId = companyId;
        if (!finalCompanyId || finalCompanyId === 'default-company') {
            const firstCompany = await prisma.company.findFirst();
            if (firstCompany) {
                finalCompanyId = firstCompany.id;
            } else {
                return res.status(400).json({ error: 'No company found. Please create a company first.' });
            }
        }

        const finalStatus = status || 'UNPAID';

        // Validate Stock if not DRAFT (Strict Mode)
        if (finalStatus !== 'DRAFT') {
            try {
                await validateStock(lines);
            } catch (validationError: any) {
                return res.status(400).json({ error: validationError.message });
            }
        }

        const faktur = await prisma.faktur.create({
            data: {
                companyId: finalCompanyId,
                fakturNumber: finalFakturNumber,
                fakturDate: new Date(fakturDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                customerId,
                salesOrderId,
                status: finalStatus as FakturStatus,
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
                    create: lines?.map((line: any) => {
                        // Sanitize line items to prevent SQL/Prisma errors
                        const quantity = Number(line.quantity) || 0;
                        const unitPrice = Number(line.unitPrice) || 0;
                        const discountPercent = Number(line.discountPercent) || 0;
                        const amount = Number(line.amount);

                        // Recalculate if amount is NaN or missing, or trust frontend if valid
                        const finalAmount = !isNaN(amount) && amount !== 0
                            ? amount
                            : (quantity * unitPrice) - ((quantity * unitPrice * discountPercent) / 100);

                        return {
                            itemId: line.itemId,
                            description: line.description || "Item",
                            quantity: quantity,
                            unitPrice: unitPrice,
                            discountPercent: discountPercent,
                            amount: finalAmount
                        };
                    })
                }
            },
            include: {
                customer: true,
                lines: true
            }
        });

        // Update Stock (OUT) ONLY if status is NOT Draft
        if (finalStatus !== 'DRAFT') {
            await updateStock(lines, 'OUT');
        }

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

        // 1. Get existing lines to Revert Stock
        const existingFaktur = await prisma.faktur.findUnique({
            where: { id },
            include: { lines: true }
        });

        if (!existingFaktur) {
            return res.status(404).json({ error: 'Faktur not found' });
        }

        // Revert stock from old lines (IF status was not draft)
        if (existingFaktur.status !== 'DRAFT') {
            await updateStock(existingFaktur.lines, 'IN');
        }

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
                        quantity: Number(line.quantity),
                        unitPrice: Number(line.unitPrice),
                        discountPercent: Number(line.discountPercent) || 0,
                        amount: Number(line.amount)
                    }))
                }
            },
            include: {
                customer: true,
                lines: true
            }
        });

        // Apply new stock (OUT) (IF status is not draft)
        if (status !== 'DRAFT') {
            await updateStock(lines, 'OUT');
        }

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

        // 1. Get existing lines to Revert Stock before delete
        const existingFaktur = await prisma.faktur.findUnique({
            where: { id },
            include: { lines: true }
        });

        if (existingFaktur) {
            // Revert stock (IN) if it wasn't a draft
            if (existingFaktur.status !== 'DRAFT') {
                await updateStock(existingFaktur.lines, 'IN');
            }
        }

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
