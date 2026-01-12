mod ai;
mod commands;
mod db;
mod error;
mod state;
pub mod types;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::connection::test_connection,
            commands::connection::connect,
            commands::connection::disconnect,
            commands::connection::get_connection_status,
            commands::query::execute_query,
            commands::schema::get_schemas,
            commands::schema::get_foreign_keys,
            commands::schema::get_table_detail,
            commands::export::export_csv,
            commands::ai::generate_sql,
            commands::settings::save_settings,
            commands::settings::load_settings,
            commands::query_history::save_query_history,
            commands::query_history::load_query_history,
            commands::connections::save_connection,
            commands::connections::load_connections,
            commands::connections::delete_connection,
            commands::connections::set_default_connection,
            commands::connections::get_connection_password,
            commands::connections::get_default_connection,
            commands::table_data::get_table_data,
            commands::table_data::get_table_row_count,
            commands::table_data::insert_rows,
            commands::table_data::update_rows,
            commands::table_data::delete_rows,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::types::*;
    use ts_rs::TS;

    #[test]
    fn export_bindings() {
        // Connection types
        ConnectionConfig::export_all().unwrap();
        SslMode::export_all().unwrap();
        SavedConnection::export_all().unwrap();
        SaveConnectionInput::export_all().unwrap();

        // Query types
        ColumnMetadata::export_all().unwrap();
        QueryResult::export_all().unwrap();
        QueryHistoryItem::export_all().unwrap();

        // Schema types
        ColumnInfo::export_all().unwrap();
        TableInfo::export_all().unwrap();
        SchemaInfo::export_all().unwrap();
        ForeignKeyInfo::export_all().unwrap();
        IndexInfo::export_all().unwrap();
        ConstraintInfo::export_all().unwrap();
        TableDetailInfo::export_all().unwrap();

        // Table data types
        TableDataRequest::export_all().unwrap();
        TableColumnInfo::export_all().unwrap();
        TableRow::export_all().unwrap();
        TableData::export_all().unwrap();
        RowUpdate::export_all().unwrap();
        RowInsert::export_all().unwrap();
        RowDelete::export_all().unwrap();

        // AI types
        AiProvider::export_all().unwrap();
        GenerateSqlRequest::export_all().unwrap();
    }
}
