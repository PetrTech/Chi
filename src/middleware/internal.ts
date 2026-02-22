import { NextFunction, Request, Response } from "express";

export const internal = (req: Request, res: Response, next: NextFunction): any => {
    const chiSecret = req.headers['X-Chi-Secret'];
    if (chiSecret !== process.env.CHI_INTERNAL_KEY) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};