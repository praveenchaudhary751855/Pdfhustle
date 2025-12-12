"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.getSubscriptionStatus = exports.createPortalSession = exports.createCheckoutSession = void 0;
const stripe_1 = require("../config/stripe");
const database_1 = __importDefault(require("../config/database"));
// Create checkout session for subscription
const createCheckoutSession = async (req, res) => {
    if (!stripe_1.stripe) {
        res.status(503).json({ error: 'Stripe is not configured' });
        return;
    }
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Check if already Pro
        if (user.plan === 'PRO') {
            res.status(400).json({ error: 'Already subscribed to Pro' });
            return;
        }
        // Create or get Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe_1.stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: {
                    userId: user.id,
                },
            });
            customerId = customer.id;
            await database_1.default.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
        }
        // Create checkout session
        const session = await stripe_1.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: stripe_1.STRIPE_PRICES.PRO_MONTHLY,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
            metadata: {
                userId: user.id,
            },
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};
exports.createCheckoutSession = createCheckoutSession;
// Create customer portal session (for managing subscription)
const createPortalSession = async (req, res) => {
    if (!stripe_1.stripe) {
        res.status(503).json({ error: 'Stripe is not configured' });
        return;
    }
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user?.stripeCustomerId) {
            res.status(400).json({ error: 'No subscription found' });
            return;
        }
        const session = await stripe_1.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/dashboard`,
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Portal session error:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
};
exports.createPortalSession = createPortalSession;
// Get subscription status
const getSubscriptionStatus = async (req, res) => {
    if (!stripe_1.stripe) {
        res.status(503).json({ error: 'Stripe is not configured' });
        return;
    }
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (!user.stripeCustomerId) {
            res.json({
                plan: user.plan,
                subscription: null,
            });
            return;
        }
        // Get subscription from Stripe
        const subscriptions = await stripe_1.stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1,
        });
        const subscription = subscriptions.data[0];
        res.json({
            plan: user.plan,
            subscription: subscription ? {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            } : null,
        });
    }
    catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
};
exports.getSubscriptionStatus = getSubscriptionStatus;
// Stripe webhook handler
const handleWebhook = async (req, res) => {
    if (!stripe_1.stripe) {
        res.status(503).json({ error: 'Stripe is not configured' });
        return;
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
        return;
    }
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            if (userId) {
                await database_1.default.user.update({
                    where: { id: userId },
                    data: { plan: 'PRO' },
                });
                console.log(`User ${userId} upgraded to PRO`);
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const user = await database_1.default.user.findUnique({
                where: { stripeCustomerId: customerId },
            });
            if (user) {
                await database_1.default.user.update({
                    where: { id: user.id },
                    data: { plan: 'FREE' },
                });
                console.log(`User ${user.id} downgraded to FREE`);
            }
            break;
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            console.log(`Payment failed for customer ${invoice.customer}`);
            // You could send an email notification here
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
};
exports.handleWebhook = handleWebhook;
//# sourceMappingURL=stripeController.js.map