import { describe, expect, test } from 'vitest';
import { formatRepositoryPage, formatSearchResult, paginate } from './mcpFormat';
import type { ListRepositoriesResponse, SearchResponse } from '../types';

const encode = (text: string) => Buffer.from(text).toString('base64');

const searchResponse = (files: SearchResponse['Result']['Files']): SearchResponse => ({
    Result: {
        Files: files,
        RepoURLs: {},
        Duration: 833_000_000,
        FileCount: 2,
        MatchCount: 3,
        ContentBytesLoaded: 0, IndexBytesLoaded: 0, Crashes: 0, ShardFilesConsidered: 0,
        FilesConsidered: 0, FilesLoaded: 0, FilesSkipped: 0, ShardsScanned: 0,
        ShardsSkipped: 0, ShardsSkippedFilter: 0, NgramMatches: 0, NgramLookups: 0,
        Wait: 0, MatchTreeConstruction: 0, MatchTreeSearch: 0, RegexpsConsidered: 0,
        FlushReason: 0,
    },
    isBranchFilteringEnabled: false,
});

const chunk = (content: string, startLine: number) => ({
    Content: encode(content),
    Ranges: [],
    FileName: false,
    ContentStart: { ByteOffset: 0, LineNumber: startLine, Column: 1 },
    Score: 1,
    SymbolInfo: null,
});

const file = (fileName: string, repository: string, chunks: ReturnType<typeof chunk>[]) => ({
    FileName: fileName,
    Repository: repository,
    Language: 'Java',
    ChunkMatches: chunks,
    Checksum: 'abc',
    Score: 1,
});

describe('paginate', () => {
    test('returns the first page by default', () => {
        expect(paginate([1, 2, 3, 4, 5], undefined, 2)).toEqual({
            items: [1, 2], page: 1, pages: 3, pageSize: 2, total: 5,
        });
    });

    test('returns a requested later page', () => {
        expect(paginate([1, 2, 3, 4, 5], 3, 2).items).toEqual([5]);
    });

    test('caps pageSize so one call cannot flood the context', () => {
        const items = Array.from({ length: 500 }, (_, i) => i);
        expect(paginate(items, 1, 9999, 200).items).toHaveLength(200);
    });

    test('clamps a page beyond the end to the last page', () => {
        expect(paginate([1, 2, 3], 99, 2).items).toEqual([3]);
    });

    test('reports a single empty page for no items', () => {
        expect(paginate([], 1, 50)).toEqual({
            items: [], page: 1, pages: 1, pageSize: 50, total: 0,
        });
    });

    test('rejects a page below one', () => {
        expect(paginate([1, 2, 3], 0, 2).page).toEqual(1);
    });
});

describe('formatSearchResult', () => {
    test('decodes chunk content and anchors every line to its real line number', () => {
        const response = searchResponse([
            file('src/Main.java', 'exp/foo', [chunk('class Main {\n  void run() {}', 41)]),
        ]);

        const text = formatSearchResult(response, 'microrelate');

        expect(text).toContain('exp/foo:src/Main.java');
        expect(text).toContain('41: class Main {');
        expect(text).toContain('42:   void run() {}');
    });

    test('reports the totals so the agent knows what it did not get', () => {
        const text = formatSearchResult(searchResponse([]), 'nothing');

        expect(text).toContain('totalMatches=3');
        expect(text).toContain('totalFiles=2');
    });

    test('says plainly when nothing matched', () => {
        expect(formatSearchResult(searchResponse(null), 'nope')).toContain('No matches');
    });

    test('names the query it ran so the agent can refine it', () => {
        expect(formatSearchResult(searchResponse(null), 'repo:foo bar')).toContain('repo:foo bar');
    });
});

describe('formatRepositoryPage', () => {
    const repos = (names: string[]): ListRepositoriesResponse => ({
        List: {
            Repos: names.map((name) => ({
                Repository: {
                    Name: name, URL: `https://gitlab.explore.de/${name}`, Source: '',
                    Branches: [{ Name: 'HEAD', Version: 'v1' }],
                    CommitURLTemplate: '', FileURLTemplate: '', LineFragmentTemplate: '',
                    RawConfig: null, Rank: 0, IndexOptions: '', HasSymbols: true,
                    Tombstone: false, LatestCommitDate: '2026-09-01T00:00:00Z',
                },
                IndexMetadata: {} as never,
                Stats: {} as never,
            })),
            Stats: {} as never,
        },
    });

    test('lists a page of repositories with its page state', () => {
        const text = formatRepositoryPage(repos(['exp/a', 'exp/b', 'exp/c']), 1, 2);

        expect(text).toContain('exp/a');
        expect(text).toContain('exp/b');
        expect(text).not.toContain('exp/c');
        expect(text).toContain('page=1/2');
        expect(text).toContain('totalRepos=3');
    });

    test('does not flood the context with 412 repositories at once', () => {
        const many = repos(Array.from({ length: 412 }, (_, i) => `exp/repo-${i}`));

        expect(formatRepositoryPage(many, 1, 9999).split('\n').length).toBeLessThan(210);
    });
});
