import { Request, Response } from 'express';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Store for processed PDFs (in-memory)
const processedPdfs: Map<string, { buffer: Buffer; filename: string; savedAt: Date }> = new Map();

// Use temp directory for uploads only
const UPLOADS_DIR = path.join(os.tmpdir(), 'pdfhustle-uploads');

// Ensure uploads directory exists
try {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
} catch (e) {
    console.error('Failed to create uploads directory:', e);
}

/**
 * Get ILovePDF instance
 */
function getILovePDFInstance(): any {
    const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
    const secretKey = process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
        throw new Error('ILovePDF API keys not configured');
    }

    return new ILovePDFApi(publicKey, secretKey);
}

/**
 * Stream to Buffer helper
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

/**
 * Compress PDF - Memory-based (no file download needed)
 */
export const compressPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const { compressionLevel } = req.body;

        if (!file) {
            res.status(400).json({ success: false, error: 'No PDF file provided' });
            return;
        }

        console.log('=== Compressing PDF with ILovePDF ===');
        console.log('File:', file.originalname);
        console.log('Compression level:', compressionLevel || 'recommended');

        const instance = getILovePDFInstance();
        const task = instance.newTask('compress');

        await task.start();
        console.log('Task started');

        const pdfFile = new ILovePDFFile(file.path);
        await task.addFile(pdfFile);
        console.log('File added to task');

        await task.process({
            compression_level: compressionLevel || 'recommended'
        });
        console.log('Processing complete');

        // Download as stream to memory - NO FILE NEEDED!
        console.log('Downloading as stream...');
        const stream = await task.downloadAsStream();
        const processedBuffer = await streamToBuffer(stream);
        console.log('Downloaded to buffer, size:', processedBuffer.length);

        const sessionId = `compress_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        processedPdfs.set(sessionId, {
            buffer: processedBuffer,
            filename: `compressed_${file.originalname}`,
            savedAt: new Date(),
        });

        // Cleanup uploaded file
        try {
            fs.unlinkSync(file.path);
        } catch (e) {
            console.log('Could not delete temp file:', e);
        }

        const originalSize = file.size;
        const compressedSize = processedBuffer.length;
        const reduction = Math.round((1 - compressedSize / originalSize) * 100);

        console.log('=== Compression successful ===');
        console.log('Original:', originalSize, 'Compressed:', compressedSize, 'Reduction:', reduction + '%');

        res.json({
            success: true,
            sessionId,
            originalSize,
            compressedSize,
            reduction: `${reduction}%`,
            message: 'PDF compressed successfully',
        });

    } catch (error: any) {
        console.error('ILovePDF compress error:', error);

        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }

        res.status(500).json({
            success: false,
            error: 'Failed to compress PDF',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Edit PDF - Memory-based
 */
export const editPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const { elements } = req.body;

        if (!file) {
            res.status(400).json({ success: false, error: 'No PDF file provided' });
            return;
        }

        console.log('Processing PDF with ILovePDF:', file.originalname);

        const instance = getILovePDFInstance();
        const task = instance.newTask('editpdf');

        await task.start();

        const pdfFile = new ILovePDFFile(file.path);
        await task.addFile(pdfFile);

        let parsedElements = [];
        if (elements) {
            try {
                parsedElements = typeof elements === 'string' ? JSON.parse(elements) : elements;
            } catch (e) {
                console.log('No valid elements provided');
            }
        }

        await task.process({ elements: parsedElements });

        // Download as stream
        const stream = await task.downloadAsStream();
        const processedBuffer = await streamToBuffer(stream);

        const sessionId = `edit_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        processedPdfs.set(sessionId, {
            buffer: processedBuffer,
            filename: `edited_${file.originalname}`,
            savedAt: new Date(),
        });

        try { fs.unlinkSync(file.path); } catch (e) { }

        res.json({
            success: true,
            sessionId,
            message: 'PDF processed successfully',
        });

    } catch (error: any) {
        console.error('ILovePDF edit error:', error);
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) { } }

        res.status(500).json({
            success: false,
            error: 'Failed to process PDF',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Merge PDFs - Memory-based
 */
export const mergePdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length < 2) {
            res.status(400).json({ success: false, error: 'At least 2 PDF files required' });
            return;
        }

        console.log(`Merging ${files.length} PDFs with ILovePDF`);

        const instance = getILovePDFInstance();
        const task = instance.newTask('merge');

        await task.start();

        for (const file of files) {
            const pdfFile = new ILovePDFFile(file.path);
            await task.addFile(pdfFile);
        }

        await task.process();

        // Download as stream
        const stream = await task.downloadAsStream();
        const processedBuffer = await streamToBuffer(stream);

        const sessionId = `merge_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        processedPdfs.set(sessionId, {
            buffer: processedBuffer,
            filename: 'merged.pdf',
            savedAt: new Date(),
        });

        files.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) { } });

        res.json({
            success: true,
            sessionId,
            message: `${files.length} PDFs merged successfully`,
        });

    } catch (error: any) {
        console.error('ILovePDF merge error:', error);
        const files = req.files as Express.Multer.File[];
        if (files) {
            files.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) { } });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to merge PDFs',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Download processed PDF from memory
 */
export const downloadProcessedPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID required' });
            return;
        }

        const pdf = processedPdfs.get(sessionId);

        if (!pdf) {
            res.status(404).json({ error: 'PDF not found or expired' });
            return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
        res.send(pdf.buffer);

        // Delete from memory after download
        processedPdfs.delete(sessionId);

    } catch (error: any) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
};

/**
 * Check API status
 */
export const getApiStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const hasKeys = !!(process.env.ILOVEPDF_PUBLIC_KEY && process.env.ILOVEPDF_SECRET_KEY);

        res.json({
            available: hasKeys,
            message: hasKeys ? 'ILovePDF API is configured' : 'ILovePDF API keys not configured',
        });
    } catch (error) {
        res.status(500).json({ available: false, error: 'Failed to check API status' });
    }
};
