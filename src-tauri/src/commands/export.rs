use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportData {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
}

#[tauri::command]
pub async fn export_csv(data: ExportData, file_path: String) -> Result<(), AppError> {
    let mut file = File::create(&file_path).map_err(|e| AppError::ExportError(e.to_string()))?;

    // Write header
    let header = data.columns.join(",");
    writeln!(file, "{}", header).map_err(|e| AppError::ExportError(e.to_string()))?;

    // Write rows
    for row in data.rows {
        let line: Vec<String> = row
            .iter()
            .map(|value| {
                match value {
                    serde_json::Value::Null => String::new(),
                    serde_json::Value::String(s) => {
                        // Escape quotes and wrap in quotes if contains comma or quote
                        if s.contains(',') || s.contains('"') || s.contains('\n') {
                            format!("\"{}\"", s.replace('"', "\"\""))
                        } else {
                            s.clone()
                        }
                    }
                    _ => value.to_string(),
                }
            })
            .collect();
        writeln!(file, "{}", line.join(",")).map_err(|e| AppError::ExportError(e.to_string()))?;
    }

    Ok(())
}
