/**
 * API Client for Stan-store
 *
 * Wraps fetch with base URL configuration and the standardized
 * response envelope type: { data, meta, error }
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Standardized API response envelope */
export interface ApiResponse<T> {
    data: T | null;
    meta: Record<string, unknown> | null;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    } | null;
}

/** Custom error class for API errors */
export class ApiError extends Error {
    code: string;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Make an API request and return the unwrapped data.
 * Throws ApiError on server-reported errors.
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // Send HTTP-only cookies
    });

    const body: ApiResponse<T> = await response.json();

    if (body.error) {
        throw new ApiError(body.error.code, body.error.message, body.error.details);
    }

    return body;
}

/** API client methods */
export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown) =>
        request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T>(endpoint: string, data?: unknown) =>
        request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
