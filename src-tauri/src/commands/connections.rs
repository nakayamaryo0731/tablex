use crate::error::AppError;
use crate::types::{SaveConnectionInput, SavedConnection};
use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const KEYRING_SERVICE: &str = "dbpilot";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct ConnectionsFile {
    connections: Vec<SavedConnection>,
}

fn get_connections_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::ConfigError(e.to_string()))?;

    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::ConfigError(format!("Failed to create app data dir: {}", e)))?;
    }

    Ok(app_data_dir.join("connections.json"))
}

fn load_connections_file(app: &AppHandle) -> Result<ConnectionsFile, AppError> {
    let path = get_connections_path(app)?;

    if !path.exists() {
        return Ok(ConnectionsFile::default());
    }

    let json = fs::read_to_string(&path)
        .map_err(|e| AppError::ConfigError(format!("Failed to read connections: {}", e)))?;

    serde_json::from_str(&json)
        .map_err(|e| AppError::ConfigError(format!("Failed to parse connections: {}", e)))
}

fn save_connections_file(app: &AppHandle, file: &ConnectionsFile) -> Result<(), AppError> {
    let path = get_connections_path(app)?;
    let json = serde_json::to_string_pretty(file)
        .map_err(|e| AppError::ConfigError(format!("Failed to serialize connections: {}", e)))?;

    fs::write(&path, json)
        .map_err(|e| AppError::ConfigError(format!("Failed to write connections: {}", e)))?;

    Ok(())
}

fn keyring_account(id: &str) -> String {
    format!("connection-{}", id)
}

fn save_password_to_keyring(id: &str, password: &str) -> Result<(), AppError> {
    let entry = Entry::new(KEYRING_SERVICE, &keyring_account(id))
        .map_err(|e| AppError::ConfigError(format!("Failed to create keyring entry: {}", e)))?;

    entry
        .set_password(password)
        .map_err(|e| AppError::ConfigError(format!("Failed to save password: {}", e)))?;

    Ok(())
}

fn get_password_from_keyring(id: &str) -> Result<Option<String>, AppError> {
    let entry = Entry::new(KEYRING_SERVICE, &keyring_account(id))
        .map_err(|e| AppError::ConfigError(format!("Failed to create keyring entry: {}", e)))?;

    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::ConfigError(format!(
            "Failed to get password: {}",
            e
        ))),
    }
}

fn delete_password_from_keyring(id: &str) -> Result<(), AppError> {
    let entry = Entry::new(KEYRING_SERVICE, &keyring_account(id))
        .map_err(|e| AppError::ConfigError(format!("Failed to create keyring entry: {}", e)))?;

    // Ignore error if password doesn't exist
    let _ = entry.delete_credential();

    Ok(())
}

#[tauri::command]
pub async fn save_connection(app: AppHandle, input: SaveConnectionInput) -> Result<(), AppError> {
    // Save password to keyring
    save_password_to_keyring(&input.id, &input.password)?;

    // Load existing connections
    let mut file = load_connections_file(&app)?;

    // If this connection should be default, unset others
    if input.is_default {
        for conn in &mut file.connections {
            conn.is_default = false;
        }
    }

    // Create saved connection (without password)
    let saved = SavedConnection {
        id: input.id.clone(),
        name: input.name,
        host: input.host,
        port: input.port,
        database: input.database,
        username: input.username,
        ssl_mode: input.ssl_mode,
        is_default: input.is_default,
    };

    // Update or add connection
    if let Some(existing) = file.connections.iter_mut().find(|c| c.id == input.id) {
        *existing = saved;
    } else {
        file.connections.push(saved);
    }

    save_connections_file(&app, &file)?;

    Ok(())
}

#[tauri::command]
pub async fn load_connections(app: AppHandle) -> Result<Vec<SavedConnection>, AppError> {
    let file = load_connections_file(&app)?;
    Ok(file.connections)
}

#[tauri::command]
pub async fn delete_connection(app: AppHandle, id: String) -> Result<(), AppError> {
    // Delete password from keyring
    delete_password_from_keyring(&id)?;

    // Remove from connections file
    let mut file = load_connections_file(&app)?;
    file.connections.retain(|c| c.id != id);
    save_connections_file(&app, &file)?;

    Ok(())
}

#[tauri::command]
pub async fn set_default_connection(app: AppHandle, id: String) -> Result<(), AppError> {
    let mut file = load_connections_file(&app)?;

    // Unset all defaults, then set the specified one
    for conn in &mut file.connections {
        conn.is_default = conn.id == id;
    }

    save_connections_file(&app, &file)?;

    Ok(())
}

#[tauri::command]
pub async fn get_connection_password(id: String) -> Result<Option<String>, AppError> {
    get_password_from_keyring(&id)
}

#[tauri::command]
pub async fn get_default_connection(app: AppHandle) -> Result<Option<SavedConnection>, AppError> {
    let file = load_connections_file(&app)?;
    Ok(file.connections.into_iter().find(|c| c.is_default))
}
