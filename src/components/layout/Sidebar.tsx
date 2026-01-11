import { SchemaTree } from "../schema";
import { useQueryStore } from "../../store/queryStore";

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
      className="flex flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
      style={{ width }}
    >
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Schema
        </div>
      </div>
      <SchemaTree onTableSelect={handleTableSelect} />
    </aside>
  );
}
