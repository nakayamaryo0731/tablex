import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQueryStore } from "../../store/queryStore";
import { EditableCell } from "./EditableCell";
import { InsertRowDialog } from "./InsertRowDialog";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

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
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        {isExecuting ? "Executing query..." : "Loading..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-[var(--radius)] bg-[hsl(var(--destructive))]/10 p-3 text-[13px] text-[hsl(var(--destructive))]">
          {error}
        </div>
      </div>
    );
  }

  // CRUD mode rendering
  if (isCrudMode && tableData) {
    const isReadOnly = !tableData.has_primary_key;

    return (
      <TooltipProvider>
        <div className="flex h-full flex-col overflow-hidden">
          {isReadOnly && (
            <div className="bg-[hsl(var(--warning))]/10 px-3 py-1 text-xs text-[hsl(var(--warning))]">
              This table has no primary key. Data is read-only.
            </div>
          )}
          <div className="flex-1 overflow-auto">
            <table className="border-collapse text-[13px]">
              <thead className="sticky top-0 z-10 bg-[hsl(var(--muted))] shadow-[0_1px_0_hsl(var(--border))]">
                <tr>
                  {!isReadOnly && (
                    <th className="w-10 border-b border-r border-[hsl(var(--border))] px-2 py-2">
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
                        className="h-4 w-4 rounded border-[hsl(var(--border))]"
                      />
                    </th>
                  )}
                  {tableData.columns.map((col, i) => (
                    <th
                      key={i}
                      style={{ width: columnWidths[i] || 150, minWidth: 50 }}
                      className="relative border-b border-r border-[hsl(var(--border))] text-left font-medium"
                    >
                      <div
                        onClick={() => handleSort(i)}
                        className="cursor-pointer select-none px-3 py-2 hover:bg-[hsl(var(--accent))] transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          {col.is_primary_key && (
                            <Key className="h-3 w-3 text-[hsl(var(--tree-icon-key))]" />
                          )}
                          <SortIcon
                            direction={
                              sortState.columnIndex === i
                                ? sortState.direction
                                : null
                            }
                          />
                        </div>
                        <div className="text-[11px] font-normal font-[var(--font-mono)] text-[hsl(var(--muted-foreground))]">
                          {col.data_type}
                          {col.is_auto_generated && " (auto)"}
                        </div>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart(e, i)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[hsl(var(--primary))]"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-[var(--font-mono)]">
                {tableData.rows.map((row) => {
                  const isDeleted = pendingDeletes.has(row.id);
                  const isSelected = selectedRows.has(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition-colors",
                        isDeleted
                          ? "bg-[hsl(var(--destructive))]/10"
                          : isSelected
                            ? "bg-[hsl(var(--table-row-selected))]"
                            : "hover:bg-[hsl(var(--table-row-hover))]"
                      )}
                    >
                      {!isReadOnly && (
                        <td className="border-b border-r border-[hsl(var(--border))] px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(row.id)}
                            disabled={isDeleted}
                            className="h-4 w-4 rounded border-[hsl(var(--border))]"
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
                            className="border-b border-r border-[hsl(var(--border))] px-3 py-1.5"
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
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1">
            {/* CRUD Toolbar */}
            {tableData.has_primary_key ? (
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setIsInsertDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Row</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => markForDelete(Array.from(selectedRows))}
                      disabled={selectedRows.size === 0}
                      className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected</TooltipContent>
                </Tooltip>

                <div className="mx-1 h-4 w-px bg-[hsl(var(--border))]" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={saveChanges}
                      disabled={!hasPendingChanges || isLoading}
                      className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save Changes</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={discardChanges}
                      disabled={!hasPendingChanges}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Discard Changes</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={refreshTableData}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Read-only (no primary key)
              </span>
            )}

            {/* Pagination */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {currentPage * pageSize + 1}-
                {Math.min((currentPage + 1) * pageSize, tableData.total_count)}{" "}
                of {tableData.total_count}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={
                    (currentPage + 1) * pageSize >= tableData.total_count
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
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
      </TooltipProvider>
    );
  }

  // Regular query result mode
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Run a query to see results
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Query executed successfully (no results)
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-[hsl(var(--muted))] shadow-[0_1px_0_hsl(var(--border))]">
            <tr>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  style={{ width: columnWidths[i] || 150, minWidth: 50 }}
                  className="relative border-b border-r border-[hsl(var(--border))] text-left font-medium"
                >
                  <div
                    onClick={() => handleSort(i)}
                    className="cursor-pointer select-none px-3 py-2 hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      <SortIcon
                        direction={
                          sortState.columnIndex === i
                            ? sortState.direction
                            : null
                        }
                      />
                    </div>
                    <div className="text-[11px] font-normal font-[var(--font-mono)] text-[hsl(var(--muted-foreground))]">
                      {col.data_type}
                    </div>
                  </div>
                  <div
                    onMouseDown={(e) => handleResizeStart(e, i)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[hsl(var(--primary))]"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-[var(--font-mono)]">
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-[hsl(var(--table-row-hover))] transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      width: columnWidths[cellIndex] || 150,
                      minWidth: 50,
                    }}
                    className="overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-[hsl(var(--border))] px-3 py-1.5"
                  >
                    {cell === null ? (
                      <span className="rounded-[var(--radius-sm)] bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[11px] italic text-[hsl(var(--table-null))]">
                        NULL
                      </span>
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
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {result.row_count} rows in {result.execution_time_ms}ms
        </span>
      </div>
    </div>
  );
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (!direction) {
    return (
      <ArrowUpDown className="h-3 w-3 text-[hsl(var(--muted-foreground))]/50" />
    );
  }

  return direction === "asc" ? (
    <ArrowUp className="h-3 w-3 text-[hsl(var(--primary))]" />
  ) : (
    <ArrowDown className="h-3 w-3 text-[hsl(var(--primary))]" />
  );
}
