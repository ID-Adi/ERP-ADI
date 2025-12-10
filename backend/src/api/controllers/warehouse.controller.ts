import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/warehouses
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const itemId = req.query.itemId as string;

        const skip = (page - 1) * limit;

        const where: any = { isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } }
            ];
        }

        const total = await prisma.warehouse.count({ where });

        // If itemId is provided, include stock info
        const include = itemId ? {
            stocks: {
                where: { itemId },
                select: { availableStock: true }
            }
        } : undefined;

        const warehouses = await prisma.warehouse.findMany({
            where,
            include,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        });

        // Map response to include stock directly if itemId was requested
        const data = warehouses.map(wh => {
            const stock = (wh as any).stocks?.[0]?.availableStock ?? 0;
            const { stocks, ...rest } = wh as any;
            return itemId ? { ...rest, stock } : rest;
        });

        res.json({
            data,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
});

// GET /api/warehouses/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });

        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }

        res.json({ data: warehouse });
    } catch (error) {
        console.error('Error fetching warehouse:', error);
        res.status(500).json({ error: 'Failed to fetch warehouse' });
    }
});

// POST /api/warehouses
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, code, address, city, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nama Gudang wajib diisi' });
        }
        if (!code) {
            return res.status(400).json({ error: 'Kode Gudang wajib diisi' });
        }

        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        // Check for duplicates (code)
        const existingWarehouse = await prisma.warehouse.findFirst({
            where: {
                companyId: defaultCompany.id,
                code: { equals: code, mode: 'insensitive' }
            }
        });

        if (existingWarehouse) {
            return res.status(400).json({ error: 'Gudang dengan kode tersebut sudah ada' });
        }

        const warehouse = await prisma.warehouse.create({
            data: {
                companyId: defaultCompany.id,
                name,
                code,
                address,
                city,
                isActive: isActive ?? true
            }
        });

        res.status(201).json({ data: warehouse, message: 'Gudang berhasil dibuat' });
    } catch (error) {
        console.error('Error creating warehouse:', error);
        res.status(500).json({ error: 'Gagal membuat gudang' });
    }
});

// PUT /api/warehouses/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, address, city, isActive } = req.body;

        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }

        const updatedWarehouse = await prisma.warehouse.update({
            where: { id },
            data: {
                name,
                code,
                address,
                city,
                isActive
            }
        });

        res.json({ data: updatedWarehouse, message: 'Gudang berhasil diupdate' });
    } catch (error) {
        console.error('Error updating warehouse:', error);
        res.status(500).json({ error: 'Gagal mengupdate gudang' });
    }
});

// DELETE /api/warehouses/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // TODO: Check for dependencies (stocks, etc) before deleting

        await prisma.warehouse.delete({ where: { id } });
        res.json({ message: 'Gudang berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        res.status(500).json({ error: 'Gagal menghapus gudang' });
    }
});

export default router;
