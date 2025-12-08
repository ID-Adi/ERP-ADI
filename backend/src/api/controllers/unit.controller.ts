import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/units
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const skip = (page - 1) * limit;

        // Debug check
        if (!prisma.unit) {
            console.error('CRITICAL: prisma.unit is undefined. The Prisma Client has not been reloaded with the new schema.');
            return res.status(500).json({ error: 'Server configuration error: Database model not loaded. Please restart backend.' });
        }

        const where: any = { isActive: true };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const total = await prisma.unit.count({ where });
        const units = await prisma.unit.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        });

        res.json({
            data: units,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ error: 'Failed to fetch units' });
    }
});

// GET /api/units/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const unit = await prisma.unit.findUnique({ where: { id } });

        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        res.json({ data: unit });
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ error: 'Failed to fetch unit' });
    }
});

// POST /api/units
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nama Satuan wajib diisi' });
        }

        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        const existingUnit = await prisma.unit.findFirst({
            where: {
                companyId: defaultCompany.id,
                name: { equals: name, mode: 'insensitive' }
            }
        });

        if (existingUnit) {
            return res.status(400).json({ error: 'Satuan sudah ada' });
        }

        const unit = await prisma.unit.create({
            data: {
                companyId: defaultCompany.id,
                name,
                description,
                isActive: true
            }
        });

        res.status(201).json({ data: unit, message: 'Satuan berhasil dibuat' });
    } catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ error: 'Gagal membuat satuan' });
    }
});

// PUT /api/units/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const unit = await prisma.unit.findUnique({ where: { id } });
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        // If specific check for duplicate name on update is needed, add here.

        const updatedUnit = await prisma.unit.update({
            where: { id },
            data: {
                name,
                description,
                isActive
            }
        });

        res.json({ data: updatedUnit, message: 'Satuan berhasil diupdate' });
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ error: 'Gagal mengupdate satuan' });
    }
});

// DELETE /api/units/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.unit.delete({ where: { id } });
        res.json({ message: 'Satuan berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ error: 'Gagal menghapus satuan' });
    }
});

export default router;
