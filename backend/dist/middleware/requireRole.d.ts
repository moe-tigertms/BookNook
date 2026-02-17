import { Request, Response, NextFunction } from "express";
export declare function requireRole(...allowed: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
