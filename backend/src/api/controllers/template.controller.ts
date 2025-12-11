import { Router, Request, Response } from 'express';
import { PrismaClient, PrintTemplateType } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/templates
router.get('/', async (req: Request, res: Response) => {
    try {
        const templates = await prisma.printTemplate.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json({ data: templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// GET /api/templates/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const template = await prisma.printTemplate.findUnique({
            where: { id }
        });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// POST /api/templates
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, type, content, isDefault } = req.body;
        const companyId = req.body.companyId || (await prisma.company.findFirst())?.id;

        if (!companyId) return res.status(400).json({ error: 'Company ID required' });

        const template = await prisma.printTemplate.create({
            data: {
                companyId,
                name,
                type: type as PrintTemplateType,
                content: content || '',
                isDefault: isDefault || false,
            }
        });
        res.status(201).json(template);
    } catch (error: any) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: error.message || 'Failed to create template' });
    }
});

// PUT /api/templates/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, content, isDefault, isActive } = req.body;

        const template = await prisma.printTemplate.update({
            where: { id },
            data: {
                name,
                type: type as PrintTemplateType,
                content,
                isDefault,
                isActive
            }
        });
        res.json(template);
    } catch (error: any) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: error.message || 'Failed to update template' });
    }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Soft delete
        const template = await prisma.printTemplate.update({
            where: { id },
            data: { isActive: false }
        });
        res.json(template);
    } catch (error: any) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: error.message || 'Failed to delete template' });
    }
});

export default router;
