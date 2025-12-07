import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/items
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const warehouse = req.query.warehouse as string; // Note: Warehouse field implementation might vary
        // Status might need custom logic depending on 'onHand' which is not in Item model directly yet, 
        // effectively mocking 'status' filtering based on assumptions or skipping for now if complex.
        const status = req.query.status as string;

        const skip = (page - 1) * limit;

        const where: any = {
            isActive: true,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Note: Warehouse filtering typically requires a relation to inventory/stock table.
        // Since Item model is master data, we might not filter by warehouse directly unless Item has warehouseId
        // or we join with Inventory table (which doesn't exist in the visible schema).
        // For now, we ignore warehouse filter efficiently or assume Items are global.

        // Count total for pagination
        const total = await prisma.item.count({ where });

        const items = await prisma.item.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                updatedAt: 'desc', // or name: 'asc'
            },
            include: {
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Mocking stock data since it's missing in Item model
        // In real world, this would be a join with Inventory/Stock table
        const enrichedItems = items.map(item => ({
            ...item,
            // Mock fields to match frontend interface
            warehouse: 'Main Warehouse',
            onHand: 0,
            reserved: 0,
            available: 0,
            status: 'normal', // mock status
            avgCost: Number(item.purchasePrice), // Convert Decimal to Number
            totalValue: 0,
            lastMovement: item.updatedAt.toISOString().split('T')[0]
        }));

        res.json({
            data: enrichedItems,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

export default router;
