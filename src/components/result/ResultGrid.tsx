import { useState, useEffect } from "react";
import { type SortingState } from "@tanstack/react-table";
import { useQueryStore } from "../../store/queryStore";
import { useColumnResize } from "../../hooks/useColumnResize";
import { QueryResultTable } from "./QueryResultTable";
import { CrudTable } from "./CrudTable";

export function ResultGrid() {
  const { result, error, isExecuting, isCrudMode, tableData, isLoading } =
    useQueryStore();

  const [sorting, setSorting] = useState<SortingState>([]);

  // Get column count from result or tableData
  const columnCount = result?.columns.length ?? tableData?.columns.length ?? 0;
  const { columnWidths, handleResizeStart } = useColumnResize(columnCount, {
    defaultWidth: 150,
    minWidth: 50,
  });

  // Reset sort when result changes
  useEffect(() => {
    if (result) {
      setSorting([]);
    }
  }, [result]);

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
    return (
      <CrudTable
        tableData={tableData}
        columnWidths={columnWidths}
        onResizeStart={handleResizeStart}
      />
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
    <QueryResultTable
      result={result}
      columnWidths={columnWidths}
      onResizeStart={handleResizeStart}
      sorting={sorting}
      onSortingChange={setSorting}
    />
  );
}
