use cav2_work_orchestration_etl_demo::dag::{DagCommand, DagDefinition, NodeEvent};
use cav2_work_orchestration_etl_demo::executor::{BatchExecutor, StructuredAgentShell};
use cav2_work_orchestration_etl_demo::host::{replay_events, run_dag};
use cav2_work_orchestration_etl_demo::ports::{AcceptedHistoryPort, InMemoryAcceptedHistory};
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

fn temp_root(label: &str) -> PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!("rwo-{label}-{}-{stamp}", std::process::id()));
    fs::create_dir_all(&path).unwrap();
    path
}

fn fake_script(root: &PathBuf) -> PathBuf {
    let path = root.join("agent.sh");
    fs::write(
        &path,
        "#!/usr/bin/env bash\nset -euo pipefail\nprintf '{\"role_id\":\"%s\",\"ok\":true}\\n' \"$2\" > \"$4\"\nprintf '{\"status\":\"complete\"}\\n' > \"$4.receipt.json\"\n",
    )
    .unwrap();
    path
}

fn slow_script(root: &PathBuf) -> PathBuf {
    let path = root.join("slow-agent.sh");
    fs::write(
        &path,
        "#!/usr/bin/env bash\nset -euo pipefail\nsleep 2\nprintf '{}\\n' > \"$4\"\n",
    )
    .unwrap();
    path
}

fn definition() -> DagDefinition {
    DagDefinition::from_value(&json!({
        "dag_id": "shell-dag",
        "deadline_seconds": 30,
        "max_parallelism": 4,
        "nodes": [
            {"node_id":"a","contract":"extractor","role_id":"a","depends_on":[],"release":{"mode":"root"},"max_attempts":1},
            {"node_id":"b","contract":"extractor","role_id":"b","depends_on":[],"release":{"mode":"root"},"max_attempts":1},
            {"node_id":"join","contract":"reducer","role_id":"join","depends_on":["a","b"],"release":{"mode":"all"},"max_attempts":1}
        ]
    }))
    .unwrap()
}

#[test]
fn shell_executor_runs_a_bounded_parallel_batch() {
    let root = temp_root("executor");
    let executor = StructuredAgentShell {
        script_path: fake_script(&root),
        run_root: root.clone(),
        api_base: None,
        request_timeout: Duration::from_secs(5),
    };
    let commands = [
        DagCommand {
            command_id: "c1".into(),
            node_id: "a".into(),
            contract: "extractor".into(),
            role_id: "a".into(),
            attempt: 1,
            input: json!({"static":{"x":1},"dependencies":[]}),
        },
        DagCommand {
            command_id: "c2".into(),
            node_id: "b".into(),
            contract: "extractor".into(),
            role_id: "b".into(),
            attempt: 1,
            input: json!({"static":{"x":2},"dependencies":[]}),
        },
    ];
    let events = executor.execute_batch(&commands, 2, Duration::from_secs(5));
    assert_eq!(events.len(), 2);
    assert!(events.iter().all(|event| event.outcome == "succeeded"));
    assert!(executor.output_path(&commands[0]).is_file());
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn shell_executor_kills_a_request_at_the_remaining_deadline() {
    let root = temp_root("timeout");
    let executor = StructuredAgentShell {
        script_path: slow_script(&root),
        run_root: root.clone(),
        api_base: None,
        request_timeout: Duration::from_secs(5),
    };
    let command = DagCommand {
        command_id: "slow-command".into(),
        node_id: "slow".into(),
        contract: "extractor".into(),
        role_id: "slow".into(),
        attempt: 1,
        input: json!({"static":{},"dependencies":[]}),
    };
    let events = executor.execute_batch(&[command], 1, Duration::from_millis(50));
    assert_eq!(events.len(), 1);
    assert_eq!(events[0].outcome, "retryable_failure");
    assert_eq!(events[0].error.as_deref(), Some("EXECUTOR_REQUEST_TIMEOUT"));
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn host_persists_command_batches_and_replay_rebuilds_cursor() {
    let root = temp_root("host");
    let executor = StructuredAgentShell {
        script_path: fake_script(&root),
        run_root: root.clone(),
        api_base: None,
        request_timeout: Duration::from_secs(5),
    };
    let mut history = InMemoryAcceptedHistory::default();
    let result = run_dag(definition(), &executor, &mut history, "stream-1").unwrap();
    assert_eq!(result["status"], "Succeeded");
    assert_eq!(result["commands"], 3);
    assert_eq!(history.read("stream-1").command_intents.len(), 3);
    let join_input: serde_json::Value =
        serde_json::from_slice(&fs::read(root.join("inputs/join-attempt-1.json")).unwrap())
            .unwrap();
    assert_eq!(join_input["dependencies"].as_array().unwrap().len(), 2);
    assert_eq!(join_input["dependencies"][0]["output"]["ok"], true);
    assert_eq!(join_input["dependencies"][1]["output"]["ok"], true);

    let outputs = history.read("stream-1").events;
    let events = outputs
        .iter()
        .skip(1)
        .map(|value| NodeEvent {
            event_id: value["event_id"].as_str().unwrap().to_owned(),
            command_id: value["command_id"].as_str().map(str::to_owned),
            node_id: value["node_id"].as_str().unwrap().to_owned(),
            outcome: value["outcome"].as_str().unwrap().to_owned(),
            output_ref: value
                .get("output_ref")
                .filter(|item| !item.is_null())
                .cloned(),
            error: value
                .get("error")
                .and_then(|item| item.as_str())
                .map(str::to_owned),
        })
        .collect::<Vec<_>>();
    let replayed = replay_events(definition(), &events).unwrap();
    assert_eq!(replayed.to_value(), result["cursor"]);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn shell_executor_rejects_a_dependency_digest_mismatch() {
    let root = temp_root("dependency-digest");
    let output_dir = root.join("outputs");
    fs::create_dir_all(&output_dir).unwrap();
    let dependency_path = output_dir.join("upstream-attempt-1.json");
    let dependency_bytes = b"{\"value\":1}\n";
    fs::write(&dependency_path, dependency_bytes).unwrap();
    let executor = StructuredAgentShell {
        script_path: fake_script(&root),
        run_root: root.clone(),
        api_base: None,
        request_timeout: Duration::from_secs(5),
    };
    let command = DagCommand {
        command_id: "digest-mismatch".into(),
        node_id: "downstream".into(),
        contract: "reducer".into(),
        role_id: "downstream".into(),
        attempt: 1,
        input: json!({
            "static": {},
            "dependencies": [{
                "node_id": "upstream",
                "output_ref": {
                    "path": dependency_path,
                    "size": dependency_bytes.len(),
                    "sha256": "not-the-recorded-bytes"
                }
            }]
        }),
    };
    let events = executor.execute_batch(&[command], 1, Duration::from_secs(5));
    assert_eq!(events[0].outcome, "failed");
    assert_eq!(
        events[0].error.as_deref(),
        Some("EXECUTOR_DEPENDENCY_DIGEST_MISMATCH")
    );
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn shell_executor_rejects_a_dependency_path_escape() {
    let root = temp_root("dependency-escape");
    fs::create_dir_all(root.join("outputs")).unwrap();
    let dependency_path = root.join("outside-attempt-1.json");
    let dependency_bytes = b"{}\n";
    fs::write(&dependency_path, dependency_bytes).unwrap();
    let executor = StructuredAgentShell {
        script_path: fake_script(&root),
        run_root: root.clone(),
        api_base: None,
        request_timeout: Duration::from_secs(5),
    };
    let command = DagCommand {
        command_id: "path-escape".into(),
        node_id: "downstream".into(),
        contract: "reducer".into(),
        role_id: "downstream".into(),
        attempt: 1,
        input: json!({
            "static": {},
            "dependencies": [{
                "node_id": "outside",
                "output_ref": {
                    "path": dependency_path,
                    "size": dependency_bytes.len(),
                    "sha256": "unused"
                }
            }]
        }),
    };
    let events = executor.execute_batch(&[command], 1, Duration::from_secs(5));
    assert_eq!(events[0].outcome, "failed");
    assert_eq!(
        events[0].error.as_deref(),
        Some("EXECUTOR_DEPENDENCY_PATH_ESCAPE")
    );
    fs::remove_dir_all(root).unwrap();
}
