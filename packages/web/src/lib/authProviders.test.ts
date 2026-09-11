import { describe, expect, test } from 'vitest';
import { getEntraCredentials, getEntraIssuer } from './authProviders';

const complete = {
    AUTH_ENTRA_CLIENT_ID: 'client-id',
    AUTH_ENTRA_CLIENT_SECRET: 'client-secret',
    AUTH_ENTRA_TENANT_ID: 'tenant-id',
};

describe('getEntraCredentials', () => {
    test('returns the credentials when client id, secret and tenant id are set', () => {
        expect(getEntraCredentials(complete)).toEqual({
            clientId: 'client-id',
            clientSecret: 'client-secret',
            tenantId: 'tenant-id',
        });
    });

    test('returns undefined when nothing is configured', () => {
        expect(getEntraCredentials({})).toBeUndefined();
    });

    test('returns undefined when the tenant id is missing', () => {
        expect(getEntraCredentials({ ...complete, AUTH_ENTRA_TENANT_ID: undefined })).toBeUndefined();
    });

    test('returns undefined when the client secret is missing', () => {
        expect(getEntraCredentials({ ...complete, AUTH_ENTRA_CLIENT_SECRET: undefined })).toBeUndefined();
    });

    test('returns undefined when the client id is missing', () => {
        expect(getEntraCredentials({ ...complete, AUTH_ENTRA_CLIENT_ID: undefined })).toBeUndefined();
    });

    test('treats an empty string as not configured', () => {
        expect(getEntraCredentials({ ...complete, AUTH_ENTRA_CLIENT_SECRET: '' })).toBeUndefined();
    });
});

describe('getEntraIssuer', () => {
    test('builds the tenant specific v2.0 issuer url', () => {
        expect(getEntraIssuer('00000000-1111-2222-3333-444444444444')).toEqual(
            'https://login.microsoftonline.com/00000000-1111-2222-3333-444444444444/v2.0'
        );
    });
});
