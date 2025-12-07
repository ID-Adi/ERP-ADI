import { Request, Response } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getSalesOrders = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const status = req.query.status as string;
        // const dateRange = req.query.dateRange as string; // Optional: Implement date filtering logic later - removed as per snippet

        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        if (status && status !== 'All') {
            where.status = status as OrderStatus;
        }

        const total = await prisma.salesOrder.count({ where });

        const orders = await prisma.salesOrder.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                orderDate: 'desc',
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
        const formattedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            description: order.notes || order.customer.name,
            orderDate: order.orderDate.toISOString().split('T')[0],
            salesPerson: order.createdBy || 'Unknown',
            total: Number(order.totalAmount),
            status: order.status
        }));

        res.json({
            data: formattedOrders,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            },
        });

    } catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).json({ error: 'Failed to fetch sales orders' });
    }
};

// Router setup
import { Router } from 'express';
const router = Router();
router.get('/', getSalesOrders);
export default router;
