import { useState } from "react";
import { useAiStore } from "../../store/aiStore";
import { useQueryStore } from "../../store/queryStore";
import { useConnectionStore } from "../../store/connectionStore";

interface AiQueryBarProps {
  onSettingsClick: () => void;
}

export function AiQueryBar({ onSettingsClick }: AiQueryBarProps) {
  const [prompt, setPrompt] = useState("");
  const { generateSql, isGenerating, error, settings } = useAiStore();
  const { setQuery } = useQueryStore();
  const { isConnected } = useConnectionStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || !isConnected) return;

    const sql = await generateSql(prompt);
    if (sql) {
      setQuery(sql);
      setPrompt("");
    }
  };

  const isConfigured =
    settings.provider === "Claude"
      ? !!settings.claudeApiKey
      : !!settings.ollamaBaseUrl;

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          title="AI Settings"
        >
          <RobotIcon />
          <span className="text-xs">{settings.provider}</span>
        </button>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            !isConnected
              ? "Connect to a database first..."
              : !isConfigured
                ? "Configure AI settings first..."
                : "Describe your query in natural language..."
          }
          disabled={!isConnected || isGenerating}
          className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
        />
        <button
          onClick={handleGenerate}
          disabled={
            !isConnected || !isConfigured || !prompt.trim() || isGenerating
          }
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>
      {error && (
        <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

function RobotIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
