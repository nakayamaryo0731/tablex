import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { SchemaInfo } from "../types/schema";

interface FocusedTable {
  schema: string;
  table: string;
}

interface SchemaState {
  schemas: SchemaInfo[];
  isLoading: boolean;
  error: string | null;
  focusedTable: FocusedTable | null;
  fetchSchemas: () => Promise<void>;
  clearSchemas: () => void;
  setFocusedTable: (schema: string, table: string) => void;
  clearFocusedTable: () => void;
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  schemas: [],
  isLoading: false,
  error: null,
  focusedTable: null,

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
    set({ schemas: [], error: null, focusedTable: null });
  },

  setFocusedTable: (schema: string, table: string) => {
    const current = get().focusedTable;
    // Toggle off if clicking the same table
    if (current?.schema === schema && current?.table === table) {
      set({ focusedTable: null });
    } else {
      set({ focusedTable: { schema, table } });
    }
  },

  clearFocusedTable: () => {
    set({ focusedTable: null });
  },
}));
