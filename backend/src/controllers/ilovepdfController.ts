import { Request, Response } from 'express';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Store for processed PDFs
const processedPdfs: Map<string, { buffer: Buffer; filename: string; savedAt: Date }> = new Map();

// Use temp directory for Render compatibility
const TEMP_DIR = os.tmpdir();
const UPLOADS_DIR = path.join(TEMP_DIR, 'pdfhustle-uploads');
const OUTPUT_DIR = path.join(TEMP_DIR, 'pdfhustle-output');

// Ensure directories exist
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
ensureDir(UPLOADS_DIR);
ensureDir(OUTPUT_DIR);

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
 * Edit PDF - Add text to PDF
 */
export const editPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const { elements } = req.body; // Array of elements to add

        if (!file) {
            res.status(400).json({ success: false, error: 'No PDF file provided' });
            return;
        }

        console.log('Processing PDF with ILovePDF:', file.originalname);

        const instance = getILovePDFInstance();
        const task = instance.newTask('editpdf');

        await task.start();

        // Add the PDF file
        const pdfFile = new ILovePDFFile(file.path);
        await task.addFile(pdfFile);

        // Parse elements if provided
        let parsedElements = [];
        if (elements) {
            try {
                parsedElements = typeof elements === 'string' ? JSON.parse(elements) : elements;
            } catch (e) {
                console.log('No valid elements provided, processing without modifications');
            }
        }

        // Process the PDF with elements
        await task.process({ elements: parsedElements });

        // Download the processed file
        const outputPath = path.join(OUTPUT_DIR, `edited_${Date.now()}.pdf`);
        await task.download(outputPath);

        // Read the processed file
        const processedBuffer = fs.readFileSync(outputPath);
        const sessionId = `ilovepdf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Store for later download
        processedPdfs.set(sessionId, {
            buffer: processedBuffer,
            filename: `edited_${file.originalname}`,
            savedAt: new Date(),
        });

        // Cleanup
        fs.unlinkSync(file.path);
        fs.unlinkSync(outputPath);

        res.json({
            success: true,
            sessionId,
            message: 'PDF processed successfully',
        });

    } catch (error: any) {
        console.error('ILovePDF edit error:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process PDF',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Compress PDF
 */
export const compressPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const { compressionLevel } = req.body; // 'extreme', 'recommended', 'low'

        if (!file) {
            res.status(400).json({ success: false, error: 'No PDF file provided' });
            return;
        }

        console.log('Compressing PDF with ILovePDF:', file.originalname);

        const instance = getILovePDFInstance();
        const task = instance.newTask('compress');

        await task.start();

        const pdfFile = new ILovePDFFile(file.path);
        await task.addFile(pdfFile);

        await task.process({
            compression_level: compressionLevel || 'recommended'
        });

        // Ensure output directory exists before download
        ensureDir(OUTPUT_DIR);
        const outputPath = path.join(OUTPUT_DIR, `compressed_${Date.now()}.pdf`);
        console.log('Downloading to:', outputPath);
        await task.download(outputPath);

        const processedBuffer = fs.readFileSync(outputPath);
        const sessionId = `compress_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        processedPdfs.set(sessionId, {
            buffer: processedBuffer,
            filename: `compressed_${file.originalname}`,
            savedAt: new Date(),
        });

        fs.unlinkSync(file.path);
        fs.unlinkSync(outputPath);

        const originalSize = file.size;
        const compressedSize = processedBuffer.length;
        const reduction = Math.round((1 - compressedSize / originalSize) * 100);

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

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Failed to compress PDF',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Merge PDFs
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

        // Add all files
        for (const file of files) {
            const pdfFile = new ILovePDFFile(file.path);
            await task.addFile(pdfFile);
        }

        await task.process();

        // Ensure output directory exists before download
        ensureDir(OUTPUT_DIR);
        const outputPath = path.join(OUTPUT_DIR, `merged_${Date.now()}.pdf`);
        console.log('Downloading to:', outputPath);
        await task.download(outputPath);

        const processedBuffer = fs.readFileSync(outputPath);
        const sessionId = `merge_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        processedPdfs.set(sessionId, {
            buffer: processedBuffer,
            filename: 'merged.pdf',
            savedAt: new Date(),
        });

        // Cleanup
        files.forEach(file => fs.unlinkSync(file.path));
        fs.unlinkSync(outputPath);

        res.json({
            success: true,
            sessionId,
            message: `${files.length} PDFs merged successfully`,
        });

    } catch (error: any) {
        console.error('ILovePDF merge error:', error);

        const files = req.files as Express.Multer.File[];
        if (files) {
            files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to merge PDFs',
            details: error.message || 'Unknown error',
        });
    }
};

/**
 * Download processed PDF
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

        // Delete after download
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
