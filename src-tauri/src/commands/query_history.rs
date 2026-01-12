use crate::error::AppError;
use crate::types::QueryHistoryItem;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn get_history_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::ConfigError(e.to_string()))?;

    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::ConfigError(format!("Failed to create app data dir: {}", e)))?;
    }

    Ok(app_data_dir.join("query_history.json"))
}

#[tauri::command]
pub async fn save_query_history(
    app: AppHandle,
    history: Vec<QueryHistoryItem>,
) -> Result<(), AppError> {
    let path = get_history_path(&app)?;
    let json = serde_json::to_string_pretty(&history)
        .map_err(|e| AppError::ConfigError(format!("Failed to serialize history: {}", e)))?;

    fs::write(&path, json)
        .map_err(|e| AppError::ConfigError(format!("Failed to write history: {}", e)))?;

    Ok(())
}

#[tauri::command]
pub async fn load_query_history(app: AppHandle) -> Result<Vec<QueryHistoryItem>, AppError> {
    let path = get_history_path(&app)?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let json = fs::read_to_string(&path)
        .map_err(|e| AppError::ConfigError(format!("Failed to read history: {}", e)))?;

    let history: Vec<QueryHistoryItem> = serde_json::from_str(&json)
        .map_err(|e| AppError::ConfigError(format!("Failed to parse history: {}", e)))?;

    Ok(history)
}
