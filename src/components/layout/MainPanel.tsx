import { useState } from "react";
import { SqlEditor } from "../editor";
import { ResultGrid } from "../result";
import { ErDiagram } from "../er-diagram";
import { useQueryStore } from "../../store/queryStore";
import { useConnectionStore } from "../../store/connectionStore";

export function MainPanel() {
  const [activeTab, setActiveTab] = useState<"query" | "er">("query");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* AI Query Bar */}
      <div className="border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <input
            type="text"
            placeholder="Describe your query in natural language..."
            className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
          />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Generate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
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
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "query" ? <QueryPanel /> : <ErDiagramPanel />}
      </div>
    </div>
  );
}

function QueryPanel() {
  const { executeQuery, isExecuting } = useQueryStore();
  const { isConnected } = useConnectionStore();

  const handleRun = () => {
    if (isConnected) {
      executeQuery();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* SQL Editor */}
      <div className="h-1/2 min-h-[150px] border-b border-gray-200 dark:border-gray-700">
        <SqlEditor />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={handleRun}
          disabled={!isConnected || isExecuting}
          className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlayIcon />
          {isExecuting ? "Running..." : "Run"}
        </button>
        {!isConnected && (
          <span className="text-xs text-gray-500">
            Connect to a database first
          </span>
        )}
      </div>

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

function PlayIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
