import dotenv from 'dotenv'

dotenv.config();

interface Config {
    port: number; // Bound port
    host: string; // Bound host
    secret: string; // Server secret for HMAC
    cross_server_secret_key: string; // Secret that is used for communication inbetween servers for the POST /verify endpoint
}

const config: Config = {
    port: Number(process.env.PORT) || 8080,
    host: process.env.HOST || 'localhost',
    secret: process.env.SECRET || 'VX__',
    cross_server_secret_key: process.env.CHI_INTERNAL_KEY || 'VX__',
}

// Check the 'config' subdirectory for configuration files

export default config;