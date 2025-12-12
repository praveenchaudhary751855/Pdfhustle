import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    getConversionHistory,
    trackConversion,
    canConvert
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/conversions', getConversionHistory);
router.post('/conversions', trackConversion);
router.get('/can-convert', canConvert);

export default router;
