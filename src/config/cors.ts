import { CorsOptions } from "cors";
import config from "../config";

// Add other sites that require Chi here
export const corsWhitelist = [
    `http://localhost:${config.port}`,
];

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || corsWhitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("CORS said no"));
        }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-Chi-Secret"],
    credentials: true,
    maxAge: 86400,
};