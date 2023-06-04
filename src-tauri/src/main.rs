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
    is_img: bool,
    is_audio: bool,
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
        if find_mimetype(path_name) {
            let c2s = C2S {
                path: path_name.to_string(),
                name: path.file_name().unwrap().to_str().unwrap().to_string(),
                dir: entry.path().parent().unwrap().to_str().unwrap().to_string(),
                size: std::fs::metadata(path_name).unwrap().len(),
                is_img: true,
                is_audio: false,
                mime: entry.path().extension().unwrap().to_str().unwrap().to_string(),
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
   std::process::Command::new("explorer").arg("/select,").arg(path_name).spawn().unwrap();
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

fn find_mimetype (filename : &String) -> bool{

    println!("filename={}", filename);
    let parts : Vec<&str> = filename.split('.').collect();

    let res = match parts.last() {
            Some(v) =>
                match *v {
                    "mp3" | "wav" | "ogg" => true,
                    "jpg" | "png" | "gif" => true,
                    &_ => false,
                },
            None => false,
        };
    return res;
}
