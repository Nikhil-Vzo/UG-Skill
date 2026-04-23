import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            reqId: string;
        }
    }
}
export declare const requestIdMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requestId.d.ts.map