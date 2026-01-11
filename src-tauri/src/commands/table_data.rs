use crate::error::AppError;
use crate::state::AppState;
use chrono::{DateTime, NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgRow;
use sqlx::{Column, Row};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableDataRequest {
    pub schema: String,
    pub table: String,
    pub limit: usize,
    pub offset: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
    pub is_auto_generated: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableRow {
    pub id: String,
    pub values: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub columns: Vec<TableColumnInfo>,
    pub rows: Vec<TableRow>,
    pub total_count: usize,
    pub primary_keys: Vec<String>,
    pub has_primary_key: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RowUpdate {
    pub row_id: String,
    pub column: String,
    pub new_value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RowInsert {
    pub values: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RowDelete {
    pub row_id: String,
}

/// Get table data with pagination
#[tauri::command]
pub async fn get_table_data(
    request: TableDataRequest,
    state: State<'_, AppState>,
) -> Result<TableData, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    // Get column info with primary key and auto-generated info
    let columns = get_column_info(&db.pool, &request.schema, &request.table).await?;
    let primary_keys: Vec<String> = columns
        .iter()
        .filter(|c| c.is_primary_key)
        .map(|c| c.name.clone())
        .collect();
    let has_primary_key = !primary_keys.is_empty();

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) as count FROM \"{}\".\"{}\"",
        request.schema, request.table
    );
    let count_row = sqlx::query(&count_query).fetch_one(&db.pool).await?;
    let total_count: i64 = count_row.try_get("count")?;

    // Get data with pagination
    let data_query = format!(
        "SELECT * FROM \"{}\".\"{}\" LIMIT {} OFFSET {}",
        request.schema, request.table, request.limit, request.offset
    );
    let rows = sqlx::query(&data_query).fetch_all(&db.pool).await?;

    // Convert rows
    let table_rows: Vec<TableRow> = rows
        .iter()
        .map(|row| {
            let id = if has_primary_key {
                build_row_id(row, &primary_keys)
            } else {
                String::new()
            };
            let values = row_to_values(row);
            TableRow { id, values }
        })
        .collect();

    Ok(TableData {
        columns,
        rows: table_rows,
        total_count: total_count as usize,
        primary_keys,
        has_primary_key,
    })
}

/// Get row count for a table
#[tauri::command]
pub async fn get_table_row_count(
    schema: String,
    table: String,
    state: State<'_, AppState>,
) -> Result<usize, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    let count_query = format!("SELECT COUNT(*) as count FROM \"{}\".\"{}\"", schema, table);
    let count_row = sqlx::query(&count_query).fetch_one(&db.pool).await?;
    let count: i64 = count_row.try_get("count")?;

    Ok(count as usize)
}

/// Insert rows into table
#[tauri::command]
pub async fn insert_rows(
    schema: String,
    table: String,
    rows: Vec<RowInsert>,
    state: State<'_, AppState>,
) -> Result<usize, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    let mut inserted = 0;

    for row in rows {
        if row.values.is_empty() {
            continue;
        }

        let columns: Vec<&String> = row.values.keys().collect();
        let column_names = columns
            .iter()
            .map(|c| format!("\"{}\"", c))
            .collect::<Vec<_>>()
            .join(", ");
        let placeholders = (1..=columns.len())
            .map(|i| format!("${}", i))
            .collect::<Vec<_>>()
            .join(", ");

        let query = format!(
            "INSERT INTO \"{}\".\"{}\" ({}) VALUES ({})",
            schema, table, column_names, placeholders
        );

        let mut q = sqlx::query(&query);
        for col in &columns {
            let value = &row.values[*col];
            q = bind_json_value(q, value);
        }

        q.execute(&db.pool).await?;
        inserted += 1;
    }

    Ok(inserted)
}

/// Update rows in table
#[tauri::command]
pub async fn update_rows(
    schema: String,
    table: String,
    updates: Vec<RowUpdate>,
    state: State<'_, AppState>,
) -> Result<usize, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    // Get primary keys for the table
    let columns = get_column_info(&db.pool, &schema, &table).await?;
    let primary_keys: Vec<String> = columns
        .iter()
        .filter(|c| c.is_primary_key)
        .map(|c| c.name.clone())
        .collect();

    if primary_keys.is_empty() {
        return Err(AppError::InvalidConfig(
            "Cannot update table without primary key".to_string(),
        ));
    }

    let mut updated = 0;

    for update in updates {
        let pk_values: HashMap<String, serde_json::Value> =
            serde_json::from_str(&update.row_id).unwrap_or_default();

        if pk_values.is_empty() {
            continue;
        }

        // Build WHERE clause for primary key
        let where_parts: Vec<String> = primary_keys
            .iter()
            .enumerate()
            .map(|(i, pk)| format!("\"{}\" = ${}", pk, i + 2))
            .collect();
        let where_clause = where_parts.join(" AND ");

        let query = format!(
            "UPDATE \"{}\".\"{}\" SET \"{}\" = $1 WHERE {}",
            schema, table, update.column, where_clause
        );

        let mut q = sqlx::query(&query);
        q = bind_json_value(q, &update.new_value);

        for pk in &primary_keys {
            if let Some(pk_val) = pk_values.get(pk) {
                q = bind_json_value(q, pk_val);
            }
        }

        let result = q.execute(&db.pool).await?;
        updated += result.rows_affected() as usize;
    }

    Ok(updated)
}

/// Delete rows from table
#[tauri::command]
pub async fn delete_rows(
    schema: String,
    table: String,
    deletes: Vec<RowDelete>,
    state: State<'_, AppState>,
) -> Result<usize, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    // Get primary keys for the table
    let columns = get_column_info(&db.pool, &schema, &table).await?;
    let primary_keys: Vec<String> = columns
        .iter()
        .filter(|c| c.is_primary_key)
        .map(|c| c.name.clone())
        .collect();

    if primary_keys.is_empty() {
        return Err(AppError::InvalidConfig(
            "Cannot delete from table without primary key".to_string(),
        ));
    }

    let mut deleted = 0;

    for delete in deletes {
        let pk_values: HashMap<String, serde_json::Value> =
            serde_json::from_str(&delete.row_id).unwrap_or_default();

        if pk_values.is_empty() {
            continue;
        }

        // Build WHERE clause for primary key
        let where_parts: Vec<String> = primary_keys
            .iter()
            .enumerate()
            .map(|(i, pk)| format!("\"{}\" = ${}", pk, i + 1))
            .collect();
        let where_clause = where_parts.join(" AND ");

        let query = format!(
            "DELETE FROM \"{}\".\"{}\" WHERE {}",
            schema, table, where_clause
        );

        let mut q = sqlx::query(&query);

        for pk in &primary_keys {
            if let Some(pk_val) = pk_values.get(pk) {
                q = bind_json_value(q, pk_val);
            }
        }

        let result = q.execute(&db.pool).await?;
        deleted += result.rows_affected() as usize;
    }

    Ok(deleted)
}

// Helper functions

async fn get_column_info(
    pool: &sqlx::PgPool,
    schema: &str,
    table: &str,
) -> Result<Vec<TableColumnInfo>, AppError> {
    let query = r#"
        SELECT
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
            CASE
                WHEN c.column_default LIKE 'nextval%' THEN true
                WHEN c.is_generated = 'ALWAYS' THEN true
                WHEN c.identity_generation IS NOT NULL THEN true
                ELSE false
            END as is_auto_generated
        FROM information_schema.columns c
        LEFT JOIN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = $1
                AND tc.table_name = $2
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_schema = $1
          AND c.table_name = $2
        ORDER BY c.ordinal_position
    "#;

    let rows = sqlx::query(query)
        .bind(schema)
        .bind(table)
        .fetch_all(pool)
        .await?;

    let columns = rows
        .iter()
        .map(|row| {
            let is_nullable: String = row.try_get("is_nullable").unwrap_or_default();
            TableColumnInfo {
                name: row.try_get("column_name").unwrap_or_default(),
                data_type: row.try_get("data_type").unwrap_or_default(),
                is_nullable: is_nullable == "YES",
                is_primary_key: row.try_get("is_primary_key").unwrap_or(false),
                is_auto_generated: row.try_get("is_auto_generated").unwrap_or(false),
                default_value: row.try_get("column_default").ok(),
            }
        })
        .collect();

    Ok(columns)
}

fn build_row_id(row: &PgRow, primary_keys: &[String]) -> String {
    let mut pk_map: HashMap<String, serde_json::Value> = HashMap::new();

    for pk in primary_keys {
        // Find column index by name
        if let Some(col_idx) = row.columns().iter().position(|c| c.name() == pk) {
            let col = &row.columns()[col_idx];
            let type_name = col.type_info().to_string();
            let value = get_column_value(row, col_idx, &type_name);
            pk_map.insert(pk.clone(), value);
        }
    }

    serde_json::to_string(&pk_map).unwrap_or_default()
}

fn get_column_value(row: &PgRow, idx: usize, type_name: &str) -> serde_json::Value {
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

fn row_to_values(row: &PgRow) -> Vec<serde_json::Value> {
    row.columns()
        .iter()
        .enumerate()
        .map(|(i, col)| {
            let type_name = col.type_info().to_string();
            get_column_value(row, i, &type_name)
        })
        .collect()
}

fn bind_json_value<'q>(
    query: sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments>,
    value: &'q serde_json::Value,
) -> sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments> {
    match value {
        serde_json::Value::Null => query.bind(None::<String>),
        serde_json::Value::Bool(b) => query.bind(*b),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                query.bind(i)
            } else if let Some(f) = n.as_f64() {
                query.bind(f)
            } else {
                query.bind(n.to_string())
            }
        }
        serde_json::Value::String(s) => {
            // Handle NULL string
            if s.eq_ignore_ascii_case("null") {
                query.bind(None::<String>)
            } else if s.starts_with('\'') && s.ends_with('\'') && s.len() > 2 {
                // Handle quoted strings (for literal 'NULL')
                query.bind(s[1..s.len() - 1].to_string())
            } else {
                query.bind(s.clone())
            }
        }
        serde_json::Value::Array(_) | serde_json::Value::Object(_) => query.bind(value.to_string()),
    }
}
