import { NextFunction, Request, Response } from "express";

export const internal = (req: Request, res: Response, next: NextFunction): any => {
    const chiSecret = req.headers['x-chi-secret'];
    if (chiSecret !== process.env.CHI_INTERNAL_KEY) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};