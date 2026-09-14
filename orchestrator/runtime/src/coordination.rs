use crate::history::{atomic_json, read_json};
use crate::model::digest;
use rwo_core::{DagCommand, NodeEvent};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EffectDisposition {
    NotApplicable,
    NotApplied,
    Applied,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Lease {
    pub command_id: String,
    pub worker_id: String,
    pub fencing_token: u64,
    pub acquired_at_ms: u128,
    pub expires_at_ms: u128,
    pub begun_at_ms: Option<u128>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Receipt {
    pub receipt_id: String,
    pub command_id: String,
    pub worker_id: String,
    pub fencing_token: u64,
    pub event: NodeEvent,
    pub effect_disposition: EffectDisposition,
    pub recorded_at_ms: u128,
}

#[derive(Clone, Debug, PartialEq)]
pub enum ReceiptRecordOutcome {
    Recorded,
    Duplicate,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct CoordinationState {
    schema_version: String,
    next_fence: u64,
    leases: BTreeMap<String, Lease>,
    receipts: BTreeMap<String, Receipt>,
    resolutions: BTreeMap<String, EffectDisposition>,
}

#[derive(Clone, Debug)]
pub struct FileCoordination {
    path: PathBuf,
}
impl FileCoordination {
    pub fn initialize(path: impl Into<PathBuf>) -> Result<Self, String> {
        let path = path.into();
        if path.exists() {
            return Err("COORDINATION_ALREADY_EXISTS".into());
        }
        atomic_json(
            &path,
            &CoordinationState {
                schema_version: "orchestrator-coordination/v1".into(),
                next_fence: 0,
                leases: BTreeMap::new(),
                receipts: BTreeMap::new(),
                resolutions: BTreeMap::new(),
            },
        )?;
        Ok(Self { path })
    }
    pub fn open(path: impl Into<PathBuf>) -> Result<Self, String> {
        let x = Self { path: path.into() };
        x.load()?;
        Ok(x)
    }
    fn load(&self) -> Result<CoordinationState, String> {
        read_json(&self.path)
    }
    fn save(&self, s: &CoordinationState) -> Result<(), String> {
        atomic_json(&self.path, s)
    }
    pub fn path(&self) -> &Path {
        &self.path
    }
    pub fn acquire(
        &self,
        command: &DagCommand,
        worker_id: &str,
        now: u128,
        ttl: u128,
    ) -> Result<Lease, String> {
        if worker_id.is_empty() || ttl == 0 {
            return Err("LEASE_INPUT_INVALID".into());
        }
        let mut s = self.load()?;
        if let Some(l) = s.leases.get(&command.command_id) {
            if l.expires_at_ms > now {
                return Err(format!("LEASE_ACTIVE:{}", command.command_id));
            }
        }
        s.next_fence += 1;
        let l = Lease {
            command_id: command.command_id.clone(),
            worker_id: worker_id.into(),
            fencing_token: s.next_fence,
            acquired_at_ms: now,
            expires_at_ms: now + ttl,
            begun_at_ms: None,
        };
        s.leases.insert(command.command_id.clone(), l.clone());
        self.save(&s)?;
        Ok(l)
    }
    pub fn begin(
        &self,
        command_id: &str,
        worker_id: &str,
        fence: u64,
        now: u128,
    ) -> Result<Lease, String> {
        let mut s = self.load()?;
        let l = s
            .leases
            .get_mut(command_id)
            .ok_or_else(|| format!("LEASE_MISSING:{command_id}"))?;
        verify(l, worker_id, fence, now)?;
        if l.begun_at_ms.is_none() {
            l.begun_at_ms = Some(now);
        }
        let out = l.clone();
        self.save(&s)?;
        Ok(out)
    }
    pub fn record_receipt(&self, r: Receipt, now: u128) -> Result<ReceiptRecordOutcome, String> {
        let mut s = self.load()?;
        if let Some(old) = s.receipts.get(&r.receipt_id) {
            return if digest(old)? == digest(&r)? {
                Ok(ReceiptRecordOutcome::Duplicate)
            } else {
                Err(format!("RECEIPT_DIVERGENT:{}", r.receipt_id))
            };
        }
        if r.event.command_id.as_deref() != Some(&r.command_id) {
            return Err("RECEIPT_EVENT_COMMAND_MISMATCH".into());
        }
        let l = s
            .leases
            .get(&r.command_id)
            .ok_or_else(|| format!("LEASE_MISSING:{}", r.command_id))?;
        verify(l, &r.worker_id, r.fencing_token, now)?;
        if l.begun_at_ms.is_none() {
            return Err("RECEIPT_COMMAND_NOT_BEGUN".into());
        }
        s.receipts.insert(r.receipt_id.clone(), r);
        self.save(&s)?;
        Ok(ReceiptRecordOutcome::Recorded)
    }
    pub fn receipt_for_command(&self, id: &str) -> Result<Option<Receipt>, String> {
        Ok(self
            .load()?
            .receipts
            .values()
            .find(|r| r.command_id == id)
            .cloned())
    }
    pub fn lease(&self, id: &str) -> Result<Option<Lease>, String> {
        Ok(self.load()?.leases.get(id).cloned())
    }
    pub fn active_lease_count(&self, now: u128) -> Result<usize, String> {
        let state = self.load()?;
        let completed = state
            .receipts
            .values()
            .map(|receipt| receipt.command_id.as_str())
            .collect::<std::collections::BTreeSet<_>>();
        Ok(state
            .leases
            .values()
            .filter(|lease| {
                lease.expires_at_ms > now && !completed.contains(lease.command_id.as_str())
            })
            .count())
    }
    pub fn resolve(&self, command_id: &str, value: EffectDisposition) -> Result<(), String> {
        if value == EffectDisposition::Unknown {
            return Err("RESOLUTION_CANNOT_BE_UNKNOWN".into());
        }
        let mut s = self.load()?;
        let r = s
            .receipts
            .values()
            .find(|r| r.command_id == command_id)
            .ok_or_else(|| format!("RECEIPT_MISSING:{command_id}"))?;
        if r.effect_disposition != EffectDisposition::Unknown {
            return Err("RESOLUTION_NOT_REQUIRED".into());
        }
        s.resolutions.insert(command_id.into(), value);
        self.save(&s)
    }
    pub fn effective_disposition(&self, receipt: &Receipt) -> Result<EffectDisposition, String> {
        if receipt.effect_disposition != EffectDisposition::Unknown {
            return Ok(receipt.effect_disposition.clone());
        }
        Ok(self
            .load()?
            .resolutions
            .get(&receipt.command_id)
            .cloned()
            .unwrap_or(EffectDisposition::Unknown))
    }
    pub fn release_for_retry(&self, command_id: &str) -> Result<(), String> {
        let mut s = self.load()?;
        s.leases.remove(command_id);
        self.save(&s)
    }
}
fn verify(l: &Lease, worker: &str, fence: u64, now: u128) -> Result<(), String> {
    if l.worker_id != worker {
        return Err("LEASE_WORKER_MISMATCH".into());
    }
    if l.fencing_token != fence {
        return Err("LEASE_FENCE_STALE".into());
    }
    if l.expires_at_ms <= now {
        return Err("LEASE_EXPIRED".into());
    }
    Ok(())
}
