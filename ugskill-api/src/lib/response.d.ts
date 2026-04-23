export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    meta?: {
        page?: number;
        perPage?: number;
        total?: number;
        totalPages?: number;
        [key: string]: any;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export declare const successResponse: <T>(data: T, meta?: ApiResponse<T>["meta"]) => ApiResponse<T>;
export declare const errorResponse: (code: string, message: string, details?: any) => ApiResponse;
//# sourceMappingURL=response.d.ts.map