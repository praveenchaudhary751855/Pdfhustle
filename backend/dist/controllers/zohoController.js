"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSaveStatus = exports.downloadPdf = exports.handleSaveCallback = exports.createPdfSession = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Store for saving edited PDFs (in production, use a proper storage solution)
const savedPdfs = new Map();
// Uploads directory
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads');
// Ensure uploads directory exists
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
/**
 * Create a new PDF editing session with Zoho
 */
const createPdfSession = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({
                success: false,
                error: 'No PDF file provided'
            });
            return;
        }
        const apiKey = process.env.ZOHO_API_KEY;
        const zohoDomain = process.env.ZOHO_OFFICE_DOMAIN || 'https://api.office-integrator.in';
        if (!apiKey) {
            res.status(500).json({
                success: false,
                error: 'Zoho API key not configured'
            });
            return;
        }
        // Generate a unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        // Get the callback URL (this should be your public server URL)
        const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const callbackUrl = `${backendUrl}/api/zoho/save-callback?sessionId=${sessionId}`;
        // Prepare form data for Zoho API
        const formData = new form_data_1.default();
        formData.append('apikey', apiKey);
        formData.append('document', fs_1.default.createReadStream(file.path), {
            filename: file.originalname,
            contentType: 'application/pdf'
        });
        // Callback settings for saving the edited document
        formData.append('callback_settings', JSON.stringify({
            save_format: 'pdf',
            save_url: callbackUrl,
            http_method_type: 'post',
            retries: 3,
            timeout: 120000
        }));
        // Document info
        formData.append('document_info', JSON.stringify({
            document_name: file.originalname,
            document_id: sessionId
        }));
        // Editor settings
        formData.append('editor_settings', JSON.stringify({
            unit: 'mm',
            language: 'en'
        }));
        // UI options - only valid parameters
        formData.append('ui_options', JSON.stringify({
            save_button: 'show'
        }));
        console.log(`Creating Zoho session with domain: ${zohoDomain}`);
        // Call Zoho PDF Editor API
        const response = await axios_1.default.post(`${zohoDomain}/pdfeditor/officeapi/v1/pdf`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 60000
        });
        // Clean up uploaded file
        fs_1.default.unlinkSync(file.path);
        console.log('Zoho API response:', JSON.stringify(response.data, null, 2));
        if (response.data && response.data.document_url) {
            res.json({
                success: true,
                sessionId: sessionId,
                editorUrl: response.data.document_url,
                documentId: response.data.document_id,
                sessionExpiresAt: response.data.session_expires_at
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to create editing session',
                details: response.data
            });
        }
    }
    catch (error) {
        console.error('Zoho create session error:', error.response?.data || error.message);
        // Clean up file if it exists
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create PDF editing session',
            details: error.response?.data?.message || error.response?.data || error.message
        });
    }
};
exports.createPdfSession = createPdfSession;
/**
 * Handle save callback from Zoho
 */
const handleSaveCallback = async (req, res) => {
    try {
        const { sessionId } = req.query;
        const file = req.file;
        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
            return;
        }
        if (!file) {
            console.log('No file in multer, checking raw body...');
            res.status(400).json({
                success: false,
                error: 'No PDF file received'
            });
            return;
        }
        const buffer = fs_1.default.readFileSync(file.path);
        savedPdfs.set(sessionId, {
            buffer,
            filename: file.originalname || `edited_${sessionId}.pdf`,
            savedAt: new Date()
        });
        fs_1.default.unlinkSync(file.path);
        console.log(`PDF saved for session ${sessionId}, size: ${buffer.length} bytes`);
        res.json({
            success: true,
            message: 'PDF saved successfully',
            sessionId
        });
    }
    catch (error) {
        console.error('Save callback error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save PDF',
            details: error.message
        });
    }
};
exports.handleSaveCallback = handleSaveCallback;
/**
 * Download the edited PDF
 */
const downloadPdf = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
            return;
        }
        const savedPdf = savedPdfs.get(sessionId);
        if (!savedPdf) {
            res.status(404).json({
                success: false,
                error: 'PDF not found. It may not have been saved yet or has expired.'
            });
            return;
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${savedPdf.filename}"`);
        res.setHeader('Content-Length', savedPdf.buffer.length);
        res.send(savedPdf.buffer);
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download PDF',
            details: error.message
        });
    }
};
exports.downloadPdf = downloadPdf;
/**
 * Check save status
 */
const checkSaveStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const savedPdf = savedPdfs.get(sessionId);
        res.json({
            success: true,
            saved: !!savedPdf,
            filename: savedPdf?.filename,
            savedAt: savedPdf?.savedAt,
            size: savedPdf?.buffer.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to check save status'
        });
    }
};
exports.checkSaveStatus = checkSaveStatus;
// Cleanup old sessions every 30 minutes
setInterval(() => {
    const maxAge = 60 * 60 * 1000; // 1 hour
    const now = new Date();
    for (const [sessionId, data] of savedPdfs.entries()) {
        if (now.getTime() - data.savedAt.getTime() > maxAge) {
            savedPdfs.delete(sessionId);
        }
    }
}, 30 * 60 * 1000);
//# sourceMappingURL=zohoController.js.map