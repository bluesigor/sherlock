import { createHash, randomBytes } from 'crypto';

export const API_KEY_PREFIX = 'sherlock_';

/**
 * The number of characters after the prefix that identify a key to its owner.
 * Short enough to stay useless to an attacker, long enough to tell a handful of
 * keys apart in a list.
 */
const PREVIEW_LENGTH = 8;

export const generateApiKey = (): string =>
    `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;

/**
 * A key is high-entropy random, so a single SHA-256 pass is enough - the
 * stretching a password needs buys nothing against a 256 bit search space.
 */
export const hashApiKey = (key: string): string =>
    createHash('sha256').update(key).digest('hex');

export const previewApiKey = (key: string): string =>
    key.slice(0, API_KEY_PREFIX.length + PREVIEW_LENGTH);

export const parseBearerToken = (header: string | null | undefined): string | undefined => {
    if (!header) {
        return undefined;
    }

    const match = /^Bearer[ ]+(\S+)$/i.exec(header.trim());
    return match?.[1];
};
