
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ContactService } from '../../domain/masters/contact.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const contactService = new ContactService();

// Schema
const contactSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(2),
    type: z.enum(['CUSTOMER', 'VENDOR', 'BOTH']),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
});

// GET /api/contacts
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const type = req.query.type as any;
        const contacts = await contactService.getCompanyContacts(user.companyId, type);
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/contacts
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const data = contactSchema.parse(req.body);

        const contact = await contactService.createContact(user.companyId, data);
        res.status(201).json(contact);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Create contact error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/contacts/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const contact = await contactService.getById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
