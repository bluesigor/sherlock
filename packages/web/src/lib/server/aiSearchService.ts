import { acquireAiRequest } from './aiRequestLimits';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { aiSearchFailed, aiSearchNotConfigured, aiTranslationFailed, ServiceError } from '../serviceError';
import { AiPreviewRequest, AiPreviewResponse, AiSearchRequest, AiSearchResponse } from '../types';
import { isServiceError } from '../utils';
import { AiModelConfig, getAiModel } from './aiModelsConfig';
import { describeProviderError } from './aiProviderError';
import { search } from './searchService';
import { SYSTEM_PROMPT } from './aiSearchPrompt';



const getLanguageModel = ({ provider, model, token }: AiModelConfig) => {
    const apiKey = process.env[token.env];
    if (!apiKey) {
        throw new Error(`Environment variable '${token.env}' is not set.`);
    }

    switch (provider) {
        case 'openai':
            return createOpenAI({ apiKey })(model);
        case 'anthropic':
            return createAnthropic({ apiKey })(model);
    }
}

// Models occasionally wrap their answer in a markdown code fence or spread it over
// several lines, despite being told not to. A zoekt query is always a single line.
const normalizeQuery = (text: string) => text
    .trim()
    .replace(/^```[a-zA-Z]*\s*/, '')
    .replace(/\s*```$/, '')
    .replace(/\s+/g, ' ')
    .trim();

const generateQuery = async (query: string, model: AiModelConfig, signal?: AbortSignal): Promise<string | ServiceError> => {
    if (signal?.aborted) return aiTranslationFailed("request cancelled");
    const release = acquireAiRequest();
    if (isServiceError(release)) return release;
    let providerFailure: string | undefined;

    const translatedQuery = await (async () => {
        try {
            const { text } = await generateText({
                model: getLanguageModel(model),
                instructions: SYSTEM_PROMPT,
                prompt: query,
                abortSignal: signal,
                timeout: 30_000,
                maxOutputTokens: 1024,
                maxRetries: 0,
            });
            return normalizeQuery(text);
        } catch (error) {
            console.error(`AI query translation failed: ${error}`);
            providerFailure = describeProviderError(error);
            return undefined;
        } finally {
            release();
        }
    })();

    if (!translatedQuery) {
        return aiTranslationFailed(providerFailure ?? `the model '${model.id}' did not return a usable query`);
    }

    return translatedQuery;
}

/**
 * Translates a natural language query into a zoekt query without running a search.
 */
export const translateQuery = async ({ query }: AiPreviewRequest, signal?: AbortSignal): Promise<AiPreviewResponse | ServiceError> => {
    const model = await getAiModel();
    if (!model) {
        return aiSearchNotConfigured();
    }

    const translatedQuery = await generateQuery(query, model, signal);
    if (isServiceError(translatedQuery)) {
        return translatedQuery;
    }

    return { translatedQuery };
}

export const aiSearch = async (searchRequest: AiSearchRequest, orgId: number, signal?: AbortSignal): Promise<AiSearchResponse | ServiceError> => {
    const translation = await translateQuery({ query: searchRequest.query }, signal);
    if (isServiceError(translation)) {
        return translation;
    }
    const { translatedQuery } = translation;

    const searchResponse = await search({
        ...searchRequest,
        query: translatedQuery,
    }, orgId);

    if (isServiceError(searchResponse)) {
        return aiSearchFailed(translatedQuery, searchResponse.message);
    }

    return {
        ...searchResponse,
        translatedQuery,
    };
}
