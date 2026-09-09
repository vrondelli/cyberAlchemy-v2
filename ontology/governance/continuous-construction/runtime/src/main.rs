use governance_continuous_construction::{evaluate, validate_program};
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

fn read_json(path: &Path) -> Result<Value, String> {
    let bytes = fs::read(path).map_err(|error| format!("{}: {error}", path.display()))?;
    serde_json::from_slice(&bytes).map_err(|error| format!("{}: {error}", path.display()))
}

fn run() -> Result<Value, String> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let operation = args
        .first()
        .map(String::as_str)
        .ok_or("expected validate-program or evaluate")?;
    let program = read_json(&argument(&args, "--program")?)?;
    let repository_root = argument(&args, "--repository-root")?;
    match operation {
        "validate-program" => Ok(validate_program(&program, &repository_root)),
        "evaluate" => {
            let attempt = read_json(&argument(&args, "--attempt")?)?;
            Ok(evaluate(&program, &attempt, &repository_root))
        }
        _ => Err("expected validate-program or evaluate".to_owned()),
    }
}

fn main() {
    let result = match run() {
        Ok(result) => result,
        Err(error) => json!({
            "schema_version": "cav2-continuous-construction-evaluation/v1",
            "status": "CANDIDATE",
            "decision": "STOP",
            "stage_results": [],
            "blocker_requests": [{"code":"CLI_INPUT_ERROR","stage":null,"detail":error}],
            "authority_requests": [],
            "human_test_packet_sha256": null,
            "human_test_observation_sha256": null,
            "routine_confirmation_required": false,
            "effect_authorized": false,
            "authority_effect": "none",
            "enforcement_effect": "none"
        }),
    };
    println!(
        "{}",
        serde_json::to_string_pretty(&result).expect("serializable result")
    );
    let code = if result.get("decision").and_then(Value::as_str) == Some("STOP") {
        2
    } else {
        0
    };
    std::process::exit(code);
}
