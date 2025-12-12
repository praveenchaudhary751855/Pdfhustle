import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx';
import * as pdfjs from 'pdfjs-dist';
import { saveAs } from 'file-saver';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ConversionResult {
    success: boolean;
    blob?: Blob;
    error?: string;
    pageCount?: number;
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPdf(file: File): Promise<{ pages: string[]; pageCount: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items and join them
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        pages.push(pageText);
    }

    return { pages, pageCount: pdf.numPages };
}

/**
 * Convert PDF to Word document
 */
export async function pdfToWord(
    file: File,
    options: { preserveFormatting?: boolean } = {}
): Promise<ConversionResult> {
    try {
        // Extract text from PDF
        const { pages, pageCount } = await extractTextFromPdf(file);

        // Create Word document
        const children: (Paragraph)[] = [];

        pages.forEach((pageText, index) => {
            // Split text into paragraphs
            const paragraphs = pageText.split(/\n\n|\r\n\r\n/).filter(p => p.trim());

            if (paragraphs.length === 0) {
                // If no paragraphs, add the whole text
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: pageText || ' ' })],
                    })
                );
            } else {
                paragraphs.forEach(paragraphText => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: paragraphText.trim(),
                                    size: 24, // 12pt
                                }),
                            ],
                            spacing: { after: 200 },
                        })
                    );
                });
            }

            // Add page break between pages (except last)
            if (index < pages.length - 1) {
                children.push(
                    new Paragraph({
                        children: [new PageBreak()],
                    })
                );
            }
        });

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: children.length > 0 ? children : [
                        new Paragraph({
                            children: [new TextRun({ text: 'No text content found in PDF.' })],
                        }),
                    ],
                },
            ],
        });

        // Generate Word file
        const blob = await Packer.toBlob(doc);

        return {
            success: true,
            blob,
            pageCount,
        };
    } catch (error) {
        console.error('PDF to Word conversion error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert PDF',
        };
    }
}

/**
 * Download Word document
 */
export function downloadWord(blob: Blob, filename: string): void {
    saveAs(blob, filename);
}
