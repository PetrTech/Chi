import express, { Express, Request, Response } from 'express';
import { join } from 'node:path';
import v1Route from './routes/v1';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { errorHandler } from './middleware/errorHandler';
import { corsOptions, corsWhitelist } from './config/cors';

const app: Express = express();
const executionPath: string = process.cwd();
const publicPath = join(executionPath, 'public');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'"],
            "frame-ancestors": ["'self'", ...corsWhitelist]
        }
    },
    crossOriginResourcePolicy: {policy: "cross-origin"},
}));
app.use(cors(corsOptions)); // automatically imported from /src/config/cors.ts, look there if you're looking to fix CORS

app.use(express.json({
    limit: '2kb'
}));

app.use('/static', express.static(publicPath));
app.use('/v1', v1Route);

app.get('/', (req: Request, res: Response) => {
    res.sendFile(join(publicPath, 'index.html'));
});

app.use(errorHandler);

app.disable('x-powered-by');

export default app;