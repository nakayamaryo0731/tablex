import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ConnectionConfig } from "../types/connection";

interface ConnectionState {
  isConnected: boolean;
  connectionName: string | null;
  isConnecting: boolean;
  error: string | null;

  testConnection: (config: ConnectionConfig) => Promise<boolean>;
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: false,
  connectionName: null,
  isConnecting: false,
  error: null,

  testConnection: async (config: ConnectionConfig) => {
    try {
      set({ error: null });
      const result = await invoke<boolean>("test_connection", { config });
      return result;
    } catch (error) {
      set({ error: String(error) });
      return false;
    }
  },

  connect: async (config: ConnectionConfig) => {
    try {
      set({ isConnecting: true, error: null });
      await invoke<string>("connect", { config });
      set({
        isConnected: true,
        connectionName: config.name,
        isConnecting: false,
      });
    } catch (error) {
      set({ isConnecting: false, error: String(error) });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await invoke("disconnect");
      set({ isConnected: false, connectionName: null });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  clearError: () => set({ error: null }),
}));
