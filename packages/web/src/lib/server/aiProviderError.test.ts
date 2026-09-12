import { describe, expect, test } from 'vitest';
import { describeProviderError } from './aiProviderError';

describe('describeProviderError', () => {
    test('names billing as the cause when the provider reports no credits', () => {
        const error = new Error('AI_APICallError: You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.');

        expect(describeProviderError(error)).toEqual(
            "the provider rejected the request for lack of credit - check the account's billing"
        );
    });

    test('recognises a quota being exhausted', () => {
        const error = new Error('429 You exceeded your current quota, please check your plan and billing details');

        expect(describeProviderError(error)).toEqual(
            "the provider rejected the request for lack of credit - check the account's billing"
        );
    });

    test('names the key when the provider rejects it', () => {
        const error = new Error('AI_APICallError: Incorrect API key provided: sk-proj-***. You can find your API key at https://platform.openai.com/account/api-keys.');

        expect(describeProviderError(error)).toEqual(
            'the provider rejected the API key'
        );
    });

    test('recognises an unauthorized response as a key problem', () => {
        expect(describeProviderError(new Error('401 Unauthorized'))).toEqual(
            'the provider rejected the API key'
        );
    });

    test('names rate limiting separately from an exhausted quota', () => {
        const error = new Error('Rate limit reached for gpt-4o-mini in organization org-abc on requests per min');

        expect(describeProviderError(error)).toEqual(
            'the provider is rate limiting this account - try again shortly'
        );
    });

    test('names an unknown model', () => {
        const error = new Error("The model 'gpt-5-imaginary' does not exist or you do not have access to it");

        expect(describeProviderError(error)).toEqual(
            'the configured model is unavailable to this account'
        );
    });

    test('reports a timeout as such', () => {
        expect(describeProviderError(new Error('Request timed out after 30000ms'))).toEqual(
            'the provider did not answer in time'
        );
    });

    test('falls back to a plain description for anything else', () => {
        expect(describeProviderError(new Error('socket hang up'))).toEqual(
            'the model did not return a usable query'
        );
    });

    test('handles a thrown value that is not an Error', () => {
        expect(describeProviderError('something odd')).toEqual(
            'the model did not return a usable query'
        );
    });

    test('handles no error at all', () => {
        expect(describeProviderError(undefined)).toEqual(
            'the model did not return a usable query'
        );
    });
});
