import { describe, expect, test } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

const toolCall = () => new Request('http://sherlock.test/api/mcp', {
    method: 'POST',
    headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'echo', arguments: { text: 'hi' } },
    }),
});

const buildServer = () => {
    const server = new McpServer({ name: 'sherlock-test', version: '1.0.0' });
    server.registerTool('echo', {
        title: 'Echo',
        inputSchema: { text: z.string() },
    }, async ({ text }) => ({ content: [{ type: 'text' as const, text: `got ${text}` }] }));
    return server;
};

describe('mcp transport lifecycle', () => {
    // The route must not close the transport before the client has read the
    // response: closing tears the stream down and the caller is handed a 200
    // with an empty body, which no type check or service test would catch.
    test('a tool call reaches the client with its result intact', async () => {
        const server = buildServer();
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        await server.connect(transport);
        transport.onclose = () => { void server.close(); };

        const response = await transport.handleRequest(toolCall());
        const body = await response.text();

        expect(response.status).toEqual(200);
        expect(body).toContain('got hi');
    });

    test('closing the transport before the body is read loses the result', async () => {
        const server = buildServer();
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        await server.connect(transport);

        const response = await transport.handleRequest(toolCall());
        await transport.close();
        await server.close();

        expect(await response.text()).toEqual('');
    });
});
