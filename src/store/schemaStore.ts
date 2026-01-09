import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { SchemaInfo } from "../types/schema";

interface SchemaState {
  schemas: SchemaInfo[];
  isLoading: boolean;
  error: string | null;
  fetchSchemas: () => Promise<void>;
  clearSchemas: () => void;
}

export const useSchemaStore = create<SchemaState>((set) => ({
  schemas: [],
  isLoading: false,
  error: null,

  fetchSchemas: async () => {
    set({ isLoading: true, error: null });
    try {
      const schemas = await invoke<SchemaInfo[]>("get_schemas");
      set({ schemas, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : String(error),
        isLoading: false,
      });
    }
  },

  clearSchemas: () => {
    set({ schemas: [], error: null });
  },
}));
