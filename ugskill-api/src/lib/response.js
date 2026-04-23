"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (data, meta) => {
    return {
        success: true,
        data,
        ...(meta && { meta }),
    };
};
exports.successResponse = successResponse;
const errorResponse = (code, message, details) => {
    return {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
        },
    };
};
exports.errorResponse = errorResponse;
//# sourceMappingURL=response.js.map