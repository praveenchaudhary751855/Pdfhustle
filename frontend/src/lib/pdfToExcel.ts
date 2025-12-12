'use client';

import * as XLSX from 'xlsx';
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

interface ConversionResult {
    success: boolean;
    blob?: Blob;
    error?: string;
    pageCount?: number;
    tableCount?: number;
}

interface TableData {
    rows: string[][];
    pageNumber: number;
}

/**
 * Extract text content from PDF and try to identify table structures
 */
async function extractTablesFromPdf(file: File): Promise<{ tables: TableData[]; pageCount: number }> {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const tables: TableData[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Group text items by their Y position to identify rows
        const textByY: Map<number, { x: number; text: string }[]> = new Map();

        textContent.items.forEach((item: any) => {
            if (item.str && item.str.trim()) {
                const y = Math.round(item.transform[5]); // Y position
                const x = item.transform[4]; // X position

                if (!textByY.has(y)) {
                    textByY.set(y, []);
                }
                textByY.get(y)!.push({ x, text: item.str.trim() });
            }
        });

        // Sort Y positions (descending because PDF coordinates start from bottom)
        const sortedYPositions = Array.from(textByY.keys()).sort((a, b) => b - a);

        // Create rows from text grouped by Y position
        const rows: string[][] = [];

        sortedYPositions.forEach(y => {
            const items = textByY.get(y)!;
            // Sort by X position
            items.sort((a, b) => a.x - b.x);
            // Combine text items into cells (using significant gaps as column separators)
            const rowTexts = items.map(item => item.text);
            if (rowTexts.length > 0) {
                rows.push(rowTexts);
            }
        });

        // Only add if we have meaningful data (more than just a few items)
        if (rows.length > 1) {
            tables.push({
                rows,
                pageNumber: pageNum,
            });
        }
    }

    return { tables, pageCount: pdf.numPages };
}

/**
 * Convert PDF to Excel workbook
 */
export async function pdfToExcel(
    file: File,
    options: { pageRange?: 'all' | 'custom'; customPages?: string } = {}
): Promise<ConversionResult> {
    try {
        // Extract tables from PDF
        const { tables, pageCount } = await extractTablesFromPdf(file);

        if (tables.length === 0) {
            return {
                success: false,
                error: 'No table data found in PDF. Make sure your PDF contains tabular data.',
            };
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add each table as a sheet
        tables.forEach((table, index) => {
            // Normalize row lengths
            const maxCols = Math.max(...table.rows.map(row => row.length));
            const normalizedRows = table.rows.map(row => {
                while (row.length < maxCols) {
                    row.push('');
                }
                return row;
            });

            // Create worksheet from array of arrays
            const ws = XLSX.utils.aoa_to_sheet(normalizedRows);

            // Set column widths
            const colWidths = [];
            for (let i = 0; i < maxCols; i++) {
                const maxWidth = Math.max(
                    ...normalizedRows.map(row => (row[i] || '').length)
                );
                colWidths.push({ wch: Math.min(Math.max(maxWidth, 10), 50) });
            }
            ws['!cols'] = colWidths;

            // Add sheet to workbook
            const sheetName = tables.length > 1
                ? `Page ${table.pageNumber}`
                : 'Data';
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        return {
            success: true,
            blob,
            pageCount,
            tableCount: tables.length,
        };
    } catch (error) {
        console.error('PDF to Excel conversion error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert PDF to Excel',
        };
    }
}

/**
 * Download Excel file
 */
export function downloadExcel(blob: Blob, filename: string): void {
    saveAs(blob, filename);
}
