use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

fn temp_root() -> PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!(
        "rwo-micro-swarm-cli-{}-{stamp}",
        std::process::id()
    ));
    fs::create_dir_all(&path).unwrap();
    path
}

#[test]
fn cli_executes_the_compiled_42_role_dag_with_a_structured_fake_agent() {
    let root = temp_root();
    let script = root.join("agent.sh");
    fs::write(
        &script,
        r#"#!/usr/bin/env bash
set -euo pipefail
python3 - "$1" "$2" "$3" "$4" <<'PY'
import json
import sys

contract, role_id, input_path, output_path = sys.argv[1:]
with open(input_path, encoding="utf-8") as handle:
    payload = json.load(handle)
dependencies = payload["dependencies"]
if any("output" not in dependency for dependency in dependencies):
    raise SystemExit("dependency content missing")
result = {
    "contract": contract,
    "role_id": role_id,
    "dependency_count": len(dependencies),
    "dependency_role_ids": [dependency["output"]["role_id"] for dependency in dependencies],
}
with open(output_path, "w", encoding="utf-8") as handle:
    json.dump(result, handle, sort_keys=True)
    handle.write("\n")
PY
"#,
    )
    .unwrap();
    let graph = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("generated/micro-swarm-dag.json");
    let run_root = root.join("run");
    let output = Command::new(env!("CARGO_BIN_EXE_micro_swarm"))
        .arg(&graph)
        .arg(&script)
        .arg(&run_root)
        .arg("contained-cli-proof")
        .env("REQUEST_TIMEOUT_SECONDS", "5")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let receipt: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(receipt["status"], "Succeeded");
    assert_eq!(receipt["commands"], 42);
    assert_eq!(receipt["accepted_events"], 43);
    assert_eq!(
        fs::read(run_root.join("run-receipt.json")).unwrap(),
        output.stdout
    );
    let cases = [
        ("cf-accounting-reducer", 3),
        ("cf-luna-synthesizer", 3),
        ("cf-sol-judge", 1),
    ];
    for (role_id, expected_dependencies) in cases {
        let input: Value = serde_json::from_slice(
            &fs::read(
                run_root
                    .join("inputs")
                    .join(format!("{role_id}-attempt-1.json")),
            )
            .unwrap(),
        )
        .unwrap();
        let dependencies = input["dependencies"].as_array().unwrap();
        assert_eq!(dependencies.len(), expected_dependencies);
        assert!(dependencies.iter().all(|dependency| {
            dependency.get("output").is_some()
                && dependency["output"]["role_id"].as_str().is_some()
                && dependency["output_ref"]["sha256"].as_str().is_some()
        }));
    }
    fs::remove_dir_all(root).unwrap();
}
