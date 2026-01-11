mod ai;
mod commands;
mod db;
mod error;
mod state;

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
            commands::connections::save_connection,
            commands::connections::load_connections,
            commands::connections::delete_connection,
            commands::connections::set_default_connection,
            commands::connections::get_connection_password,
            commands::connections::get_default_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
