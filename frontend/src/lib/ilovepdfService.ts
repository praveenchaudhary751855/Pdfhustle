const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ILovePDFResponse {
    success: boolean;
    sessionId?: string;
    message?: string;
    error?: string;
    details?: string;
    originalSize?: number;
    compressedSize?: number;
    reduction?: string;
}

export interface ApiStatusResponse {
    available: boolean;
    message?: string;
}

/**
 * Check if ILovePDF API is available
 */
export async function checkApiStatus(): Promise<ApiStatusResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/ilovepdf/status`);
        return await response.json();
    } catch (error) {
        return { available: false };
    }
}

/**
 * Edit PDF with ILovePDF
 */
export async function editPdf(file: File, elements?: any[]): Promise<ILovePDFResponse> {
    try {
        const formData = new FormData();
        formData.append('pdf', file);
        if (elements && elements.length > 0) {
            formData.append('elements', JSON.stringify(elements));
        }

        const response = await fetch(`${API_BASE_URL}/ilovepdf/edit`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error('Error editing PDF:', error);
        return {
            success: false,
            error: 'Failed to edit PDF',
            details: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Compress PDF with ILovePDF
 */
export async function compressPdf(file: File, compressionLevel: 'extreme' | 'recommended' | 'low' = 'recommended'): Promise<ILovePDFResponse> {
    try {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('compressionLevel', compressionLevel);

        const response = await fetch(`${API_BASE_URL}/ilovepdf/compress`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error('Error compressing PDF:', error);
        return {
            success: false,
            error: 'Failed to compress PDF',
            details: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Merge multiple PDFs
 */
export async function mergePdfs(files: File[]): Promise<ILovePDFResponse> {
    try {
        const formData = new FormData();
        files.forEach(file => formData.append('pdfs', file));

        const response = await fetch(`${API_BASE_URL}/ilovepdf/merge`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error('Error merging PDFs:', error);
        return {
            success: false,
            error: 'Failed to merge PDFs',
            details: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Download processed PDF
 */
export async function downloadProcessedPdf(sessionId: string, filename: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/ilovepdf/download/${sessionId}`);

        if (!response.ok) {
            console.error('Download failed');
            return false;
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading PDF:', error);
        return false;
    }
}
