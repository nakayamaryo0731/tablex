use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub ai_provider: Option<String>,
    pub claude_api_key: Option<String>,
    pub ollama_base_url: Option<String>,
    pub ollama_model: Option<String>,
}

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::ConfigError(e.to_string()))?;

    // Create directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::ConfigError(format!("Failed to create app data dir: {}", e)))?;
    }

    Ok(app_data_dir.join("settings.json"))
}

#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), AppError> {
    let path = get_settings_path(&app)?;
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| AppError::ConfigError(format!("Failed to serialize settings: {}", e)))?;

    fs::write(&path, json)
        .map_err(|e| AppError::ConfigError(format!("Failed to write settings: {}", e)))?;

    Ok(())
}

#[tauri::command]
pub async fn load_settings(app: AppHandle) -> Result<AppSettings, AppError> {
    let path = get_settings_path(&app)?;

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let json = fs::read_to_string(&path)
        .map_err(|e| AppError::ConfigError(format!("Failed to read settings: {}", e)))?;

    let settings: AppSettings = serde_json::from_str(&json)
        .map_err(|e| AppError::ConfigError(format!("Failed to parse settings: {}", e)))?;

    Ok(settings)
}
