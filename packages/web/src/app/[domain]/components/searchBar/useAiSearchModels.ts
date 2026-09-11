'use client';

import { useQuery } from "@tanstack/react-query";
import { getAiSearchModels } from "@/app/api/(client)/client";
import { useDomain } from "@/hooks/useDomain";

/**
 * Fetches the language models that are available for AI search. If no models are
 * configured, AI search is disabled and the list is empty.
 */
export const useAiSearchModels = () => {
    const domain = useDomain();
    const { data: models } = useQuery({
        queryKey: ["aiSearchModels"],
        queryFn: () => getAiSearchModels(domain),
        refetchOnWindowFocus: false,
    });

    return {
        models: models ?? [],
        isAiSearchAvailable: (models ?? []).length > 0,
    };
}
