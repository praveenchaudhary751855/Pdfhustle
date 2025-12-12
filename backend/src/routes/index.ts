import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import stripeRoutes from './stripeRoutes';
import zohoRoutes from './zohoRoutes';
import ilovepdfRoutes from './ilovepdfRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/stripe', stripeRoutes);
router.use('/zoho', zohoRoutes);
router.use('/ilovepdf', ilovepdfRoutes);

export default router;
