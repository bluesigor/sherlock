'use server';

import { aiSearch } from "@/lib/server/aiSearchService";
import { aiSearchRequestSchema } from "@/lib/schemas";
import { isServiceError } from "@/lib/utils";
import { NextRequest } from "next/server";
import { sew, withAuth, withOrgMembership } from "@/actions";
import { schemaValidationError, serviceErrorResponse } from "@/lib/serviceError";
import { AiSearchRequest } from "@/lib/types";

export const POST = async (request: NextRequest) => {
    const domain = request.headers.get("X-Org-Domain")!;
    const body = await request.json();
    const parsed = await aiSearchRequestSchema.safeParseAsync(body);
    if (!parsed.success) {
        return serviceErrorResponse(
            schemaValidationError(parsed.error)
        );
    }

    const response = await postAiSearch(parsed.data, domain, request.signal);
    if (isServiceError(response)) {
        return serviceErrorResponse(response);
    }
    return Response.json(response);
}

const postAiSearch = (request: AiSearchRequest, domain: string, signal: AbortSignal) => sew(() =>
    withAuth((session) =>
        withOrgMembership(session, domain, async ({ orgId }) => {
            const response = await aiSearch(request, orgId, signal);
            return response;
        }
    ), /* allowSingleTenantUnauthedAccess */ true));
