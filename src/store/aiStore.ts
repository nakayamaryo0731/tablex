import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import type { AiProvider, AiSettings, GenerateSqlRequest } from "../types/ai";
import { useSchemaStore } from "./schemaStore";

interface AiState {
  settings: AiSettings;
  isGenerating: boolean;
  error: string | null;
  generatedSql: string | null;
  updateSettings: (settings: Partial<AiSettings>) => void;
  generateSql: (prompt: string) => Promise<string | null>;
  clearError: () => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      settings: {
        provider: "Claude" as AiProvider,
        claudeApiKey: "",
        ollamaBaseUrl: "http://localhost:11434",
        ollamaModel: "llama3",
      },
      isGenerating: false,
      error: null,
      generatedSql: null,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

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
              settings.provider === "Claude"
                ? settings.claudeApiKey
                : undefined,
            ollama_base_url:
              settings.provider === "Ollama"
                ? settings.ollamaBaseUrl
                : undefined,
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
    }),
    {
      name: "dbpilot-ai-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
