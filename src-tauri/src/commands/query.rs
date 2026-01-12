use crate::db::row_utils::row_to_values;
use crate::error::AppError;
use crate::state::AppState;
use crate::types::{ColumnMetadata, QueryResult};
use sqlx::{Column, Row};
use tauri::State;

#[tauri::command]
pub async fn execute_query(
    query: String,
    state: State<'_, AppState>,
) -> Result<QueryResult, AppError> {
    let connection = state.connection.lock().await;

    let db = connection.as_ref().ok_or(AppError::NotConnected)?;

    let start = std::time::Instant::now();

    let rows = sqlx::query(&query).fetch_all(&db.pool).await?;

    let execution_time_ms = start.elapsed().as_millis() as u64;

    let columns = if rows.is_empty() {
        Vec::new()
    } else {
        rows[0]
            .columns()
            .iter()
            .map(|col| ColumnMetadata {
                name: col.name().to_string(),
                data_type: col.type_info().to_string(),
            })
            .collect()
    };

    let row_count = rows.len();
    let rows = rows.into_iter().map(|row| row_to_values(&row)).collect();

    Ok(QueryResult {
        columns,
        rows,
        row_count,
        execution_time_ms,
    })
}
