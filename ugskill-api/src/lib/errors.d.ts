export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    constructor(message: string, statusCode?: number, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class AuthError extends AppError {
    constructor(message?: string, statusCode?: number);
}
//# sourceMappingURL=errors.d.ts.map