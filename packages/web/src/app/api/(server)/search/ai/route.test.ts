import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ErrorCode } from '@/lib/errorCodes';

const { aiSearchMock } = vi.hoisted(() => ({
    aiSearchMock: vi.fn(),
}));

vi.mock('@/lib/server/aiSearchService', () => ({
    aiSearch: aiSearchMock,
}));

// The auth wrappers are exercised by the routes they wrap; here we only care that
// this route runs its body with the resolved orgId.
vi.mock('@/actions', () => ({
    sew: (fn: () => unknown) => fn(),
    withAuth: (fn: (session: unknown) => unknown) => fn({ user: { id: 'test-user' } }),
    withOrgMembership: (_session: unknown, _domain: string, fn: (args: { orgId: number }) => unknown) => fn({ orgId: 1 }),
}));

const buildRequest = (body: unknown) => new NextRequest('http://localhost/api/search/ai', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Org-Domain': 'test-domain',
    },
    body: JSON.stringify(body),
});

describe('POST /api/search/ai', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects a malformed request body', async () => {
        const { POST } = await import('./route');

        const response = await POST(buildRequest({ maxMatchDisplayCount: 100 }));

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ errorCode: ErrorCode.INVALID_REQUEST_BODY });
        expect(aiSearchMock).not.toHaveBeenCalled();
    });

    test('returns the search response along with the translated query', async () => {
        const aiSearchResponse = {
            Result: { Files: [], MatchCount: 0 },
            isBranchFilteringEnabled: false,
            translatedQuery: 'repo:foo bar',
        };
        aiSearchMock.mockResolvedValue(aiSearchResponse);
        const { POST } = await import('./route');

        const response = await POST(buildRequest({ query: 'find bar in foo', maxMatchDisplayCount: 100 }));

        expect(aiSearchMock).toHaveBeenCalledWith({ query: 'find bar in foo', maxMatchDisplayCount: 100 }, 1, expect.anything());
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(aiSearchResponse);
    });

    test('forwards a service error from the ai search service', async () => {
        aiSearchMock.mockResolvedValue({
            statusCode: 501,
            errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED,
            message: 'AI search is not configured.',
        });
        const { POST } = await import('./route');

        const response = await POST(buildRequest({ query: 'find bar in foo', maxMatchDisplayCount: 100 }));

        expect(response.status).toBe(501);
        expect(await response.json()).toMatchObject({ errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED });
    });
});
