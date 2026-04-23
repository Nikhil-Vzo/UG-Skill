"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestId_1 = require("./middleware/requestId");
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)()); // Configure origin properly in production
// Request parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request ID
app.use(requestId_1.requestIdMiddleware);
// Logging HTTP Requests using Morgan and Winston
app.use((0, morgan_1.default)(':method :url :status :res[content-length] - :response-time ms - reqId::req[x-request-id]', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim()),
    },
}));
// Routes
app.use('/api/v1/health', health_1.default);
// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Cannot ${req.method} ${req.originalUrl}`,
        },
    });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map