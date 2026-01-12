import { describe, it, expect, beforeEach } from "vitest";
import { useQueryStore } from "./queryStore";

describe("queryStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useQueryStore.setState({
      query: "",
      result: null,
      isExecuting: false,
      error: null,
      queryHistory: [],
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
    });
  });

  describe("setQuery", () => {
    it("should update the query string", () => {
      const { setQuery } = useQueryStore.getState();

      setQuery("SELECT * FROM users");

      expect(useQueryStore.getState().query).toBe("SELECT * FROM users");
    });
  });

  describe("clearResult", () => {
    it("should clear the result", () => {
      useQueryStore.setState({
        result: {
          columns: [{ name: "id", data_type: "integer" }],
          rows: [[1]],
          row_count: 1,
          execution_time_ms: 10,
        },
      });

      const { clearResult } = useQueryStore.getState();
      clearResult();

      expect(useQueryStore.getState().result).toBeNull();
    });
  });

  describe("clearError", () => {
    it("should clear the error", () => {
      useQueryStore.setState({ error: "Some error" });

      const { clearError } = useQueryStore.getState();
      clearError();

      expect(useQueryStore.getState().error).toBeNull();
    });
  });

  describe("setEditingCell", () => {
    it("should set the editing cell", () => {
      const { setEditingCell } = useQueryStore.getState();

      setEditingCell({ rowId: "row1", column: "name" });

      expect(useQueryStore.getState().editingCell).toEqual({
        rowId: "row1",
        column: "name",
      });
    });

    it("should clear the editing cell when set to null", () => {
      useQueryStore.setState({
        editingCell: { rowId: "row1", column: "name" },
      });

      const { setEditingCell } = useQueryStore.getState();
      setEditingCell(null);

      expect(useQueryStore.getState().editingCell).toBeNull();
    });
  });

  describe("updateCell", () => {
    it("should add a pending change when value changes", () => {
      const { updateCell } = useQueryStore.getState();

      updateCell("row1", "name", "oldValue", "newValue");

      const pendingChanges = useQueryStore.getState().pendingChanges;
      expect(pendingChanges.size).toBe(1);
      expect(pendingChanges.get("row1:name")).toEqual({
        type: "update",
        rowId: "row1",
        column: "name",
        originalValue: "oldValue",
        newValue: "newValue",
      });
    });

    it("should remove pending change when value is reverted", () => {
      // First add a pending change
      useQueryStore
        .getState()
        .updateCell("row1", "name", "original", "changed");

      expect(useQueryStore.getState().pendingChanges.size).toBe(1);

      // Revert to original value
      useQueryStore
        .getState()
        .updateCell("row1", "name", "original", "original");

      expect(useQueryStore.getState().pendingChanges.size).toBe(0);
    });

    it("should clear editing cell after update", () => {
      useQueryStore.setState({
        editingCell: { rowId: "row1", column: "name" },
      });

      const { updateCell } = useQueryStore.getState();
      updateCell("row1", "name", "old", "new");

      expect(useQueryStore.getState().editingCell).toBeNull();
    });
  });

  describe("toggleRowSelection", () => {
    it("should add row to selection", () => {
      const { toggleRowSelection } = useQueryStore.getState();

      toggleRowSelection("row1");

      expect(useQueryStore.getState().selectedRows.has("row1")).toBe(true);
    });

    it("should remove row from selection if already selected", () => {
      useQueryStore.setState({
        selectedRows: new Set(["row1"]),
      });

      const { toggleRowSelection } = useQueryStore.getState();
      toggleRowSelection("row1");

      expect(useQueryStore.getState().selectedRows.has("row1")).toBe(false);
    });
  });

  describe("selectAllRows", () => {
    it("should select all rows from tableData", () => {
      useQueryStore.setState({
        tableData: {
          columns: [],
          rows: [
            { id: "row1", values: [] },
            { id: "row2", values: [] },
            { id: "row3", values: [] },
          ],
          total_count: 3,
          primary_keys: ["id"],
          has_primary_key: true,
        },
      });

      const { selectAllRows } = useQueryStore.getState();
      selectAllRows();

      const selectedRows = useQueryStore.getState().selectedRows;
      expect(selectedRows.size).toBe(3);
      expect(selectedRows.has("row1")).toBe(true);
      expect(selectedRows.has("row2")).toBe(true);
      expect(selectedRows.has("row3")).toBe(true);
    });

    it("should do nothing if tableData is null", () => {
      const { selectAllRows } = useQueryStore.getState();
      selectAllRows();

      expect(useQueryStore.getState().selectedRows.size).toBe(0);
    });
  });

  describe("clearSelection", () => {
    it("should clear all selected rows", () => {
      useQueryStore.setState({
        selectedRows: new Set(["row1", "row2", "row3"]),
      });

      const { clearSelection } = useQueryStore.getState();
      clearSelection();

      expect(useQueryStore.getState().selectedRows.size).toBe(0);
    });
  });

  describe("markForDelete", () => {
    it("should add rows to pendingDeletes", () => {
      const { markForDelete } = useQueryStore.getState();

      markForDelete(["row1", "row2"]);

      const pendingDeletes = useQueryStore.getState().pendingDeletes;
      expect(pendingDeletes.size).toBe(2);
      expect(pendingDeletes.has("row1")).toBe(true);
      expect(pendingDeletes.has("row2")).toBe(true);
    });

    it("should clear selection after marking for delete", () => {
      useQueryStore.setState({
        selectedRows: new Set(["row1", "row2"]),
      });

      const { markForDelete } = useQueryStore.getState();
      markForDelete(["row1", "row2"]);

      expect(useQueryStore.getState().selectedRows.size).toBe(0);
    });
  });

  describe("addPendingInsert", () => {
    it("should add a new insert to pendingInserts", () => {
      const { addPendingInsert } = useQueryStore.getState();

      addPendingInsert({ name: "John", age: 30 });

      const pendingInserts = useQueryStore.getState().pendingInserts;
      expect(pendingInserts.length).toBe(1);
      expect(pendingInserts[0].values).toEqual({ name: "John", age: 30 });
    });
  });

  describe("discardChanges", () => {
    it("should clear all pending changes", () => {
      useQueryStore.setState({
        pendingChanges: new Map([
          [
            "row1:name",
            {
              type: "update",
              rowId: "row1",
              column: "name",
              originalValue: "old",
              newValue: "new",
            },
          ],
        ]),
        pendingInserts: [{ values: { name: "John" } }],
        pendingDeletes: new Set(["row2"]),
        editingCell: { rowId: "row1", column: "name" },
      });

      const { discardChanges } = useQueryStore.getState();
      discardChanges();

      const state = useQueryStore.getState();
      expect(state.pendingChanges.size).toBe(0);
      expect(state.pendingInserts.length).toBe(0);
      expect(state.pendingDeletes.size).toBe(0);
      expect(state.editingCell).toBeNull();
    });
  });

  describe("hasPendingChanges", () => {
    it("should return false when no pending changes", () => {
      const { hasPendingChanges } = useQueryStore.getState();

      expect(hasPendingChanges()).toBe(false);
    });

    it("should return true when there are pending updates", () => {
      useQueryStore.setState({
        pendingChanges: new Map([
          [
            "row1:name",
            {
              type: "update",
              rowId: "row1",
              column: "name",
              originalValue: "old",
              newValue: "new",
            },
          ],
        ]),
      });

      const { hasPendingChanges } = useQueryStore.getState();
      expect(hasPendingChanges()).toBe(true);
    });

    it("should return true when there are pending inserts", () => {
      useQueryStore.setState({
        pendingInserts: [{ values: { name: "John" } }],
      });

      const { hasPendingChanges } = useQueryStore.getState();
      expect(hasPendingChanges()).toBe(true);
    });

    it("should return true when there are pending deletes", () => {
      useQueryStore.setState({
        pendingDeletes: new Set(["row1"]),
      });

      const { hasPendingChanges } = useQueryStore.getState();
      expect(hasPendingChanges()).toBe(true);
    });
  });

  describe("exitCrudMode", () => {
    it("should reset all CRUD-related state", () => {
      useQueryStore.setState({
        isCrudMode: true,
        tableData: {
          columns: [],
          rows: [],
          total_count: 0,
          primary_keys: [],
          has_primary_key: false,
        },
        currentSchema: "public",
        currentTable: "users",
        pendingChanges: new Map([
          [
            "row1:name",
            {
              type: "update",
              rowId: "row1",
              column: "name",
              originalValue: "old",
              newValue: "new",
            },
          ],
        ]),
        pendingInserts: [{ values: { name: "John" } }],
        pendingDeletes: new Set(["row2"]),
        selectedRows: new Set(["row1"]),
        editingCell: { rowId: "row1", column: "name" },
      });

      const { exitCrudMode } = useQueryStore.getState();
      exitCrudMode();

      const state = useQueryStore.getState();
      expect(state.isCrudMode).toBe(false);
      expect(state.tableData).toBeNull();
      expect(state.currentSchema).toBeNull();
      expect(state.currentTable).toBeNull();
      expect(state.pendingChanges.size).toBe(0);
      expect(state.pendingInserts.length).toBe(0);
      expect(state.pendingDeletes.size).toBe(0);
      expect(state.selectedRows.size).toBe(0);
      expect(state.editingCell).toBeNull();
    });
  });

  describe("setPage", () => {
    it("should update the current page", () => {
      const { setPage } = useQueryStore.getState();

      setPage(2);

      expect(useQueryStore.getState().currentPage).toBe(2);
    });
  });

  describe("setPageSize", () => {
    it("should update page size and reset to first page", () => {
      useQueryStore.setState({ currentPage: 5 });

      const { setPageSize } = useQueryStore.getState();
      setPageSize(100);

      const state = useQueryStore.getState();
      expect(state.pageSize).toBe(100);
      expect(state.currentPage).toBe(0);
    });
  });
});
