import { describe, expect, test } from 'vitest';
import { generateApiKey, hashApiKey, parseBearerToken, API_KEY_PREFIX } from './apiKey';

describe('generateApiKey', () => {
    test('produces a prefixed key so a leaked secret is recognisable', () => {
        expect(generateApiKey()).toMatch(new RegExp(`^${API_KEY_PREFIX}[A-Za-z0-9_-]{43}$`));
    });

    test('never repeats a key', () => {
        const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()));
        expect(keys.size).toEqual(100);
    });
});

describe('hashApiKey', () => {
    test('is stable for the same key', () => {
        const key = generateApiKey();
        expect(hashApiKey(key)).toEqual(hashApiKey(key));
    });

    test('differs between keys', () => {
        expect(hashApiKey(generateApiKey())).not.toEqual(hashApiKey(generateApiKey()));
    });

    test('does not contain the key it hashes', () => {
        const key = generateApiKey();
        expect(hashApiKey(key)).not.toContain(key.slice(API_KEY_PREFIX.length));
    });
});

describe('parseBearerToken', () => {
    test('reads a bearer token', () => {
        expect(parseBearerToken('Bearer sk-abc')).toEqual('sk-abc');
    });

    test('accepts the scheme in any case, as RFC 7235 requires', () => {
        expect(parseBearerToken('bearer sk-abc')).toEqual('sk-abc');
        expect(parseBearerToken('BEARER sk-abc')).toEqual('sk-abc');
    });

    test('rejects a header without the bearer scheme', () => {
        expect(parseBearerToken('Basic dXNlcjpwYXNz')).toBeUndefined();
    });

    test('rejects an empty token', () => {
        expect(parseBearerToken('Bearer ')).toBeUndefined();
        expect(parseBearerToken('Bearer')).toBeUndefined();
    });

    test('handles a missing header', () => {
        expect(parseBearerToken(null)).toBeUndefined();
        expect(parseBearerToken(undefined)).toBeUndefined();
    });
});
