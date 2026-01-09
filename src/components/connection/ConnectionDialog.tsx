import { useState } from "react";
import type { ConnectionConfig } from "../../types/connection";
import { useConnectionStore } from "../../store/connectionStore";

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionDialog({ isOpen, onClose }: ConnectionDialogProps) {
  const { testConnection, connect, isConnecting, error, clearError } =
    useConnectionStore();

  const [form, setForm] = useState<Omit<ConnectionConfig, "id">>({
    name: "",
    host: "localhost",
    port: 5432,
    database: "",
    username: "postgres",
    password: "",
    ssl_mode: "disable",
  });

  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "port" ? parseInt(value) || 0 : value,
    }));
    setTestResult(null);
    clearError();
  };

  const handleTest = async () => {
    const config: ConnectionConfig = {
      ...form,
      id: crypto.randomUUID(),
    };

    const success = await testConnection(config);
    setTestResult(success ? "success" : "error");
  };

  const handleConnect = async () => {
    const config: ConnectionConfig = {
      ...form,
      id: crypto.randomUUID(),
    };

    try {
      await connect(config);
      onClose();
    } catch {
      // Error is handled in store
    }
  };

  const handleClose = () => {
    clearError();
    setTestResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">New Connection</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Connection Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="My Database"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Host</label>
              <input
                type="text"
                name="host"
                value={form.host}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Port</label>
              <input
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Database</label>
            <input
              type="text"
              name="database"
              value={form.database}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">SSL Mode</label>
            <select
              name="ssl_mode"
              value={form.ssl_mode}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="disable">Disable</option>
              <option value="prefer">Prefer</option>
              <option value="require">Require</option>
            </select>
          </div>

          {error && (
            <div className="rounded bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {testResult === "success" && (
            <div className="rounded bg-green-100 p-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Connection successful!
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleTest}
            disabled={isConnecting}
            className="rounded border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/30"
          >
            Test
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
