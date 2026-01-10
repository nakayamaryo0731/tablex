use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Connection not found: {0}")]
    ConnectionNotFound(String),

    #[error("Already connected")]
    AlreadyConnected,

    #[error("Not connected")]
    NotConnected,

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    #[error("Export error: {0}")]
    ExportError(String),

    #[error("AI error: {0}")]
    AiError(String),

    #[error("Config error: {0}")]
    ConfigError(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
