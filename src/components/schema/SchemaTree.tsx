import { useState, useEffect } from "react";
import { ChevronRight, Folder, Table2, Columns3, Key } from "lucide-react";
import { useSchemaStore } from "../../store/schemaStore";
import { useConnectionStore } from "../../store/connectionStore";
import { cn } from "../../lib/utils";
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
      <div className="p-4 text-[13px] text-[hsl(var(--muted-foreground))]">
        Connect to a database to view schema
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-[13px] text-[hsl(var(--muted-foreground))]">
        Loading schemas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-[13px] text-[hsl(var(--destructive))]">
        {error}
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="p-4 text-[13px] text-[hsl(var(--muted-foreground))]">
        No schemas found
      </div>
    );
  }

  return (
    <div className="p-2">
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
        className="flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-left text-[13px] hover:bg-[hsl(var(--accent))] transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <Folder className="h-4 w-4 text-[hsl(var(--tree-icon-schema))]" />
        <span className="font-medium">{schema.name}</span>
        <span className="ml-auto text-[11px] text-[hsl(var(--muted-foreground))]">
          {schema.tables.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-2">
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
  const { focusedTable, setFocusedTable } = useSchemaStore();

  const isFocused =
    focusedTable?.schema === table.schema && focusedTable?.table === table.name;

  const handleClick = () => {
    setFocusedTable(table.schema, table.name);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        className={cn(
          "flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-left text-[13px] transition-colors",
          isFocused
            ? "bg-[hsl(var(--table-row-selected))] ring-1 ring-[hsl(var(--primary))]/30"
            : "hover:bg-[hsl(var(--accent))]"
        )}
        title="Click to focus in ER diagram"
      >
        <span onClick={handleExpandClick} className="cursor-pointer">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        </span>
        <Table2 className="h-4 w-4 text-[hsl(var(--tree-icon-table))]" />
        <span>{table.name}</span>
        <span className="ml-auto text-[11px] text-[hsl(var(--muted-foreground))]">
          {table.columns.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-2">
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
    <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
      {column.is_primary_key ? (
        <Key className="h-3.5 w-3.5 text-[hsl(var(--tree-icon-key))]" />
      ) : (
        <Columns3 className="h-3.5 w-3.5 text-[hsl(var(--tree-icon-column))]" />
      )}
      <span
        className={cn(
          "font-[var(--font-mono)]",
          column.is_primary_key && "font-medium"
        )}
      >
        {column.name}
      </span>
      <span className="ml-auto text-[10px] font-[var(--font-mono)] opacity-60">
        {column.data_type}
      </span>
    </div>
  );
}
