use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;

/// Sets or removes the read-only attribute of a file
#[tauri::command]
fn set_file_readonly(file_path: String, readonly: bool) -> Result<(), String> {
  let path = Path::new(&file_path);
  
  if !path.exists() {
    return Err(format!("File does not exist: {}", file_path));
  }

  #[cfg(target_os = "windows")]
  {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let mut permissions = metadata.permissions();
    permissions.set_readonly(readonly);
    fs::set_permissions(path, permissions).map_err(|e| e.to_string())?;
  }

  #[cfg(not(target_os = "windows"))]
  {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let mut permissions = metadata.permissions();
    permissions.set_readonly(readonly);
    fs::set_permissions(path, permissions).map_err(|e| e.to_string())?;
  }

  Ok(())
}

/// Checks if a file has the read-only attribute
#[tauri::command]
fn is_file_readonly(file_path: String) -> Result<bool, String> {
  let path = Path::new(&file_path);
  
  if !path.exists() {
    return Err(format!("File does not exist: {}", file_path));
  }

  let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
  Ok(metadata.permissions().readonly())
}

/// Opens a folder in the system's file explorer
#[tauri::command]
fn open_folder(folder_path: String) -> Result<(), String> {
  let path = Path::new(&folder_path);
  
  if !path.exists() {
    return Err(format!("Folder does not exist: {}", folder_path));
  }

  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
      .arg(&folder_path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(&folder_path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  #[cfg(target_os = "linux")]
  {
    Command::new("xdg-open")
      .arg(&folder_path)
      .spawn()
      .map_err(|e| e.to_string())?;
  }

  Ok(())
}

/// Closes the application window with force option
#[tauri::command]
async fn close_window(app: tauri::AppHandle, force: bool) -> Result<(), String> {
  if force {
    // Force close the window immediately
    app.exit(0);
  }
  Ok(())
}

/// Allow window closing (set closable = true)
#[tauri::command]
async fn allow_close(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("main") {
    window.set_closable(true).map_err(|e| e.to_string())?;
  }
  Ok(())
}

/// Prevent window closing (set closable = false)
#[tauri::command]
async fn prevent_close(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("main") {
    window.set_closable(false).map_err(|e| e.to_string())?;
  }
  Ok(())
}

/// Toggle maximize/restore window
#[tauri::command]
async fn toggle_maximize(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("main") {
    if window.is_maximized().map_err(|e| e.to_string())? {
      window.unmaximize().map_err(|e| e.to_string())?;
    } else {
      window.maximize().map_err(|e| e.to_string())?;
    }
  }
  Ok(())
}

/// Maximize window
#[tauri::command]
async fn maximize_window(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("main") {
    window.maximize().map_err(|e| e.to_string())?;
  }
  Ok(())
}

/// Restore window to normal size
#[tauri::command]
async fn restore_window(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("main") {
    window.unmaximize().map_err(|e| e.to_string())?;
  }
  Ok(())
}

/// Toggle fullscreen mode
#[tauri::command]
async fn toggle_fullscreen(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window("main") {
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
  }
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      set_file_readonly, 
      is_file_readonly, 
      open_folder, 
      close_window,
      allow_close,
      prevent_close,
      toggle_maximize,
      maximize_window,
      restore_window,
      toggle_fullscreen
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Ensure the window is not minimized on startup
      if let Some(window) = app.get_webview_window("main") {
        // If the window is minimized, restore it to normal state
        let _ = window.unminimize();
        // Make sure the window is visible
        let _ = window.show();
        // Bring the window to front
        let _ = window.set_focus();
      }
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
