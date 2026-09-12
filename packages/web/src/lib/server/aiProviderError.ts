const CREDIT_EXHAUSTED = "the provider rejected the request for lack of credit - check the account's billing";
const KEY_REJECTED = 'the provider rejected the API key';
const RATE_LIMITED = 'the provider is rate limiting this account - try again shortly';
const MODEL_UNAVAILABLE = 'the configured model is unavailable to this account';
const TIMED_OUT = 'the provider did not answer in time';
const UNUSABLE = 'the model did not return a usable query';

/**
 * Turns a provider SDK error into something an operator can act on. The
 * provider knows why it refused; passing that on saves reading server logs to
 * find out that a card expired.
 */
export const describeProviderError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const text = message.toLowerCase();

    if (!text) {
        return UNUSABLE;
    }

    if (text.includes('no credits remaining') || text.includes('exceeded your current quota') || text.includes('insufficient_quota') || text.includes('billing') || text.includes('credit balance')) {
        return CREDIT_EXHAUSTED;
    }

    if (text.includes('incorrect api key') || text.includes('invalid api key') || text.includes('invalid_api_key') || text.includes('authentication') || text.includes('401') || text.includes('unauthorized')) {
        return KEY_REJECTED;
    }

    if (text.includes('rate limit') || text.includes('429')) {
        return RATE_LIMITED;
    }

    if (text.includes('does not exist') || text.includes('model_not_found') || text.includes('do not have access')) {
        return MODEL_UNAVAILABLE;
    }

    if (text.includes('timed out') || text.includes('timeout') || text.includes('etimedout')) {
        return TIMED_OUT;
    }

    return UNUSABLE;
};
