const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ZohoSessionResponse {
    success: boolean;
    editorUrl?: string;
    sessionId?: string;
    error?: string;
    details?: string;
}

export interface SaveStatusResponse {
    saved: boolean;
    savedAt?: string;
    filename?: string;
}

/**
 * Create a new Zoho PDF editing session
 */
export async function createZohoSession(file: File): Promise<ZohoSessionResponse> {
    try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch(`${API_BASE_URL}/zoho/create-session`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating Zoho session:', error);
        return {
            success: false,
            error: 'Failed to create editing session',
            details: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Check if the PDF has been saved in Zoho editor
 */
export async function checkSaveStatus(sessionId: string): Promise<SaveStatusResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/zoho/status/${sessionId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking save status:', error);
        return { saved: false };
    }
}

/**
 * Download the edited PDF
 */
export async function downloadEditedPdf(sessionId: string, filename: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/zoho/download/${sessionId}`);

        if (!response.ok) {
            const error = await response.json();
            console.error('Download error:', error);
            return false;
        }

        const blob = await response.blob();

        // Create download link
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
