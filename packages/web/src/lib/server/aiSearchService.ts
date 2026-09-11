import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { aiSearchFailed, aiSearchNotConfigured, aiTranslationFailed, ServiceError } from '../serviceError';
import { AiPreviewRequest, AiPreviewResponse, AiSearchRequest, AiSearchResponse } from '../types';
import { isServiceError } from '../utils';
import { AiModelConfig, getAiModel } from './aiModelsConfig';
import { search, zoektPrefixes } from './searchService';

const EXAMPLES: [naturalLanguage: string, query: string][] = [
    ['TODOs in typescript', 'TODO lang:typescript'],
    ['the function that parses the zoekt response', 'sym:parseZoektResponse'],
    ['where do we read the connection config', 'sym:readConnectionConfig'],
    ['react components that call useEffect', String.raw`useEffect\( lang:typescript`],
    ['config file for the gitlab connection', String.raw`file:gitlab.*\.json`],
];

const SYSTEM_PROMPT = [
    'You translate a natural language description of code into a single zoekt search query.',
    'Respond with the query on a single line and nothing else: no explanation, no markdown, no quotes.',
    `The supported query prefixes are: ${Object.values(zoektPrefixes).join(', ')}.`,
    'Terms without a prefix match file content. Values are regular expressions.',
    'Use a prefix whenever the description implies one: a programming language becomes lang:, a file name or extension becomes file:, the name of a function, class, type or variable becomes sym:, a repository name becomes repo:.',
    'When the description points at a named thing rather than at prose, search for its likely identifier spelling with sym: instead of searching for the words of the description.',
    'Drop conversational filler such as "where do we", "find all" or "show me" rather than searching for those words.',
    'A term is excluded by prefixing it with a minus sign; there is no other negation syntax.',
    'Every value must be a valid RE2 regular expression: escape the metacharacters ( ) [ ] { } . + * ? | ^ $ \\ wherever they are part of a literal term,',
    String.raw`so a call to useEffect( must be written as useEffect\(.`,
    `Examples: ${EXAMPLES.map(([naturalLanguage, query]) => `"${naturalLanguage}" -> ${query}`).join('; ')}.`,
].join(' ');

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

const generateQuery = async (query: string, model: AiModelConfig): Promise<string | ServiceError> => {
    const translatedQuery = await (async () => {
        try {
            const { text } = await generateText({
                model: getLanguageModel(model),
                instructions: SYSTEM_PROMPT,
                prompt: query,
            });
            return normalizeQuery(text);
        } catch (error) {
            console.error(`AI query translation failed: ${error}`);
            return undefined;
        }
    })();

    if (!translatedQuery) {
        return aiTranslationFailed(`the model '${model.id}' did not return a usable query`);
    }

    return translatedQuery;
}

/**
 * Translates a natural language query into a zoekt query without running a search.
 */
export const translateQuery = async ({ query }: AiPreviewRequest): Promise<AiPreviewResponse | ServiceError> => {
    const model = await getAiModel();
    if (!model) {
        return aiSearchNotConfigured();
    }

    const translatedQuery = await generateQuery(query, model);
    if (isServiceError(translatedQuery)) {
        return translatedQuery;
    }

    return { translatedQuery };
}

export const aiSearch = async (searchRequest: AiSearchRequest, orgId: number): Promise<AiSearchResponse | ServiceError> => {
    const translation = await translateQuery({ query: searchRequest.query });
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
