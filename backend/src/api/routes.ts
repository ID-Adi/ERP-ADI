import { Router } from 'express';
import authRoutes from './controllers/auth.controller';
import customerRoutes from './controllers/customer.controller';
import itemRoutes from './controllers/item.controller';
import salesOrderRoutes from './controllers/salesOrder.controller';
import fakturRoutes from './controllers/faktur.controller';
import unitRoutes from './controllers/unit.controller';
import categoryRoutes from './controllers/category.controller';

import accountRoutes from './controllers/account.controller';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to ERP ADI API' });
});

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/items', itemRoutes);
router.use('/sales-orders', salesOrderRoutes);
router.use('/fakturs', fakturRoutes);
router.use('/units', unitRoutes);
router.use('/categories', categoryRoutes);
router.use('/accounts', accountRoutes);

export default router;
