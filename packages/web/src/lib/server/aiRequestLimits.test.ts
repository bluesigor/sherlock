import { afterEach, beforeEach, expect, test, vi } from 'vitest';
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());
test('limits concurrent calls and releases slots exactly once', async () => {
    const { acquireAiRequest } = await import('./aiRequestLimits');
    const releases = Array.from({ length: 4 }, () => acquireAiRequest());
    expect(acquireAiRequest()).toMatchObject({ statusCode: 429 });
    const release = releases[0] as () => void;
    release(); release();
    expect(acquireAiRequest()).toBeTypeOf('function');
    expect(acquireAiRequest()).toMatchObject({ statusCode: 429 });
});
test('completed calls still count toward the rolling minute budget', async () => {
    const { acquireAiRequest } = await import('./aiRequestLimits');
    for (let i = 0; i < 30; i++) (acquireAiRequest() as () => void)();
    expect(acquireAiRequest()).toMatchObject({ statusCode: 429 });
    vi.advanceTimersByTime(60_000);
    expect(acquireAiRequest()).toBeTypeOf('function');
});
