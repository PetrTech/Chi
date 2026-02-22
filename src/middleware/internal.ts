import { NextFunction, Request, Response } from "express";
import config from "../config";

export const internal = (req: Request, res: Response, next: NextFunction): any => {
    const chiSecret = req.headers['x-chi-secret'];
    if (chiSecret !== config.cross_server_secret_key) {
        console.log(config.cross_server_secret_key);
        console.log(chiSecret);
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};