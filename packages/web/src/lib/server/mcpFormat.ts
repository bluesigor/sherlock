import { base64Decode } from '../utils';
import type { ListRepositoriesResponse, SearchResponse } from '../types';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

/** A generated file can run to tens of thousands of lines. */
const MAX_FILE_LINES = 2000;

export interface Page<T> {
    items: T[];
    page: number;
    pages: number;
    pageSize: number;
    total: number;
}

/**
 * An unpaged tool result is a context bomb: a few hundred entries can evict the
 * conversation that asked for them. Every list a tool returns goes through here.
 */
export const paginate = <T>(
    items: T[],
    page: number | undefined,
    pageSize: number = DEFAULT_PAGE_SIZE,
    maxPageSize: number = MAX_PAGE_SIZE,
): Page<T> => {
    const size = Math.max(1, Math.min(Math.floor(pageSize) || DEFAULT_PAGE_SIZE, maxPageSize));
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(Math.max(Math.floor(page ?? 1) || 1, 1), pages);
    const start = (current - 1) * size;

    return {
        items: items.slice(start, start + size),
        page: current,
        pages,
        pageSize: size,
        total,
    };
};

const pageState = (page: Page<unknown>, entityLabel: string) =>
    `page=${page.page}/${page.pages} | pageSize=${page.pageSize} | total${entityLabel}=${page.total}`;

/**
 * Line numbers are what make a match actionable - without them the agent has to
 * search the file again to act on what it was just handed.
 */
const renderChunk = (content: string, startLine: number): string =>
    base64Decode(content)
        .split('\n')
        .map((line, index) => `${startLine + index}: ${line}`)
        .join('\n');

export const formatSearchResult = (response: SearchResponse, query: string): string => {
    const files = response.Result.Files ?? [];
    const header = [
        `query: ${query}`,
        `totalMatches=${response.Result.MatchCount} | totalFiles=${response.Result.FileCount} | duration=${Math.round(response.Result.Duration / 1_000_000)}ms`,
    ].join('\n');

    if (files.length === 0) {
        return `${header}\n\nNo matches.`;
    }

    const blocks = files.map((file) => {
        const chunks = file.ChunkMatches
            .map((match) => renderChunk(match.Content, match.ContentStart.LineNumber))
            .join('\n  ...\n');

        return `${file.Repository}:${file.FileName} (${file.Language})\n${chunks}`;
    });

    return `${header}\n\n${blocks.join('\n\n')}`;
};

export const formatRepositoryPage = (
    response: ListRepositoriesResponse,
    page: number | undefined,
    pageSize: number | undefined,
): string => {
    const names = response.List.Repos
        .map((repo) => repo.Repository.Name)
        .sort((a, b) => a.localeCompare(b));

    const result = paginate(names, page, pageSize ?? DEFAULT_PAGE_SIZE);
    const lines = result.items.map((name) => `- ${name}`).join('\n');

    return `${pageState(result, 'Repos')}\n${lines}`;
};

export const formatFileSource = (
    source: string,
    language: string,
    repository: string,
    fileName: string,
): string => {
    // getFileSource passes zoekt's stored content straight through, which is
    // base64; the browse page decodes at the call site and so does this.
    const lines = base64Decode(source).split('\n');
    const shown = lines.slice(0, MAX_FILE_LINES);
    const header = `${repository}:${fileName} (${language}, ${lines.length} lines)`;
    const body = shown.map((line, index) => `${index + 1}: ${line}`).join('\n');

    if (shown.length === lines.length) {
        return [header, '', body].join('\n');
    }

    return [
        header,
        '',
        body,
        '',
        `... truncated at line ${MAX_FILE_LINES} of ${lines.length}. Use search_code with a file: filter to reach the rest.`,
    ].join('\n');
};
