export type svcResponse<T> = {
    success: boolean,
    body?: T,
    error?: {
        input: Error | string, options?: {
            code?: string;
            exit?: number;
        }
    },
}
