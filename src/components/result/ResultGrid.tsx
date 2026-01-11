import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryStore } from "../../store/queryStore";
import { EditableCell } from "./EditableCell";
import { InsertRowDialog } from "./InsertRowDialog";

type SortDirection = "asc" | "desc" | null;

interface SortState {
  columnIndex: number | null;
  direction: SortDirection;
}

export function ResultGrid() {
  const {
    result,
    error,
    isExecuting,
    isCrudMode,
    tableData,
    isLoading,
    editingCell,
    pendingChanges,
    pendingDeletes,
    pendingInserts,
    selectedRows,
    currentPage,
    pageSize,
    setEditingCell,
    updateCell,
    toggleRowSelection,
    setPage,
    setPageSize,
    saveChanges,
    discardChanges,
    refreshTableData,
    markForDelete,
    addPendingInsert,
  } = useQueryStore();
  const [isInsertDialogOpen, setIsInsertDialogOpen] = useState(false);

  const hasPendingChanges =
    pendingChanges.size > 0 ||
    pendingInserts.length > 0 ||
    pendingDeletes.size > 0;
  const [sortState, setSortState] = useState<SortState>({
    columnIndex: null,
    direction: null,
  });
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [resizing, setResizing] = useState<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Reset sort and column widths when result changes
  useEffect(() => {
    if (result) {
      setSortState({ columnIndex: null, direction: null });
      setColumnWidths(result.columns.map(() => 150));
    }
  }, [result]);

  const handleSort = (columnIndex: number) => {
    setSortState((prev) => {
      if (prev.columnIndex !== columnIndex) {
        return { columnIndex, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { columnIndex, direction: "desc" };
      }
      return { columnIndex: null, direction: null };
    });
  };

  const sortedRows = useMemo(() => {
    if (!result || sortState.columnIndex === null || !sortState.direction) {
      return result?.rows ?? [];
    }

    const colIndex = sortState.columnIndex;
    const direction = sortState.direction;

    return [...result.rows].sort((a, b) => {
      const aVal = a[colIndex];
      const bVal = b[colIndex];

      // Handle nulls
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return direction === "asc" ? -1 : 1;
      if (bVal === null) return direction === "asc" ? 1 : -1;

      // Compare values
      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr);
      return direction === "asc" ? cmp : -cmp;
    });
  }, [result, sortState]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing({
        index,
        startX: e.clientX,
        startWidth: columnWidths[index] || 150,
      });
    },
    [columnWidths]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);

      setColumnWidths((prev) => {
        const next = [...prev];
        next[resizing.index] = newWidth;
        return next;
      });
    },
    [resizing]
  );

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing, handleResizeMove, handleResizeEnd]);

  if (isExecuting || isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        {isExecuting ? "Executing query..." : "Loading..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  // CRUD mode rendering
  if (isCrudMode && tableData) {
    const isReadOnly = !tableData.has_primary_key;

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {isReadOnly && (
          <div className="bg-yellow-100 px-3 py-1 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            This table has no primary key. Data is read-only.
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
              <tr>
                {!isReadOnly && (
                  <th className="w-10 border-b border-r border-gray-200 px-2 py-2 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.size > 0 &&
                        selectedRows.size === tableData.rows.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          useQueryStore.getState().selectAllRows();
                        } else {
                          useQueryStore.getState().clearSelection();
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </th>
                )}
                {tableData.columns.map((col, i) => (
                  <th
                    key={i}
                    style={{ width: columnWidths[i] || 150, minWidth: 50 }}
                    className="relative border-b border-r border-gray-200 text-left font-medium dark:border-gray-700"
                  >
                    <div
                      onClick={() => handleSort(i)}
                      className="cursor-pointer select-none px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.name}</span>
                        {col.is_primary_key && (
                          <span className="text-yellow-500" title="Primary Key">
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                            </svg>
                          </span>
                        )}
                        <SortIcon
                          direction={
                            sortState.columnIndex === i
                              ? sortState.direction
                              : null
                          }
                        />
                      </div>
                      <div className="text-xs font-normal text-gray-400">
                        {col.data_type}
                        {col.is_auto_generated && " (auto)"}
                      </div>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart(e, i)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row) => {
                const isDeleted = pendingDeletes.has(row.id);
                const isSelected = selectedRows.has(row.id);

                return (
                  <tr
                    key={row.id}
                    className={`${
                      isDeleted
                        ? "bg-red-50 dark:bg-red-900/20"
                        : isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {!isReadOnly && (
                      <td className="border-b border-r border-gray-200 px-2 py-1.5 text-center dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(row.id)}
                          disabled={isDeleted}
                          className="h-4 w-4"
                        />
                      </td>
                    )}
                    {row.values.map((cell, cellIndex) => {
                      const col = tableData.columns[cellIndex];
                      const cellKey = `${row.id}:${col.name}`;
                      const pendingChange = pendingChanges.get(cellKey);
                      const isModified = !!pendingChange;
                      const displayValue = isModified
                        ? pendingChange.newValue
                        : cell;
                      const isEditing =
                        editingCell?.rowId === row.id &&
                        editingCell?.column === col.name;
                      const isCellReadOnly =
                        isReadOnly || col.is_auto_generated;

                      return (
                        <td
                          key={cellIndex}
                          style={{
                            width: columnWidths[cellIndex] || 150,
                            minWidth: 50,
                          }}
                          className="border-b border-r border-gray-200 px-3 py-1.5 dark:border-gray-700"
                        >
                          <EditableCell
                            value={displayValue}
                            column={col}
                            isEditing={isEditing}
                            isModified={isModified}
                            isDeleted={isDeleted}
                            onStartEdit={() =>
                              setEditingCell({
                                rowId: row.id,
                                column: col.name,
                              })
                            }
                            onSave={(newValue) =>
                              updateCell(row.id, col.name, cell, newValue)
                            }
                            onCancel={() => setEditingCell(null)}
                            readOnly={isCellReadOnly}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Bottom toolbar with CRUD buttons and Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          {/* CRUD Toolbar */}
          {tableData.has_primary_key ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsInsertDialogOpen(true)}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                title="Add new row"
              >
                + Add
              </button>
              <button
                onClick={() => markForDelete(Array.from(selectedRows))}
                disabled={selectedRows.size === 0}
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Delete selected rows"
              >
                Delete
              </button>
              <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />
              <button
                onClick={saveChanges}
                disabled={!hasPendingChanges || isLoading}
                className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Save changes (Ctrl+S)"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={discardChanges}
                disabled={!hasPendingChanges}
                className="rounded bg-gray-600 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Discard changes"
              >
                Discard
              </button>
              <button
                onClick={refreshTableData}
                disabled={isLoading}
                className="rounded bg-gray-600 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh data"
              >
                Refresh
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-500">
              Read-only (no primary key)
            </span>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {currentPage * pageSize + 1}-
              {Math.min((currentPage + 1) * pageSize, tableData.total_count)} of{" "}
              {tableData.total_count}
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="rounded px-1.5 py-0.5 text-xs hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={(currentPage + 1) * pageSize >= tableData.total_count}
                className="rounded px-1.5 py-0.5 text-xs hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Insert Row Dialog */}
        <InsertRowDialog
          isOpen={isInsertDialogOpen}
          onClose={() => setIsInsertDialogOpen(false)}
          columns={tableData.columns}
          onInsert={(values) => {
            addPendingInsert(values);
            setIsInsertDialogOpen(false);
          }}
        />
      </div>
    );
  }

  // Regular query result mode
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Run a query to see results
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Query executed successfully (no results)
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-sm">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
            <tr>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  style={{ width: columnWidths[i] || 150, minWidth: 50 }}
                  className="relative border-b border-r border-gray-200 text-left font-medium dark:border-gray-700"
                >
                  <div
                    onClick={() => handleSort(i)}
                    className="cursor-pointer select-none px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.name}</span>
                      <SortIcon
                        direction={
                          sortState.columnIndex === i
                            ? sortState.direction
                            : null
                        }
                      />
                    </div>
                    <div className="text-xs font-normal text-gray-400">
                      {col.data_type}
                    </div>
                  </div>
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      width: columnWidths[cellIndex] || 150,
                      minWidth: 50,
                    }}
                    className="overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-gray-200 px-3 py-1.5 dark:border-gray-700"
                  >
                    {cell === null ? (
                      <span className="italic text-gray-400">NULL</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-xs text-gray-500">
          {result.row_count} rows in {result.execution_time_ms}ms
        </span>
      </div>
    </div>
  );
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (!direction) {
    return (
      <svg
        className="h-3 w-3 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-3 w-3 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {direction === "asc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      )}
    </svg>
  );
}
