# AI Search — Design Spec

**Date:** 2026-09-11
**Status:** Approved for implementation

## Problem

Sherlock's search only accepts raw zoekt query syntax (`repo:`, `lang:`, `sym:`, regex, etc.). Users who don't know that syntax can't express what they're looking for. We want an opt-in "AI search" mode: user types a plain-English description, an LLM translates it into a zoekt query, and normal search results come back — one round trip, no intermediate confirmation step.

## Non-goals (YAGNI)

- No RAG/chat over code content. No answering questions about the codebase. Translation only: NL → zoekt query string.
- No new DB tables. Model config is static server config, not user/org state — it doesn't need persistence, sync status, or UI management. It comes from `default-config.json` (or whatever `CONFIG_PATH` points to), same as `connections` today.
- No result quality evaluation / prompt-tuning harness. Out of scope for v1.
- No multi-turn refinement. One NL input → one translated query → one result set.

## Config schema addition

Add a `models` array to `schemas/v3/index.json`, mirroring the shape already used by `exp/sourcebot`'s (newer-upstream) config, so existing config authors don't need to relearn a shape:

```json
{
  "models": [
    {
      "provider": "openai" | "anthropic",
      "model": "string",
      "displayName": "string",
      "token": { "env": "string" }
    }
  ]
}
```

New file `schemas/v3/model.json` (referenced from `index.json`), plus generated `model.type.ts` following the existing `connection.json`/`connection.type.ts` codegen pattern.

If `models` is absent or empty, the AI search UI element does not render — Sherlock remains fully usable with zero AI setup (matches existing "connections optional" behavior).

## Components

### 1. `packages/web/src/lib/server/aiModelsConfig.ts` (new)

Lazily loads and validates just the `models` slice of the config file (independent of the `connections` DB-sync flow in `initialize.ts` — no DB coupling, no file-watch reload needed for v1: a process restart picking up model config changes is an acceptable trade for the simplicity of not adding a second live-reload path).

```ts
export const getAiModels = async (): Promise<AiModelConfig[]>
export const getAiModel = async (modelId?: string): Promise<AiModelConfig | undefined> // defaults to first configured model
```

### 2. `packages/web/src/lib/server/aiSearchService.ts` (new)

Follows the exact pattern of `searchService.ts`: exported async function returning `T | ServiceError`, using the existing `ServiceError` factories.

```ts
export const aiSearch = async (
  { query, modelId }: AiSearchRequest,
  orgId: number
): Promise<SearchResponse & { translatedQuery: string } | ServiceError>
```

Internally:
1. `getAiModel(modelId)` — if none configured, return a new `ServiceError` (`aiSearchNotConfigured`, added to `serviceError.ts`).
2. Build the LLM call via **Vercel AI SDK** (`ai` + `@ai-sdk/openai` + `@ai-sdk/anthropic` — one call-shape for both providers, matches the config's `provider` field 1:1, already the de facto standard for this exact use case upstream).
3. System prompt enumerates the `zoektPrefixes` enum already defined in `searchService.ts` (exported so both modules share the single source of truth — no duplicated prefix list).
4. LLM call failure / malformed output → `ServiceError` (`aiTranslationFailed`), never silently fall through to treating the raw NL text as a literal zoekt query.
5. On success, call the existing `search()` from `searchService.ts` with the translated query — full reuse, no duplicated search logic.
6. Return the normal `SearchResponse` plus `translatedQuery` for UI transparency.

### 3. API route: `packages/web/src/app/api/(server)/search/ai/route.ts` (new)

Byte-for-byte the same wrapper pattern as `search/route.ts` (`sew` → `withAuth` → `withOrgMembership`), calling `aiSearch` instead of `search`. New Zod schema `aiSearchRequestSchema` in `lib/schemas.ts` (`query: string`, `modelId: string.optional()`).

### 4. UI: `searchBar` component

Add a small toggle (sparkle icon) next to the existing input. Toggling reveals a second input with an NL placeholder ("describe what you're looking for"). Submitting calls the new `/api/search/ai` route instead of `/api/search`; results render through the existing results-list component. A caption above results shows the translated query (`Interpreted as: <query>`) styled as secondary text.

The toggle only renders if at least one model is configured. A new lightweight route `packages/web/src/app/api/(server)/search/ai/models/route.ts` (GET, same auth wrapper pattern) returns `{ id, displayName }[]` — never tokens — for the client to check; `searchBar` fetches it once on mount alongside its existing suggestions-data fetch.

## Error handling

| Failure | User-facing behavior |
|---|---|
| No models configured | AI toggle not shown at all |
| LLM call throws / times out | Inline error in the AI input area: "AI search unavailable, try again" |
| LLM returns unusable output | Inline error: "Couldn't translate that, try rephrasing or use normal search" |
| Underlying zoekt search fails (post-translation) | Same error path as normal search already uses today |

## Testing

- `aiSearchService.test.ts`: mock the AI SDK call, assert (a) the translated query is passed verbatim into `search()`, (b) LLM failure maps to `aiTranslationFailed`, (c) missing model config maps to `aiSearchNotConfigured`.
- `search/ai/route.test.ts` (or equivalent existing route-test pattern): schema validation rejects malformed body; happy path returns `SearchResponse & { translatedQuery }`.
- No test asserts on actual translation *quality* (non-deterministic, explicitly out of scope).

## Dependencies added

- `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic` (web package only).
