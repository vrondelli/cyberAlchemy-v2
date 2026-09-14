use cyberalchemy_orchestrator_runtime::{EffectDisposition, OrchestratorRuntime, Receipt};
use orchestrator_capabilities::{RunTemplate, StrategyTemplate};
use rwo_core::{DagEngine, NodeEvent};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn robot_talks_templates() -> (StrategyTemplate, RunTemplate) {
    (
        serde_json::from_str(include_str!(
            "../../../examples/robot-talks/strategy-template.json"
        ))
        .unwrap(),
        serde_json::from_str(include_str!(
            "../../../examples/robot-talks/run-template.json"
        ))
        .unwrap(),
    )
}

fn robot_world_templates() -> (StrategyTemplate, RunTemplate) {
    (
        serde_json::from_str(include_str!(
            "../../../examples/robot-world/strategy-template.json"
        ))
        .unwrap(),
        serde_json::from_str(include_str!(
            "../../../examples/robot-world/run-template.json"
        ))
        .unwrap(),
    )
}

fn success(command: &rwo_core::DagCommand, sequence: usize) -> NodeEvent {
    NodeEvent::succeeded(
        format!("event-{sequence}-{}", command.node_id),
        &command.node_id,
        json!({"uri":format!("artifact://{}",command.node_id),"sha256":format!("fixture-{sequence}")}),
    )
    .bind_command(&command.command_id)
}

#[test]
fn robot_talks_is_an_eight_agent_four_lane_template_and_completes() {
    let (strategy_template, run_template) = robot_talks_templates();
    let proposal = run_template
        .propose(&strategy_template, BTreeMap::new(), None)
        .unwrap();
    assert_eq!(proposal.lanes.len(), 4);
    assert_eq!(proposal.agent_requirements.len(), 8);
    assert_eq!(
        proposal
            .agent_requirements
            .iter()
            .filter_map(|requirement| requirement.agent_ref.as_ref())
            .collect::<BTreeSet<_>>()
            .len(),
        8
    );
    for lane in &proposal.lanes {
        let members = proposal
            .agent_requirements
            .iter()
            .filter(|requirement| requirement.lane_id == lane.lane_id)
            .collect::<Vec<_>>();
        assert_eq!(members.len(), 2);
        let node_ids = members
            .iter()
            .map(|requirement| requirement.node_selector.as_str())
            .collect::<Vec<_>>();
        assert!(node_ids.iter().any(|node| node.ends_with("-constructive")));
        assert!(node_ids.iter().any(|node| node.ends_with("-adversarial")));
    }

    let bundle = proposal
        .admit("run-robot-talks", 1, 3_600_001, "admission:local-test")
        .unwrap();
    assert_eq!(
        bundle.admission_context["template_ref"],
        "robot-talks-four-concern-dialectic@v1"
    );
    let mut engine = DagEngine::new(bundle.graph);
    let initial = engine.start();
    assert_eq!(initial.commands.len(), 8);
    let mut next = Vec::new();
    for (index, command) in initial.commands.iter().enumerate() {
        next = engine
            .apply_event(success(command, index))
            .unwrap()
            .commands;
    }
    assert_eq!(next.len(), 1);
    assert_eq!(next[0].node_id, "synthesize");
    next = engine.apply_event(success(&next[0], 8)).unwrap().commands;
    assert_eq!(next[0].node_id, "audit");
    next = engine.apply_event(success(&next[0], 9)).unwrap().commands;
    assert_eq!(next[0].node_id, "close");
    let terminal = engine.apply_event(success(&next[0], 10)).unwrap();
    assert_eq!(terminal.kind, "Succeeded");
}

fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn ca2_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(3)
        .unwrap()
        .to_path_buf()
}

fn run_world_worker(
    job: &Path,
    contract: &str,
    command_id: &str,
    fencing_token: u64,
    binding: Value,
    predecessor: Value,
) -> Vec<u8> {
    fs::create_dir_all(job).unwrap();
    let request = job.join("input.json");
    let output = job.join("output.json");
    let cancel = job.join("cancel");
    fs::write(
        &request,
        serde_json::to_vec(&json!({
            "schema_version":"robot-world.worker-request/v1",
            "contract":contract,
            "command_id":command_id,
            "fencing_token":fencing_token,
            "input":binding,
            "predecessor":predecessor,
        }))
        .unwrap(),
    )
    .unwrap();
    let worker = ca2_root().join("development/robot-world-kep/orchestrator-integration/worker.py");
    let result = Command::new("python3")
        .env("PYTHONDONTWRITEBYTECODE", "1")
        .arg(worker)
        .arg(&request)
        .arg(&output)
        .arg(cancel)
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "world worker failed: {}",
        String::from_utf8_lossy(&result.stderr)
    );
    fs::read(output).unwrap()
}

#[test]
fn robot_world_runs_and_verifies_through_the_durable_runtime() {
    let (strategy_template, run_template) = robot_world_templates();
    let proposal = run_template
        .propose(&strategy_template, BTreeMap::new(), None)
        .unwrap();
    assert_eq!(proposal.graph.nodes.len(), 2);
    assert_eq!(proposal.selected_adapter_refs, ["robot-world-worker/v1"]);
    let bundle = proposal
        .admit("run-robot-world", 1, 120_001, "admission:local-test")
        .unwrap();
    let temp = tempfile::tempdir().unwrap();
    let runtime = OrchestratorRuntime::open(temp.path().join("runtime"), 1).unwrap();
    runtime.register(bundle).unwrap();

    let capabilities = vec![
        "robot-world.run/v1".to_owned(),
        "robot-world.verify/v1".to_owned(),
    ];
    let run_assignment = runtime
        .poll("robot-world-worker", &capabilities, 10, 10_000)
        .unwrap()
        .unwrap();
    assert_eq!(run_assignment.command.contract, "robot-world.run/v1");
    let controller = runtime.run(&run_assignment.run_id).unwrap();
    controller
        .begin(
            &run_assignment.command.command_id,
            &run_assignment.lease.worker_id,
            run_assignment.lease.fencing_token,
            11,
        )
        .unwrap();
    let binding = run_assignment.command.input["static"]["definition"].clone();
    let run_bytes = run_world_worker(
        &temp.path().join("run-job"),
        &run_assignment.command.contract,
        &run_assignment.command.command_id,
        run_assignment.lease.fencing_token,
        binding,
        Value::Null,
    );
    let run_path = temp.path().join("run-job/output.json");
    let run_ref = json!({"uri":run_path,"sha256":sha256(&run_bytes)});
    controller
        .complete(
            0,
            Receipt {
                receipt_id: "receipt-world-run".into(),
                command_id: run_assignment.command.command_id.clone(),
                worker_id: run_assignment.lease.worker_id.clone(),
                fencing_token: run_assignment.lease.fencing_token,
                event: NodeEvent::succeeded("event-world-run", "run", run_ref)
                    .bind_command(&run_assignment.command.command_id),
                effect_disposition: EffectDisposition::Applied,
                recorded_at_ms: 12,
            },
            12,
        )
        .unwrap();

    let verify_assignment = runtime
        .poll("robot-world-worker", &capabilities, 20, 10_000)
        .unwrap()
        .unwrap();
    assert_eq!(verify_assignment.command.contract, "robot-world.verify/v1");
    let controller = runtime.run(&verify_assignment.run_id).unwrap();
    controller
        .begin(
            &verify_assignment.command.command_id,
            &verify_assignment.lease.worker_id,
            verify_assignment.lease.fencing_token,
            21,
        )
        .unwrap();
    let binding = verify_assignment.command.input["static"]["definition"].clone();
    let dependency = &verify_assignment.command.input["dependencies"][0]["output_ref"];
    let predecessor_bytes = fs::read(dependency["uri"].as_str().unwrap()).unwrap();
    assert_eq!(dependency["sha256"], sha256(&predecessor_bytes));
    let predecessor = json!({
        "utf8_json":String::from_utf8(predecessor_bytes).unwrap(),
        "sha256":dependency["sha256"],
    });
    let verify_bytes = run_world_worker(
        &temp.path().join("verify-job"),
        &verify_assignment.command.contract,
        &verify_assignment.command.command_id,
        verify_assignment.lease.fencing_token,
        binding,
        predecessor,
    );
    let verify_value: Value = serde_json::from_slice(&verify_bytes).unwrap();
    assert_eq!(verify_value["status"], "succeeded");
    assert_eq!(verify_value["result"]["status"], "PASS");
    let verify_path = temp.path().join("verify-job/output.json");
    controller
        .complete(
            1,
            Receipt {
                receipt_id: "receipt-world-verify".into(),
                command_id: verify_assignment.command.command_id.clone(),
                worker_id: verify_assignment.lease.worker_id.clone(),
                fencing_token: verify_assignment.lease.fencing_token,
                event: NodeEvent::succeeded(
                    "event-world-verify",
                    "verify",
                    json!({"uri":verify_path,"sha256":sha256(&verify_bytes)}),
                )
                .bind_command(&verify_assignment.command.command_id),
                effect_disposition: EffectDisposition::Applied,
                recorded_at_ms: 22,
            },
            22,
        )
        .unwrap();
    let terminal = controller.snapshot().unwrap();
    assert_eq!(terminal.cursor.node_status["run"], "succeeded");
    assert_eq!(terminal.cursor.node_status["verify"], "succeeded");
    assert!(terminal.pending_commands.is_empty());
}
