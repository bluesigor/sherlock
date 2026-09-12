// THIS IS A AUTO-GENERATED FILE. DO NOT MODIFY MANUALLY!

/**
 * Defines a language model that Sherlock can use to translate natural language into a search query.
 */
export interface ModelConfig {
  /**
   * The provider that hosts the model.
   */
  provider: "openai" | "anthropic";
  /**
   * The provider specific model identifier (e.g., `gpt-4o-mini`, `claude-3-5-haiku-latest`).
   */
  model: string;
  /**
   * The name shown to the user when selecting this model.
   */
  displayName: string;
  /**
   * The API token used to authenticate with the provider.
   */
  token: {
    /**
     * The name of the environment variable that contains the token.
     */
    env: string;
  };
}
