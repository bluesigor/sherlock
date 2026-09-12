'use server';

import { getAiModels } from "@/lib/server/aiModelsConfig";
import { NextRequest } from "next/server";
import { sew, withAuth, withOrgMembership } from "@/actions";
import { isServiceError } from "@/lib/utils";
import { serviceErrorResponse } from "@/lib/serviceError";
import { AiSearchModelsResponse } from "@/lib/types";

export const GET = async (request: NextRequest) => {
    const domain = request.headers.get("X-Org-Domain")!;
    const response = await getModels(domain);

    if (isServiceError(response)) {
        return serviceErrorResponse(response);
    }
    return Response.json(response);
}

const getModels = (domain: string) => sew(() =>
    withAuth((session) =>
        withOrgMembership(session, domain, async (): Promise<AiSearchModelsResponse> => {
            const models = await getAiModels();
            return models.map(({ id, displayName }) => ({ id, displayName }));
        }
    ), /* allowSingleTenantUnauthedAccess */ true));
