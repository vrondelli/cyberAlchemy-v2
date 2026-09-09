use crate::dag::NodeEvent;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Clone, Debug)]
pub struct C19GateInput<'a> {
    pub node_id: &'a str,
    pub command_id: &'a str,
    pub expected_stage: &'a str,
    pub expected_program_id: &'a str,
    pub expected_attempt_id: &'a str,
    pub repository_root: &'a Path,
    pub evaluator_path: &'a Path,
    pub evaluator_sha256: &'a str,
    pub program_path: &'a Path,
    pub program_sha256: &'a str,
    pub attempt_path: &'a Path,
    pub attempt_sha256: &'a str,
    pub timeout: Duration,
    pub max_output_bytes: usize,
    pub are_result: &'a Value,
}

#[derive(Clone, Debug, PartialEq)]
pub struct C19GateResult {
    pub event: NodeEvent,
    pub work_emitted: bool,
    pub authority_effect: &'static str,
    pub external_effect: &'static str,
}

fn sha(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn fail(input: &C19GateInput<'_>, code: impl Into<String>) -> C19GateResult {
    C19GateResult {
        event: NodeEvent::failed(
            format!("{}:gate", input.command_id),
            input.node_id,
            code.into(),
        )
        .bind_command(input.command_id),
        work_emitted: false,
        authority_effect: "none",
        external_effect: "none",
    }
}

fn contained(root: &Path, candidate: &Path, label: &str) -> Result<PathBuf, String> {
    let root = root
        .canonicalize()
        .map_err(|error| format!("C19_REPOSITORY_ROOT_INVALID:{error}"))?;
    let joined = if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        root.join(candidate)
    };
    let target = joined
        .canonicalize()
        .map_err(|error| format!("C19_{label}_PATH_INVALID:{error}"))?;
    if target == root || !target.starts_with(&root) {
        return Err(format!("C19_{label}_PATH_ESCAPE"));
    }
    Ok(target)
}

fn exact_file(path: &Path, expected: &str, label: &str) -> Result<Vec<u8>, String> {
    let bytes = fs::read(path).map_err(|error| format!("C19_{label}_READ_FAILED:{error}"))?;
    if sha(&bytes) != expected {
        return Err(format!("C19_{label}_DIGEST_DRIFT"));
    }
    Ok(bytes)
}

fn read_bounded<R: Read>(mut reader: R, maximum: usize) -> (Vec<u8>, bool) {
    let mut kept = Vec::new();
    let mut buffer = [0_u8; 8192];
    let mut overflow = false;
    loop {
        match reader.read(&mut buffer) {
            Ok(0) | Err(_) => break,
            Ok(count) => {
                if kept.len().saturating_add(count) <= maximum {
                    kept.extend_from_slice(&buffer[..count]);
                } else {
                    overflow = true;
                }
            }
        }
    }
    (kept, overflow)
}

fn invoke(input: &C19GateInput<'_>) -> Result<Value, String> {
    if input.timeout.is_zero() || input.timeout > Duration::from_secs(30) {
        return Err("C19_TIMEOUT_OUTSIDE_BOUNDS".to_owned());
    }
    if input.max_output_bytes == 0 || input.max_output_bytes > 1_048_576 {
        return Err("C19_OUTPUT_BOUND_INVALID".to_owned());
    }
    let root = input
        .repository_root
        .canonicalize()
        .map_err(|error| format!("C19_REPOSITORY_ROOT_INVALID:{error}"))?;
    let evaluator = contained(&root, input.evaluator_path, "EVALUATOR")?;
    let program = contained(&root, input.program_path, "PROGRAM")?;
    let attempt = contained(&root, input.attempt_path, "ATTEMPT")?;
    exact_file(&evaluator, input.evaluator_sha256, "EVALUATOR")?;
    let program_bytes = exact_file(&program, input.program_sha256, "PROGRAM")?;
    let attempt_bytes = exact_file(&attempt, input.attempt_sha256, "ATTEMPT")?;
    let program_record: Value = serde_json::from_slice(&program_bytes)
        .map_err(|_| "C19_PROGRAM_MALFORMED_JSON".to_owned())?;
    let attempt_record: Value = serde_json::from_slice(&attempt_bytes)
        .map_err(|_| "C19_ATTEMPT_MALFORMED_JSON".to_owned())?;
    if program_record.get("program_id").and_then(Value::as_str) != Some(input.expected_program_id) {
        return Err("C19_PROGRAM_ID_MISMATCH".to_owned());
    }
    if attempt_record.get("program_id").and_then(Value::as_str) != Some(input.expected_program_id) {
        return Err("C19_ATTEMPT_PROGRAM_ID_MISMATCH".to_owned());
    }
    if attempt_record.get("attempt_id").and_then(Value::as_str) != Some(input.expected_attempt_id) {
        return Err("C19_ATTEMPT_ID_MISMATCH".to_owned());
    }

    let mut child = Command::new(&evaluator)
        .arg("evaluate")
        .arg("--program")
        .arg(&program)
        .arg("--attempt")
        .arg(&attempt)
        .arg("--repository-root")
        .arg(&root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("C19_EVALUATOR_SPAWN_FAILED:{error}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "C19_EVALUATOR_STDOUT_MISSING".to_owned())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "C19_EVALUATOR_STDERR_MISSING".to_owned())?;
    let maximum = input.max_output_bytes;
    let stdout_reader = thread::spawn(move || read_bounded(stdout, maximum));
    let stderr_reader = thread::spawn(move || read_bounded(stderr, maximum));
    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if started.elapsed() < input.timeout => {
                thread::sleep(Duration::from_millis(5))
            }
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                let _ = stdout_reader.join();
                let _ = stderr_reader.join();
                return Err("C19_EVALUATOR_TIMEOUT".to_owned());
            }
            Err(error) => return Err(format!("C19_EVALUATOR_WAIT_FAILED:{error}")),
        }
    };
    let (stdout, stdout_overflow) = stdout_reader
        .join()
        .map_err(|_| "C19_EVALUATOR_OUTPUT_THREAD_FAILED".to_owned())?;
    let (_, stderr_overflow) = stderr_reader
        .join()
        .map_err(|_| "C19_EVALUATOR_OUTPUT_THREAD_FAILED".to_owned())?;
    if stdout_overflow || stderr_overflow {
        return Err("C19_EVALUATOR_OUTPUT_LIMIT_EXCEEDED".to_owned());
    }
    let evaluation: Value =
        serde_json::from_slice(&stdout).map_err(|_| "C19_EVALUATOR_MALFORMED_JSON".to_owned())?;
    let decision = evaluation.get("decision").and_then(Value::as_str);
    if !matches!(
        decision,
        Some("CONTINUE" | "STOP" | "READY_FOR_HUMAN_TEST" | "REQUEST_TERMINAL_CONFIRMATION")
    ) {
        return Err("C19_EVALUATOR_UNKNOWN_DECISION".to_owned());
    }
    let expected_exit = if decision == Some("STOP") { 2 } else { 0 };
    if status.code() != Some(expected_exit) {
        return Err(format!(
            "C19_EVALUATOR_EXIT_MISMATCH:{}",
            status.code().unwrap_or(-1)
        ));
    }
    Ok(evaluation)
}

pub fn evaluate_exact(input: C19GateInput<'_>) -> C19GateResult {
    let evaluation = match invoke(&input) {
        Ok(value) => value,
        Err(error) => return fail(&input, error),
    };
    if evaluation.get("program_id").and_then(Value::as_str) != Some(input.expected_program_id) {
        return fail(&input, "C19_EVALUATOR_PROGRAM_ID_MISMATCH");
    }
    if evaluation.get("attempt_id").and_then(Value::as_str) != Some(input.expected_attempt_id) {
        return fail(&input, "C19_EVALUATOR_ATTEMPT_ID_MISMATCH");
    }
    if input.are_result.get("kind").and_then(Value::as_str) != Some("direct")
        || evaluation.get("decision").and_then(Value::as_str) != Some("CONTINUE")
    {
        return fail(&input, "C19_CONTINUATION_NOT_PERMITTED");
    }
    let next_action = evaluation.get("next_action").and_then(Value::as_object);
    if next_action
        .and_then(|value| value.get("kind"))
        .and_then(Value::as_str)
        != Some("advance-authorized-stage")
        || next_action
            .and_then(|value| value.get("stage"))
            .and_then(Value::as_str)
            != Some(input.expected_stage)
        || input.are_result.get("next_stage").and_then(Value::as_str) != Some(input.expected_stage)
    {
        return fail(&input, "C19_STAGE_MISMATCH");
    }
    if input
        .are_result
        .get("authority_effect")
        .and_then(Value::as_str)
        != Some("none")
        || evaluation.get("authority_effect").and_then(Value::as_str) != Some("none")
        || input
            .are_result
            .get("effect_authorized")
            .and_then(Value::as_bool)
            != Some(false)
        || evaluation.get("effect_authorized").and_then(Value::as_bool) != Some(false)
    {
        return fail(&input, "C19_EFFECT_CEILING_VIOLATION");
    }
    C19GateResult {
        event: NodeEvent::succeeded(
            format!("{}:gate", input.command_id),
            input.node_id,
            json!({
                "stage": input.expected_stage,
                "decision": "CONTINUE",
                "next_action": evaluation["next_action"],
                "effect_authorized": false,
                "authority_effect": "none",
                "program_sha256": input.program_sha256,
                "attempt_sha256": input.attempt_sha256,
                "evaluator_sha256": input.evaluator_sha256
            }),
        )
        .bind_command(input.command_id),
        work_emitted: false,
        authority_effect: "none",
        external_effect: "none",
    }
}
