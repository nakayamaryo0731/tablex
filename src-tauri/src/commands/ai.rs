use crate::ai::{build_system_prompt, generate_sql_claude, generate_sql_ollama, AiProvider};
use crate::error::AppError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateSqlRequest {
    pub prompt: String,
    pub schema_context: String,
    pub provider: AiProvider,
    pub api_key: Option<String>,
    pub ollama_base_url: Option<String>,
    pub ollama_model: Option<String>,
}

#[tauri::command]
pub async fn generate_sql(request: GenerateSqlRequest) -> Result<String, AppError> {
    let system_prompt = build_system_prompt(&request.schema_context);

    match request.provider {
        AiProvider::Claude => {
            let api_key = request
                .api_key
                .ok_or_else(|| AppError::AiError("Claude API key not configured".to_string()))?;
            generate_sql_claude(&api_key, &system_prompt, &request.prompt).await
        }
        AiProvider::Ollama => {
            let base_url = request
                .ollama_base_url
                .unwrap_or_else(|| "http://localhost:11434".to_string());
            let model = request.ollama_model.unwrap_or_else(|| "llama3".to_string());
            generate_sql_ollama(&base_url, &model, &system_prompt, &request.prompt).await
        }
    }
}
