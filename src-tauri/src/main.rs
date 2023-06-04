// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;

use tauri::Manager;
use walkdir::WalkDir;

#[derive(serde::Serialize, Debug)]
struct C2S {
    path: String,
    name: String,
    dir: String,
    size: u64,
    mime: String,
}

#[tauri::command]
fn path_by_mime(path_name: &str) -> Vec<C2S> {
    println!("name={}", path_name);
    let path = Path::new(path_name);
    let mut res = Vec::new();
    for entry in WalkDir::new(path) {
        let entry = entry.unwrap();
        // entry是否是文件
        if !entry.file_type().is_file() {
            continue;
        }
        // 打印dir,而不是文件
        let path_name = &entry.path().to_str().unwrap().to_string();
        let ext = entry
            .path()
            .extension()
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        if find_mimetype(&ext) {
            let c2s = C2S {
                path: path_name.to_string(),
                name: entry.file_name().to_str().unwrap().to_string(),
                dir: entry.path().parent().unwrap().to_str().unwrap().to_string(),
                size: std::fs::metadata(path_name).unwrap().len(),
                mime: ext,
            };
            res.push(c2s);
        }
    }
    // format!("Hello, {}! You've been greeted from Rust!", name)
    println!("res={:?}", res);
    res
}

#[tauri::command]
fn cmd_explorer(path_name: &str) {
    println!("name={}", path_name);
    std::process::Command::new("explorer")
        .arg("/select,")
        .arg(path_name)
        .spawn()
        .unwrap();
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![path_by_mime, cmd_explorer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn find_mimetype(ext: &str) -> bool {
    let res = match ext {
        "mp3" | "wav" | "ogg" => true,
        "jpg" | "png" | "gif" => true,
        &_ => false,
    };
    return res;
}
