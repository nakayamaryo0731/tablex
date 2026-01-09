use crate::db::DatabaseConnection;
use tokio::sync::Mutex;

pub struct AppState {
    pub connection: Mutex<Option<DatabaseConnection>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            connection: Mutex::new(None),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
