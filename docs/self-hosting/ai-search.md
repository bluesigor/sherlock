# AI-assisted search

AI search translates a natural-language question into a Zoekt query and runs normal code search. It does not generate answers or send repository contents to a model. Your question and Sherlock's query instructions are sent to the configured provider. Questions may contain sensitive information; choose a provider and account policy appropriate for your data. API usage may incur charges.

## Configuration

Set `CONFIG_PATH` to a v3 JSON configuration file. Add a `models` array alongside your `connections`:

```json
{
  "$schema": "./schemas/v3/index.json",
  "connections": {},
  "models": [
    {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "displayName": "OpenAI search",
      "token": { "env": "SHERLOCK_AI_API_KEY" }
    }
  ]
}
```

Set `SHERLOCK_AI_API_KEY` in the web server environment (or `.env.development.local` for development). Never put the actual key in configuration committed to Git. For Anthropic, set `provider` to `anthropic` and `model` to a model ID available in your Anthropic account. The first configured model is used; there is no model picker. Restart the web server after changing model configuration. Without models, normal search remains available and the AI toggle is hidden.

The browser receives model names only, never provider credentials. Both AI endpoints use the same authentication and organization membership rules as search. Authentication-disabled installations allow reachable users to make AI requests: keep these local or behind a trusted gateway. Use authentication for shared deployments.

## Behavior and limits

After five seconds without typing, Sherlock requests a preview. Submitting an available preview executes that exact query. Loading more results also reuses the translation. Failed searches are not automatically retried by the browser.

Questions are limited to 500 characters. Model calls have a 30-second deadline, a 1,024-output-token limit, and no automatic provider retries. Browser cancellation is forwarded to the provider request; a provider may still bill work already performed. Preview and search share a limit of 30 translations in a rolling minute and four simultaneous translations per server process. Exceeding it returns HTTP 429. These limits reset on restart and multiply across replicas; configure a shared gateway limit and provider-side spending budget for a deployment-wide cap.

If AI is unavailable, use normal search or try again later. Check server logs and the provider dashboard for missing credentials or unsupported model IDs. Some reasoning models may require more output tokens than this query-translation budget allows; use a model suited to short outputs.
