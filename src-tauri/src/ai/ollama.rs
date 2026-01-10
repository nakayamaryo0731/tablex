//! Ollama client for SQL generation

use crate::error::AppError;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

pub async fn generate_sql_ollama(
    base_url: &str,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, AppError> {
    let client = Client::new();

    let full_prompt = format!("{}\n\nUser request: {}", system_prompt, user_prompt);

    let request = OllamaRequest {
        model: model.to_string(),
        prompt: full_prompt,
        stream: false,
    };

    let url = format!("{}/api/generate", base_url.trim_end_matches('/'));

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| AppError::AiError(format!("Ollama connection error: {}", e)))?;

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(AppError::AiError(format!(
            "Ollama API error: {}",
            error_text
        )));
    }

    let ollama_response: OllamaResponse = response
        .json()
        .await
        .map_err(|e| AppError::AiError(e.to_string()))?;

    // Clean up the response - remove markdown code blocks if present
    let sql = ollama_response
        .response
        .trim()
        .trim_start_matches("```sql")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim()
        .to_string();

    Ok(sql)
}
