use cav2_work_orchestration_etl_demo::run_demo;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

fn package_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("runtime has package parent")
        .to_path_buf()
}

fn json_file(relative: &str) -> Value {
    serde_json::from_slice(&fs::read(package_root().join(relative)).expect("fixture readable"))
        .expect("fixture JSON")
}

#[test]
fn synthetic_etl_executes_and_replays_idempotently() {
    let result = run_demo(
        &json_file("generated/rwo-composition.json"),
        &json_file("fixtures/input/customers.json"),
    )
    .expect("valid demo");
    assert_eq!(result["status"], "PASS");
    assert_eq!(result["idempotency"]["initial_load_effects"], 1);
    assert_eq!(result["idempotency"]["replay_load_effects"], 0);
    assert_eq!(
        result["warehouse_rows"],
        json_file("fixtures/expected/warehouse.json")
    );
    assert_eq!(
        result["initial_run"]["duplicate_probe"]["outcome"],
        "Duplicate"
    );
}

#[test]
fn validation_failure_stops_before_load() {
    let invalid = json!([{"customer_id":"C-001","name":"Ada","email":"not-an-email"}]);
    let error = run_demo(&json_file("generated/rwo-composition.json"), &invalid)
        .expect_err("invalid batch must stop");
    assert!(error.starts_with("VALIDATION_GATE_REJECTED:"), "{error}");
}

#[test]
fn malformed_structure_is_rejected_by_rwo() {
    let mut composition = json_file("generated/rwo-composition.json");
    composition["edges"][0]["target_node_id"] = Value::String("MissingNode".to_owned());
    let error = run_demo(&composition, &json_file("fixtures/input/customers.json"))
        .expect_err("missing endpoint must stop");
    assert_eq!(error, "RWO_COMPILE_REJECTED:MISSING_ENDPOINT");
}
