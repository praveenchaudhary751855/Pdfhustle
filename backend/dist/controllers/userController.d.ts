import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getConversionHistory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const trackConversion: (req: AuthRequest, res: Response) => Promise<void>;
export declare const canConvert: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map