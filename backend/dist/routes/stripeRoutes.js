"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const stripeController_1 = require("../controllers/stripeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Webhook route (needs raw body - must be before json middleware)
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), stripeController_1.handleWebhook);
// Protected routes
router.post('/checkout', auth_1.authenticate, stripeController_1.createCheckoutSession);
router.post('/portal', auth_1.authenticate, stripeController_1.createPortalSession);
router.get('/subscription', auth_1.authenticate, stripeController_1.getSubscriptionStatus);
exports.default = router;
//# sourceMappingURL=stripeRoutes.js.map