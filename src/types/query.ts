export interface ColumnMetadata {
  name: string;
  data_type: string;
}

export interface QueryResult {
  columns: ColumnMetadata[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
}

// CRUD related types
export interface TableColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_auto_generated: boolean;
  default_value: string | null;
}

export interface TableRow {
  id: string;
  values: unknown[];
}

export interface TableData {
  columns: TableColumnInfo[];
  rows: TableRow[];
  total_count: number;
  primary_keys: string[];
  has_primary_key: boolean;
}

export interface TableDataRequest {
  schema: string;
  table: string;
  limit: number;
  offset: number;
}

export interface RowUpdate {
  row_id: string;
  column: string;
  new_value: unknown;
}

export interface RowInsert {
  values: Record<string, unknown>;
}

export interface RowDelete {
  row_id: string;
}

export interface PendingChange {
  type: "update" | "insert" | "delete";
  rowId: string;
  column?: string;
  originalValue?: unknown;
  newValue?: unknown;
  insertData?: Record<string, unknown>;
}
