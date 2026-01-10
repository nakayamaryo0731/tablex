import { useState } from "react";
import { SchemaTree, TableDetailPanel } from "../schema";

interface SidebarProps {
  width?: number;
}

export function Sidebar({ width = 240 }: SidebarProps) {
  const [selectedTable, setSelectedTable] = useState<{
    schema: string;
    table: string;
  } | null>(null);

  const handleTableSelect = (schemaName: string, tableName: string) => {
    setSelectedTable({ schema: schemaName, table: tableName });
  };

  const handleCloseDetail = () => {
    setSelectedTable(null);
  };

  return (
    <aside
      className="flex flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
      style={{ width }}
    >
      {selectedTable ? (
        <TableDetailPanel
          schemaName={selectedTable.schema}
          tableName={selectedTable.table}
          onClose={handleCloseDetail}
        />
      ) : (
        <>
          <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Schema
            </div>
          </div>
          <SchemaTree onTableSelect={handleTableSelect} />
        </>
      )}
    </aside>
  );
}
