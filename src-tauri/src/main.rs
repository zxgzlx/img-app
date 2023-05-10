// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;

use tauri::Manager;
use walkdir::WalkDir;

#[tauri::command]
fn path_by_mime(path_name: &str) -> Vec<String> {
    println!("name={}", path_name);
    let path = Path::new(path_name);
    let mut res = Vec::new();
    for entry in WalkDir::new(path) {
        let entry = entry.unwrap();
        if find_mimetype(&entry.path().to_str().unwrap().to_string()) {
            res.push(format!("{}", entry.path().display()));
        }
    }
    // format!("Hello, {}! You've been greeted from Rust!", name)
    // println!("res={:?}", res);
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
