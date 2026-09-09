use crate::dag::{DagCommand, NodeEvent};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

pub trait BatchExecutor {
    fn execute_batch(
        &self,
        commands: &[DagCommand],
        max_parallelism: usize,
        timeout: Duration,
    ) -> Vec<NodeEvent>;
}

#[derive(Clone, Debug)]
pub struct StructuredAgentShell {
    pub script_path: PathBuf,
    pub run_root: PathBuf,
    pub api_base: Option<String>,
    pub request_timeout: Duration,
}

fn digest(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn safe_component(value: &str) -> Result<&str, String> {
    if !value.is_empty()
        && value.len() <= 160
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
    {
        Ok(value)
    } else {
        Err("EXECUTOR_NODE_ID_INVALID".to_owned())
    }
}

impl StructuredAgentShell {
    pub fn execute_one(&self, command: &DagCommand) -> NodeEvent {
        self.execute_one_with_timeout(command, self.request_timeout)
            .bind_command(command.command_id.clone())
    }

    fn execute_one_with_timeout(&self, command: &DagCommand, timeout: Duration) -> NodeEvent {
        let node_id = match safe_component(&command.node_id) {
            Ok(value) => value,
            Err(error) => {
                return NodeEvent::failed(
                    format!("{}:invalid", command.command_id),
                    command.node_id.clone(),
                    error,
                )
            }
        };
        let input_dir = self.run_root.join("inputs");
        let output_dir = self.run_root.join("outputs");
        if let Err(error) =
            fs::create_dir_all(&input_dir).and_then(|_| fs::create_dir_all(&output_dir))
        {
            return NodeEvent::retryable_failure(
                format!("{}:io", command.command_id),
                command.node_id.clone(),
                format!("EXECUTOR_DIRECTORY_ERROR:{error}"),
            );
        }
        let stem = format!("{node_id}-attempt-{}", command.attempt);
        let input_path = input_dir.join(format!("{stem}.json"));
        let output_path = output_dir.join(format!("{stem}.json"));
        let materialized_input = match self.materialize_input(&command.input) {
            Ok(value) => value,
            Err(error) => {
                return NodeEvent::failed(
                    format!("{}:materialize", command.command_id),
                    command.node_id.clone(),
                    error,
                )
            }
        };
        let input_bytes = match serde_json::to_vec_pretty(&materialized_input) {
            Ok(mut bytes) => {
                bytes.push(b'\n');
                bytes
            }
            Err(error) => {
                return NodeEvent::failed(
                    format!("{}:serialize", command.command_id),
                    command.node_id.clone(),
                    format!("EXECUTOR_INPUT_SERIALIZE_ERROR:{error}"),
                )
            }
        };
        if let Err(error) = fs::write(&input_path, &input_bytes) {
            return NodeEvent::retryable_failure(
                format!("{}:input", command.command_id),
                command.node_id.clone(),
                format!("EXECUTOR_INPUT_WRITE_ERROR:{error}"),
            );
        }
        let mut process = Command::new("bash");
        process
            .arg(&self.script_path)
            .arg(&command.contract)
            .arg(&command.role_id)
            .arg(&input_path)
            .arg(&output_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(api_base) = &self.api_base {
            process.env("API_BASE", api_base);
        }
        let mut child = match process.spawn() {
            Ok(child) => child,
            Err(error) => {
                return NodeEvent::retryable_failure(
                    format!("{}:spawn", command.command_id),
                    command.node_id.clone(),
                    format!("EXECUTOR_SPAWN_ERROR:{error}"),
                )
            }
        };
        let started = Instant::now();
        loop {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) if started.elapsed() < timeout => {
                    thread::sleep(Duration::from_millis(10));
                }
                Ok(None) => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return NodeEvent::retryable_failure(
                        format!("{}:timeout", command.command_id),
                        command.node_id.clone(),
                        "EXECUTOR_REQUEST_TIMEOUT",
                    );
                }
                Err(error) => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return NodeEvent::retryable_failure(
                        format!("{}:wait", command.command_id),
                        command.node_id.clone(),
                        format!("EXECUTOR_WAIT_ERROR:{error}"),
                    );
                }
            }
        }
        let result = match child.wait_with_output() {
            Ok(result) => result,
            Err(error) => {
                return NodeEvent::retryable_failure(
                    format!("{}:collect", command.command_id),
                    command.node_id.clone(),
                    format!("EXECUTOR_OUTPUT_COLLECT_ERROR:{error}"),
                )
            }
        };
        if !result.status.success() {
            return NodeEvent::retryable_failure(
                format!("{}:exit", command.command_id),
                command.node_id.clone(),
                format!(
                    "EXECUTOR_EXIT:{}:{}",
                    result.status.code().unwrap_or(-1),
                    String::from_utf8_lossy(&result.stderr).trim()
                ),
            );
        }
        let output_bytes = match fs::read(&output_path) {
            Ok(bytes) => bytes,
            Err(error) => {
                return NodeEvent::retryable_failure(
                    format!("{}:output", command.command_id),
                    command.node_id.clone(),
                    format!("EXECUTOR_OUTPUT_READ_ERROR:{error}"),
                )
            }
        };
        if serde_json::from_slice::<Value>(&output_bytes).is_err() {
            return NodeEvent::failed(
                format!("{}:invalid-json", command.command_id),
                command.node_id.clone(),
                "EXECUTOR_OUTPUT_INVALID_JSON",
            );
        }
        let receipt_path = PathBuf::from(format!("{}.receipt.json", output_path.display()));
        NodeEvent::succeeded(
            format!("{}:succeeded", command.command_id),
            command.node_id.clone(),
            json!({
                "path": output_path,
                "sha256": digest(&output_bytes),
                "size": output_bytes.len(),
                "receipt_path": receipt_path,
            }),
        )
    }

    pub fn output_path(&self, command: &DagCommand) -> PathBuf {
        self.run_root.join("outputs").join(format!(
            "{}-attempt-{}.json",
            command.node_id, command.attempt
        ))
    }

    pub fn script_exists(&self) -> bool {
        Path::new(&self.script_path).is_file()
    }

    fn materialize_input(&self, input: &Value) -> Result<Value, String> {
        let mut materialized = input
            .as_object()
            .cloned()
            .ok_or_else(|| "EXECUTOR_INPUT_MANIFEST_INVALID".to_owned())?;
        let dependencies = materialized
            .get("dependencies")
            .and_then(Value::as_array)
            .ok_or_else(|| "EXECUTOR_DEPENDENCIES_INVALID".to_owned())?;
        if dependencies.is_empty() {
            return Ok(Value::Object(materialized));
        }
        let output_root = fs::canonicalize(self.run_root.join("outputs"))
            .map_err(|_| "EXECUTOR_OUTPUT_ROOT_MISSING".to_owned())?;
        let mut expanded = Vec::with_capacity(dependencies.len());
        for dependency in dependencies {
            let mut dependency = dependency
                .as_object()
                .cloned()
                .ok_or_else(|| "EXECUTOR_DEPENDENCY_INVALID".to_owned())?;
            let dependency_id = dependency
                .get("node_id")
                .and_then(Value::as_str)
                .and_then(|value| safe_component(value).ok())
                .ok_or_else(|| "EXECUTOR_DEPENDENCY_NODE_ID_INVALID".to_owned())?;
            let output_ref = dependency
                .get("output_ref")
                .and_then(Value::as_object)
                .ok_or_else(|| "EXECUTOR_DEPENDENCY_REF_INVALID".to_owned())?;
            let path = output_ref
                .get("path")
                .and_then(Value::as_str)
                .map(PathBuf::from)
                .ok_or_else(|| "EXECUTOR_DEPENDENCY_PATH_INVALID".to_owned())?;
            let expected_size = output_ref
                .get("size")
                .and_then(Value::as_u64)
                .ok_or_else(|| "EXECUTOR_DEPENDENCY_SIZE_INVALID".to_owned())?;
            let expected_digest = output_ref
                .get("sha256")
                .and_then(Value::as_str)
                .ok_or_else(|| "EXECUTOR_DEPENDENCY_DIGEST_INVALID".to_owned())?;
            let metadata = fs::symlink_metadata(&path)
                .map_err(|_| "EXECUTOR_DEPENDENCY_MISSING".to_owned())?;
            if metadata.file_type().is_symlink() || !metadata.is_file() {
                return Err("EXECUTOR_DEPENDENCY_NOT_REGULAR_FILE".to_owned());
            }
            let canonical_path =
                fs::canonicalize(&path).map_err(|_| "EXECUTOR_DEPENDENCY_MISSING".to_owned())?;
            if !canonical_path.starts_with(&output_root) {
                return Err("EXECUTOR_DEPENDENCY_PATH_ESCAPE".to_owned());
            }
            let expected_prefix = format!("{dependency_id}-attempt-");
            if !canonical_path
                .file_name()
                .and_then(|value| value.to_str())
                .is_some_and(|value| {
                    value.starts_with(&expected_prefix) && value.ends_with(".json")
                })
            {
                return Err("EXECUTOR_DEPENDENCY_ID_PATH_MISMATCH".to_owned());
            }
            let bytes = fs::read(&canonical_path)
                .map_err(|_| "EXECUTOR_DEPENDENCY_READ_ERROR".to_owned())?;
            if bytes.len() as u64 != expected_size {
                return Err("EXECUTOR_DEPENDENCY_SIZE_MISMATCH".to_owned());
            }
            if digest(&bytes) != expected_digest {
                return Err("EXECUTOR_DEPENDENCY_DIGEST_MISMATCH".to_owned());
            }
            let output = serde_json::from_slice::<Value>(&bytes)
                .map_err(|_| "EXECUTOR_DEPENDENCY_INVALID_JSON".to_owned())?;
            dependency.insert("output".to_owned(), output);
            expanded.push(Value::Object(dependency));
        }
        materialized.insert("dependencies".to_owned(), Value::Array(expanded));
        Ok(Value::Object(materialized))
    }
}

impl BatchExecutor for StructuredAgentShell {
    fn execute_batch(
        &self,
        commands: &[DagCommand],
        max_parallelism: usize,
        timeout: Duration,
    ) -> Vec<NodeEvent> {
        let width = max_parallelism.max(1);
        let request_timeout = self.request_timeout.min(timeout);
        let mut events = Vec::new();
        for chunk in commands.chunks(width) {
            let mut chunk_events = thread::scope(|scope| {
                let handles = chunk
                    .iter()
                    .cloned()
                    .map(|command| {
                        scope.spawn(move || {
                            let command_id = command.command_id.clone();
                            self.execute_one_with_timeout(&command, request_timeout)
                                .bind_command(command_id)
                        })
                    })
                    .collect::<Vec<_>>();
                handles
                    .into_iter()
                    .map(|handle| {
                        handle
                            .join()
                            .expect("structured-agent worker must not panic")
                    })
                    .collect::<Vec<_>>()
            });
            events.append(&mut chunk_events);
        }
        events
    }
}
