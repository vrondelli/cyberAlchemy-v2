use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tempfile::NamedTempFile;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct StructuralTransition {
    pub stream_id: String,
    pub expected_cursor_identity: Option<String>,
    pub event_id: String,
    pub accepted_event: Value,
    pub next_cursor: Value,
    pub next_cursor_identity: String,
    pub command_intents: Vec<Value>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AppendOutcome {
    Accepted,
    Duplicate,
    DivergentDuplicate,
    Conflict,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AcceptedHistoryView {
    pub events: Vec<Value>,
    pub cursor: Option<Value>,
    pub cursor_identity: Option<String>,
    pub command_intents: Vec<Value>,
    pub transitions: Vec<StructuralTransition>,
}

pub trait AcceptedHistoryPort {
    fn read(&self, stream_id: &str) -> AcceptedHistoryView;
    fn compare_and_append(&mut self, transition: StructuralTransition) -> AppendOutcome;
}

#[derive(Clone, Default, Serialize, Deserialize)]
struct StreamState {
    events: Vec<Value>,
    cursor: Option<Value>,
    cursor_identity: Option<String>,
    command_intents: Vec<Value>,
    event_digests: BTreeMap<String, String>,
    transitions: Vec<StructuralTransition>,
    transition_digests: Vec<String>,
    absolute_deadline_unix_ms: Option<u128>,
    stream_identity_digest: Option<String>,
}

#[derive(Default)]
pub struct InMemoryAcceptedHistory {
    streams: BTreeMap<String, StreamState>,
}

impl AcceptedHistoryPort for InMemoryAcceptedHistory {
    fn read(&self, stream_id: &str) -> AcceptedHistoryView {
        let state = self.streams.get(stream_id);
        AcceptedHistoryView {
            events: state.map(|value| value.events.clone()).unwrap_or_default(),
            cursor: state.and_then(|value| value.cursor.clone()),
            cursor_identity: state.and_then(|value| value.cursor_identity.clone()),
            command_intents: state
                .map(|value| value.command_intents.clone())
                .unwrap_or_default(),
            transitions: state
                .map(|value| value.transitions.clone())
                .unwrap_or_default(),
        }
    }

    fn compare_and_append(&mut self, transition: StructuralTransition) -> AppendOutcome {
        if transition
            .accepted_event
            .get("event_id")
            .and_then(Value::as_str)
            != Some(transition.event_id.as_str())
            || digest(&transition.next_cursor) != transition.next_cursor_identity
        {
            return AppendOutcome::Conflict;
        }
        let digest = transition_digest(&transition);
        let state = self
            .streams
            .entry(transition.stream_id.clone())
            .or_default();
        if let Some(existing) = state.event_digests.get(&transition.event_id) {
            return if existing == &digest {
                AppendOutcome::Duplicate
            } else {
                AppendOutcome::DivergentDuplicate
            };
        }
        if state.cursor_identity != transition.expected_cursor_identity {
            return AppendOutcome::Conflict;
        }
        state
            .event_digests
            .insert(transition.event_id.clone(), digest.clone());
        state.events.push(transition.accepted_event.clone());
        state.cursor = Some(transition.next_cursor.clone());
        state.cursor_identity = Some(transition.next_cursor_identity.clone());
        state
            .command_intents
            .extend(transition.command_intents.clone());
        state.transitions.push(transition);
        state.transition_digests.push(digest);
        AppendOutcome::Accepted
    }
}

fn digest(value: &Value) -> String {
    format!(
        "sha256:{:x}",
        Sha256::digest(serde_json::to_vec(value).expect("JSON serializes"))
    )
}

fn transition_digest(transition: &StructuralTransition) -> String {
    digest(&serde_json::to_value(transition).expect("transition serializes"))
}

pub fn stream_identity(identity: &Value) -> String {
    digest(identity)
}

#[derive(Clone, Default, Serialize, Deserialize)]
struct DurableState {
    streams: BTreeMap<String, StreamState>,
    command_receipts: BTreeMap<String, Value>,
    command_receipt_digests: BTreeMap<String, String>,
    command_input_digests: BTreeMap<String, String>,
    commands_in_progress: BTreeSet<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum ResumeDisposition {
    Execute,
    Completed(Value),
}

pub struct FileAcceptedHistory {
    path: PathBuf,
    state: DurableState,
}

impl FileAcceptedHistory {
    pub fn open(path: impl Into<PathBuf>) -> Result<Self, String> {
        let path = path.into();
        let state = if path.exists() {
            let bytes = fs::read(&path).map_err(|error| format!("HISTORY_READ_FAILED:{error}"))?;
            serde_json::from_slice(&bytes).map_err(|error| format!("HISTORY_CORRUPT:{error}"))?
        } else {
            DurableState::default()
        };
        let this = Self { path, state };
        this.verify_integrity()?;
        Ok(this)
    }

    fn verify_integrity(&self) -> Result<(), String> {
        for (stream_id, state) in &self.state.streams {
            if state.stream_identity_digest.as_deref() != Some(stream_id.as_str()) {
                return Err("HISTORY_STREAM_IDENTITY_MISMATCH".to_owned());
            }
            if state.transitions.len() != state.transition_digests.len() {
                return Err("HISTORY_CORRUPT".to_owned());
            }
            let mut prior_cursor_identity: Option<String> = None;
            for (transition, expected) in state.transitions.iter().zip(&state.transition_digests) {
                if transition_digest(transition) != *expected {
                    return Err("HISTORY_CORRUPT".to_owned());
                }
                if transition.expected_cursor_identity != prior_cursor_identity
                    || digest(&transition.next_cursor) != transition.next_cursor_identity
                {
                    return Err("HISTORY_CORRUPT".to_owned());
                }
                prior_cursor_identity = Some(transition.next_cursor_identity.clone());
            }
            let derived_events = state
                .transitions
                .iter()
                .map(|transition| transition.accepted_event.clone())
                .collect::<Vec<_>>();
            let derived_commands = state
                .transitions
                .iter()
                .flat_map(|transition| transition.command_intents.clone())
                .collect::<Vec<_>>();
            let derived_event_digests = state
                .transitions
                .iter()
                .map(|transition| (transition.event_id.clone(), transition_digest(transition)))
                .collect::<BTreeMap<_, _>>();
            let derived_cursor = state
                .transitions
                .last()
                .map(|transition| transition.next_cursor.clone());
            let derived_cursor_identity = state
                .transitions
                .last()
                .map(|transition| transition.next_cursor_identity.clone());
            if state.events != derived_events
                || state.command_intents != derived_commands
                || state.event_digests != derived_event_digests
                || state.cursor != derived_cursor
                || state.cursor_identity != derived_cursor_identity
                || state.cursor.as_ref().map(digest) != state.cursor_identity
            {
                return Err("HISTORY_CORRUPT".to_owned());
            }
        }
        if self.state.command_receipts.len() != self.state.command_receipt_digests.len()
            || self.state.command_receipts.iter().any(|(id, receipt)| {
                self.state.command_receipt_digests.get(id) != Some(&digest(receipt))
                    || !self.state.command_input_digests.contains_key(id)
            })
            || self
                .state
                .commands_in_progress
                .iter()
                .any(|id| !self.state.command_input_digests.contains_key(id))
        {
            return Err("HISTORY_CORRUPT".to_owned());
        }
        Ok(())
    }

    fn persist(&self) -> Result<(), String> {
        let parent = self.path.parent().unwrap_or_else(|| Path::new("."));
        fs::create_dir_all(parent).map_err(|error| format!("HISTORY_WRITE_FAILED:{error}"))?;
        let mut temporary = NamedTempFile::new_in(parent)
            .map_err(|error| format!("HISTORY_WRITE_FAILED:{error}"))?;
        let bytes = serde_json::to_vec_pretty(&self.state)
            .map_err(|error| format!("HISTORY_WRITE_FAILED:{error}"))?;
        temporary
            .write_all(&bytes)
            .and_then(|_| temporary.as_file().sync_all())
            .map_err(|error| format!("HISTORY_WRITE_FAILED:{error}"))?;
        temporary
            .persist(&self.path)
            .map_err(|error| format!("HISTORY_WRITE_FAILED:{error}"))?;
        Ok(())
    }

    pub fn open_stream(
        &mut self,
        stream_id: &str,
        identity: &Value,
        absolute_deadline_unix_ms: u128,
        now_unix_ms: u128,
    ) -> Result<(), String> {
        if now_unix_ms >= absolute_deadline_unix_ms {
            return Err("GLOBAL_DEADLINE_EXCEEDED".to_owned());
        }
        let identity = stream_identity(identity);
        if stream_id != identity {
            return Err("HISTORY_STREAM_IDENTITY_MISMATCH".to_owned());
        }
        let state = self.state.streams.entry(stream_id.to_owned()).or_default();
        if let Some(existing) = &state.stream_identity_digest {
            if existing != &identity
                || state.absolute_deadline_unix_ms != Some(absolute_deadline_unix_ms)
            {
                return Err("HISTORY_STREAM_IDENTITY_MISMATCH".to_owned());
            }
            return Ok(());
        }
        state.stream_identity_digest = Some(identity);
        state.absolute_deadline_unix_ms = Some(absolute_deadline_unix_ms);
        self.persist()
    }

    pub fn assert_resumable(&self, stream_id: &str, now_unix_ms: u128) -> Result<(), String> {
        let state = self
            .state
            .streams
            .get(stream_id)
            .ok_or_else(|| "HISTORY_STREAM_MISSING".to_owned())?;
        if state
            .absolute_deadline_unix_ms
            .is_some_and(|deadline| now_unix_ms >= deadline)
        {
            return Err("GLOBAL_DEADLINE_EXCEEDED".to_owned());
        }
        self.verify_integrity()
    }

    pub fn record_command_receipt(
        &mut self,
        command_id: &str,
        receipt: Value,
    ) -> Result<(), String> {
        let receipt_digest = digest(&receipt);
        if let Some(existing) = self.state.command_receipt_digests.get(command_id) {
            return if existing == &receipt_digest {
                Ok(())
            } else {
                Err("COMMAND_RECEIPT_CONFLICT".to_owned())
            };
        }
        if !self.state.commands_in_progress.contains(command_id)
            || !self.state.command_input_digests.contains_key(command_id)
        {
            return Err("COMMAND_NOT_BEGUN".to_owned());
        }
        let prior = self.state.clone();
        self.state
            .command_receipts
            .insert(command_id.to_owned(), receipt);
        self.state
            .command_receipt_digests
            .insert(command_id.to_owned(), receipt_digest);
        self.state.commands_in_progress.remove(command_id);
        if let Err(error) = self.persist() {
            self.state = prior;
            return Err(error);
        }
        Ok(())
    }

    pub fn command_receipt(&self, command_id: &str) -> Option<&Value> {
        self.state.command_receipts.get(command_id)
    }

    pub fn begin_command(
        &mut self,
        command_id: &str,
        exact_input: &Value,
    ) -> Result<ResumeDisposition, String> {
        let input_digest = digest(exact_input);
        if let Some(existing) = self.state.command_input_digests.get(command_id) {
            if existing != &input_digest {
                return Err("COMMAND_RECEIPT_CONFLICT".to_owned());
            }
            if let Some(receipt) = self.state.command_receipts.get(command_id) {
                return Ok(ResumeDisposition::Completed(receipt.clone()));
            }
            if self.state.commands_in_progress.contains(command_id) {
                return Err("REPOSITORY_RECONCILIATION_REQUIRED".to_owned());
            }
        }
        let prior = self.state.clone();
        self.state
            .command_input_digests
            .insert(command_id.to_owned(), input_digest);
        self.state
            .commands_in_progress
            .insert(command_id.to_owned());
        if let Err(error) = self.persist() {
            self.state = prior;
            return Err(error);
        }
        Ok(ResumeDisposition::Execute)
    }
}

impl AcceptedHistoryPort for FileAcceptedHistory {
    fn read(&self, stream_id: &str) -> AcceptedHistoryView {
        let state = self.state.streams.get(stream_id);
        AcceptedHistoryView {
            events: state.map(|value| value.events.clone()).unwrap_or_default(),
            cursor: state.and_then(|value| value.cursor.clone()),
            cursor_identity: state.and_then(|value| value.cursor_identity.clone()),
            command_intents: state
                .map(|value| value.command_intents.clone())
                .unwrap_or_default(),
            transitions: state
                .map(|value| value.transitions.clone())
                .unwrap_or_default(),
        }
    }

    fn compare_and_append(&mut self, transition: StructuralTransition) -> AppendOutcome {
        let stream_id = transition.stream_id.clone();
        let prior = self.state.clone();
        let mut memory = InMemoryAcceptedHistory {
            streams: self.state.streams.clone(),
        };
        let outcome = memory.compare_and_append(transition);
        if outcome != AppendOutcome::Accepted {
            return outcome;
        }
        self.state.streams = memory.streams;
        if self.persist().is_err() {
            self.state = prior;
            return AppendOutcome::Conflict;
        }
        debug_assert!(self.state.streams.contains_key(&stream_id));
        AppendOutcome::Accepted
    }
}

#[derive(Clone, Debug)]
pub struct AdapterRequest {
    pub authority_ref: String,
    pub idempotency_key: String,
    pub transition: StructuralTransition,
}

fn accept_adapter_event(
    port: &mut dyn AcceptedHistoryPort,
    request: AdapterRequest,
) -> Result<AppendOutcome, String> {
    if request.authority_ref.trim().is_empty() {
        return Err("AUTHORITY_REF_REQUIRED".to_owned());
    }
    if request.idempotency_key != request.transition.event_id {
        return Err("IDEMPOTENCY_KEY_EVENT_MISMATCH".to_owned());
    }
    Ok(port.compare_and_append(request.transition))
}

pub fn accept_http_event(
    port: &mut dyn AcceptedHistoryPort,
    request: AdapterRequest,
) -> Result<AppendOutcome, String> {
    accept_adapter_event(port, request)
}

pub fn accept_grpc_event(
    port: &mut dyn AcceptedHistoryPort,
    request: AdapterRequest,
) -> Result<AppendOutcome, String> {
    accept_adapter_event(port, request)
}
