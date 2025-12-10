import { Router } from 'express';
import authRoutes from './controllers/auth.controller';
import customerRoutes from './controllers/customer.controller';
import itemRoutes from './controllers/item.controller';
import salesOrderRoutes from './controllers/salesOrder.controller';
import fakturRoutes from './controllers/faktur.controller';
import unitRoutes from './controllers/unit.controller';
import categoryRoutes from './controllers/category.controller';

import accountRoutes from './controllers/account.controller';
import reportRoutes from './controllers/report.controller';
import warehouseRoutes from './controllers/warehouse.controller';
import salesReceiptRoutes from './controllers/salesReceipt.controller';
import salespersonRoutes from './controllers/salesperson.controller';
import employeeRoutes from './controllers/employee.controller';

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
router.use('/reports', reportRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/sales-receipts', salesReceiptRoutes);
router.use('/salespersons', salespersonRoutes);
router.use('/employees', employeeRoutes);

export default router;
