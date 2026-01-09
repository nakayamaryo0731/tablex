use crate::db::{ConnectionConfig, DatabaseConnection};
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn test_connection(config: ConnectionConfig) -> Result<bool, AppError> {
    DatabaseConnection::test_connection(&config).await?;
    Ok(true)
}

#[tauri::command]
pub async fn connect(
    config: ConnectionConfig,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let mut connection = state.connection.lock().await;

    if connection.is_some() {
        return Err(AppError::AlreadyConnected);
    }

    let db = DatabaseConnection::connect(config.clone()).await?;
    let connection_id = config.id.clone();

    *connection = Some(db);

    Ok(connection_id)
}

#[tauri::command]
pub async fn disconnect(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut connection = state.connection.lock().await;

    if let Some(db) = connection.take() {
        db.pool.close().await;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_connection_status(state: State<'_, AppState>) -> Result<Option<String>, AppError> {
    let connection = state.connection.lock().await;

    Ok(connection.as_ref().map(|db| db.config.name.clone()))
}
