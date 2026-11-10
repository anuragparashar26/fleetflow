// App config loader
import { loadEnv } from './utils/loadEnv.js';

loadEnv();

export default {
    port: process.env.PORT || 4000,
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    logLevel: process.env.LOG_LEVEL || 'info'

    // Add more config as needed 
}