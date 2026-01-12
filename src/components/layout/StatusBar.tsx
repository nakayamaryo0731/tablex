import { useConnectionStore } from "../../store/connectionStore";
import { cn } from "../../lib/utils";

export function StatusBar() {
  const { isConnected, connectionName } = useConnectionStore();

  return (
    <footer className="flex h-6 items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-[11px]">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-all",
            isConnected
              ? "bg-[hsl(var(--success))] shadow-[0_0_4px_hsl(var(--success)/0.5)]"
              : "bg-[hsl(var(--muted-foreground))]"
          )}
        />
        <span className="text-[hsl(var(--muted-foreground))]">
          {isConnected ? `Connected to ${connectionName}` : "Not connected"}
        </span>
      </div>
      <div className="text-[hsl(var(--muted-foreground))]">v0.1.0</div>
    </footer>
  );
}
