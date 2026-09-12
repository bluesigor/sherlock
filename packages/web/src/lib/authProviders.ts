export interface EntraCredentials {
    clientId: string;
    clientSecret: string;
    tenantId: string;
}

interface EntraEnv {
    AUTH_ENTRA_CLIENT_ID?: string;
    AUTH_ENTRA_CLIENT_SECRET?: string;
    AUTH_ENTRA_TENANT_ID?: string;
}

export const getEntraCredentials = (env: EntraEnv): EntraCredentials | undefined => {
    const { AUTH_ENTRA_CLIENT_ID, AUTH_ENTRA_CLIENT_SECRET, AUTH_ENTRA_TENANT_ID } = env;

    if (!AUTH_ENTRA_CLIENT_ID || !AUTH_ENTRA_CLIENT_SECRET || !AUTH_ENTRA_TENANT_ID) {
        return undefined;
    }

    return {
        clientId: AUTH_ENTRA_CLIENT_ID,
        clientSecret: AUTH_ENTRA_CLIENT_SECRET,
        tenantId: AUTH_ENTRA_TENANT_ID,
    };
};

export const getEntraIssuer = (tenantId: string) =>
    `https://login.microsoftonline.com/${tenantId}/v2.0`;
