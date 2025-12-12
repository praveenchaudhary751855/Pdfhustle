import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Only initialize Stripe if the secret key is provided
export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

if (!stripe) {
    console.warn('Warning: STRIPE_SECRET_KEY not set. Stripe functionality will not work.');
}

// Price IDs for subscription plans
export const STRIPE_PRICES = {
    PRO_MONTHLY: process.env.STRIPE_PRO_PRICE_ID || '',
};

export default stripe;

