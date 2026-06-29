import { Request, Response, NextFunction } from 'express';
interface LogRequest extends Request {
    apiKeyId?: string;
    kbId?: string;
}
export declare function requestLogger(req: LogRequest, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=logger.d.ts.map