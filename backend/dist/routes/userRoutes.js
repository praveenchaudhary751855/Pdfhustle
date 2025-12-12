"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
router.get('/profile', userController_1.getProfile);
router.put('/profile', userController_1.updateProfile);
router.get('/conversions', userController_1.getConversionHistory);
router.post('/conversions', userController_1.trackConversion);
router.get('/can-convert', userController_1.canConvert);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map