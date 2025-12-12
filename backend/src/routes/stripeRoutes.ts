import { Router } from 'express';
import express from 'express';
import {
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    handleWebhook
} from '../controllers/stripeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook route (needs raw body - must be before json middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/checkout', authenticate, createCheckoutSession);
router.post('/portal', authenticate, createPortalSession);
router.get('/subscription', authenticate, getSubscriptionStatus);

export default router;
