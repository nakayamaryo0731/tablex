export type AiProvider = "Claude" | "Ollama";

export interface GenerateSqlRequest {
  prompt: string;
  schema_context: string;
  provider: AiProvider;
  api_key?: string;
  ollama_base_url?: string;
  ollama_model?: string;
}

export interface AiSettings {
  provider: AiProvider;
  claudeApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}
