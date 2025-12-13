import { Router, Request, Response } from 'express';
import { WarehouseService } from '../../domain/masters/warehouse.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Keep prisma for company check temporarily if needed, though service should handle it.
const router = Router();
const warehouseService = new WarehouseService();

// GET /api/warehouses
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const itemId = req.query.itemId as string;

        // Assuming single tenant for now or getting companyId from somewhere?
        // The original code did: const defaultCompany = await prisma.company.findFirst();
        // But the GET didn't use companyId explicitly in the original code? 
        // Wait, original GET logic: const total = await prisma.warehouse.count({ where }); 
        // It didn't filter by companyId explicitly in original code?
        // Original code: const where: any = { isActive: true };
        
        // However, the `create` logic fetched `defaultCompany`.
        // To be safe and consistent with refactor, let's fetch default company or handle it.
        // Ideally `req.user.companyId` but there is no auth middleware visible here.
        // I will stick to "findFirst" company strategy if context is missing, or query all if original did so.
        
        // Original GET query:
        // const where: any = { isActive: true };
        // if (search) ...
        
        // It seems original code was loosely typed regarding tenancy in GET.
        // But for `create` it enforced company.
        // Let's get a companyId to pass to the service, or make service method flexible?
        // Service methods `findAllByCompany` require companyId.
        
        // Let's look for a company first.
        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
             // Fallback or error? Original GET didn't fail if no company, just returned empty list effectively if no warehouses?
             // Actually original GET returned all warehouses regardless of company.
             // But my Service is designed for Multi-tenancy (companyId).
             // Given the schema has `companyId`, I should probably use the default company ID.
             return res.json({ data: [], meta: { total: 0, page, limit, last_page: 0 } });
        }

        const result = await warehouseService.getCompanyWarehouses(defaultCompany.id, {
            page,
            limit,
            search,
            itemId
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
});

// GET /api/warehouses/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const warehouse = await warehouseService.getById(id);

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
        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        const warehouse = await warehouseService.createWarehouse(defaultCompany.id, req.body);
        res.status(201).json({ data: warehouse, message: 'Gudang berhasil dibuat' });
    } catch (error: any) {
        console.error('Error creating warehouse:', error);
        // Handle specific service errors
        if (error.message === 'Nama Gudang wajib diisi' || 
            error.message === 'Kode Gudang wajib diisi' || 
            error.message === 'Gudang dengan kode tersebut sudah ada') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Gagal membuat gudang' });
    }
});

// PUT /api/warehouses/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        // We need to ensure the warehouse belongs to the company, service update checks this usually?
        // My service update checks: if (!warehouse || warehouse.companyId !== companyId)
        
        const updatedWarehouse = await warehouseService.updateWarehouse(id, defaultCompany.id, req.body);
        res.json({ data: updatedWarehouse, message: 'Gudang berhasil diupdate' });
    } catch (error: any) {
        console.error('Error updating warehouse:', error);
        if (error.message === 'Warehouse not found or access denied') {
             return res.status(404).json({ error: 'Warehouse not found' });
        }
        if (error.message === 'Gudang dengan kode tersebut sudah ada') {
             return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Gagal mengupdate gudang' });
    }
});

// DELETE /api/warehouses/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await warehouseService.deleteWarehouse(id);
        res.json({ message: 'Gudang berhasil dihapus' });
    } catch (error: any) {
        console.error('Error deleting warehouse:', error);
        if (error.message === 'Gudang tidak dapat dihapus karena masih memiliki stok atau riwayat transaksi.') {
            return res.status(400).json({ error: error.message });
        }
        // Also handle not found if strict
        res.status(500).json({ error: 'Gagal menghapus gudang' });
    }
});

export default router;
