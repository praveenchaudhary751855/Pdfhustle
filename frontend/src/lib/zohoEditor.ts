/**
 * Zoho PDF Editor Service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ZohoSessionResponse {
    success: boolean;
    sessionId?: string;
    editorUrl?: string;
    error?: string;
    details?: any;
}

export interface SaveStatusResponse {
    success: boolean;
    saved: boolean;
    filename?: string;
    savedAt?: string;
    size?: number;
}

export async function createZohoSession(file: File): Promise<ZohoSessionResponse> {
    try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch(`${API_BASE_URL}/zoho/create-session`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error('Error creating Zoho session:', error);
        return {
            success: false,
            error: 'Failed to create editing session',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function checkSaveStatus(sessionId: string): Promise<SaveStatusResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/zoho/status/${sessionId}`);
        return await response.json();
    } catch (error) {
        return { success: false, saved: false };
    }
}

export async function downloadEditedPdf(sessionId: string, filename?: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/zoho/download/${sessionId}`);

        if (!response.ok) return false;

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `edited_${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
    } catch (error) {
        console.error('Error downloading PDF:', error);
        return false;
    }
}
