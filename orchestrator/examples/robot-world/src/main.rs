//! Local Robot World adapter over the public Orchestrator contracts.
//! Open questions: ../README.md.
use cyberalchemy_orchestrator_runtime::{
    model::digest, EffectDisposition, OrchestratorRuntime, Receipt,
};
use orchestrator_capabilities::{RunTemplate, StrategyTemplate};
use rwo_core::NodeEvent;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const LIMIT: u64 = 32 * 1024 * 1024;

fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn read(path: &Path) -> Result<Vec<u8>, String> {
    let metadata = fs::symlink_metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() || metadata.file_type().is_symlink() || metadata.len() > LIMIT {
        return Err("WORLD_ARTIFACT_PATH_OR_SIZE".into());
    }
    fs::read(path).map_err(|error| error.to_string())
}

fn templates() -> Result<(StrategyTemplate, RunTemplate), String> {
    let strategy = serde_json::from_str(include_str!("../strategy-template.json"))
        .map_err(|error| error.to_string())?;
    let run = serde_json::from_str(include_str!("../run-template.json"))
        .map_err(|error| error.to_string())?;
    Ok((strategy, run))
}

fn proposal(binding: &Value) -> Result<orchestrator_capabilities::DispatchProposal, String> {
    let (strategy, run) = templates()?;
    run.propose(
        &strategy,
        BTreeMap::from([("world_binding".to_owned(), binding.clone())]),
        None,
    )
}

struct WorkerInvocation<'a> {
    worker: &'a Path,
    root: &'a Path,
    node_id: &'a str,
    contract: &'a str,
    command_id: &'a str,
    fence: u64,
    binding: Value,
    predecessor: Value,
    cancel: &'a Path,
}

fn worker_request(invocation: WorkerInvocation<'_>) -> Result<(PathBuf, Vec<u8>, Value), String> {
    let label = if invocation.node_id == "run" {
        "world"
    } else {
        invocation.node_id
    };
    let input = invocation.root.join(format!("{label}-input.json"));
    let output = invocation.root.join(format!("{label}-output.json"));
    if input.exists() || output.exists() {
        return Err("WORLD_RECONCILIATION_REQUIRED".into());
    }
    let value = json!({
        "schema_version":"robot-world.worker-request/v1",
        "contract":invocation.contract,
        "command_id":invocation.command_id,
        "fencing_token":invocation.fence,
        "input":invocation.binding,
        "predecessor":invocation.predecessor,
    });
    let bytes = serde_json::to_vec(&value).map_err(|error| error.to_string())?;
    fs::write(&input, &bytes).map_err(|error| error.to_string())?;
    let result = Command::new("python3")
        .env("PYTHONDONTWRITEBYTECODE", "1")
        .arg(invocation.worker)
        .arg(&input)
        .arg(&output)
        .arg(invocation.cancel)
        .output()
        .map_err(|error| format!("WORLD_SPAWN:{error}"))?;
    if !result.status.success() {
        return Err("WORLD_WORKER_FAILED_RECONCILIATION_REQUIRED".into());
    }
    let output_bytes = read(&output)?;
    let response: Value = serde_json::from_slice(&output_bytes)
        .map_err(|error| format!("WORLD_RESULT_JSON:{error}"))?;
    if response["schema_version"] != "robot-world.worker-result/v1"
        || response["contract"] != invocation.contract
        || response["command_id"] != invocation.command_id
        || response["fencing_token"] != invocation.fence
        || response["request_sha256"] != sha256(&bytes)
    {
        return Err("WORLD_RESULT_BINDING".into());
    }
    if response["status"] == "cancelled" || invocation.cancel.exists() {
        return Err("WORLD_CANCELLED".into());
    }
    if response["status"] != "succeeded"
        || response["result"]["binding"] != value["input"]
        || (invocation.node_id == "run"
            && ["events", "frames", "traces", "final_state"]
                .iter()
                .any(|field| response["result"][*field].is_null()))
        || (invocation.node_id == "verify" && response["result"]["status"] != "PASS")
    {
        return Err("WORLD_RESULT_SHAPE".into());
    }
    Ok((output, output_bytes, response))
}

fn accepted_output(
    run_root: &Path,
    cursor: &Value,
    node: &str,
) -> Result<(PathBuf, Value), String> {
    let reference = &cursor["outputs"][node];
    let uri = reference["uri"].as_str().ok_or("WORLD_OUTPUT_REFERENCE")?;
    let path = PathBuf::from(uri);
    let expected = run_root.join(if node == "run" {
        "world-output.json"
    } else {
        "verify-output.json"
    });
    if path != expected {
        return Err("WORLD_OUTPUT_PATH_INVALID".into());
    }
    let bytes = read(&path)?;
    if reference["sha256"] != sha256(&bytes) {
        return Err("WORLD_OUTPUT_DIGEST".into());
    }
    let value = serde_json::from_slice(&bytes).map_err(|error| error.to_string())?;
    Ok((path, value))
}

fn report(runtime: &OrchestratorRuntime, run_id: &str, replayed: bool) -> Result<Value, String> {
    let controller = runtime.run(run_id)?;
    let snapshot = controller.snapshot()?;
    if snapshot
        .cursor
        .node_status
        .values()
        .any(|status| status != "succeeded")
    {
        return Err("WORLD_RECONCILIATION_REQUIRED".into());
    }
    let (world_path, world) =
        accepted_output(controller.root(), &snapshot.cursor.to_value(), "run")?;
    let (verify_path, verify) =
        accepted_output(controller.root(), &snapshot.cursor.to_value(), "verify")?;
    if verify["result"]["source_output_sha256"] != snapshot.cursor.outputs["run"]["sha256"] {
        return Err("WORLD_RESULT_BINDING".into());
    }
    Ok(json!({
        "schema_version":"robot-world.owner-result/v1",
        "status":"PASS",
        "run_key":run_id,
        "replayed":replayed,
        "world_output":world_path,
        "verification_output":verify_path,
        "ticks":world["result"]["completed_ticks"],
        "constructed":world["result"]["constructed"],
        "verification":verify["result"],
        "capacity":{"total_assignments_started":2},
        "authority_effect":"none",
    }))
}

fn execute(worker: &Path, binding: Value, state_root: &Path, mode: &str) -> Result<Value, String> {
    let proposal = proposal(&binding)?;
    let graph_digest = digest(&proposal.graph)?;
    let identity = digest(&binding)?;
    let run_id = format!("robot-world-{}", &identity[7..23]);
    let runtime = OrchestratorRuntime::open(state_root, 1)?;
    let existing = runtime.run_ids()?;
    if let Some(existing_id) = existing.first() {
        if existing.len() != 1 {
            return Err("WORLD_OWNER_SCOPE".into());
        }
        let controller = runtime.run(existing_id)?;
        if controller.bundle().graph_digest != graph_digest {
            return Err("WORLD_GRAPH_BINDING".into());
        }
        return report(&runtime, existing_id, true);
    }
    if mode == "replay" {
        return Err("WORLD_RUN_MISSING".into());
    }
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    let bundle = proposal.admit(&run_id, now, now + 120_000, "admission:robot-world-local")?;
    runtime.register(bundle)?;
    let capabilities = vec!["robot-world.run/v1".into(), "robot-world.verify/v1".into()];
    let cancel = state_root.join("cancel.request");
    for revision in 0..2_u64 {
        let assignment = runtime
            .poll(
                "robot-world-worker",
                &capabilities,
                now + revision as u128 * 10,
                5_000,
            )?
            .ok_or("WORLD_NO_COMMAND")?;
        let controller = runtime.run(&run_id)?;
        controller.begin(
            &assignment.command.command_id,
            &assignment.lease.worker_id,
            assignment.lease.fencing_token,
            now + revision as u128 * 10 + 1,
        )?;
        let binding = assignment.command.input["static"]["definition"].clone();
        let predecessor = if assignment.command.node_id == "verify" {
            let reference = &assignment.command.input["dependencies"][0]["output_ref"];
            let bytes = read(Path::new(
                reference["uri"].as_str().ok_or("WORLD_DEPENDENCY")?,
            ))?;
            if reference["sha256"] != sha256(&bytes) {
                return Err("WORLD_DEPENDENCY_DIGEST".into());
            }
            json!({"utf8_json":String::from_utf8(bytes.clone()).map_err(|e|e.to_string())?,"sha256":sha256(&bytes)})
        } else {
            Value::Null
        };
        let worker_result = worker_request(WorkerInvocation {
            worker,
            root: controller.root(),
            node_id: &assignment.command.node_id,
            contract: &assignment.command.contract,
            command_id: &assignment.command.command_id,
            fence: assignment.lease.fencing_token,
            binding,
            predecessor,
            cancel: &cancel,
        });
        let (output_path, output_bytes, _) = match worker_result {
            Ok(value) => value,
            Err(error) if error == "WORLD_CANCELLED" => {
                let state = controller.snapshot()?;
                controller.cancel(
                    state.revision,
                    "robot-world-local-cancel",
                    "cancel-requested",
                    now + revision as u128 * 10 + 2,
                )?;
                return Err(error);
            }
            Err(error) => return Err(error),
        };
        let event = NodeEvent::succeeded(
            format!("event-{}", assignment.command.node_id),
            &assignment.command.node_id,
            json!({"uri":output_path,"sha256":sha256(&output_bytes)}),
        )
        .bind_command(&assignment.command.command_id);
        controller.complete(
            revision,
            Receipt {
                receipt_id: format!("receipt-{}", assignment.command.node_id),
                command_id: assignment.command.command_id,
                worker_id: assignment.lease.worker_id,
                fencing_token: assignment.lease.fencing_token,
                event,
                effect_disposition: EffectDisposition::Applied,
                recorded_at_ms: now + revision as u128 * 10 + 2,
            },
            now + revision as u128 * 10 + 2,
        )?;
    }
    report(&runtime, &run_id, false)
}

fn run() -> Result<(), String> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    if args.len() != 4 || !matches!(args[3].as_str(), "run" | "replay") {
        return Err("Usage: world_contracts WORKER.py BINDING.json STATE_ROOT run|replay".into());
    }
    let binding: Value =
        serde_json::from_slice(&read(Path::new(&args[1]))?).map_err(|error| error.to_string())?;
    let result = execute(Path::new(&args[0]), binding, Path::new(&args[2]), &args[3])?;
    println!("{result}");
    Ok(())
}

fn main() -> std::process::ExitCode {
    match run() {
        Ok(()) => std::process::ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            std::process::ExitCode::FAILURE
        }
    }
}
