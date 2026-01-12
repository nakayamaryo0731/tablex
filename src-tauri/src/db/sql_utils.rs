use crate::error::AppError;

/// Validates a SQL identifier (schema name, table name, column name)
/// to prevent SQL injection attacks.
///
/// Valid identifiers:
/// - Start with a letter or underscore
/// - Contain only letters, numbers, underscores
/// - Are not empty and not too long (max 128 chars)
pub fn validate_identifier(name: &str) -> Result<&str, AppError> {
    if name.is_empty() {
        return Err(AppError::InvalidConfig("Identifier cannot be empty".into()));
    }

    if name.len() > 128 {
        return Err(AppError::InvalidConfig(
            "Identifier too long (max 128 characters)".into(),
        ));
    }

    let first_char = name.chars().next().unwrap();
    if !first_char.is_alphabetic() && first_char != '_' {
        return Err(AppError::InvalidConfig(format!(
            "Invalid identifier '{}': must start with a letter or underscore",
            name
        )));
    }

    for c in name.chars() {
        if !c.is_alphanumeric() && c != '_' {
            return Err(AppError::InvalidConfig(format!(
                "Invalid identifier '{}': contains invalid character '{}'",
                name, c
            )));
        }
    }

    Ok(name)
}

/// Quotes an identifier for safe use in SQL queries.
/// This should only be called after validate_identifier().
pub fn quote_identifier(name: &str) -> String {
    format!("\"{}\"", name)
}

/// Validates and quotes an identifier in one step.
pub fn safe_identifier(name: &str) -> Result<String, AppError> {
    validate_identifier(name)?;
    Ok(quote_identifier(name))
}

/// Validates and quotes a schema.table reference.
pub fn safe_table_ref(schema: &str, table: &str) -> Result<String, AppError> {
    let safe_schema = safe_identifier(schema)?;
    let safe_table = safe_identifier(table)?;
    Ok(format!("{}.{}", safe_schema, safe_table))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_identifiers() {
        assert!(validate_identifier("users").is_ok());
        assert!(validate_identifier("_private").is_ok());
        assert!(validate_identifier("table_name").is_ok());
        assert!(validate_identifier("Table123").is_ok());
        assert!(validate_identifier("public").is_ok());
    }

    #[test]
    fn test_invalid_identifiers() {
        assert!(validate_identifier("").is_err());
        assert!(validate_identifier("123abc").is_err());
        assert!(validate_identifier("table-name").is_err());
        assert!(validate_identifier("table name").is_err());
        assert!(validate_identifier("table;drop").is_err());
        assert!(validate_identifier("table\"quote").is_err());
        assert!(validate_identifier("table'quote").is_err());
    }

    #[test]
    fn test_safe_table_ref() {
        let result = safe_table_ref("public", "users").unwrap();
        assert_eq!(result, "\"public\".\"users\"");
    }

    #[test]
    fn test_injection_attempt() {
        // Attempting SQL injection via schema name
        assert!(safe_table_ref("public\"; DROP TABLE users; --", "users").is_err());
        // Attempting SQL injection via table name
        assert!(safe_table_ref("public", "users\"; DROP TABLE users; --").is_err());
    }
}
