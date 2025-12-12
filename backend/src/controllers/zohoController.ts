import { Request, Response } from 'express';
import * as SDK from "@zoho-corp/office-integrator-sdk";
import { initializeZohoSDK, getZohoDomain } from '../config/zohoConfig';
import fs from 'fs';
import path from 'path';

// Store for saving edited PDFs
const savedPdfs: Map<string, { buffer: Buffer; filename: string; savedAt: Date }> = new Map();

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Create a new PDF editing session with Zoho
 */
export const createPdfSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;

        if (!file) {
            res.status(400).json({
                success: false,
                error: 'No PDF file provided'
            });
            return;
        }

        // Initialize SDK
        await initializeZohoSDK();

        // Generate a unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Get the callback URL
        const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const callbackUrl = `${backendUrl}/api/zoho/save-callback?sessionId=${sessionId}`;

        console.log(`Creating Zoho PDF session for: ${file.originalname}`);
        console.log(`Callback URL: ${callbackUrl}`);

        // Create PDF Editor parameters using SDK
        const pdfEditorAPI = new SDK.V1.PDFEditorAPI();

        // Create document with file upload
        const document = new SDK.V1.CreateDocumentParameters();

        // Read file and create stream source
        const fileBuffer = fs.readFileSync(file.path);
        const streamWrapper = new SDK.StreamWrapper(file.originalname, fileBuffer, file.mimetype);
        document.setDocument(streamWrapper);

        // Set callback settings
        const callbackSettings = new SDK.V1.CallbackSettings();
        callbackSettings.setSaveFormat("pdf");
        callbackSettings.setSaveUrl(callbackUrl);
        callbackSettings.setHttpMethodType("post");
        callbackSettings.setRetries(3);
        callbackSettings.setTimeout(120000);
        document.setCallbackSettings(callbackSettings);

        // Set document info
        const documentInfo = new SDK.V1.DocumentInfo();
        documentInfo.setDocumentName(file.originalname);
        documentInfo.setDocumentId(sessionId);
        document.setDocumentInfo(documentInfo);

        // Set editor settings
        const editorSettings = new SDK.V1.EditorSettings();
        editorSettings.setUnit("mm");
        editorSettings.setLanguage("en");
        document.setEditorSettings(editorSettings);

        // Set UI options
        const uiOptions = new SDK.V1.UiOptions();
        uiOptions.setSaveButton("show");
        document.setUiOptions(uiOptions);

        // Create the session
        const response = await pdfEditorAPI.createDocument(document);

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        if (response) {
            const documentUrl = response.getDocumentUrl();
            const documentSessionId = response.getSessionId();

            console.log('Zoho session created successfully');

            res.json({
                success: true,
                editorUrl: documentUrl,
                sessionId: documentSessionId || sessionId,
            });
        } else {
            throw new Error('No response from Zoho API');
        }

    } catch (error: any) {
        console.error('Zoho create session error:', error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create PDF editing session',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Handle save callback from Zoho
 */
export const handleSaveCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.query.sessionId as string;

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID required' });
            return;
        }

        console.log(`Received save callback for session: ${sessionId}`);

        // Zoho sends the file in the request body
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(chunks);

            if (buffer.length > 0) {
                // Save the PDF data
                savedPdfs.set(sessionId, {
                    buffer,
                    filename: `edited_${sessionId}.pdf`,
                    savedAt: new Date(),
                });

                console.log(`PDF saved for session ${sessionId}, size: ${buffer.length} bytes`);
            }

            res.json({ success: true });
        });

    } catch (error: any) {
        console.error('Save callback error:', error);
        res.status(500).json({ error: 'Failed to save PDF' });
    }
};

/**
 * Check if PDF has been saved
 */
export const checkSaveStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.params.sessionId;

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID required' });
            return;
        }

        const savedPdf = savedPdfs.get(sessionId);

        res.json({
            saved: !!savedPdf,
            savedAt: savedPdf?.savedAt,
            filename: savedPdf?.filename,
        });

    } catch (error: any) {
        console.error('Check status error:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
};

/**
 * Download the edited PDF
 */
export const downloadPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.params.sessionId;

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID required' });
            return;
        }

        const savedPdf = savedPdfs.get(sessionId);

        if (!savedPdf) {
            res.status(404).json({ error: 'PDF not found. Please save in the editor first.' });
            return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${savedPdf.filename}"`);
        res.send(savedPdf.buffer);

        // Optionally, delete after download
        savedPdfs.delete(sessionId);

    } catch (error: any) {
        console.error('Download PDF error:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
};
