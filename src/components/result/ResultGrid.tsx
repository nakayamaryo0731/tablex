import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useQueryStore } from "../../store/queryStore";

export function ResultGrid() {
  const { result, error, isExecuting } = useQueryStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!result) return;

    try {
      setIsExporting(true);
      const filePath = await save({
        defaultPath: "query_result.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (filePath) {
        await invoke("export_csv", {
          data: {
            columns: result.columns.map((c) => c.name),
            rows: result.rows,
          },
          filePath,
        });
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

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
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
            <tr>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  className="border-b border-r border-gray-200 px-3 py-2 text-left font-medium dark:border-gray-700"
                >
                  <div>{col.name}</div>
                  <div className="text-xs font-normal text-gray-400">
                    {col.data_type}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b border-r border-gray-200 px-3 py-1.5 dark:border-gray-700"
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
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-xs text-gray-500">
          {result.row_count} rows in {result.execution_time_ms}ms
        </span>
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <DownloadIcon />
          {isExporting ? "Exporting..." : "CSV"}
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}
