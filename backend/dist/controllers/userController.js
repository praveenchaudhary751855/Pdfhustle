"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canConvert = exports.trackConversion = exports.getConversionHistory = exports.updateProfile = exports.getProfile = void 0;
const database_1 = __importDefault(require("../config/database"));
// Free tier limit
const FREE_DAILY_LIMIT = 5;
// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                plan: true,
                conversionsToday: true,
                lastConversionDate: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Calculate remaining conversions for free users
        const today = new Date().toDateString();
        const lastConversion = user.lastConversionDate?.toDateString();
        let remainingConversions = FREE_DAILY_LIMIT;
        if (user.plan === 'FREE' && lastConversion === today) {
            remainingConversions = Math.max(0, FREE_DAILY_LIMIT - user.conversionsToday);
        }
        res.json({
            user: {
                ...user,
                remainingConversions: user.plan === 'PRO' ? 'unlimited' : remainingConversions,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
};
exports.getProfile = getProfile;
// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, image } = req.body;
        const user = await database_1.default.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(image && { image }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                plan: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
// Get user's conversion history
const getConversionHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [conversions, total] = await Promise.all([
            database_1.default.conversion.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip,
            }),
            database_1.default.conversion.count({
                where: { userId: req.user.id },
            }),
        ]);
        res.json({
            conversions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get conversion history' });
    }
};
exports.getConversionHistory = getConversionHistory;
// Track a conversion (called when user converts a file)
const trackConversion = async (req, res) => {
    try {
        const { type, fileName, fileSize } = req.body;
        if (!type || !fileName) {
            res.status(400).json({ error: 'Type and fileName are required' });
            return;
        }
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Check limits for free users
        if (user.plan === 'FREE') {
            const today = new Date().toDateString();
            const lastConversion = user.lastConversionDate?.toDateString();
            // Reset count if new day
            const todayConversions = lastConversion === today ? user.conversionsToday : 0;
            if (todayConversions >= FREE_DAILY_LIMIT) {
                res.status(403).json({
                    error: 'Daily limit reached',
                    message: 'Upgrade to Pro for unlimited conversions',
                    upgradeUrl: '/pricing',
                });
                return;
            }
        }
        // Create conversion record
        const conversion = await database_1.default.conversion.create({
            data: {
                userId: user.id,
                type,
                fileName,
                fileSize: fileSize || 0,
            },
        });
        // Update user's conversion count
        const today = new Date();
        const isSameDay = user.lastConversionDate?.toDateString() === today.toDateString();
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                conversionsToday: isSameDay ? user.conversionsToday + 1 : 1,
                lastConversionDate: today,
            },
        });
        res.json({
            success: true,
            conversion,
            remainingToday: user.plan === 'PRO'
                ? 'unlimited'
                : FREE_DAILY_LIMIT - (isSameDay ? user.conversionsToday + 1 : 1),
        });
    }
    catch (error) {
        console.error('Track conversion error:', error);
        res.status(500).json({ error: 'Failed to track conversion' });
    }
};
exports.trackConversion = trackConversion;
// Check if user can convert (pre-check before conversion)
const canConvert = async (req, res) => {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (user.plan === 'PRO') {
            res.json({ canConvert: true, remaining: 'unlimited' });
            return;
        }
        const today = new Date().toDateString();
        const lastConversion = user.lastConversionDate?.toDateString();
        const todayConversions = lastConversion === today ? user.conversionsToday : 0;
        res.json({
            canConvert: todayConversions < FREE_DAILY_LIMIT,
            remaining: FREE_DAILY_LIMIT - todayConversions,
            limit: FREE_DAILY_LIMIT,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to check conversion limit' });
    }
};
exports.canConvert = canConvert;
//# sourceMappingURL=userController.js.map