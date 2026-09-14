use crate::{CompletionOutcome, OrchestratorRuntime, Receipt};
use serde::{de::Error as _, Deserialize, Deserializer, Serialize};

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "operation", rename_all = "snake_case")]
pub enum WorkerRequest {
    Poll {
        worker_id: String,
        capabilities: Vec<String>,
        now_ms: u128,
        ttl_ms: u128,
    },
    Begin {
        run_id: String,
        command_id: String,
        worker_id: String,
        fencing_token: u64,
        now_ms: u128,
    },
    Complete {
        run_id: String,
        expected_revision: u64,
        receipt: Box<Receipt>,
        now_ms: u128,
    },
}

impl<'de> Deserialize<'de> for WorkerRequest {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct Poll {
            worker_id: String,
            capabilities: Vec<String>,
            now_ms: u128,
            ttl_ms: u128,
        }
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct Begin {
            run_id: String,
            command_id: String,
            worker_id: String,
            fencing_token: u64,
            now_ms: u128,
        }
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct Complete {
            run_id: String,
            expected_revision: u64,
            receipt: Box<Receipt>,
            now_ms: u128,
        }

        let mut value = serde_json::Value::deserialize(deserializer)?;
        let object = value
            .as_object_mut()
            .ok_or_else(|| D::Error::custom("worker request must be an object"))?;
        let operation = object
            .remove("operation")
            .and_then(|value| value.as_str().map(str::to_owned))
            .ok_or_else(|| D::Error::custom("worker request operation is required"))?;
        match operation.as_str() {
            "poll" => {
                let request: Poll = serde_json::from_value(value).map_err(D::Error::custom)?;
                Ok(Self::Poll {
                    worker_id: request.worker_id,
                    capabilities: request.capabilities,
                    now_ms: request.now_ms,
                    ttl_ms: request.ttl_ms,
                })
            }
            "begin" => {
                let request: Begin = serde_json::from_value(value).map_err(D::Error::custom)?;
                Ok(Self::Begin {
                    run_id: request.run_id,
                    command_id: request.command_id,
                    worker_id: request.worker_id,
                    fencing_token: request.fencing_token,
                    now_ms: request.now_ms,
                })
            }
            "complete" => {
                let request: Complete =
                    serde_json::from_value(value).map_err(D::Error::custom)?;
                Ok(Self::Complete {
                    run_id: request.run_id,
                    expected_revision: request.expected_revision,
                    receipt: request.receipt,
                    now_ms: request.now_ms,
                })
            }
            _ => Err(D::Error::custom("unknown worker request operation")),
        }
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WorkerResponse {
    pub ok: bool,
    pub kind: String,
    pub value: serde_json::Value,
    pub error: Option<String>,
}
#[derive(Clone, Debug)]
pub struct WorkerApi {
    runtime: OrchestratorRuntime,
}
impl WorkerApi {
    pub fn new(runtime: OrchestratorRuntime) -> Self {
        Self { runtime }
    }
    pub fn handle(&self, request: WorkerRequest) -> WorkerResponse {
        let result: Result<(String, serde_json::Value), String> = (|| match request {
            WorkerRequest::Poll {
                worker_id,
                capabilities,
                now_ms,
                ttl_ms,
            } => {
                let v = self
                    .runtime
                    .poll(&worker_id, &capabilities, now_ms, ttl_ms)?;
                Ok((
                    if v.is_some() { "assignment" } else { "idle" }.into(),
                    serde_json::to_value(v).map_err(|e| e.to_string())?,
                ))
            }
            WorkerRequest::Begin {
                run_id,
                command_id,
                worker_id,
                fencing_token,
                now_ms,
            } => {
                let v = self.runtime.run(&run_id)?.begin(
                    &command_id,
                    &worker_id,
                    fencing_token,
                    now_ms,
                )?;
                Ok((
                    "begun".into(),
                    serde_json::to_value(v).map_err(|e| e.to_string())?,
                ))
            }
            WorkerRequest::Complete {
                run_id,
                expected_revision,
                receipt,
                now_ms,
            } => {
                let v = self
                    .runtime
                    .run(&run_id)?
                    .complete(expected_revision, *receipt, now_ms)?;
                match v {
                    CompletionOutcome::Accepted(history) => Ok((
                        "accepted".into(),
                        serde_json::to_value(history).map_err(|e| e.to_string())?,
                    )),
                    CompletionOutcome::Duplicate(history) => Ok((
                        "duplicate".into(),
                        serde_json::to_value(history).map_err(|e| e.to_string())?,
                    )),
                    CompletionOutcome::ReceiptOnly(assessment) => Ok((
                        "receipt_only".into(),
                        serde_json::to_value(assessment).map_err(|e| e.to_string())?,
                    )),
                    CompletionOutcome::Conflict { expected, actual } => Ok((
                        "conflict".into(),
                        serde_json::json!({"expected":expected,"actual":actual}),
                    )),
                }
            }
        })();
        match result {
            Ok((kind, value)) => WorkerResponse {
                ok: true,
                kind,
                value,
                error: None,
            },
            Err(error) => WorkerResponse {
                ok: false,
                kind: "error".into(),
                value: serde_json::Value::Null,
                error: Some(error),
            },
        }
    }
}
