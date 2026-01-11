import { ConnectionDialog } from "../connection";
import { useConnectionStore } from "../../store/connectionStore";

export function Header() {
  const {
    isConnected,
    connectionName,
    disconnect,
    shouldShowConnectionDialog,
    setShouldShowConnectionDialog,
  } = useConnectionStore();

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShouldShowConnectionDialog(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Connect
          </button>
          {isConnected && connectionName && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {connectionName}
              </span>
              <button
                onClick={disconnect}
                className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <SettingsIcon />
          </button>
        </div>
      </header>

      <ConnectionDialog
        isOpen={shouldShowConnectionDialog}
        onClose={() => setShouldShowConnectionDialog(false)}
      />
    </>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
