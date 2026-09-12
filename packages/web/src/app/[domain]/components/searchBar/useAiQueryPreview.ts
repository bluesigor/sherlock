'use client';

import { previewAiSearch } from "@/app/api/(client)/client";
import { useDomain } from "@/hooks/useDomain";
import { useEffect, useState } from "react";

const DEBOUNCE_MS = 5000;

interface Props {
    query: string;
    isEnabled: boolean;
}

/**
 * Translates the natural language query into a zoekt query a few seconds after the
 * user stops typing, so that they can see what will actually be searched for. A new
 * keystroke restarts the timer and abandons any request that is still in flight.
 */
export const useAiQueryPreview = ({ query, isEnabled }: Props) => {
    const domain = useDomain();
    const [preview, setPreview] = useState<{ query: string; domain: string; text: string } | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setPreview(undefined);

        if (!isEnabled || query.trim().length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const abortController = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                const { translatedQuery } = await previewAiSearch({ query }, domain, abortController.signal);
                if (!abortController.signal.aborted) {
                    setPreview({ query, domain, text: translatedQuery });
                }
            } catch (_error) {
                // A preview is a hint; a failed translation simply shows nothing.
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timeout);
            abortController.abort();
        };
    }, [query, isEnabled, domain]);

    return { preview: isEnabled && preview?.query === query && preview.domain === domain ? preview.text : undefined, isLoading };
}
