import { useConnectionStore } from "../../store/connectionStore";

export function StatusBar() {
  const { isConnected, connectionName } = useConnectionStore();

  return (
    <footer className="flex h-6 items-center justify-between border-t border-gray-200 bg-gray-100 px-4 text-xs dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}
        />
        <span className="text-gray-600 dark:text-gray-400">
          {isConnected ? `Connected to ${connectionName}` : "Not connected"}
        </span>
      </div>
      <div className="text-gray-500 dark:text-gray-400">v0.1.0</div>
    </footer>
  );
}
