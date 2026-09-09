use cav2_work_orchestration_etl_demo::run_demo;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn read_json(path: &PathBuf) -> Result<Value, String> {
    serde_json::from_slice(&fs::read(path).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())
}

fn main() -> Result<(), String> {
    let package_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or_else(|| "PACKAGE_ROOT_MISSING".to_owned())?
        .to_path_buf();
    let composition = read_json(&package_root.join("generated/rwo-composition.json"))?;
    let input = read_json(&package_root.join("fixtures/input/customers.json"))?;
    let result = run_demo(&composition, &input)?;
    let bytes = format!(
        "{}\n",
        serde_json::to_string_pretty(&result).map_err(|error| error.to_string())?
    );
    fs::create_dir_all(package_root.join("runs")).map_err(|error| error.to_string())?;
    fs::write(package_root.join("runs/etl-demo-result.json"), &bytes)
        .map_err(|error| error.to_string())?;
    print!("{bytes}");
    Ok(())
}
