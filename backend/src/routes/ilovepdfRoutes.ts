import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    editPdf,
    compressPdf,
    mergePdf,
    downloadProcessedPdf,
    getApiStatus,
} from '../controllers/ilovepdfController';

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

// API status check
router.get('/status', getApiStatus);

// Edit PDF (add text, images, etc.)
router.post('/edit', upload.single('pdf'), editPdf);

// Compress PDF
router.post('/compress', upload.single('pdf'), compressPdf);

// Merge PDFs
router.post('/merge', upload.array('pdfs', 10), mergePdf);

// Download processed PDF
router.get('/download/:sessionId', downloadProcessedPdf);

export default router;
