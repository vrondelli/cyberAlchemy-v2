use cav2_work_orchestration_etl_demo::dag::DagDefinition;
use cav2_work_orchestration_etl_demo::executor::StructuredAgentShell;
use cav2_work_orchestration_etl_demo::host::run_dag;
use cav2_work_orchestration_etl_demo::ports::InMemoryAcceptedHistory;
use serde_json::Value;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;
use std::time::Duration;

fn required_arg(args: &mut impl Iterator<Item = String>, name: &str) -> Result<String, String> {
    args.next()
        .ok_or_else(|| format!("CLI_ARGUMENT_MISSING:{name}"))
}

fn run() -> Result<(), String> {
    let mut args = env::args().skip(1);
    let dag_path = PathBuf::from(required_arg(&mut args, "dag-path")?);
    let script_path = PathBuf::from(required_arg(&mut args, "agent-script")?);
    let run_root = PathBuf::from(required_arg(&mut args, "run-root")?);
    let stream_id = args
        .next()
        .unwrap_or_else(|| "micro-swarm-contained-run".to_owned());
    if args.next().is_some() {
        return Err("CLI_ARGUMENTS_EXCESS".to_owned());
    }
    if !dag_path.is_file() {
        return Err("CLI_DAG_MISSING".to_owned());
    }
    if !script_path.is_file() {
        return Err("CLI_AGENT_SCRIPT_MISSING".to_owned());
    }
    fs::create_dir_all(&run_root).map_err(|error| format!("CLI_RUN_ROOT_ERROR:{error}"))?;
    let graph: Value = serde_json::from_slice(
        &fs::read(&dag_path).map_err(|error| format!("CLI_DAG_READ_ERROR:{error}"))?,
    )
    .map_err(|error| format!("CLI_DAG_JSON_ERROR:{error}"))?;
    let definition = DagDefinition::from_value(&graph)?;
    let request_timeout_seconds = env::var("REQUEST_TIMEOUT_SECONDS")
        .ok()
        .map(|value| {
            value
                .parse::<u64>()
                .ok()
                .filter(|seconds| *seconds > 0)
                .ok_or_else(|| "CLI_REQUEST_TIMEOUT_INVALID".to_owned())
        })
        .transpose()?
        .unwrap_or(240);
    let executor = StructuredAgentShell {
        script_path,
        run_root: run_root.clone(),
        api_base: env::var("API_BASE").ok(),
        request_timeout: Duration::from_secs(request_timeout_seconds),
    };
    let mut history = InMemoryAcceptedHistory::default();
    let receipt = run_dag(definition, &executor, &mut history, &stream_id)?;
    let mut bytes = serde_json::to_vec_pretty(&receipt)
        .map_err(|error| format!("CLI_RECEIPT_SERIALIZE_ERROR:{error}"))?;
    bytes.push(b'\n');
    fs::write(run_root.join("run-receipt.json"), &bytes)
        .map_err(|error| format!("CLI_RECEIPT_WRITE_ERROR:{error}"))?;
    print!("{}", String::from_utf8_lossy(&bytes));
    Ok(())
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
