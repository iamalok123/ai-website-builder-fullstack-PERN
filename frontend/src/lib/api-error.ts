import { AxiosError } from "axios";

interface ErrorResponse {
    message?: string;
}

export const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred') => {
    if (error instanceof AxiosError) {
        const response = error.response?.data as ErrorResponse | undefined;
        return response?.message || error.message || fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
};
