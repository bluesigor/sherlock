'use client';

import { aiPreviewResponseSchema, aiSearchModelsResponseSchema, aiSearchResponseSchema, fileSourceResponseSchema, getVersionResponseSchema, listRepositoriesResponseSchema, searchResponseSchema } from "@/lib/schemas";
import { ServiceErrorException } from "@/lib/serviceError";
import { AiPreviewRequest, AiPreviewResponse, AiSearchModelsResponse, AiSearchRequest, AiSearchResponse, FileSourceRequest, FileSourceResponse, GetVersionResponse, ListRepositoriesResponse, SearchRequest, SearchResponse } from "@/lib/types";
import { isServiceError } from "@/lib/utils";

export const search = async (body: SearchRequest, domain: string): Promise<SearchResponse> => {
    const result = await fetch("/api/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Org-Domain": domain,
        },
        body: JSON.stringify(body),
    }).then(response => response.json());

    return searchResponseSchema.parse(result);
}

export const aiSearch = async (body: AiSearchRequest, domain: string): Promise<AiSearchResponse> => {
    const result = await fetch("/api/search/ai", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Org-Domain": domain,
        },
        body: JSON.stringify(body),
    }).then(response => response.json());

    // Surfaced to the UI so that it can tell the user what was tried.
    if (isServiceError(result)) {
        throw new ServiceErrorException(result);
    }

    return aiSearchResponseSchema.parse(result);
}

export const previewAiSearch = async (body: AiPreviewRequest, domain: string, signal?: AbortSignal): Promise<AiPreviewResponse> => {
    const result = await fetch("/api/search/ai/preview", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Org-Domain": domain,
        },
        body: JSON.stringify(body),
        signal,
    }).then(response => response.json());

    if (isServiceError(result)) {
        throw new ServiceErrorException(result);
    }

    return aiPreviewResponseSchema.parse(result);
}

export const getAiSearchModels = async (domain: string): Promise<AiSearchModelsResponse> => {
    const result = await fetch("/api/search/ai/models", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-Org-Domain": domain,
        },
    }).then(response => response.json());

    if (isServiceError(result)) {
        throw new ServiceErrorException(result);
    }

    return aiSearchModelsResponseSchema.parse(result);
}

export const fetchFileSource = async (body: FileSourceRequest, domain: string): Promise<FileSourceResponse> => {
    const result = await fetch("/api/source", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Org-Domain": domain,
        },
        body: JSON.stringify(body),
    }).then(response => response.json());

    return fileSourceResponseSchema.parse(result);
}

export const getRepos = async (domain: string): Promise<ListRepositoriesResponse> => {
    const result = await fetch("/api/repos", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-Org-Domain": domain,
        },
    }).then(response => response.json());

    return listRepositoriesResponseSchema.parse(result);
}

export const getVersion = async (): Promise<GetVersionResponse> => {
    const result = await fetch("/api/version", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }).then(response => response.json());
    return getVersionResponseSchema.parse(result);
}
