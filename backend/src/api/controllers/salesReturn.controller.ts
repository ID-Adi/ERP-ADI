
import { Router } from 'express';
import { SalesReturnService } from '../../domain/sales/salesReturn.service';

const router = Router();
const service = new SalesReturnService();

// Create Return
router.post('/', async (req, res) => {
    try {
        // Assume companyId and userId are extracted from auth middleware (req.user)
        // For now, extracting from body or header if available, or defaulting.
        // In a real scenario, use req.user.companyId
        const companyId = req.body.companyId || (req as any).user?.companyId;
        const userId = (req as any).user?.id || 'system';

        if (!companyId) {
             return res.status(400).json({ message: "Company ID is required" });
        }

        const result = await service.create(companyId, req.body, userId);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Get Returns by Faktur ID
router.get('/', async (req, res) => {
    try {
        const { fakturId } = req.query;
        if (!fakturId) {
            return res.status(400).json({ message: "Faktur ID is required" });
        }
        const result = await service.getByFakturId(String(fakturId));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
