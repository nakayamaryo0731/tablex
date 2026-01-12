import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  QueryResult,
  TableData,
  TableDataRequest,
  RowUpdate,
  RowInsert,
  RowDelete,
  PendingChange,
} from "../types/query";

export interface QueryHistoryItem {
  id: string;
  query: string;
  executedAt: Date;
  rowCount?: number;
  executionTimeMs?: number;
  error?: string;
}

interface QueryState {
  query: string;
  result: QueryResult | null;
  isExecuting: boolean;
  error: string | null;

  // Query history
  queryHistory: QueryHistoryItem[];

  // CRUD mode state
  tableData: TableData | null;
  currentSchema: string | null;
  currentTable: string | null;
  isCrudMode: boolean;
  pendingChanges: Map<string, PendingChange>;
  pendingInserts: RowInsert[];
  pendingDeletes: Set<string>;
  selectedRows: Set<string>;
  editingCell: { rowId: string; column: string } | null;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;

  setQuery: (query: string) => void;
  executeQuery: () => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
  clearHistory: () => void;

  // CRUD actions
  loadTableData: (schema: string, table: string) => Promise<void>;
  refreshTableData: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  exitCrudMode: () => void;

  // Editing actions
  setEditingCell: (cell: { rowId: string; column: string } | null) => void;
  updateCell: (
    rowId: string,
    column: string,
    originalValue: unknown,
    newValue: unknown
  ) => void;
  addPendingInsert: (values: Record<string, unknown>) => void;
  toggleRowSelection: (rowId: string) => void;
  selectAllRows: () => void;
  clearSelection: () => void;
  markForDelete: (rowIds: string[]) => void;

  // Save/Discard actions
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
  hasPendingChanges: () => boolean;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  query: "",
  result: null,
  isExecuting: false,
  error: null,

  // Query history
  queryHistory: [],

  // CRUD mode state
  tableData: null,
  currentSchema: null,
  currentTable: null,
  isCrudMode: false,
  pendingChanges: new Map(),
  pendingInserts: [],
  pendingDeletes: new Set(),
  selectedRows: new Set(),
  editingCell: null,
  currentPage: 0,
  pageSize: 50,
  isLoading: false,

  setQuery: (query: string) => set({ query }),

  executeQuery: async () => {
    const { query, queryHistory } = get();
    if (!query.trim()) return;

    const historyItem: QueryHistoryItem = {
      id: crypto.randomUUID(),
      query: query.trim(),
      executedAt: new Date(),
    };

    try {
      set({ isExecuting: true, error: null, isCrudMode: false });
      const result = await invoke<QueryResult>("execute_query", { query });

      // Update history with success info
      historyItem.rowCount = result.row_count;
      historyItem.executionTimeMs = result.execution_time_ms;

      // Add to history (keep last 50)
      const newHistory = [historyItem, ...queryHistory].slice(0, 50);

      set({
        result,
        isExecuting: false,
        tableData: null,
        queryHistory: newHistory,
      });
    } catch (error) {
      // Update history with error
      historyItem.error = String(error);
      const newHistory = [historyItem, ...queryHistory].slice(0, 50);

      set({
        isExecuting: false,
        error: String(error),
        queryHistory: newHistory,
      });
    }
  },

  clearResult: () => set({ result: null }),

  clearError: () => set({ error: null }),

  clearHistory: () => set({ queryHistory: [] }),

  // CRUD actions
  loadTableData: async (schema: string, table: string) => {
    const { pageSize, currentPage } = get();

    try {
      set({
        isLoading: true,
        error: null,
        currentSchema: schema,
        currentTable: table,
      });

      const request: TableDataRequest = {
        schema,
        table,
        limit: pageSize,
        offset: currentPage * pageSize,
      };

      const tableData = await invoke<TableData>("get_table_data", { request });

      set({
        tableData,
        isCrudMode: true,
        isLoading: false,
        result: null,
        pendingChanges: new Map(),
        pendingInserts: [],
        pendingDeletes: new Set(),
        selectedRows: new Set(),
        editingCell: null,
      });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  refreshTableData: async () => {
    const { currentSchema, currentTable, pageSize, currentPage } = get();
    if (!currentSchema || !currentTable) return;

    try {
      set({ isLoading: true, error: null });

      const request: TableDataRequest = {
        schema: currentSchema,
        table: currentTable,
        limit: pageSize,
        offset: currentPage * pageSize,
      };

      const tableData = await invoke<TableData>("get_table_data", { request });

      set({
        tableData,
        isLoading: false,
        pendingChanges: new Map(),
        pendingInserts: [],
        pendingDeletes: new Set(),
        selectedRows: new Set(),
        editingCell: null,
      });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  setPage: (page: number) => {
    set({ currentPage: page });
    get().refreshTableData();
  },

  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 0 });
    get().refreshTableData();
  },

  exitCrudMode: () => {
    set({
      isCrudMode: false,
      tableData: null,
      currentSchema: null,
      currentTable: null,
      pendingChanges: new Map(),
      pendingInserts: [],
      pendingDeletes: new Set(),
      selectedRows: new Set(),
      editingCell: null,
    });
  },

  // Editing actions
  setEditingCell: (cell) => set({ editingCell: cell }),

  updateCell: (rowId, column, originalValue, newValue) => {
    const { pendingChanges } = get();
    const key = `${rowId}:${column}`;

    const newChanges = new Map(pendingChanges);
    if (originalValue === newValue) {
      newChanges.delete(key);
    } else {
      newChanges.set(key, {
        type: "update",
        rowId,
        column,
        originalValue,
        newValue,
      });
    }

    set({ pendingChanges: newChanges, editingCell: null });
  },

  addPendingInsert: (values) => {
    const { pendingInserts } = get();
    set({ pendingInserts: [...pendingInserts, { values }] });
  },

  toggleRowSelection: (rowId) => {
    const { selectedRows } = get();
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    set({ selectedRows: newSelection });
  },

  selectAllRows: () => {
    const { tableData } = get();
    if (!tableData) return;
    const allIds = new Set(tableData.rows.map((r) => r.id));
    set({ selectedRows: allIds });
  },

  clearSelection: () => set({ selectedRows: new Set() }),

  markForDelete: (rowIds) => {
    const { pendingDeletes } = get();
    const newDeletes = new Set(pendingDeletes);
    for (const id of rowIds) {
      newDeletes.add(id);
    }
    set({ pendingDeletes: newDeletes, selectedRows: new Set() });
  },

  // Save/Discard actions
  saveChanges: async () => {
    const {
      currentSchema,
      currentTable,
      pendingChanges,
      pendingInserts,
      pendingDeletes,
    } = get();

    if (!currentSchema || !currentTable) return;

    try {
      set({ isLoading: true, error: null });

      // Process updates
      if (pendingChanges.size > 0) {
        const updates: RowUpdate[] = Array.from(pendingChanges.values())
          .filter((c) => c.type === "update")
          .map((c) => ({
            row_id: c.rowId,
            column: c.column!,
            new_value: c.newValue,
          }));

        if (updates.length > 0) {
          await invoke("update_rows", {
            schema: currentSchema,
            table: currentTable,
            updates,
          });
        }
      }

      // Process inserts
      if (pendingInserts.length > 0) {
        await invoke("insert_rows", {
          schema: currentSchema,
          table: currentTable,
          rows: pendingInserts,
        });
      }

      // Process deletes
      if (pendingDeletes.size > 0) {
        const deletes: RowDelete[] = Array.from(pendingDeletes).map((id) => ({
          row_id: id,
        }));
        await invoke("delete_rows", {
          schema: currentSchema,
          table: currentTable,
          deletes,
        });
      }

      // Refresh data
      await get().refreshTableData();
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  discardChanges: () => {
    set({
      pendingChanges: new Map(),
      pendingInserts: [],
      pendingDeletes: new Set(),
      editingCell: null,
    });
  },

  hasPendingChanges: () => {
    const { pendingChanges, pendingInserts, pendingDeletes } = get();
    return (
      pendingChanges.size > 0 ||
      pendingInserts.length > 0 ||
      pendingDeletes.size > 0
    );
  },
}));
