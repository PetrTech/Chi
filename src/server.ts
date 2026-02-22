import { isAbsolute, join, resolve } from 'path';
import app from './app';
import config from './config';
import logger from './logger';
import { createServer } from 'https';
import { readFileSync } from 'fs';

const resolvePath = (path: string): string => isAbsolute(path) ? path : resolve(process.cwd(), path);

const readFile = (path: string) => {
    try {
        return readFileSync(path, 'utf-8');
    } catch (err) {
        logger.error(`File doesn't exist: ${path}`);
        process.exit(1);
    }
}

if (config.httpsEnabled) {
    var credentials = {
        key: readFile(resolvePath(config.httpsPrivateKey)),
        cert: readFile(resolvePath(config.httpsCertificate)),
    };

    var server = createServer(credentials, app);
    server.listen(config.port, config.host, () => {
        logger.info(`Chi HTTPS server running at ${config.host}:${config.port}`);
    });
} else {
    app.listen(config.port, config.host, () => {
        logger.info(`Chi server running at ${config.host}:${config.port}`);
    });
}
