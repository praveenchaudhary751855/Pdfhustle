import { jsPDF } from 'jspdf';

// Page size dimensions in mm
const PAGE_SIZES = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 },
};

interface ConvertOptions {
    pageSize: 'a4' | 'letter' | 'legal' | 'fit';
    orientation: 'portrait' | 'landscape' | 'auto';
    quality?: number; // 0.1 to 1
    margin?: number; // in mm
}

/**
 * Convert multiple images to a single PDF document
 */
export async function imagesToPdf(
    images: File[],
    options: ConvertOptions = { pageSize: 'a4', orientation: 'portrait' }
): Promise<Blob> {
    const { pageSize, orientation, quality = 0.92, margin = 10 } = options;

    // Determine initial PDF dimensions
    let pdfWidth: number;
    let pdfHeight: number;

    if (pageSize === 'fit') {
        // Will be set based on first image
        pdfWidth = 210;
        pdfHeight = 297;
    } else {
        const size = PAGE_SIZES[pageSize];
        if (orientation === 'landscape') {
            pdfWidth = size.height;
            pdfHeight = size.width;
        } else {
            pdfWidth = size.width;
            pdfHeight = size.height;
        }
    }

    // Create PDF with initial dimensions
    const pdf = new jsPDF({
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: pageSize === 'fit' ? [pdfWidth, pdfHeight] : pageSize,
    });

    for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Load image
        const imageData = await loadImage(image);
        const imgRatio = imageData.width / imageData.height;

        // Calculate dimensions for this page
        let pageWidth = pdfWidth;
        let pageHeight = pdfHeight;

        if (pageSize === 'fit') {
            // Fit page to image
            const maxWidth = 210; // A4 width as max
            if (imageData.width > maxWidth) {
                pageWidth = maxWidth;
                pageHeight = maxWidth / imgRatio;
            } else {
                pageWidth = imageData.width / 3.779527559; // px to mm
                pageHeight = imageData.height / 3.779527559;
            }
        } else if (orientation === 'auto') {
            // Auto-detect orientation based on image
            if (imgRatio > 1) {
                // Image is landscape
                pageWidth = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES].height;
                pageHeight = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES].width;
            } else {
                pageWidth = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES].width;
                pageHeight = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES].height;
            }
        }

        // Add new page for subsequent images
        if (i > 0) {
            pdf.addPage([pageWidth, pageHeight], pageWidth > pageHeight ? 'landscape' : 'portrait');
        }

        // Calculate image dimensions to fit within margins
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        let imgWidth: number;
        let imgHeight: number;

        if (imgRatio > availableWidth / availableHeight) {
            // Image is wider than available space
            imgWidth = availableWidth;
            imgHeight = availableWidth / imgRatio;
        } else {
            // Image is taller than available space
            imgHeight = availableHeight;
            imgWidth = availableHeight * imgRatio;
        }

        // Center the image on the page
        const x = margin + (availableWidth - imgWidth) / 2;
        const y = margin + (availableHeight - imgHeight) / 2;

        // Add image to PDF
        pdf.addImage(
            imageData.dataUrl,
            getImageFormat(image.type),
            x,
            y,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
        );
    }

    // Return as blob
    return pdf.output('blob');
}

/**
 * Load an image file and return its data URL and dimensions
 */
function loadImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const img = new Image();

            img.onload = () => {
                resolve({
                    dataUrl,
                    width: img.width,
                    height: img.height,
                });
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get the image format for jsPDF
 */
function getImageFormat(mimeType: string): 'JPEG' | 'PNG' | 'WEBP' {
    if (mimeType.includes('png')) return 'PNG';
    if (mimeType.includes('webp')) return 'PNG'; // jsPDF doesn't support WEBP natively
    return 'JPEG';
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
