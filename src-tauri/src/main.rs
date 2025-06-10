// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // Set environment variables to fix WebKit rendering issues on Linux
  std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
  std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

  //app_lib::run();
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_fs::init())
    .run(tauri::generate_context!())
    .expect("failed to run app");
}
