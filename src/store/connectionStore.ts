import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  ConnectionConfig,
  SavedConnection,
  SaveConnectionInput,
} from "../types/connection";

interface ConnectionState {
  isConnected: boolean;
  connectionName: string | null;
  isConnecting: boolean;
  error: string | null;
  savedConnections: SavedConnection[];
  isLoadingSaved: boolean;
  shouldShowConnectionDialog: boolean;

  checkConnectionStatus: () => Promise<void>;
  testConnection: (config: ConnectionConfig) => Promise<boolean>;
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;

  // Saved connections
  loadSavedConnections: () => Promise<void>;
  saveConnection: (input: SaveConnectionInput) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  setDefaultConnection: (id: string) => Promise<void>;
  getConnectionPassword: (id: string) => Promise<string>;
  getDefaultConnection: () => Promise<SavedConnection | null>;
  connectToSaved: (saved: SavedConnection) => Promise<void>;
  setShouldShowConnectionDialog: (show: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isConnected: false,
  connectionName: null,
  isConnecting: false,
  error: null,
  savedConnections: [],
  isLoadingSaved: false,
  shouldShowConnectionDialog: false,

  checkConnectionStatus: async () => {
    try {
      const connectionName = await invoke<string | null>(
        "get_connection_status"
      );
      if (connectionName) {
        set({ isConnected: true, connectionName });
      } else {
        set({ isConnected: false, connectionName: null });
      }
    } catch (error) {
      console.error("Failed to check connection status:", error);
    }
  },

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

  // Saved connections
  loadSavedConnections: async () => {
    try {
      set({ isLoadingSaved: true });
      const connections = await invoke<SavedConnection[]>("load_connections");
      set({ savedConnections: connections, isLoadingSaved: false });
    } catch (error) {
      console.error("Failed to load saved connections:", error);
      set({ isLoadingSaved: false });
    }
  },

  saveConnection: async (input: SaveConnectionInput) => {
    try {
      await invoke("save_connection", { input });
      await get().loadSavedConnections();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteConnection: async (id: string) => {
    try {
      await invoke("delete_connection", { id });
      await get().loadSavedConnections();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  setDefaultConnection: async (id: string) => {
    try {
      await invoke("set_default_connection", { id });
      await get().loadSavedConnections();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getConnectionPassword: async (id: string) => {
    try {
      const password = await invoke<string | null>("get_connection_password", {
        id,
      });
      return password ?? "";
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getDefaultConnection: async () => {
    try {
      return await invoke<SavedConnection | null>("get_default_connection");
    } catch (error) {
      console.error("Failed to get default connection:", error);
      return null;
    }
  },

  connectToSaved: async (saved: SavedConnection, passwordOverride?: string) => {
    try {
      set({ isConnecting: true, error: null });
      const password =
        passwordOverride ?? (await get().getConnectionPassword(saved.id));
      if (!password) {
        set({
          isConnecting: false,
          error: "Password not found. Please enter password and save again.",
        });
        throw new Error("Password not found");
      }
      const config: ConnectionConfig = {
        id: saved.id,
        name: saved.name,
        host: saved.host,
        port: saved.port,
        database: saved.database,
        username: saved.username,
        password,
        ssl_mode: saved.ssl_mode,
      };
      await invoke<string>("connect", { config });
      set({
        isConnected: true,
        connectionName: saved.name,
        isConnecting: false,
      });
    } catch (error) {
      set({ isConnecting: false, error: String(error) });
      throw error;
    }
  },

  setShouldShowConnectionDialog: (show: boolean) =>
    set({ shouldShowConnectionDialog: show }),
}));
