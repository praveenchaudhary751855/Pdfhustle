"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_PRICES = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Only initialize Stripe if the secret key is provided
exports.stripe = process.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-11-17.clover',
    })
    : null;
if (!exports.stripe) {
    console.warn('Warning: STRIPE_SECRET_KEY not set. Stripe functionality will not work.');
}
// Price IDs for subscription plans
exports.STRIPE_PRICES = {
    PRO_MONTHLY: process.env.STRIPE_PRO_PRICE_ID || '',
};
exports.default = exports.stripe;
//# sourceMappingURL=stripe.js.map