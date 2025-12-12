"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const stripeRoutes_1 = __importDefault(require("./stripeRoutes"));
const zohoRoutes_1 = __importDefault(require("./zohoRoutes"));
const router = (0, express_1.Router)();
// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API routes
router.use('/auth', authRoutes_1.default);
router.use('/user', userRoutes_1.default);
router.use('/stripe', stripeRoutes_1.default);
router.use('/zoho', zohoRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map