"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message = 'Validation Error', details) {
        super(message, 400, details);
    }
}
exports.ValidationError = ValidationError;
class AuthError extends AppError {
    constructor(message = 'Authentication failed', statusCode = 401) {
        super(message, statusCode);
    }
}
exports.AuthError = AuthError;
//# sourceMappingURL=errors.js.map