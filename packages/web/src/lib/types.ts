import { z } from "zod";
import { aiPreviewRequestSchema, aiPreviewResponseSchema, aiSearchModelsResponseSchema, aiSearchRequestSchema, aiSearchResponseSchema, fileSourceRequestSchema, fileSourceResponseSchema, listRepositoriesResponseSchema, locationSchema, rangeSchema, repositorySchema, repositoryQuerySchema, searchRequestSchema, searchResponseSchema, symbolSchema, getVersionResponseSchema } from "./schemas";
import { tenancyModeSchema } from "@/env.mjs";

export type KeymapType = "default" | "vim";

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export type AiSearchRequest = z.infer<typeof aiSearchRequestSchema>;
export type AiSearchResponse = z.infer<typeof aiSearchResponseSchema>;
export type AiSearchModelsResponse = z.infer<typeof aiSearchModelsResponseSchema>;
export type AiPreviewRequest = z.infer<typeof aiPreviewRequestSchema>;
export type AiPreviewResponse = z.infer<typeof aiPreviewResponseSchema>;

export type SearchResult = SearchResponse["Result"];
export type SearchResultFile = NonNullable<SearchResult["Files"]>[number];
export type SearchResultFileMatch = SearchResultFile["ChunkMatches"][number];
export type SearchResultRange = z.infer<typeof rangeSchema>;
export type SearchResultLocation = z.infer<typeof locationSchema>;

export type FileSourceRequest = z.infer<typeof fileSourceRequestSchema>;
export type FileSourceResponse = z.infer<typeof fileSourceResponseSchema>;

export type ListRepositoriesResponse = z.infer<typeof listRepositoriesResponseSchema>;
export type Repository = z.infer<typeof repositorySchema>;
export type RepositoryQuery = z.infer<typeof repositoryQuerySchema>;
export type Symbol = z.infer<typeof symbolSchema>;

export type GetVersionResponse = z.infer<typeof getVersionResponseSchema>;

export enum SearchQueryParams {
    query = "query",
    aiQuery = "aiQuery",
    maxMatchDisplayCount = "maxMatchDisplayCount",
}

export type TenancyMode = z.infer<typeof tenancyModeSchema>;