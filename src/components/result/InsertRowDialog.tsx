import { useState, useEffect } from "react";
import type { TableColumnInfo } from "../../types/query";

interface InsertRowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columns: TableColumnInfo[];
  onInsert: (values: Record<string, unknown>) => void;
}

export function InsertRowDialog({
  isOpen,
  onClose,
  columns,
  onInsert,
}: InsertRowDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset values when dialog opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      columns.forEach((col) => {
        if (!col.is_auto_generated) {
          initial[col.name] = col.default_value ? "" : "";
        }
      });
      setValues(initial);
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedValues: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.is_auto_generated) continue;

      const strValue = values[col.name] || "";

      // Handle NULL
      if (strValue.toLowerCase() === "null") {
        parsedValues[col.name] = null;
        continue;
      }

      // Handle empty - use default if available
      if (strValue === "") {
        if (col.default_value) {
          continue; // Let database use default
        }
        if (col.is_nullable) {
          parsedValues[col.name] = null;
          continue;
        }
      }

      // Parse based on type
      const lowerType = col.data_type.toLowerCase();
      if (lowerType === "boolean") {
        parsedValues[col.name] = strValue === "true";
      } else if (
        lowerType.includes("int") ||
        lowerType === "smallint" ||
        lowerType === "bigint"
      ) {
        const num = parseInt(strValue, 10);
        parsedValues[col.name] = isNaN(num) ? strValue : num;
      } else if (
        lowerType.includes("float") ||
        lowerType.includes("double") ||
        lowerType === "numeric" ||
        lowerType === "decimal" ||
        lowerType === "real"
      ) {
        const num = parseFloat(strValue);
        parsedValues[col.name] = isNaN(num) ? strValue : num;
      } else {
        parsedValues[col.name] = strValue;
      }
    }

    onInsert(parsedValues);
  };

  const editableColumns = columns.filter((col) => !col.is_auto_generated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-[500px] overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Add New Row</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto p-4">
            <div className="space-y-4">
              {editableColumns.map((col) => (
                <div key={col.name}>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {col.name}
                    <span className="ml-2 text-xs text-gray-400">
                      {col.data_type}
                      {!col.is_nullable && !col.default_value && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                      {col.default_value && (
                        <span className="ml-1">
                          (default: {col.default_value})
                        </span>
                      )}
                    </span>
                  </label>
                  {renderInput(col, values[col.name] || "", (val) =>
                    setValues((prev) => ({ ...prev, [col.name]: val }))
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Row
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function renderInput(
  column: TableColumnInfo,
  value: string,
  onChange: (val: string) => void
) {
  const dataType = column.data_type.toLowerCase();

  // Boolean
  if (dataType === "boolean") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
      >
        <option value="">-- Select --</option>
        <option value="true">true</option>
        <option value="false">false</option>
        <option value="null">NULL</option>
      </select>
    );
  }

  // Date
  if (dataType === "date") {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
      />
    );
  }

  // Timestamp
  if (dataType.includes("timestamp")) {
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
      />
    );
  }

  // Time
  if (dataType === "time") {
    return (
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
      />
    );
  }

  // Text (multiline)
  if (dataType === "text") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        placeholder={column.is_nullable ? "NULL for null" : ""}
      />
    );
  }

  // Number types
  if (
    dataType.includes("int") ||
    dataType.includes("float") ||
    dataType.includes("double") ||
    dataType === "numeric" ||
    dataType === "decimal" ||
    dataType === "real"
  ) {
    return (
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        placeholder={column.is_nullable ? "NULL for null" : ""}
      />
    );
  }

  // Default text input
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
      placeholder={column.is_nullable ? "NULL for null" : ""}
    />
  );
}
