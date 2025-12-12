import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    createPdfSession,
    handleSaveCallback,
    downloadPdf,
    checkSaveStatus
} from '../controllers/zohoController';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `pdf-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Create PDF editing session
router.post('/create-session', upload.single('pdf'), createPdfSession);

// Handle save callback from Zoho
router.post('/save-callback', upload.single('content'), handleSaveCallback);

// Download the edited PDF
router.get('/download/:sessionId', downloadPdf);

// Check save status
router.get('/status/:sessionId', checkSaveStatus);

export default router;
