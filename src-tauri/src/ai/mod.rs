//! AI module for SQL generation

mod claude;
mod ollama;

pub use claude::generate_sql_claude;
pub use ollama::generate_sql_ollama;

pub fn build_system_prompt(schema_context: &str) -> String {
    format!(
        r#"You are a PostgreSQL expert. Generate SQL queries based on user requests.

Rules:
- Only output the SQL query, no explanations
- Use proper PostgreSQL syntax
- Use the exact table and column names from the schema
- For SELECT queries, be specific about columns when possible
- Always use proper JOIN syntax when relating tables

Database Schema:
{}

Generate a single SQL query that answers the user's request."#,
        schema_context
    )
}
