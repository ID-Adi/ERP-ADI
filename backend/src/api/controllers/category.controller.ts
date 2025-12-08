import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/categories
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const skip = (page - 1) * limit;

        const where: any = { isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } }
            ];
        }

        const total = await prisma.itemCategory.count({ where });
        const categories = await prisma.itemCategory.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        });

        res.json({
            data: categories,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/categories/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await prisma.itemCategory.findUnique({ where: { id } });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ data: category });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, code, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nama Kategori wajib diisi' });
        }
        if (!code) {
            return res.status(400).json({ error: 'Kode Kategori wajib diisi' });
        }

        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        // Check for duplicates (code or name)
        const existingCategory = await prisma.itemCategory.findFirst({
            where: {
                companyId: defaultCompany.id,
                OR: [
                    { code: { equals: code, mode: 'insensitive' } },
                    { name: { equals: name, mode: 'insensitive' } }
                ]
            }
        });

        if (existingCategory) {
            return res.status(400).json({ error: 'Kategori dengan nama atau kode tersebut sudah ada' });
        }

        const category = await prisma.itemCategory.create({
            data: {
                companyId: defaultCompany.id,
                name,
                code,
                description,
                isActive: true
            }
        });

        res.status(201).json({ data: category, message: 'Kategori berhasil dibuat' });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Gagal membuat kategori' });
    }
});

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, description, isActive } = req.body;

        const category = await prisma.itemCategory.findUnique({ where: { id } });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const updatedCategory = await prisma.itemCategory.update({
            where: { id },
            data: {
                name,
                code,
                description,
                isActive
            }
        });

        res.json({ data: updatedCategory, message: 'Kategori berhasil diupdate' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Gagal mengupdate kategori' });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.itemCategory.delete({ where: { id } });
        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Gagal menghapus kategori' });
    }
});

export default router;
