import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ErrorCode } from '@/lib/errorCodes';

const { translateQueryMock } = vi.hoisted(() => ({
    translateQueryMock: vi.fn(),
}));

vi.mock('@/lib/server/aiSearchService', () => ({
    translateQuery: translateQueryMock,
}));

// The auth wrappers are exercised by the routes they wrap; here we only care that
// this route runs its body with the resolved orgId.
vi.mock('@/actions', () => ({
    sew: (fn: () => unknown) => fn(),
    withAuth: (fn: (session: unknown) => unknown) => fn({ user: { id: 'test-user' } }),
    withOrgMembership: (_session: unknown, _domain: string, fn: (args: { orgId: number }) => unknown) => fn({ orgId: 1 }),
}));

const buildRequest = (body: unknown) => new NextRequest('http://localhost/api/search/ai/preview', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Org-Domain': 'test-domain',
    },
    body: JSON.stringify(body),
});

describe('POST /api/search/ai/preview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects a malformed request body', async () => {
        const { POST } = await import('./route');

        const response = await POST(buildRequest({}));

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ errorCode: ErrorCode.INVALID_REQUEST_BODY });
        expect(translateQueryMock).not.toHaveBeenCalled();
    });

    test('returns the translated query', async () => {
        translateQueryMock.mockResolvedValue({ translatedQuery: 'TODO lang:typescript' });
        const { POST } = await import('./route');

        const response = await POST(buildRequest({ query: 'todos in typescript' }));

        expect(translateQueryMock).toHaveBeenCalledWith({ query: 'todos in typescript' });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ translatedQuery: 'TODO lang:typescript' });
    });

    test('forwards a service error from the ai search service', async () => {
        translateQueryMock.mockResolvedValue({
            statusCode: 501,
            errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED,
            message: 'AI search is not configured.',
        });
        const { POST } = await import('./route');

        const response = await POST(buildRequest({ query: 'todos in typescript' }));

        expect(response.status).toBe(501);
        expect(await response.json()).toMatchObject({ errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED });
    });
});
