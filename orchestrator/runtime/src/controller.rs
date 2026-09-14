use crate::coordination::{EffectDisposition, FileCoordination, Lease, Receipt};
use crate::history::{
    atomic_json, read_json, AcceptOutcome, AcceptedHistory, ControlRecord, FileAcceptedHistory,
    HistoryState,
};
use crate::model::RunBundle;
use crate::recovery::{assess, RecoveryAction, RecoveryAssessment};
use rwo_core::{DagCommand, DagEngine, NodeEvent};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq)]
pub enum CompletionOutcome {
    Accepted(HistoryState),
    Duplicate(HistoryState),
    ReceiptOnly(RecoveryAssessment),
    Conflict { expected: u64, actual: u64 },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct RunManifest {
    schema_version: String,
    bundle: RunBundle,
}

#[derive(Clone, Debug)]
pub struct DurableRunController {
    root: PathBuf,
    bundle: RunBundle,
    history: FileAcceptedHistory,
    coordination: FileCoordination,
}

impl DurableRunController {
    pub fn register(root: impl Into<PathBuf>, bundle: RunBundle) -> Result<Self, String> {
        bundle.validate()?;
        let root = root.into();
        if root.exists() {
            return Err("RUN_ROOT_ALREADY_EXISTS".into());
        }
        fs::create_dir_all(&root).map_err(|e| format!("RUN_ROOT_CREATE:{e}"))?;
        atomic_json(
            &root.join("manifest.json"),
            &RunManifest {
                schema_version: "orchestrator-run-manifest/v1".into(),
                bundle: bundle.clone(),
            },
        )?;
        let start = DagEngine::new(bundle.graph.clone()).start();
        let history = FileAcceptedHistory::initialize(
            root.join("accepted-history.json"),
            &bundle.run_id,
            start,
        )?;
        let coordination = FileCoordination::initialize(root.join("coordination.json"))?;
        Ok(Self {
            root,
            bundle,
            history,
            coordination,
        })
    }
    pub fn open(root: impl Into<PathBuf>) -> Result<Self, String> {
        let root = root.into();
        let m: RunManifest = read_json(&root.join("manifest.json"))?;
        m.bundle.validate()?;
        let history = FileAcceptedHistory::open(root.join("accepted-history.json"))?;
        let coordination = FileCoordination::open(root.join("coordination.json"))?;
        let state = history.load()?;
        DagEngine::from_cursor(m.bundle.graph.clone(), state.cursor.clone())?;
        Ok(Self {
            root,
            bundle: m.bundle,
            history,
            coordination,
        })
    }
    pub fn root(&self) -> &Path {
        &self.root
    }
    pub fn bundle(&self) -> &RunBundle {
        &self.bundle
    }
    pub fn snapshot(&self) -> Result<HistoryState, String> {
        self.history.load()
    }
    pub fn pending_commands(&self) -> Result<Vec<DagCommand>, String> {
        Ok(self.snapshot()?.pending_commands.into_values().collect())
    }
    pub fn accept_event(
        &self,
        expected_revision: u64,
        event: NodeEvent,
    ) -> Result<AcceptOutcome, String> {
        let current = self.history.load()?;
        if current.revision != expected_revision {
            if current
                .accepted_events
                .iter()
                .any(|x| x.event_id == event.event_id)
            {
                return self.history.accept(
                    expected_revision,
                    event,
                    rwo_core::DagTransition {
                        kind: "Duplicate".into(),
                        cursor: current.cursor.clone(),
                        commands: vec![],
                    },
                );
            }
            return Ok(AcceptOutcome::Conflict {
                expected: expected_revision,
                actual: current.revision,
            });
        }
        let transition =
            rwo_core::apply_event(self.bundle.graph.clone(), current.cursor, event.clone())?;
        self.history.accept(expected_revision, event, transition)
    }
    pub fn acquire(
        &self,
        command_id: &str,
        worker: &str,
        now: u128,
        ttl: u128,
    ) -> Result<Lease, String> {
        let state = self.history.load()?;
        let command = state
            .pending_commands
            .get(command_id)
            .ok_or_else(|| format!("COMMAND_NOT_PENDING:{command_id}"))?;
        self.coordination.acquire(command, worker, now, ttl)
    }
    pub fn begin(
        &self,
        command_id: &str,
        worker: &str,
        fence: u64,
        now: u128,
    ) -> Result<Lease, String> {
        self.coordination.begin(command_id, worker, fence, now)
    }
    pub fn complete(
        &self,
        expected_revision: u64,
        receipt: Receipt,
        now: u128,
    ) -> Result<CompletionOutcome, String> {
        let _record = self.coordination.record_receipt(receipt.clone(), now)?;
        let disposition = self.coordination.effective_disposition(&receipt)?;
        if disposition == EffectDisposition::Unknown {
            return Ok(CompletionOutcome::ReceiptOnly(assess(
                self,
                &receipt.command_id,
                now,
            )?));
        }
        match self.accept_event(expected_revision, receipt.event)? {
            AcceptOutcome::Accepted(x) => Ok(CompletionOutcome::Accepted(x)),
            AcceptOutcome::Duplicate(x) => Ok(CompletionOutcome::Duplicate(x)),
            AcceptOutcome::Conflict { expected, actual } => {
                Ok(CompletionOutcome::Conflict { expected, actual })
            }
        }
    }
    pub fn recovery(&self, command_id: &str, now: u128) -> Result<RecoveryAssessment, String> {
        assess(self, command_id, now)
    }
    pub fn receipt(&self, command_id: &str) -> Result<Option<Receipt>, String> {
        self.coordination.receipt_for_command(command_id)
    }
    pub fn lease(&self, command_id: &str) -> Result<Option<Lease>, String> {
        self.coordination.lease(command_id)
    }
    pub fn effective_disposition(&self, r: &Receipt) -> Result<EffectDisposition, String> {
        self.coordination.effective_disposition(r)
    }
    pub fn resolve_unknown(
        &self,
        command_id: &str,
        value: EffectDisposition,
    ) -> Result<RecoveryAssessment, String> {
        self.coordination.resolve(command_id, value)?;
        let assessment = assess(self, command_id, u128::MAX - 1)?;
        if assessment.action == RecoveryAction::Execute {
            self.coordination.release_for_retry(command_id)?;
        }
        Ok(assessment)
    }
    pub fn accept_recorded_event(
        &self,
        expected_revision: u64,
        command_id: &str,
    ) -> Result<AcceptOutcome, String> {
        let receipt = self
            .coordination
            .receipt_for_command(command_id)?
            .ok_or_else(|| format!("RECEIPT_MISSING:{command_id}"))?;
        if self.coordination.effective_disposition(&receipt)? == EffectDisposition::Unknown {
            return Err("UNKNOWN_EFFECT_BLOCKS_ACCEPTANCE".into());
        }
        self.accept_event(expected_revision, receipt.event)
    }
    pub fn cancel(
        &self,
        expected_revision: u64,
        control_id: &str,
        reason: &str,
        now: u128,
    ) -> Result<AcceptOutcome, String> {
        let state = self.history.load()?;
        if state.revision != expected_revision {
            return Ok(AcceptOutcome::Conflict {
                expected: expected_revision,
                actual: state.revision,
            });
        }
        let mut engine = DagEngine::from_cursor(self.bundle.graph.clone(), state.cursor)?;
        let transition = engine.cancel(reason);
        self.history.accept_control(
            expected_revision,
            ControlRecord {
                control_id: control_id.into(),
                kind: "cancellation".into(),
                reason: reason.into(),
                at_ms: now,
            },
            transition,
        )
    }
    pub fn expire_if_due(&self, now: u128) -> Result<Option<AcceptOutcome>, String> {
        if now < self.bundle.deadline_at_ms {
            return Ok(None);
        }
        let state = self.history.load()?;
        if state.cursor.cancelled {
            return Ok(None);
        }
        Ok(Some(self.cancel(
            state.revision,
            &format!("deadline:{}", self.bundle.run_id),
            "deadline-exceeded",
            now,
        )?))
    }
    pub fn active_lease_count(&self, now: u128) -> Result<usize, String> {
        self.coordination.active_lease_count(now)
    }
}
