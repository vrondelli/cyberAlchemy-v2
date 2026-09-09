use cav2_work_orchestration_etl_demo::c19::{evaluate_exact, C19GateInput};
use cav2_work_orchestration_etl_demo::composite::{
    compile_l0, validate_compiled_composite, ScopeBindings,
};
use cav2_work_orchestration_etl_demo::host::verify_accepted_history;
use cav2_work_orchestration_etl_demo::l0;
use cav2_work_orchestration_etl_demo::ports::{AcceptedHistoryPort, FileAcceptedHistory};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::env;
use std::fs;
use std::path::Path;
use std::time::Duration;

fn usage() -> String {
    "usage: domainspec_control compile <source.json> <scope-bindings.json> [output.json]\n       domainspec_control validate <compiled-graph.json>\n       domainspec_control history-verify <compiled-graph.json> <history.json> <stream-id>\n       domainspec_control c19-evaluate <input.json>\n       domainspec_control preflight <l0-run-request.json>\n       domainspec_control run <l0-run-request.json>\n       domainspec_control resume <l0-run-request.json>".to_owned()
}

fn read_json(path: &str) -> Result<Value, String> {
    let bytes = fs::read(path).map_err(|error| format!("CLI_READ_FAILED:{path}:{error}"))?;
    serde_json::from_slice(&bytes).map_err(|error| format!("CLI_JSON_INVALID:{path}:{error}"))
}

fn write(value: &Value, path: Option<&String>) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(value)
        .map_err(|error| format!("CLI_JSON_WRITE_FAILED:{error}"))?;
    if let Some(path) = path {
        fs::write(path, &bytes).map_err(|error| format!("CLI_WRITE_FAILED:{path}:{error}"))?;
    } else {
        println!("{}", String::from_utf8(bytes).expect("JSON is utf8"));
    }
    Ok(())
}

fn sha(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn main_result() -> Result<(), String> {
    let args = env::args().skip(1).collect::<Vec<_>>();
    match args.first().map(String::as_str) {
        Some("compile") if (args.len() == 3 || args.len() == 4) => {
            let source = fs::read(&args[1])
                .map_err(|error| format!("CLI_READ_FAILED:{}:{error}", args[1]))?;
            let raw = read_json(&args[2])?;
            let bindings: BTreeMap<String, Vec<String>> = serde_json::from_value(raw)
                .map_err(|error| format!("CLI_SCOPE_BINDINGS_INVALID:{error}"))?;
            let compiled = compile_l0(&source, &ScopeBindings(bindings))?;
            write(&compiled.value, args.get(3))
        }
        Some("validate") if args.len() == 2 => {
            let value = read_json(&args[1])?;
            let definition = validate_compiled_composite(&value)?;
            write(
                &json!({
                    "status":"PASS",
                    "dag_id":definition.dag_id,
                    "nodes":definition.nodes.len(),
                    "graph_sha256":sha(&serde_json::to_vec(&value).expect("serializes")),
                    "authority_effect":"none",
                    "external_effect":"none"
                }),
                None,
            )
        }
        Some("history-verify") if args.len() == 4 => {
            let graph = validate_compiled_composite(&read_json(&args[1])?)?;
            let history = FileAcceptedHistory::open(&args[2])?;
            let view = history.read(&args[3]);
            let cursor = verify_accepted_history(graph, &view)?;
            write(
                &json!({"status":"PASS","stream_id":args[3],"cursor":cursor.to_value(),"authority_effect":"none","external_effect":"none"}),
                None,
            )
        }
        Some("c19-evaluate") if args.len() == 2 => {
            let input = read_json(&args[1])?;
            let path = |field: &str| {
                input[field]
                    .as_str()
                    .map(Path::new)
                    .ok_or_else(|| format!("CLI_C19_INPUT_INVALID:{field}"))
            };
            let result = evaluate_exact(C19GateInput {
                node_id: input["node_id"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:node_id".to_owned())?,
                command_id: input["command_id"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:command_id".to_owned())?,
                expected_stage: input["expected_stage"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:expected_stage".to_owned())?,
                expected_program_id: input["expected_program_id"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:expected_program_id".to_owned())?,
                expected_attempt_id: input["expected_attempt_id"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:expected_attempt_id".to_owned())?,
                repository_root: path("repository_root")?,
                evaluator_path: path("evaluator_path")?,
                evaluator_sha256: input["evaluator_sha256"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:evaluator_sha256".to_owned())?,
                program_path: path("program_path")?,
                program_sha256: input["program_sha256"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:program_sha256".to_owned())?,
                attempt_path: path("attempt_path")?,
                attempt_sha256: input["attempt_sha256"]
                    .as_str()
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:attempt_sha256".to_owned())?,
                timeout: Duration::from_millis(
                    input["timeout_ms"]
                        .as_u64()
                        .ok_or_else(|| "CLI_C19_INPUT_INVALID:timeout_ms".to_owned())?,
                ),
                max_output_bytes: input["max_output_bytes"]
                    .as_u64()
                    .and_then(|value| usize::try_from(value).ok())
                    .ok_or_else(|| "CLI_C19_INPUT_INVALID:max_output_bytes".to_owned())?,
                are_result: &input["are_result"],
            });
            write(
                &json!({"event":result.event.to_value(),"work_emitted":result.work_emitted,"authority_effect":result.authority_effect,"external_effect":result.external_effect}),
                None,
            )
        }
        Some("preflight") if args.len() == 2 => write(&l0::preflight(Path::new(&args[1]))?, None),
        Some("run") if args.len() == 2 => write(&l0::run(Path::new(&args[1]))?, None),
        Some("resume") if args.len() == 2 => write(&l0::resume(Path::new(&args[1]))?, None),
        _ => Err(usage()),
    }
}

fn main() {
    if let Err(error) = main_result() {
        eprintln!("{error}");
        std::process::exit(2);
    }
}
