import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/prisma';
import { parseBearerToken } from '@/lib/apiKey';
import { resolveApiKey } from '@/lib/server/apiKeyAuth';
import { search, getFileSource, listRepositories } from '@/lib/server/searchService';
import { aiSearch } from '@/lib/server/aiSearchService';
import { formatFileSource, formatRepositoryPage, formatSearchResult } from '@/lib/server/mcpFormat';
import { isServiceError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const MAX_MATCH_DISPLAY_COUNT = 100;

const textResult = (text: string) => ({
    content: [{ type: 'text' as const, text }],
});

const errorResult = (text: string) => ({
    content: [{ type: 'text' as const, text }],
    isError: true,
});

const buildServer = (orgId: number) => {
    const server = new McpServer({
        name: 'sherlock',
        version: '1.0.0',
    }, {
        instructions: 'Search the organisation\'s GitLab source code. Prefer search_code with a zoekt query; use ask_codebase only when the question is in plain language and the right query is unclear.',
    });

    server.registerTool('search_code', {
        title: 'Search code',
        description: [
            'Search across every indexed repository and return matching lines with their line numbers.',
            'The query is a zoekt expression. Useful filters: repo:<name>, file:<path>, lang:<language>,',
            'sym:<symbol>, case:yes, and regular expressions. Terms combine with AND; prefix with - to exclude.',
            'Searches the default branch unless a branch: filter is given.',
            'Example: "DomainVertex lang:java -file:test"',
        ].join(' '),
        inputSchema: {
            query: z.string().min(1).describe('A zoekt query, e.g. "createConnection lang:typescript"'),
            maxMatches: z.number().int().min(1).max(MAX_MATCH_DISPLAY_COUNT).optional()
                .describe(`Maximum number of matching files to return (default 20, max ${MAX_MATCH_DISPLAY_COUNT}).`),
        },
    }, async ({ query, maxMatches }) => {
        const response = await search({
            query,
            maxMatchDisplayCount: Math.min(maxMatches ?? 20, MAX_MATCH_DISPLAY_COUNT),
            whole: false,
        }, orgId);

        if (isServiceError(response)) {
            return errorResult(`Search failed: ${response.message}`);
        }

        return textResult(formatSearchResult(response, query));
    });

    server.registerTool('get_file', {
        title: 'Get file contents',
        description: 'Return the full contents of one file, with line numbers. Use search_code first to find the repository and path.',
        inputSchema: {
            repository: z.string().min(1).describe('Repository name exactly as search_code reported it, e.g. "gitlab.explore.de/exp/foo"'),
            fileName: z.string().min(1).describe('Path of the file within the repository.'),
            branch: z.string().optional().describe('Branch to read from. Defaults to the indexed default branch.'),
        },
    }, async ({ repository, fileName, branch }) => {
        const response = await getFileSource({ fileName, repository, branch }, orgId);

        if (isServiceError(response)) {
            return errorResult(`Could not read ${repository}:${fileName}: ${response.message}`);
        }

        return textResult(formatFileSource(response.source, response.language, repository, fileName));
    });

    server.registerTool('list_repos', {
        title: 'List repositories',
        description: 'List the indexed repositories, one page at a time. Use it to discover repository names for the repo: filter of search_code.',
        inputSchema: {
            page: z.number().int().min(1).optional().describe('1-based page number, default 1.'),
            pageSize: z.number().int().min(1).max(200).optional().describe('Repositories per page, default 50, maximum 200.'),
        },
    }, async ({ page, pageSize }) => {
        const response = await listRepositories(orgId);

        if (isServiceError(response)) {
            return errorResult(`Could not list repositories: ${response.message}`);
        }

        return textResult(formatRepositoryPage(response, page, pageSize));
    });

    server.registerTool('ask_codebase', {
        title: 'Ask the codebase',
        description: 'Translate a plain-language question into a code search and run it. Slower and less precise than search_code - reach for it only when the right query is unclear.',
        inputSchema: {
            question: z.string().min(1).max(500).describe('A question in plain language, e.g. "where do we validate the BOM import?"'),
            maxMatches: z.number().int().min(1).max(MAX_MATCH_DISPLAY_COUNT).optional()
                .describe(`Maximum number of matching files to return (default 20, max ${MAX_MATCH_DISPLAY_COUNT}).`),
        },
    }, async ({ question, maxMatches }) => {
        const response = await aiSearch({
            query: question,
            maxMatchDisplayCount: Math.min(maxMatches ?? 20, MAX_MATCH_DISPLAY_COUNT),
            whole: false,
        }, orgId);

        if (isServiceError(response)) {
            return errorResult(`Could not answer that: ${response.message}`);
        }

        return textResult(formatSearchResult(response, response.translatedQuery));
    });

    return server;
};

const unauthorized = () => Response.json(
    {
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized. Pass a Sherlock API key as "Authorization: Bearer <key>".' },
        id: null,
    },
    {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer realm="sherlock"' },
    },
);

const handle = async (request: NextRequest): Promise<Response> => {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) {
        return unauthorized();
    }

    const identity = await resolveApiKey(prisma, token);
    if (!identity) {
        return unauthorized();
    }

    const server = buildServer(identity.orgId);
    // One transport per request: the deployment runs a single replica with a
    // Recreate strategy, so nothing may outlive the request that created it.
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });

    try {
        await server.connect(transport);
    } catch (error) {
        await transport.close();
        await server.close();
        throw error;
    }

    // Closing here would tear the stream down before the client has read it,
    // leaving a 200 with an empty body. The response outlives this function, so
    // the cleanup has to follow the response, not the return.
    transport.onclose = () => { void server.close(); };
    return transport.handleRequest(request);
};

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
