import { ErrorCode } from '../errorCodes';
import { ServiceError } from '../serviceError';

// Shared by preview and search in this server process. Deployment-wide budgets
// must additionally be enforced at the gateway/provider when using replicas.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_CONCURRENT = 4;
let started: number[] = [];
let active = 0;

export const acquireAiRequest = (): (() => void) | ServiceError => {
    const now = Date.now();
    started = started.filter(time => time > now - WINDOW_MS);
    if (started.length >= MAX_REQUESTS || active >= MAX_CONCURRENT) {
        return {
            statusCode: 429,
            errorCode: ErrorCode.AI_RATE_LIMITED,
            message: 'AI search is busy. Please wait a minute and try again.',
        };
    }
    started.push(now);
    active++;
    let released = false;
    return () => {
        if (!released) active--;
        released = true;
    };
};
