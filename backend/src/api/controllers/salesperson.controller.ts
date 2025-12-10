import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/salespersons
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
                        { code: { contains: search, mode: 'insensitive' } },
                  ];
            }

            const total = await prisma.salesperson.count({ where });
            const salespersons = await prisma.salesperson.findMany({
                  where,
                  skip,
                  take: limit,
                  orderBy: { name: 'asc' }
            });

            res.json({
                  data: salespersons,
                  meta: {
                        total,
                        page,
                        limit,
                        last_page: Math.ceil(total / limit)
                  }
            });
      } catch (error) {
            console.error('Error fetching salespersons:', error);
            res.status(500).json({ error: 'Failed to fetch salespersons' });
      }
});

// POST /api/salespersons
router.post('/', async (req: Request, res: Response) => {
      try {
            const { name, code, phone, email, isActive } = req.body;

            if (!name) {
                  return res.status(400).json({ error: 'Nama Penjual wajib diisi' });
            }
            if (!code) {
                  return res.status(400).json({ error: 'Kode Penjual wajib diisi' });
            }

            const defaultCompany = await prisma.company.findFirst();
            if (!defaultCompany) {
                  return res.status(500).json({ error: 'No company found' });
            }

            // Check for duplicates (code)
            const existingSalesperson = await prisma.salesperson.findFirst({
                  where: {
                        companyId: defaultCompany.id,
                        code: { equals: code, mode: 'insensitive' }
                  }
            });

            if (existingSalesperson) {
                  return res.status(400).json({ error: 'Penjual dengan kode tersebut sudah ada' });
            }

            const salesperson = await prisma.salesperson.create({
                  data: {
                        companyId: defaultCompany.id,
                        name,
                        code,
                        phone,
                        email,
                        isActive: isActive ?? true
                  }
            });

            res.status(201).json({ data: salesperson, message: 'Penjual berhasil dibuat' });
      } catch (error) {
            console.error('Error creating salesperson:', error);
            res.status(500).json({ error: 'Gagal membuat penjual' });
      }
});

export default router;
