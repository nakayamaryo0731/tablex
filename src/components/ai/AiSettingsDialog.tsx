import { useAiStore } from "../../store/aiStore";
import type { AiProvider } from "../../types/ai";

interface AiSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSettingsDialog({ isOpen, onClose }: AiSettingsDialogProps) {
  const { settings, updateSettings } = useAiStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">AI Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              value={settings.provider}
              onChange={(e) =>
                updateSettings({ provider: e.target.value as AiProvider })
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="Claude">Claude (Anthropic)</option>
              <option value="Ollama">Ollama (Local)</option>
            </select>
          </div>

          {settings.provider === "Claude" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Claude API Key
              </label>
              <input
                type="password"
                value={settings.claudeApiKey}
                onChange={(e) =>
                  updateSettings({ claudeApiKey: e.target.value })
                }
                placeholder="sk-ant-..."
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">
                Get your API key from{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          )}

          {settings.provider === "Ollama" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaBaseUrl}
                  onChange={(e) =>
                    updateSettings({ ollamaBaseUrl: e.target.value })
                  }
                  placeholder="http://localhost:11434"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Model</label>
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) =>
                    updateSettings({ ollamaModel: e.target.value })
                  }
                  placeholder="llama3"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Make sure Ollama is running with the specified model
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
