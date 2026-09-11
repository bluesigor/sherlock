import { describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getAiModelsMock } = vi.hoisted(() => ({
    getAiModelsMock: vi.fn(),
}));

vi.mock('@/lib/server/aiModelsConfig', () => ({
    getAiModels: getAiModelsMock,
}));

vi.mock('@/actions', () => ({
    sew: (fn: () => unknown) => fn(),
    withAuth: (fn: (session: unknown) => unknown) => fn({ user: { id: 'test-user' } }),
    withOrgMembership: (_session: unknown, _domain: string, fn: (args: { orgId: number }) => unknown) => fn({ orgId: 1 }),
}));

const buildRequest = () => new NextRequest('http://localhost/api/search/ai/models', {
    method: 'GET',
    headers: {
        'X-Org-Domain': 'test-domain',
    },
});

describe('GET /api/search/ai/models', () => {
    test('returns the id and display name of every configured model, and never the token', async () => {
        getAiModelsMock.mockResolvedValue([
            {
                id: 'openai/gpt-4o-mini',
                provider: 'openai',
                model: 'gpt-4o-mini',
                displayName: 'GPT-4o mini',
                token: { env: 'OPENAI_API_KEY' },
            },
        ]);
        const { GET } = await import('./route');

        const response = await GET(buildRequest());

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([
            { id: 'openai/gpt-4o-mini', displayName: 'GPT-4o mini' },
        ]);
    });

    test('returns an empty list when no models are configured', async () => {
        getAiModelsMock.mockResolvedValue([]);
        const { GET } = await import('./route');

        const response = await GET(buildRequest());

        expect(await response.json()).toEqual([]);
    });
});
