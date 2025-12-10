import { Request, Response } from 'express';
// Use direct PrismaClient if that's the pattern or check customer controller
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define AuthRequest here if not exported globally
interface AuthRequest extends Request {
    user?: any;
}

export const PaymentTermController = {
    // Get all payment terms
    getPaymentTerms: async (req: Request, res: Response) => {
        try {
            const companyId = (req as AuthRequest).user?.companyId;

            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required' });
            }

            const paymentTerms = await prisma.paymentTerm.findMany({
                where: {
                    companyId,
                    isActive: true
                },
                orderBy: {
                    days: 'asc'
                }
            });

            res.json(paymentTerms);
        } catch (error) {
            console.error('Error fetching payment terms:', error);
            res.status(500).json({ message: 'Error fetching payment terms' });
        }
    },

    // Get single payment term
    getPaymentTerm: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const companyId = (req as AuthRequest).user?.companyId;

            const paymentTerm = await prisma.paymentTerm.findFirst({
                where: {
                    id,
                    companyId
                }
            });

            if (!paymentTerm) {
                return res.status(404).json({ message: 'Payment term not found' });
            }

            res.json(paymentTerm);
        } catch (error) {
            console.error('Error fetching payment term:', error);
            res.status(500).json({ message: 'Error fetching payment term' });
        }
    },

    // Create payment term
    createPaymentTerm: async (req: Request, res: Response) => {
        try {
            const companyId = (req as AuthRequest).user?.companyId;
            const { code, name, days } = req.body;

            if (!companyId) {
                return res.status(400).json({ message: 'Company ID is required' });
            }

            // Check if code exists
            const existing = await prisma.paymentTerm.findFirst({
                where: {
                    companyId,
                    code
                }
            });

            if (existing) {
                return res.status(400).json({ message: 'Payment term code already exists' });
            }

            const paymentTerm = await prisma.paymentTerm.create({
                data: {
                    companyId,
                    code,
                    name,
                    days: Number(days),
                    isActive: true
                }
            });

            res.status(201).json(paymentTerm);
        } catch (error) {
            console.error('Error creating payment term:', error);
            res.status(500).json({ message: 'Error creating payment term' });
        }
    },

    // Update payment term
    updatePaymentTerm: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const companyId = (req as AuthRequest).user?.companyId;
            const { code, name, days, isActive } = req.body;

            const paymentTerm = await prisma.paymentTerm.findFirst({
                where: { id, companyId }
            });

            if (!paymentTerm) {
                return res.status(404).json({ message: 'Payment term not found' });
            }

            // Check code uniqueness if changing
            if (code !== paymentTerm.code) {
                const existing = await prisma.paymentTerm.findFirst({
                    where: { companyId, code }
                });
                if (existing) {
                    return res.status(400).json({ message: 'Payment term code already exists' });
                }
            }

            const updated = await prisma.paymentTerm.update({
                where: { id },
                data: {
                    code,
                    name,
                    days: Number(days),
                    isActive
                }
            });

            res.json(updated);
        } catch (error) {
            console.error('Error updating payment term:', error);
            res.status(500).json({ message: 'Error updating payment term' });
        }
    },

    // Delete payment term (soft delete)
    deletePaymentTerm: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const companyId = (req as AuthRequest).user?.companyId;

            const paymentTerm = await prisma.paymentTerm.findFirst({
                where: { id, companyId }
            });

            if (!paymentTerm) {
                return res.status(404).json({ message: 'Payment term not found' });
            }

            // Check usage
            const usageCount = await prisma.customer.count({
                where: { paymentTermId: id }
            });

            if (usageCount > 0) {
                return res.status(400).json({
                    message: 'Cannot delete payment term currently in use by customers'
                });
            }

            await prisma.paymentTerm.delete({
                where: { id }
            });

            res.json({ message: 'Payment term deleted successfully' });
        } catch (error) {
            console.error('Error deleting payment term:', error);
            res.status(500).json({ message: 'Error deleting payment term' });
        }
    }
};
