import { Router } from 'express';
import authRoutes from './controllers/auth.controller';
import contactRoutes from './controllers/contact.controller';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to ERP ADI API' });
});

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);

export default router;
