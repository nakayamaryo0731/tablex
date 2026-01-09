use crate::error::AppError;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaInfo {
    pub name: String,
    pub tables: Vec<TableInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub schema: String,
    pub name: String,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
    pub default_value: Option<String>,
}

#[tauri::command]
pub async fn get_schemas(state: State<'_, AppState>) -> Result<Vec<SchemaInfo>, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    // Get all schemas (excluding system schemas)
    let schema_rows = sqlx::query(
        r#"
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        ORDER BY schema_name
        "#,
    )
    .fetch_all(&db.pool)
    .await?;

    let mut schemas = Vec::new();

    for schema_row in schema_rows {
        let schema_name: String = schema_row.try_get("schema_name")?;

        // Get tables for this schema
        let table_rows = sqlx::query(
            r#"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = $1
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
            "#,
        )
        .bind(&schema_name)
        .fetch_all(&db.pool)
        .await?;

        let mut tables = Vec::new();

        for table_row in table_rows {
            let table_name: String = table_row.try_get("table_name")?;

            // Get columns for this table
            let column_rows = sqlx::query(
                r#"
                SELECT
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.column_default,
                    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
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
                "#,
            )
            .bind(&schema_name)
            .bind(&table_name)
            .fetch_all(&db.pool)
            .await?;

            let columns: Vec<ColumnInfo> = column_rows
                .iter()
                .map(|row| {
                    let is_nullable: String = row.try_get("is_nullable").unwrap_or_default();
                    ColumnInfo {
                        name: row.try_get("column_name").unwrap_or_default(),
                        data_type: row.try_get("data_type").unwrap_or_default(),
                        is_nullable: is_nullable == "YES",
                        is_primary_key: row.try_get("is_primary_key").unwrap_or(false),
                        default_value: row.try_get("column_default").ok(),
                    }
                })
                .collect();

            tables.push(TableInfo {
                schema: schema_name.clone(),
                name: table_name,
                columns,
            });
        }

        schemas.push(SchemaInfo {
            name: schema_name,
            tables,
        });
    }

    Ok(schemas)
}
