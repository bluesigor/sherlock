import { beforeEach, expect, test, vi } from 'vitest';
import { executeSearch } from './searchExecution';
import { aiSearch, search } from '@/app/api/(client)/client';
vi.mock('@/app/api/(client)/client', () => ({ aiSearch: vi.fn(), search: vi.fn() }));
beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(search).mockResolvedValue({ Result: {} } as never);
    vi.mocked(aiSearch).mockResolvedValue({ translatedQuery: 'lang:typescript TODO' } as never);
});
test('submitting a preview searches its exact translation without another model call', async () => {
    const result = await executeSearch('lang:typescript TODO', 'todos in typescript', 100, 'demo');
    expect(search).toHaveBeenCalledWith({ query: 'lang:typescript TODO', maxMatchDisplayCount: 100 }, 'demo', undefined);
    expect(aiSearch).not.toHaveBeenCalled();
    expect(result.translatedQuery).toBe('lang:typescript TODO');
});
test('loading more preserves the initial translation and only increases the limit', async () => {
    const first = await executeSearch('', 'todos in typescript', 100, 'demo');
    await executeSearch(first.translatedQuery!, 'todos in typescript', 200, 'demo');
    expect(aiSearch).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith({ query: first.translatedQuery, maxMatchDisplayCount: 200 }, 'demo', undefined);
});
test('normal searches remain independent of AI and receive cancellation', async () => {
    const signal = new AbortController().signal;
    const result = await executeSearch('TODO', '', 100, 'demo', signal);
    expect(aiSearch).not.toHaveBeenCalled();
    expect(search).toHaveBeenCalledWith({ query: 'TODO', maxMatchDisplayCount: 100 }, 'demo', signal);
    expect(result.translatedQuery).toBeUndefined();
});
