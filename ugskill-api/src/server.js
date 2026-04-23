"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const mongodb_1 = require("./config/mongodb");
const logger_1 = require("./lib/logger");
const startServer = async () => {
    try {
        // 1. Connect dependencies
        await (0, mongodb_1.connectMongo)();
        // Redis + Postgres connect automatically via their configs at top level,
        // but in a more complex setup you might defer their connection here.
        // 2. Start HTTP Server
        const server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 Server running on http://localhost:${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
        });
        // 3. Graceful Shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(() => {
                logger_1.logger.info('HTTP server closed.');
                process.exit(0);
            });
            // Force close if it takes too long
            setTimeout(() => {
                logger_1.logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map