import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAiQueryPreview } from './useAiQueryPreview';
import { previewAiSearch } from '@/app/api/(client)/client';
vi.mock('@/app/api/(client)/client', () => ({ previewAiSearch: vi.fn() }));
vi.mock('@/hooks/useDomain', () => ({ useDomain: () => 'demo' }));
let root: Root;
let element: HTMLDivElement;
let latest: ReturnType<typeof useAiQueryPreview>;
function Harness({ query, enabled = true }: { query: string; enabled?: boolean }) {
    latest = useAiQueryPreview({ query, isEnabled: enabled });
    return null;
}
beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    element = document.createElement('div'); root = createRoot(element);
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });
test('never exposes a previous question preview after editing or disabling AI', async () => {
    vi.mocked(previewAiSearch).mockResolvedValue({ translatedQuery: 'TODO' });
    act(() => root.render(<Harness query="todos" />));
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(latest.preview).toBe('TODO');
    act(() => root.render(<Harness query="functions" />));
    expect(latest.preview).toBeUndefined();
    act(() => root.render(<Harness query="todos" enabled={false} />));
    expect(latest.preview).toBeUndefined();
});
test('cancels in-flight previews and ignores their late results', async () => {
    let resolve!: (value: { translatedQuery: string }) => void;
    vi.mocked(previewAiSearch).mockImplementation(() => new Promise(done => { resolve = done; }));
    act(() => root.render(<Harness query="todos" />));
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    const signal = vi.mocked(previewAiSearch).mock.calls[0][2]!;
    act(() => root.render(<Harness query="functions" />));
    expect(signal.aborted).toBe(true);
    await act(async () => resolve({ translatedQuery: 'TODO' }));
    expect(latest.preview).toBeUndefined();
});
