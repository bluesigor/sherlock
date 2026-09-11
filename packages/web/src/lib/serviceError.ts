import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "./errorCodes";
import { z, ZodError } from "zod";

export const serviceErrorSchema = z.object({
    statusCode: z.number(),
    errorCode: z.string(),
    message: z.string(),
    // Error specific context that the UI can surface alongside the message.
    data: z.record(z.string(), z.unknown()).optional(),
});

export type ServiceError = z.infer<typeof serviceErrorSchema>;

/**
 * Useful for throwing errors and handling them in error boundaries.
 */
export class ServiceErrorException extends Error {
    constructor(public readonly serviceError: ServiceError) {
        super(JSON.stringify(serviceError));
    }
}

export const serviceErrorResponse = ({ statusCode, errorCode, message, data }: ServiceError) => {
    return Response.json({
        statusCode,
        errorCode,
        message,
        ...(data ? { data } : {}),
    }, {
        status: statusCode,
    });
}

export const missingQueryParam = (name: string): ServiceError => {
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorCode: ErrorCode.MISSING_REQUIRED_QUERY_PARAMETER,
        message: `Missing required query parameter: ${name}`,
    };
}

export const schemaValidationError = (error: ZodError): ServiceError => {
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorCode: ErrorCode.INVALID_REQUEST_BODY,
        message: `Schema validation failed with: ${error.message}`,
    };
}

export const invalidZoektResponse = async (zoektResponse: Response): Promise<ServiceError> => {
    const zoektMessage = await (async () => {
        try {
            const zoektResponseBody = await zoektResponse.json();
            if (zoektResponseBody.Error) {
                return zoektResponseBody.Error;
            }
        } catch (_e) {
            return "Unknown error";
        }
    })();

    return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.INVALID_REQUEST_BODY,
        message: `Zoekt request failed with status code ${zoektResponse.status} and message: "${zoektMessage}"`,
    };
}

export const fileNotFound = async (fileName: string, repository: string): Promise<ServiceError> => {
    return {
        statusCode: StatusCodes.NOT_FOUND,
        errorCode: ErrorCode.FILE_NOT_FOUND,
        message: `File "${fileName}" not found in repository "${repository}"`,
    };
}

export const unexpectedError = (message: string): ServiceError => {
    return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.UNEXPECTED_ERROR,
        message: `Unexpected error: ${message}`,
    };
}

export const notAuthenticated = (): ServiceError => {
    return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorCode: ErrorCode.NOT_AUTHENTICATED,
        message: "Not authenticated",
    }
}

export const notFound = (): ServiceError => {
    return {
        statusCode: StatusCodes.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
        message: "Not found",
    }
}

export const orgDomainExists = (): ServiceError => {
    return {
        statusCode: StatusCodes.CONFLICT,
        errorCode: ErrorCode.ORG_DOMAIN_ALREADY_EXISTS,
        message: "Organization domain already exists, please try a different one.",
    }
}

export const secretAlreadyExists = (): ServiceError => {
    return {
        statusCode: StatusCodes.CONFLICT,
        errorCode: ErrorCode.SECRET_ALREADY_EXISTS,
        message: "Secret already exists",
    }
}

export const aiSearchNotConfigured = (): ServiceError => {
    return {
        statusCode: StatusCodes.NOT_IMPLEMENTED,
        errorCode: ErrorCode.AI_SEARCH_NOT_CONFIGURED,
        message: "AI search is not configured. Add a model to the `models` section of your config file.",
    }
}

export const aiTranslationFailed = (reason: string): ServiceError => {
    return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.AI_TRANSLATION_FAILED,
        message: `Failed to translate the search query: ${reason}`,
    }
}

export const aiSearchFailed = (translatedQuery: string, reason: string): ServiceError => {
    return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.AI_SEARCH_FAILED,
        message: `The translated search query failed: ${reason}`,
        data: { translatedQuery },
    }
}
