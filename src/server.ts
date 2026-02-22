import app from './app'
import config from './config';
import logger from './logger'

app.listen(config.port, config.host, () => {
    logger.info(`Chi server running at ${config.host}:${config.port}`)
});
