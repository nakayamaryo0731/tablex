import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { SqlEditor } from "../editor";
import { ResultGrid } from "../result";
import { ErDiagram } from "../er-diagram";
import { AiQueryBar, AiSettingsDialog } from "../ai";
import { useQueryStore } from "../../store/queryStore";
import { useConnectionStore } from "../../store/connectionStore";

export function MainPanel() {
  const [activeTab, setActiveTab] = useState<"query" | "er">("query");
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const {
    executeQuery,
    query,
    isExecuting,
    result,
    isCrudMode,
    currentSchema,
    currentTable,
    exitCrudMode,
  } = useQueryStore();
  const { isConnected } = useConnectionStore();

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* AI Query Bar */}
      <AiQueryBar onSettingsClick={() => setIsAiSettingsOpen(true)} />

      {/* Tabs and Run Button */}
      <div className="flex items-center border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "query"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("query")}
        >
          Query
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "er"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("er")}
        >
          ER Diagram
        </button>

        {/* CRUD mode indicator */}
        {isCrudMode && currentTable && (
          <div className="ml-4 flex items-center gap-2 border-l border-gray-300 pl-4 dark:border-gray-600">
            <span className="text-xs text-gray-500">
              {currentSchema}.{currentTable}
            </span>
            <button
              onClick={exitCrudMode}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Exit table view"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Query buttons - always visible */}
        <button
          onClick={handleExportCsv}
          disabled={!result || isExporting}
          className="mr-2 rounded bg-gray-600 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "CSV"}
        </button>
        <button
          onClick={executeQuery}
          disabled={!isConnected || !query.trim() || isExecuting}
          className="mr-2 rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExecuting ? "Running..." : "Run"}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "query" ? <QueryPanel /> : <ErDiagramPanel />}
      </div>

      {/* AI Settings Dialog */}
      <AiSettingsDialog
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </div>
  );
}

function QueryPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(200);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - containerRect.top;
      const minHeight = 100;
      const maxHeight = containerRect.height - 100;

      setEditorHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
      {/* SQL Editor */}
      <div style={{ height: editorHeight }} className="min-h-[100px]">
        <SqlEditor />
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-1 cursor-row-resize bg-gray-200 hover:bg-blue-400 dark:bg-gray-700 dark:hover:bg-blue-500 ${
          isDragging ? "bg-blue-500 dark:bg-blue-500" : ""
        }`}
      />

      {/* Results */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <ResultGrid />
      </div>
    </div>
  );
}

function ErDiagramPanel() {
  return (
    <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
      <ErDiagram />
    </div>
  );
}
