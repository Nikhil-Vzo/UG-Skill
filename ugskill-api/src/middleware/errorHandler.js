"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const errorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: err.format(),
            },
        });
    }
    if (err instanceof errors_1.AppError) {
        // Expected operational errors
        if (!err.isOperational) {
            logger_1.logger.error('Unexpected AppError:', { error: err.message, stack: err.stack });
        }
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.name,
                message: err.message,
                details: err.details,
            },
        });
    }
    // Fallback for unhandled/unexpected errors
    logger_1.logger.error('Unhandled Error:', { error: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map