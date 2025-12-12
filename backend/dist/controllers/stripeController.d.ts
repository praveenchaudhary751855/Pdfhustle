import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createCheckoutSession: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPortalSession: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSubscriptionStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=stripeController.d.ts.map