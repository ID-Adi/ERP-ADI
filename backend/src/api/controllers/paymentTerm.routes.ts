import { Router } from 'express';
import { PaymentTermController } from './PaymentTermController';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', PaymentTermController.getPaymentTerms);
router.get('/:id', PaymentTermController.getPaymentTerm);
router.post('/', PaymentTermController.createPaymentTerm);
router.put('/:id', PaymentTermController.updatePaymentTerm);
router.delete('/:id', PaymentTermController.deletePaymentTerm);

export default router;
