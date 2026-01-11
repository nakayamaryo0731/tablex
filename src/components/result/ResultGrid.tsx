import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryStore } from "../../store/queryStore";

type SortDirection = "asc" | "desc" | null;

interface SortState {
  columnIndex: number | null;
  direction: SortDirection;
}

export function ResultGrid() {
  const { result, error, isExecuting } = useQueryStore();
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

  if (isExecuting) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Executing query...
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
