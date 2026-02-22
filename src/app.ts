import express, { Express, Request, Response } from 'express';
import { join } from 'node:path';
import v1Route from './routes/v1';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { errorHandler } from './middleware/errorHandler';
import { corsOptions, corsWhitelist } from './config/cors';
import demo from './config/demo';
import logger from './logger';

const app: Express = express();
const executionPath: string = process.cwd();
const publicPath = join(executionPath, 'public');
const privatePath = join(executionPath, 'private');

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'"],
                'frame-ancestors': ["'self'", ...corsWhitelist],
            },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
);
app.use(cors(corsOptions)); // automatically imported from /src/config/cors.ts, look there if you're looking to fix CORS

app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    next();
});

app.use(
    express.json({
        limit: '2kb',
    }),
);

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.use('/static', express.static(publicPath));
if (demo.captchaDemo) {
    app.use('/demo', express.static(join(privatePath, 'demo')));
}
app.use('/v1', v1Route);

app.get('/', (req: Request, res: Response) => {
    if (demo.captchaDemo) {
        res.status(200).sendFile(join(privatePath, 'demo', 'index.html'));
    } else {
        res.status(200).json({ status: 'OK' });
    }
});

app.use(errorHandler);

app.disable('x-powered-by');

export default app;
