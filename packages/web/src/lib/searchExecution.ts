import { aiSearch, search } from '@/app/api/(client)/client';
import { SearchResponse } from './types';

export const executeSearch = async (
    query: string, aiQuery: string, maxMatchDisplayCount: number,
    domain: string, signal?: AbortSignal,
): Promise<SearchResponse & { translatedQuery?: string }> => {
    if (aiQuery && !query) {
        return aiSearch({ query: aiQuery, maxMatchDisplayCount }, domain, signal);
    }
    const result = await search({ query, maxMatchDisplayCount }, domain, signal);
    return { ...result, ...(aiQuery ? { translatedQuery: query } : {}) };
};
