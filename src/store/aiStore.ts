import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AiProvider, AiSettings, GenerateSqlRequest } from "../types/ai";
import { useSchemaStore } from "./schemaStore";

interface AppSettings {
  ai_provider?: string;
  claude_api_key?: string;
  ollama_base_url?: string;
  ollama_model?: string;
}

interface AiState {
  settings: AiSettings;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  generatedSql: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AiSettings>) => Promise<void>;
  generateSql: (prompt: string) => Promise<string | null>;
  clearError: () => void;
}

export const useAiStore = create<AiState>()((set, get) => ({
  settings: {
    provider: "Claude" as AiProvider,
    claudeApiKey: "",
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "llama3",
  },
  isGenerating: false,
  isLoading: true,
  error: null,
  generatedSql: null,

  loadSettings: async () => {
    try {
      const saved = await invoke<AppSettings>("load_settings");
      set({
        settings: {
          provider: (saved.ai_provider as AiProvider) || "Claude",
          claudeApiKey: saved.claude_api_key || "",
          ollamaBaseUrl: saved.ollama_base_url || "http://localhost:11434",
          ollamaModel: saved.ollama_model || "llama3",
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    set({ settings: updatedSettings });

    // Save to file
    try {
      await invoke("save_settings", {
        settings: {
          ai_provider: updatedSettings.provider,
          claude_api_key: updatedSettings.claudeApiKey,
          ollama_base_url: updatedSettings.ollamaBaseUrl,
          ollama_model: updatedSettings.ollamaModel,
        },
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  },

  generateSql: async (prompt: string) => {
    const { settings } = get();
    const schemas = useSchemaStore.getState().schemas;

    // Build schema context from current schemas
    const schemaContext = schemas
      .flatMap((schema) =>
        schema.tables.map((table) => {
          const columns = table.columns
            .map(
              (col) =>
                `  ${col.name} ${col.data_type}${col.is_primary_key ? " PRIMARY KEY" : ""}${!col.is_nullable ? " NOT NULL" : ""}`
            )
            .join("\n");
          return `Table ${schema.name}.${table.name}:\n${columns}`;
        })
      )
      .join("\n\n");

    if (!schemaContext) {
      set({ error: "No schema loaded. Connect to a database first." });
      return null;
    }

    set({ isGenerating: true, error: null });

    try {
      const request: GenerateSqlRequest = {
        prompt,
        schema_context: schemaContext,
        provider: settings.provider,
        api_key:
          settings.provider === "Claude" ? settings.claudeApiKey : undefined,
        ollama_base_url:
          settings.provider === "Ollama" ? settings.ollamaBaseUrl : undefined,
        ollama_model:
          settings.provider === "Ollama" ? settings.ollamaModel : undefined,
      };

      const sql = await invoke<string>("generate_sql", { request });
      set({ generatedSql: sql, isGenerating: false });
      return sql;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isGenerating: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
