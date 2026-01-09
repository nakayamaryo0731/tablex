use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    #[serde(default, skip_serializing)]
    pub password: String,
    #[serde(default)]
    pub ssl_mode: SslMode,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SslMode {
    #[default]
    Disable,
    Prefer,
    Require,
}

impl ConnectionConfig {
    pub fn connection_string(&self) -> String {
        let ssl_mode = match self.ssl_mode {
            SslMode::Disable => "disable",
            SslMode::Prefer => "prefer",
            SslMode::Require => "require",
        };

        format!(
            "postgres://{}:{}@{}:{}/{}?sslmode={}",
            self.username, self.password, self.host, self.port, self.database, ssl_mode
        )
    }
}

pub struct DatabaseConnection {
    pub config: ConnectionConfig,
    pub pool: PgPool,
}

impl DatabaseConnection {
    pub async fn connect(config: ConnectionConfig) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&config.connection_string())
            .await?;

        Ok(Self { config, pool })
    }

    pub async fn test_connection(config: &ConnectionConfig) -> Result<(), sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&config.connection_string())
            .await?;

        sqlx::query("SELECT 1").execute(&pool).await?;
        pool.close().await;

        Ok(())
    }
}
