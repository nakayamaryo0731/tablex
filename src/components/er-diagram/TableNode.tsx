import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { ColumnInfo } from "../../types/schema";

export interface TableNodeData {
  label: string;
  columns: ColumnInfo[];
  [key: string]: unknown;
}

interface TableNodeProps {
  data: TableNodeData;
}

export const TableNode = memo(function TableNode({ data }: TableNodeProps) {
  const { label, columns } = data;

  return (
    <div className="min-w-[180px] rounded border border-gray-300 bg-white shadow-md dark:border-gray-600 dark:bg-gray-800">
      <div className="rounded-t bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
        {label}
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {columns.map((column) => (
          <div
            key={column.name}
            className="relative flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${column.name}-target`}
              style={{ top: "50%", background: "#6366f1" }}
            />
            {column.is_primary_key ? (
              <KeyIcon className="h-3 w-3 text-yellow-600" />
            ) : (
              <ColumnIcon className="h-3 w-3 text-gray-400" />
            )}
            <span
              className={
                column.is_primary_key
                  ? "font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }
            >
              {column.name}
            </span>
            <span className="ml-auto text-gray-400">{column.data_type}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`${column.name}-source`}
              style={{ top: "50%", background: "#6366f1" }}
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
