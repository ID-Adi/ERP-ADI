import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CustomerService } from '../../domain/masters/customer.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const customerService = new CustomerService();

// Validation Schema
const customerSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().optional(),

    // Contact
    contactPerson: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    fax: z.string().optional(),
    website: z.string().optional(),

    // Address
    billingAddress: z.string().optional(),
    billingCity: z.string().optional(),
    billingProvince: z.string().optional(),
    billingCountry: z.string().optional(),
    billingZipCode: z.string().optional(),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingProvince: z.string().optional(),
    shippingCountry: z.string().optional(),
    shippingZipCode: z.string().optional(),

    // Sales Rules
    priceCategory: z.string().optional(),
    discountCategory: z.string().optional(),
    paymentTerms: z.coerce.number().int().optional(),
    paymentTermId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v), // Add paymentTermId
    creditLimit: z.coerce.number().optional(),
    defaultDiscount: z.coerce.number().optional(),
    maxReceivableDays: z.coerce.number().int().optional(),
    salesperson: z.string().optional(),

    // Tax
    taxIncluded: z.boolean().optional(),
    npwp: z.string().optional(),
    taxName: z.string().optional(),
    nik: z.string().optional(),
    nppkp: z.string().optional(),
    taxAddress: z.string().optional(),

    // Accounts
    // Accounts
    receivableAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    downPaymentAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    salesAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    cogsAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    salesReturnAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    goodsDiscountAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    salesDiscountAccountId: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),

    notes: z.string().optional(),
    isActive: z.boolean().optional(),
});

// GET /api/customers/dropdown - Lightweight endpoint for dropdowns (no pagination)
router.get('/dropdown', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const customers = await customerService.getCustomersForDropdown(user.companyId);
        res.json({ data: customers });
    } catch (error) {
        console.error('Get customers dropdown error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/customers - Paginated list for tables
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { page, limit, search, status } = req.query;

        const result = await customerService.getCompanyCustomersPaginated(user.companyId, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 50,
            search: search as string,
            status: status as string
        });

        res.json({
            data: result.data,
            total: result.total,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 50,
            totalPages: Math.ceil(result.total / (limit ? Number(limit) : 50)),
            hasMore: ((page ? Number(page) : 1) - 1) * (limit ? Number(limit) : 50) + result.data.length < result.total
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const customer = await customerService.getById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/customers
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const data = customerSchema.parse(req.body);

        const customer = await customerService.createCustomer(user.companyId, data);
        res.status(201).json(customer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Extract nicer error messages
            const formattedErrors = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }));
            return res.status(400).json({ message: 'Validation error', errors: formattedErrors });
        }
        console.error('Create customer error:', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
});

// PUT /api/customers/:id
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        console.log('PUT /customers/:id - Request body:', JSON.stringify(req.body, null, 2));
        console.log('PUT /customers/:id - User companyId:', user.companyId);

        const data = customerSchema.partial().parse(req.body);
        console.log('PUT /customers/:id - Parsed data:', JSON.stringify(data, null, 2));

        const customer = await customerService.updateCustomer(req.params.id, user.companyId, data);
        res.json(customer);
    } catch (error) {
        console.error('PUT /customers/:id - Full error:', error);

        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }));
            console.error('PUT /customers/:id - Zod validation errors:', formattedErrors);
            return res.status(400).json({ message: 'Validation error', errors: formattedErrors });
        }

        // Handle "not found or access denied" error
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Update customer error:', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
});

// DELETE /api/customers/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        await customerService.delete(req.params.id); // Base service delete
        res.status(200).json({ message: 'Customer deleted' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
