import { api } from '../../lib/api';

export interface CopyResult {
    title: string;
    description: string;
    bullets: string[];
}

export const aiApi = {
    // Generate product copy using AI
    generateProductCopy: (prompt: string) => api.post<CopyResult>('/ai/generate-copy', { prompt }),
};
