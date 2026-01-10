import { useState, useEffect } from "react";
import { useSchemaStore } from "../../store/schemaStore";
import { useConnectionStore } from "../../store/connectionStore";
import type { SchemaInfo, TableInfo, ColumnInfo } from "../../types/schema";

interface SchemaTreeProps {
  onTableSelect?: (schemaName: string, tableName: string) => void;
}

export function SchemaTree({ onTableSelect }: SchemaTreeProps) {
  const { schemas, isLoading, error, fetchSchemas, clearSchemas } =
    useSchemaStore();
  const { isConnected } = useConnectionStore();

  useEffect(() => {
    if (isConnected) {
      fetchSchemas();
    } else {
      clearSchemas();
    }
  }, [isConnected, fetchSchemas, clearSchemas]);

  if (!isConnected) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Connect to a database to view schema
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading schemas...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  if (schemas.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No schemas found</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-2">
      {schemas.map((schema) => (
        <SchemaNode
          key={schema.name}
          schema={schema}
          onTableSelect={onTableSelect}
        />
      ))}
    </div>
  );
}

interface SchemaNodeProps {
  schema: SchemaInfo;
  onTableSelect?: (schemaName: string, tableName: string) => void;
}

function SchemaNode({ schema, onTableSelect }: SchemaNodeProps) {
  const [isExpanded, setIsExpanded] = useState(schema.name === "public");

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronIcon expanded={isExpanded} />
        <FolderIcon />
        <span className="font-medium">{schema.name}</span>
        <span className="ml-auto text-xs text-gray-400">
          {schema.tables.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-4">
          {schema.tables.map((table) => (
            <TableNode
              key={`${schema.name}.${table.name}`}
              table={table}
              onTableSelect={onTableSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TableNodeProps {
  table: TableInfo;
  onTableSelect?: (schemaName: string, tableName: string) => void;
}

function TableNode({ table, onTableSelect }: TableNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDoubleClick = () => {
    onTableSelect?.(table.schema, table.name);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Double-click to view details"
      >
        <ChevronIcon expanded={isExpanded} />
        <TableIcon />
        <span>{table.name}</span>
        <span className="ml-auto text-xs text-gray-400">
          {table.columns.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-4">
          {table.columns.map((column) => (
            <ColumnNode
              key={`${table.schema}.${table.name}.${column.name}`}
              column={column}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnNode({ column }: { column: ColumnInfo }) {
  return (
    <div className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 dark:text-gray-400">
      {column.is_primary_key ? <KeyIcon /> : <ColumnIcon />}
      <span className={column.is_primary_key ? "font-medium" : ""}>
        {column.name}
      </span>
      <span className="ml-auto text-xs text-gray-400">{column.data_type}</span>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      className="h-4 w-4 text-yellow-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg
      className="h-4 w-4 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ColumnIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h7"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      className="h-4 w-4 text-yellow-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}
