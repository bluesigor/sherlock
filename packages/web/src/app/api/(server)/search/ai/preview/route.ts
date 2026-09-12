'use server';

import { translateQuery } from "@/lib/server/aiSearchService";
import { aiPreviewRequestSchema } from "@/lib/schemas";
import { isServiceError } from "@/lib/utils";
import { NextRequest } from "next/server";
import { sew, withAuth, withOrgMembership } from "@/actions";
import { schemaValidationError, serviceErrorResponse } from "@/lib/serviceError";
import { AiPreviewRequest } from "@/lib/types";

export const POST = async (request: NextRequest) => {
    const domain = request.headers.get("X-Org-Domain")!;
    const body = await request.json();
    const parsed = await aiPreviewRequestSchema.safeParseAsync(body);
    if (!parsed.success) {
        return serviceErrorResponse(
            schemaValidationError(parsed.error)
        );
    }

    const response = await postAiPreview(parsed.data, domain, request.signal);
    if (isServiceError(response)) {
        return serviceErrorResponse(response);
    }
    return Response.json(response);
}

const postAiPreview = (request: AiPreviewRequest, domain: string, signal: AbortSignal) => sew(() =>
    withAuth((session) =>
        withOrgMembership(session, domain, async () => {
            const response = await translateQuery(request, signal);
            return response;
        }
    ), /* allowSingleTenantUnauthedAccess */ true));
