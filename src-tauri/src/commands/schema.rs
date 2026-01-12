use crate::db::queries;
use crate::error::AppError;
use crate::state::AppState;
use crate::types::{
    ColumnInfo, ConstraintInfo, ForeignKeyInfo, IndexInfo, SchemaInfo, TableDetailInfo, TableInfo,
};
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn get_schemas(state: State<'_, AppState>) -> Result<Vec<SchemaInfo>, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    let schema_rows = sqlx::query(queries::GET_SCHEMAS)
        .fetch_all(&db.pool)
        .await?;

    let mut schemas = Vec::new();

    for schema_row in schema_rows {
        let schema_name: String = schema_row.try_get("schema_name")?;

        let table_rows = sqlx::query(queries::GET_TABLES)
            .bind(&schema_name)
            .fetch_all(&db.pool)
            .await?;

        let mut tables = Vec::new();

        for table_row in table_rows {
            let table_name: String = table_row.try_get("table_name")?;

            let column_rows = sqlx::query(queries::GET_COLUMNS)
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

#[tauri::command]
pub async fn get_foreign_keys(
    schema_name: String,
    state: State<'_, AppState>,
) -> Result<Vec<ForeignKeyInfo>, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    let rows = sqlx::query(queries::GET_FOREIGN_KEYS)
        .bind(&schema_name)
        .fetch_all(&db.pool)
        .await?;

    let foreign_keys: Vec<ForeignKeyInfo> = rows
        .iter()
        .map(|row| ForeignKeyInfo {
            constraint_name: row.try_get("constraint_name").unwrap_or_default(),
            source_schema: row.try_get("source_schema").unwrap_or_default(),
            source_table: row.try_get("source_table").unwrap_or_default(),
            source_column: row.try_get("source_column").unwrap_or_default(),
            target_schema: row.try_get("target_schema").unwrap_or_default(),
            target_table: row.try_get("target_table").unwrap_or_default(),
            target_column: row.try_get("target_column").unwrap_or_default(),
        })
        .collect();

    Ok(foreign_keys)
}

#[tauri::command]
pub async fn get_table_detail(
    schema_name: String,
    table_name: String,
    state: State<'_, AppState>,
) -> Result<TableDetailInfo, AppError> {
    let connection = state.connection.lock().await;
    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    // Get columns
    let column_rows = sqlx::query(queries::GET_COLUMNS)
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

    // Get indexes
    let index_rows = sqlx::query(queries::GET_INDEXES)
        .bind(&schema_name)
        .bind(&table_name)
        .fetch_all(&db.pool)
        .await?;

    let indexes: Vec<IndexInfo> = index_rows
        .iter()
        .map(|row| IndexInfo {
            name: row.try_get("index_name").unwrap_or_default(),
            columns: row.try_get::<Vec<String>, _>("columns").unwrap_or_default(),
            is_unique: row.try_get("is_unique").unwrap_or(false),
            is_primary: row.try_get("is_primary").unwrap_or(false),
        })
        .collect();

    // Get constraints
    let constraint_rows = sqlx::query(queries::GET_CONSTRAINTS)
        .bind(&schema_name)
        .bind(&table_name)
        .fetch_all(&db.pool)
        .await?;

    let constraints: Vec<ConstraintInfo> = constraint_rows
        .iter()
        .map(|row| ConstraintInfo {
            name: row.try_get("constraint_name").unwrap_or_default(),
            constraint_type: row.try_get("constraint_type").unwrap_or_default(),
            columns: row
                .try_get::<Vec<Option<String>>, _>("columns")
                .unwrap_or_default()
                .into_iter()
                .flatten()
                .collect(),
            definition: row.try_get("definition").ok(),
        })
        .collect();

    // Get foreign keys
    let fk_rows = sqlx::query(queries::GET_FOREIGN_KEYS_FOR_TABLE)
        .bind(&schema_name)
        .bind(&table_name)
        .fetch_all(&db.pool)
        .await?;

    let foreign_keys: Vec<ForeignKeyInfo> = fk_rows
        .iter()
        .map(|row| ForeignKeyInfo {
            constraint_name: row.try_get("constraint_name").unwrap_or_default(),
            source_schema: row.try_get("source_schema").unwrap_or_default(),
            source_table: row.try_get("source_table").unwrap_or_default(),
            source_column: row.try_get("source_column").unwrap_or_default(),
            target_schema: row.try_get("target_schema").unwrap_or_default(),
            target_table: row.try_get("target_table").unwrap_or_default(),
            target_column: row.try_get("target_column").unwrap_or_default(),
        })
        .collect();

    Ok(TableDetailInfo {
        schema: schema_name,
        name: table_name,
        columns,
        indexes,
        constraints,
        foreign_keys,
    })
}
