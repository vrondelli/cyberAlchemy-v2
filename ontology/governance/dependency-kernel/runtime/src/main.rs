use governance_dependency_kernel::{enforce, evaluate, validate_program};
use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};

fn argument(args: &[String], name: &str) -> Result<PathBuf, String> {
    let index = args
        .iter()
        .position(|item| item == name)
        .ok_or_else(|| format!("missing {name}"))?;
    args.get(index + 1)
        .map(PathBuf::from)
        .ok_or_else(|| format!("missing value after {name}"))
}

fn optional_argument(args: &[String], name: &str) -> Option<PathBuf> {
    args.iter()
        .position(|item| item == name)
        .and_then(|index| args.get(index + 1))
        .map(PathBuf::from)
}

fn read_json(path: &Path) -> Result<(Vec<u8>, Value), String> {
    let bytes = fs::read(path).map_err(|error| format!("{}: {error}", path.display()))?;
    let value =
        serde_json::from_slice(&bytes).map_err(|error| format!("{}: {error}", path.display()))?;
    Ok((bytes, value))
}

fn exit_code(result: &Value) -> i32 {
    match result.get("status").and_then(Value::as_str) {
        Some("PASS") | Some("CANDIDATE") => 0,
        Some("BLOCK") => 2,
        Some("NOT_EVALUABLE") => 3,
        _ => 4,
    }
}

fn run() -> Result<Value, String> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let operation = args
        .first()
        .map(String::as_str)
        .ok_or("expected validate-program, evaluate, or enforce")?;
    let program_path = argument(&args, "--program")?;
    let repository_root = argument(&args, "--repository-root")?;
    let (program_bytes, program) = read_json(&program_path)?;
    match operation {
        "validate-program" => Ok(validate_program(&program, &repository_root)),
        "evaluate" => {
            let (_, request) = read_json(&argument(&args, "--request")?)?;
            Ok(evaluate(&program, &request, &repository_root))
        }
        "enforce" => {
            let (request_bytes, request) = read_json(&argument(&args, "--request")?)?;
            let activation = optional_argument(&args, "--activation")
                .map(|path| read_json(&path).map(|(_, value)| value))
                .transpose()?;
            let executable = std::env::current_exe()
                .map_err(|error| format!("cannot resolve current executable: {error}"))?;
            let kernel_bytes = fs::read(&executable)
                .map_err(|error| format!("{}: {error}", executable.display()))?;
            Ok(enforce(
                &program_bytes,
                &kernel_bytes,
                &request_bytes,
                &program,
                &request,
                activation.as_ref(),
                &repository_root,
            ))
        }
        _ => Err("expected validate-program, evaluate, or enforce".to_owned()),
    }
}

fn main() {
    let result = match run() {
        Ok(result) => result,
        Err(error) => json!({
            "schema_version": "cav2-governance-dependency-evaluation/v1",
            "status": "NOT_EVALUABLE",
            "problems": [{"code":"CLI_INPUT_ERROR","subject":null,"detail":error}],
            "effect_authorized": false,
            "authority_effect": "none",
            "enforcement_effect": "none"
        }),
    };
    println!(
        "{}",
        serde_json::to_string_pretty(&result).expect("serializable result")
    );
    std::process::exit(exit_code(&result));
}
