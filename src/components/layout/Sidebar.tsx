import { SchemaTree } from "../schema";
import { useQueryStore } from "../../store/queryStore";
import { ScrollArea } from "../ui/scroll-area";

interface SidebarProps {
  width?: number;
}

export function Sidebar({ width = 240 }: SidebarProps) {
  const loadTableData = useQueryStore((state) => state.loadTableData);

  const handleTableSelect = (schemaName: string, tableName: string) => {
    // Double-click opens table in CRUD mode
    loadTableData(schemaName, tableName);
  };

  return (
    <aside
      className="flex flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))]"
      style={{ width }}
    >
      <div className="border-b border-[hsl(var(--sidebar-border))] px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Schema
        </div>
      </div>
      <ScrollArea className="flex-1">
        <SchemaTree onTableSelect={handleTableSelect} />
      </ScrollArea>
    </aside>
  );
}
