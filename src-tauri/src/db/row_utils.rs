use chrono::{DateTime, NaiveDate, NaiveDateTime, NaiveTime, Utc};
use sqlx::postgres::PgRow;
use sqlx::{Column, Row};

/// Extracts a typed value from a PostgreSQL row column and converts it to JSON.
pub fn get_column_value(row: &PgRow, idx: usize, type_name: &str) -> serde_json::Value {
    match type_name {
        "INT2" | "INT4" | "INT8" => row
            .try_get::<i64, _>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
        "FLOAT4" | "FLOAT8" | "NUMERIC" => row
            .try_get::<f64, _>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
        "BOOL" => row
            .try_get::<bool, _>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
        "TEXT" | "VARCHAR" | "CHAR" | "NAME" => row
            .try_get::<String, _>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
        "TIMESTAMPTZ" => row
            .try_get::<DateTime<Utc>, _>(idx)
            .map(|dt| serde_json::Value::String(dt.to_rfc3339()))
            .unwrap_or(serde_json::Value::Null),
        "TIMESTAMP" => row
            .try_get::<NaiveDateTime, _>(idx)
            .map(|dt| serde_json::Value::String(dt.to_string()))
            .unwrap_or(serde_json::Value::Null),
        "DATE" => row
            .try_get::<NaiveDate, _>(idx)
            .map(|d| serde_json::Value::String(d.to_string()))
            .unwrap_or(serde_json::Value::Null),
        "TIME" => row
            .try_get::<NaiveTime, _>(idx)
            .map(|t| serde_json::Value::String(t.to_string()))
            .unwrap_or(serde_json::Value::Null),
        "UUID" => row
            .try_get::<uuid::Uuid, _>(idx)
            .map(|u| serde_json::Value::String(u.to_string()))
            .unwrap_or(serde_json::Value::Null),
        "JSON" | "JSONB" => row
            .try_get::<serde_json::Value, _>(idx)
            .unwrap_or(serde_json::Value::Null),
        _ => row
            .try_get::<String, _>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
    }
}

/// Converts all columns of a PostgreSQL row to a vector of JSON values.
pub fn row_to_values(row: &PgRow) -> Vec<serde_json::Value> {
    row.columns()
        .iter()
        .enumerate()
        .map(|(i, col)| {
            let type_name = col.type_info().to_string();
            get_column_value(row, i, &type_name)
        })
        .collect()
}
