import { Request, Response } from 'express';
/**
 * Create a new PDF editing session with Zoho
 */
export declare const createPdfSession: (req: Request, res: Response) => Promise<void>;
/**
 * Handle save callback from Zoho
 */
export declare const handleSaveCallback: (req: Request, res: Response) => Promise<void>;
/**
 * Download the edited PDF
 */
export declare const downloadPdf: (req: Request, res: Response) => Promise<void>;
/**
 * Check save status
 */
export declare const checkSaveStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=zohoController.d.ts.map