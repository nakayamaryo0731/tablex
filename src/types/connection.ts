export type SslMode = "disable" | "prefer" | "require";

export interface ConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode: SslMode;
}

export interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl_mode: SslMode;
  is_default: boolean;
}

export interface SaveConnectionInput {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode: SslMode;
  is_default: boolean;
}
