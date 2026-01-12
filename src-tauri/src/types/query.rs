//! Query-related types

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/generated/")]
pub struct ColumnMetadata {
    pub name: String,
    pub data_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/generated/")]
pub struct QueryResult {
    pub columns: Vec<ColumnMetadata>,
    #[ts(type = "unknown[][]")]
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: usize,
    #[ts(type = "number")]
    pub execution_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/generated/")]
pub struct QueryHistoryItem {
    pub id: String,
    pub query: String,
    pub executed_at: String,
    pub row_count: Option<usize>,
    #[ts(type = "number | null")]
    pub execution_time_ms: Option<u64>,
    pub error: Option<String>,
}
