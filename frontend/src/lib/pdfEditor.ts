'use client';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

// pdfjs will be imported dynamically to avoid SSR issues
let pdfjs: typeof import('pdfjs-dist') | null = null;

// Initialize pdfjs only on client side
async function getPdfJs() {
    if (typeof window === 'undefined') {
        throw new Error('PDF.js can only be used in browser');
    }

    if (!pdfjs) {
        pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    return pdfjs;
}

export interface TextAnnotation {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    pageNumber: number;
}

export interface PageInfo {
    pageNumber: number;
    width: number;
    height: number;
}

/**
 * Load PDF and get page information
 */
export async function loadPdfInfo(file: File): Promise<{ pageCount: number; pages: PageInfo[] }> {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: PageInfo[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
        });
    }

    return { pageCount: pdf.numPages, pages };
}

/**
 * Render PDF page to canvas
 */
export async function renderPdfPage(
    file: File,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
): Promise<{ width: number; height: number }> {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    await page.render({
        canvas,
        canvasContext: context,
        viewport,
    }).promise;

    return { width: viewport.width, height: viewport.height };
}

/**
 * Add text annotations to PDF and save
 */
export async function savePdfWithAnnotations(
    file: File,
    annotations: TextAnnotation[]
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    // Group annotations by page
    const annotationsByPage = annotations.reduce((acc, ann) => {
        if (!acc[ann.pageNumber]) {
            acc[ann.pageNumber] = [];
        }
        acc[ann.pageNumber].push(ann);
        return acc;
    }, {} as Record<number, TextAnnotation[]>);

    // Add annotations to each page
    Object.entries(annotationsByPage).forEach(([pageNum, pageAnnotations]) => {
        const page = pages[parseInt(pageNum) - 1];
        if (!page) return;

        const { height } = page.getSize();

        pageAnnotations.forEach(annotation => {
            // Convert color hex to RGB
            const colorHex = annotation.color.replace('#', '');
            const r = parseInt(colorHex.substring(0, 2), 16) / 255;
            const g = parseInt(colorHex.substring(2, 4), 16) / 255;
            const b = parseInt(colorHex.substring(4, 6), 16) / 255;

            // PDF coordinates are from bottom-left, canvas from top-left
            // We need to convert y coordinate
            const pdfY = height - annotation.y - annotation.fontSize;

            page.drawText(annotation.text, {
                x: annotation.x,
                y: pdfY,
                size: annotation.fontSize,
                font: helveticaFont,
                color: rgb(r, g, b),
            });
        });
    });

    const pdfBytes = await pdfDoc.save();
    // Cast to Uint8Array<ArrayBuffer> for TypeScript 5.x compatibility with Blob
    return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}

/**
 * Download edited PDF
 */
export function downloadPdf(blob: Blob, filename: string): void {
    saveAs(blob, filename);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
