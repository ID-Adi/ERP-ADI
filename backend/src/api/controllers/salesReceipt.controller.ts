
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { SalesReceiptService } from '../../domain/sales/salesReceipt.service';
import { z } from 'zod';

const router = Router();
const receiptService = new SalesReceiptService();

const createReceiptSchema = z.object({
    receiptDate: z.string(), // ISO Date
    customerId: z.string().uuid(),
    bankAccountId: z.string().uuid(),
    paymentMethod: z.string().optional(),
    amount: z.number().positive(),
    notes: z.string().optional(),
    lines: z.array(z.object({
        fakturId: z.string().uuid(),
        amount: z.number().positive()
    })).min(1)
});

// GET /api/sales-receipts
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const receipts = await receiptService.findAll(user.companyId, req.query);
        res.json({ data: receipts });
    } catch (error) {
        console.error("Get Receipts Error", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// POST /api/sales-receipts
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const data = createReceiptSchema.parse(req.body); // Validate input

        const receipt = await receiptService.create(user.companyId, data, user.id);
        res.status(201).json(receipt);
    } catch (error) {
        console.error("Create Receipt Error", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: (error as Error).message });
    }

});

// PUT /api/sales-receipts/:id
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const data = createReceiptSchema.parse(req.body); // Reuse schema

        const receipt = await receiptService.update(req.params.id, data, user.id);
        res.json(receipt);
    } catch (error) {
        console.error("Update Receipt Error", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: (error as Error).message });
    }
});

// DELETE /api/sales-receipts/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const result = await receiptService.delete(req.params.id, user.id);
        res.json(result);
    } catch (error) {
        console.error("Delete Receipt Error", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

export default router;
