import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    createPdfSession,
    handleSaveCallback,
    checkSaveStatus,
    downloadPdf,
} from '../controllers/zohoController';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `pdf-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    }
});

// Create PDF editing session
router.post('/create-session', upload.single('pdf'), createPdfSession);

// Save callback from Zoho
router.post('/save-callback', handleSaveCallback);

// Check save status
router.get('/status/:sessionId', checkSaveStatus);

// Download edited PDF
router.get('/download/:sessionId', downloadPdf);

export default router;
