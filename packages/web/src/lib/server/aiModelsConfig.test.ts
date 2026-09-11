import { beforeEach, describe, expect, test, vi } from 'vitest';

const { readFileMock, envMock } = vi.hoisted(() => ({
    readFileMock: vi.fn(),
    envMock: {
        CONFIG_PATH: undefined as string | undefined,
    },
}));

vi.mock('fs/promises', () => ({
    default: { readFile: readFileMock },
    readFile: readFileMock,
}));

vi.mock('@/env.mjs', () => ({
    env: envMock,
}));

const modelConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    token: { env: 'OPENAI_API_KEY' },
};

const importModule = async () => {
    vi.resetModules();
    return import('./aiModelsConfig');
};

const mockConfigFile = (config: unknown) => {
    envMock.CONFIG_PATH = '/etc/sherlock/config.json';
    readFileMock.mockResolvedValue(JSON.stringify(config));
};

describe('aiModelsConfig', () => {
    beforeEach(() => {
        readFileMock.mockReset();
        envMock.CONFIG_PATH = undefined;
    });

    test('returns no models when no config path is set', async () => {
        const { getAiModels } = await importModule();
        expect(await getAiModels()).toEqual([]);
    });

    test('returns no models when the config file does not define any', async () => {
        mockConfigFile({ connections: {} });
        const { getAiModels } = await importModule();
        expect(await getAiModels()).toEqual([]);
    });

    test('returns the configured models with a stable id', async () => {
        mockConfigFile({ models: [modelConfig] });
        const { getAiModels } = await importModule();

        expect(await getAiModels()).toEqual([
            {
                ...modelConfig,
                id: 'openai/gpt-4o-mini',
            },
        ]);
    });

    test('reads the config file only once', async () => {
        mockConfigFile({ models: [modelConfig] });
        const { getAiModels } = await importModule();

        await getAiModels();
        await getAiModels();

        expect(readFileMock).toHaveBeenCalledTimes(1);
    });

    test('returns no models when the config file is invalid', async () => {
        mockConfigFile({ models: [{ provider: 'not-a-provider' }] });
        const { getAiModels } = await importModule();

        expect(await getAiModels()).toEqual([]);
    });

    test('getAiModel always returns the first configured model', async () => {
        const secondModel = { ...modelConfig, provider: 'anthropic', model: 'claude-3-5-haiku-latest' };
        mockConfigFile({ models: [modelConfig, secondModel] });
        const { getAiModel } = await importModule();

        expect(await getAiModel()).toMatchObject({ id: 'openai/gpt-4o-mini' });
    });

    test('getAiModel returns undefined when no models are configured', async () => {
        mockConfigFile({});
        const { getAiModel } = await importModule();

        expect(await getAiModel()).toBeUndefined();
    });
});
