import { describe, expect, test, vi } from 'vitest';
import { resolveApiKey } from './apiKeyAuth';
import { generateApiKey, hashApiKey } from '../apiKey';

const keyRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 'key_1',
    orgId: 1,
    userId: 'user_1',
    user: { id: 'user_1', email: 'someone@explore.de' },
    ...overrides,
});

const clientFor = (record: unknown, membership: unknown = { orgId: 1, userId: 'user_1' }) => ({
    apiKey: {
        findUnique: vi.fn().mockResolvedValue(record),
        update: vi.fn().mockResolvedValue(record),
    },
    userToOrg: {
        findUnique: vi.fn().mockResolvedValue(membership),
    },
});

describe('resolveApiKey', () => {
    test('looks the key up by its hash, never by the key itself', async () => {
        const key = generateApiKey();
        const client = clientFor(keyRecord());

        await resolveApiKey(client as never, key);

        const where = client.apiKey.findUnique.mock.calls[0][0].where;
        expect(where).toEqual({ hash: hashApiKey(key) });
        expect(JSON.stringify(client.apiKey.findUnique.mock.calls)).not.toContain(key);
    });

    test('returns the org and user a valid key belongs to', async () => {
        const client = clientFor(keyRecord());

        await expect(resolveApiKey(client as never, generateApiKey())).resolves.toEqual({
            orgId: 1,
            user: { id: 'user_1', email: 'someone@explore.de' },
        });
    });

    test('rejects an unknown key', async () => {
        const client = clientFor(null);

        await expect(resolveApiKey(client as never, generateApiKey())).resolves.toBeUndefined();
    });

    test('rejects a key whose user was deleted', async () => {
        const client = clientFor(keyRecord({ user: null }));

        await expect(resolveApiKey(client as never, generateApiKey())).resolves.toBeUndefined();
    });

    test('rejects an empty token without touching the database', async () => {
        const client = clientFor(keyRecord());

        await expect(resolveApiKey(client as never, '')).resolves.toBeUndefined();
        expect(client.apiKey.findUnique).not.toHaveBeenCalled();
    });

    test('records when the key was last used', async () => {
        const client = clientFor(keyRecord());

        await resolveApiKey(client as never, generateApiKey());

        expect(client.apiKey.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'key_1' } })
        );
    });

    test('still authenticates when recording the use fails', async () => {
        const client = clientFor(keyRecord());
        client.apiKey.update.mockRejectedValue(new Error('db is read only'));

        await expect(resolveApiKey(client as never, generateApiKey())).resolves.toEqual(
            expect.objectContaining({ orgId: 1 })
        );
    });

    // A key records the org it was issued for, but membership can be revoked
    // afterwards - an owner removing a member deletes the membership and leaves
    // the key behind. Access has to be decided on current membership, not on
    // what was true when the key was created.
    test('rejects a key whose owner is no longer a member of the org', async () => {
        const client = clientFor(keyRecord(), null);

        await expect(resolveApiKey(client as never, generateApiKey())).resolves.toBeUndefined();
    });

    test('checks membership for the org and user the key names', async () => {
        const client = clientFor(keyRecord());

        await resolveApiKey(client as never, generateApiKey());

        expect(client.userToOrg.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { orgId_userId: { orgId: 1, userId: 'user_1' } },
            })
        );
    });

    test('does not record a use for a key it rejects', async () => {
        const client = clientFor(keyRecord(), null);

        await resolveApiKey(client as never, generateApiKey());

        expect(client.apiKey.update).not.toHaveBeenCalled();
    });
});
