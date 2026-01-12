import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTheme } from "../../hooks/useTheme";
import type { ColumnInfo } from "../../types/schema";

export interface TableNodeData {
  label: string;
  columns: ColumnInfo[];
  isFocused?: boolean;
  onFocus?: (tableName: string) => void;
  [key: string]: unknown;
}

interface TableNodeProps {
  data: TableNodeData;
}

export const TableNode = memo(function TableNode({ data }: TableNodeProps) {
  const { label, columns, isFocused, onFocus } = data;
  const { isDark } = useTheme();

  const handleClick = () => {
    if (onFocus) {
      onFocus(label);
    }
  };

  const handleColor = isDark ? "#60a5fa" : "#3b82f6";

  return (
    <div
      onClick={handleClick}
      className={`min-w-[180px] cursor-pointer rounded-[var(--radius)] border-2 bg-[hsl(var(--background))] shadow-md transition-all ${
        isFocused
          ? "border-[hsl(var(--warning))] ring-2 ring-[hsl(var(--warning))]/50"
          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
      }`}
    >
      <div
        className={`rounded-t-[calc(var(--radius)-2px)] px-3 py-2 text-sm font-semibold text-white ${
          isFocused ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--primary))]"
        }`}
      >
        {label}
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">
        {columns.map((column) => (
          <div
            key={column.name}
            className="relative flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${column.name}-target`}
              style={{ top: "50%", background: handleColor }}
            />
            {column.is_primary_key ? (
              <KeyIcon className="h-3 w-3 text-[hsl(var(--tree-icon-key))]" />
            ) : (
              <ColumnIcon className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
            )}
            <span
              className={
                column.is_primary_key
                  ? "font-medium text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--foreground))]"
              }
            >
              {column.name}
            </span>
            <span className="ml-auto text-[hsl(var(--muted-foreground))]">
              {column.data_type}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={`${column.name}-source`}
              style={{ top: "50%", background: handleColor }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

function ColumnIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
