use crate::model::digest;
use rwo_core::{DagCommand, DagCursor, DagTransition, NodeEvent};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ControlRecord {
    pub control_id: String,
    pub kind: String,
    pub reason: String,
    pub at_ms: u128,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HistoryState {
    pub schema_version: String,
    pub run_id: String,
    pub revision: u64,
    pub cursor: DagCursor,
    pub accepted_events: Vec<NodeEvent>,
    pub pending_commands: BTreeMap<String, DagCommand>,
    pub control_records: Vec<ControlRecord>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum AcceptOutcome {
    Accepted(HistoryState),
    Duplicate(HistoryState),
    Conflict { expected: u64, actual: u64 },
}

pub trait AcceptedHistory {
    fn load(&self) -> Result<HistoryState, String>;
    fn accept(
        &self,
        expected_revision: u64,
        event: NodeEvent,
        transition: DagTransition,
    ) -> Result<AcceptOutcome, String>;
    fn accept_control(
        &self,
        expected_revision: u64,
        record: ControlRecord,
        transition: DagTransition,
    ) -> Result<AcceptOutcome, String>;
}

#[derive(Clone, Debug)]
pub struct FileAcceptedHistory {
    path: PathBuf,
}

impl FileAcceptedHistory {
    pub fn initialize(
        path: impl Into<PathBuf>,
        run_id: &str,
        transition: DagTransition,
    ) -> Result<Self, String> {
        let path = path.into();
        if path.exists() {
            return Err("HISTORY_ALREADY_EXISTS".to_owned());
        }
        let state = HistoryState {
            schema_version: "orchestrator-accepted-history/v1".to_owned(),
            run_id: run_id.to_owned(),
            revision: 0,
            cursor: transition.cursor,
            accepted_events: Vec::new(),
            pending_commands: transition
                .commands
                .into_iter()
                .map(|c| (c.command_id.clone(), c))
                .collect(),
            control_records: Vec::new(),
        };
        atomic_json(&path, &state)?;
        Ok(Self { path })
    }
    pub fn open(path: impl Into<PathBuf>) -> Result<Self, String> {
        let value = Self { path: path.into() };
        value.load()?;
        Ok(value)
    }
    pub fn path(&self) -> &Path {
        &self.path
    }
}

impl AcceptedHistory for FileAcceptedHistory {
    fn load(&self) -> Result<HistoryState, String> {
        read_json(&self.path)
    }

    fn accept(
        &self,
        expected_revision: u64,
        event: NodeEvent,
        transition: DagTransition,
    ) -> Result<AcceptOutcome, String> {
        let mut state = self.load()?;
        if let Some(existing) = state
            .accepted_events
            .iter()
            .find(|e| e.event_id == event.event_id)
        {
            return if digest(&existing.to_value())? == digest(&event.to_value())? {
                Ok(AcceptOutcome::Duplicate(state))
            } else {
                Err(format!("HISTORY_DIVERGENT_EVENT:{}", event.event_id))
            };
        }
        if state.revision != expected_revision {
            return Ok(AcceptOutcome::Conflict {
                expected: expected_revision,
                actual: state.revision,
            });
        }
        let event_digest = digest(&event.to_value())?;
        if transition.cursor.accepted_events.get(&event.event_id) != Some(&event_digest) {
            return Err("HISTORY_TRANSITION_EVENT_MISMATCH".to_owned());
        }
        if let Some(command_id) = &event.command_id {
            if state.pending_commands.remove(command_id).is_none() {
                return Err(format!("HISTORY_COMMAND_NOT_PENDING:{command_id}"));
            }
        }
        for command in transition.commands {
            if state
                .pending_commands
                .insert(command.command_id.clone(), command)
                .is_some()
            {
                return Err("HISTORY_COMMAND_DUPLICATE".to_owned());
            }
        }
        state.cursor = transition.cursor;
        state.accepted_events.push(event);
        state.revision += 1;
        atomic_json(&self.path, &state)?;
        Ok(AcceptOutcome::Accepted(state))
    }

    fn accept_control(
        &self,
        expected_revision: u64,
        record: ControlRecord,
        transition: DagTransition,
    ) -> Result<AcceptOutcome, String> {
        let mut state = self.load()?;
        if let Some(existing) = state
            .control_records
            .iter()
            .find(|x| x.control_id == record.control_id)
        {
            return if existing == &record {
                Ok(AcceptOutcome::Duplicate(state))
            } else {
                Err(format!("HISTORY_DIVERGENT_CONTROL:{}", record.control_id))
            };
        }
        if state.revision != expected_revision {
            return Ok(AcceptOutcome::Conflict {
                expected: expected_revision,
                actual: state.revision,
            });
        }
        state.cursor = transition.cursor;
        state.pending_commands.clear();
        state.control_records.push(record);
        state.revision += 1;
        atomic_json(&self.path, &state)?;
        Ok(AcceptOutcome::Accepted(state))
    }
}

pub(crate) fn read_json<T: DeserializeOwned>(path: &Path) -> Result<T, String> {
    let bytes = fs::read(path).map_err(|e| format!("READ:{}:{e}", path.display()))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("DECODE:{}:{e}", path.display()))
}
pub(crate) fn atomic_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "PATH_PARENT_MISSING".to_owned())?;
    fs::create_dir_all(parent).map_err(|e| format!("MKDIR:{}:{e}", parent.display()))?;
    let tmp = path.with_extension("tmp");
    let bytes = serde_json::to_vec_pretty(value).map_err(|e| format!("ENCODE:{e}"))?;
    let mut f = File::create(&tmp).map_err(|e| format!("CREATE:{}:{e}", tmp.display()))?;
    f.write_all(&bytes)
        .and_then(|_| f.write_all(b"\n"))
        .and_then(|_| f.sync_all())
        .map_err(|e| format!("WRITE:{}:{e}", tmp.display()))?;
    fs::rename(&tmp, path).map_err(|e| format!("RENAME:{}:{e}", path.display()))?;
    File::open(parent)
        .and_then(|f| f.sync_all())
        .map_err(|e| format!("SYNC:{}:{e}", parent.display()))
}
