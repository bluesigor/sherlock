import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ErrorCode } from '../errorCodes';
import { AiSearchRequest } from '../types';

const { generateTextMock, searchMock, getAiModelMock, createOpenAIMock, createAnthropicMock } = vi.hoisted(() => ({
    generateTextMock: vi.fn(),
    searchMock: vi.fn(),
    getAiModelMock: vi.fn(),
    createOpenAIMock: vi.fn(() => vi.fn((model: string) => ({ provider: 'openai', model }))),
    createAnthropicMock: vi.fn(() => vi.fn((model: string) => ({ provider: 'anthropic', model }))),
}));

vi.mock('ai', () => ({
    generateText: generateTextMock,
}));

vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: createOpenAIMock,
}));

vi.mock('@ai-sdk/anthropic', () => ({
    createAnthropic: createAnthropicMock,
}));

vi.mock('./searchService', () => ({
    search: searchMock,
    zoektPrefixes: { repo: 'repo:', lang: 'lang:', sym: 'sym:' },
}));

vi.mock('./aiModelsConfig', () => ({
    getAiModel: getAiModelMock,
}));

const ORG_ID = 42;

const request: AiSearchRequest = {
    query: 'where do we parse the zoekt response?',
    maxMatchDisplayCount: 100,
};

const searchResponse = {
    Result: { Files: [], MatchCount: 0 },
    isBranchFilteringEnabled: false,
};

const mockConfiguredModel = () => {
    process.env.TEST_AI_TOKEN = 'test-token';
    getAiModelMock.mockResolvedValue({
        id: 'openai/gpt-4o-mini',
        provider: 'openai',
        model: 'gpt-4o-mini',
        displayName: 'GPT-4o mini',
        token: { env: 'TEST_AI_TOKEN' },
    });
}

const mockConfiguredAnthropicModel = () => {
    process.env.TEST_AI_TOKEN = 'test-token';
    getAiModelMock.mockResolvedValue({
        id: 'anthropic/claude-3-5-haiku-latest',
        provider: 'anthropic',
        model: 'claude-3-5-haiku-latest',
        displayName: 'Claude 3.5 Haiku',
        token: { env: 'TEST_AI_TOKEN' },
    });
}

describe('aiSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        searchMock.mockResolvedValue(searchResponse);
    });

    test('passes the translated query verbatim to search', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: 'sym:parseZoektResponse lang:TypeScript' });
        const { aiSearch } = await import('./aiSearchService');

        const response = await aiSearch(request, ORG_ID);

        expect(searchMock).toHaveBeenCalledWith({
            ...request,
            query: 'sym:parseZoektResponse lang:TypeScript',
        }, ORG_ID);
        expect(response).toEqual({
            ...searchResponse,
            translatedQuery: 'sym:parseZoektResponse lang:TypeScript',
        });
    });

    test('returns aiSearchNotConfigured when no model is configured', async () => {
        getAiModelMock.mockResolvedValue(undefined);
        const { aiSearch } = await import('./aiSearchService');

        const response = await aiSearch(request, ORG_ID);

        expect(response).toMatchObject({ errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED });
        expect(searchMock).not.toHaveBeenCalled();
    });

    test('returns aiTranslationFailed when the model call throws', async () => {
        mockConfiguredModel();
        generateTextMock.mockRejectedValue(new Error('upstream is down'));
        const { aiSearch } = await import('./aiSearchService');

        const response = await aiSearch(request, ORG_ID);

        expect(response).toMatchObject({ errorCode: ErrorCode.AI_TRANSLATION_FAILED });
        expect(searchMock).not.toHaveBeenCalled();
    });

    test('returns aiTranslationFailed when the model returns an empty query', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: '   ' });
        const { aiSearch } = await import('./aiSearchService');

        const response = await aiSearch(request, ORG_ID);

        expect(response).toMatchObject({ errorCode: ErrorCode.AI_TRANSLATION_FAILED });
        expect(searchMock).not.toHaveBeenCalled();
    });

    test('returns aiTranslationFailed when the token environment variable is not set', async () => {
        mockConfiguredModel();
        delete process.env.TEST_AI_TOKEN;
        const { aiSearch } = await import('./aiSearchService');

        const response = await aiSearch(request, ORG_ID);

        expect(response).toMatchObject({ errorCode: ErrorCode.AI_TRANSLATION_FAILED });
        expect(generateTextMock).not.toHaveBeenCalled();
    });

    test('reports a failing search with the attempted translated query attached', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: 'useEffect( lang:typescript' });
        searchMock.mockResolvedValue({ statusCode: 500, errorCode: ErrorCode.INVALID_REQUEST_BODY, message: 'error parsing regexp' });
        const { aiSearch } = await import('./aiSearchService');

        const response = await aiSearch(request, ORG_ID);

        expect(response).toMatchObject({
            errorCode: ErrorCode.AI_SEARCH_FAILED,
            data: { translatedQuery: 'useEffect( lang:typescript' },
        });
        expect((response as { message: string }).message).toContain('error parsing regexp');
    });

    test('strips a markdown code fence from the model output', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: '```\nrepo:foo bar\n```' });
        const { aiSearch } = await import('./aiSearchService');

        await aiSearch(request, ORG_ID);

        expect(searchMock).toHaveBeenCalledWith(expect.objectContaining({ query: 'repo:foo bar' }), ORG_ID);
    });

    test('collapses a multi line model output into a single line query', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: 'useState\\(\n-useEffect  lang:typescript' });
        const { aiSearch } = await import('./aiSearchService');

        await aiSearch(request, ORG_ID);

        expect(searchMock).toHaveBeenCalledWith(
            expect.objectContaining({ query: 'useState\\( -useEffect lang:typescript' }),
            ORG_ID,
        );
    });
});

describe('translateQuery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        searchMock.mockResolvedValue(searchResponse);
    });

    test('returns the translated query without running a search', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: 'sym:searchRequestSchema' });
        const { translateQuery } = await import('./aiSearchService');

        const response = await translateQuery({ query: request.query });

        expect(response).toEqual({ translatedQuery: 'sym:searchRequestSchema' });
        expect(searchMock).not.toHaveBeenCalled();
    });

    test('resolves an openai model through the openai sdk', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: 'sym:searchRequestSchema' });
        const { translateQuery } = await import('./aiSearchService');

        const response = await translateQuery({ query: request.query });

        expect(createOpenAIMock).toHaveBeenCalledWith({ apiKey: 'test-token' });
        expect(createOpenAIMock.mock.results[0].value).toHaveBeenCalledWith('gpt-4o-mini');
        expect(createAnthropicMock).not.toHaveBeenCalled();
        expect(generateTextMock.mock.calls[0][0].model).toEqual({ provider: 'openai', model: 'gpt-4o-mini' });
        expect(response).toEqual({ translatedQuery: 'sym:searchRequestSchema' });
    });

    test('resolves an anthropic model through the anthropic sdk', async () => {
        mockConfiguredAnthropicModel();
        generateTextMock.mockResolvedValue({ text: 'sym:searchRequestSchema' });
        const { translateQuery } = await import('./aiSearchService');

        const response = await translateQuery({ query: request.query });

        expect(createAnthropicMock).toHaveBeenCalledWith({ apiKey: 'test-token' });
        expect(createAnthropicMock.mock.results[0].value).toHaveBeenCalledWith('claude-3-5-haiku-latest');
        expect(createOpenAIMock).not.toHaveBeenCalled();
        expect(generateTextMock.mock.calls[0][0].model).toEqual({ provider: 'anthropic', model: 'claude-3-5-haiku-latest' });
        expect(response).toEqual({ translatedQuery: 'sym:searchRequestSchema' });
    });

    test('returns aiSearchNotConfigured when no model is configured', async () => {
        getAiModelMock.mockResolvedValue(undefined);
        const { translateQuery } = await import('./aiSearchService');

        expect(await translateQuery({ query: request.query })).toMatchObject({
            errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED,
        });
        expect(generateTextMock).not.toHaveBeenCalled();
    });

    test('returns aiTranslationFailed when the model returns nothing usable', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: '' });
        const { translateQuery } = await import('./aiSearchService');

        expect(await translateQuery({ query: request.query })).toMatchObject({
            errorCode: ErrorCode.AI_TRANSLATION_FAILED,
        });
    });

    test('instructs the model to use every supported zoekt prefix and to escape regex metacharacters', async () => {
        mockConfiguredModel();
        generateTextMock.mockResolvedValue({ text: 'repo:foo' });
        const { translateQuery } = await import('./aiSearchService');

        await translateQuery({ query: request.query });

        const { instructions } = generateTextMock.mock.calls[0][0];
        for (const prefix of ['repo:', 'lang:', 'sym:']) {
            expect(instructions).toContain(prefix);
        }
        expect(instructions).toContain(String.raw`useEffect\(`);
        expect(instructions).not.toContain('omit a prefix');
    });
});
