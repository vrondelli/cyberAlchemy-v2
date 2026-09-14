use crate::{DurableRunController, Lease, RunBundle};
use rwo_core::DagCommand;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Assignment {
    pub run_id: String,
    pub command: DagCommand,
    pub lease: Lease,
}
#[derive(Clone, Debug)]
pub struct OrchestratorRuntime {
    root: PathBuf,
    max_active_assignments: usize,
}
impl OrchestratorRuntime {
    pub fn open(root: impl Into<PathBuf>, max_active_assignments: usize) -> Result<Self, String> {
        if max_active_assignments == 0 {
            return Err("RUNTIME_CAPACITY_INVALID".into());
        }
        let root = root.into();
        fs::create_dir_all(root.join("runs")).map_err(|e| format!("RUNTIME_ROOT_CREATE:{e}"))?;
        Ok(Self {
            root,
            max_active_assignments,
        })
    }
    pub fn root(&self) -> &Path {
        &self.root
    }
    pub fn max_active_assignments(&self) -> usize {
        self.max_active_assignments
    }
    pub fn active_assignment_count(&self, now: u128) -> Result<usize, String> {
        let mut active = 0;
        for id in self.run_ids()? {
            active += self.run(&id)?.active_lease_count(now)?;
        }
        Ok(active)
    }
    pub fn register(&self, bundle: RunBundle) -> Result<DurableRunController, String> {
        DurableRunController::register(self.root.join("runs").join(&bundle.run_id), bundle)
    }
    pub fn run(&self, run_id: &str) -> Result<DurableRunController, String> {
        DurableRunController::open(self.root.join("runs").join(run_id))
    }
    pub fn run_ids(&self) -> Result<Vec<String>, String> {
        let mut ids = fs::read_dir(self.root.join("runs"))
            .map_err(|e| format!("RUNS_READ:{e}"))?
            .filter_map(Result::ok)
            .filter(|x| x.path().is_dir())
            .filter_map(|x| x.file_name().into_string().ok())
            .collect::<Vec<_>>();
        ids.sort();
        Ok(ids)
    }
    pub fn poll(
        &self,
        worker: &str,
        capabilities: &[String],
        now: u128,
        ttl: u128,
    ) -> Result<Option<Assignment>, String> {
        let active = self.active_assignment_count(now)?;
        if active >= self.max_active_assignments {
            return Ok(None);
        }
        for id in self.run_ids()? {
            let c = self.run(&id)?;
            for command in c.pending_commands()? {
                if capabilities.iter().any(|x| x == &command.contract)
                    && c.lease(&command.command_id)?
                        .is_none_or(|x| x.expires_at_ms <= now)
                {
                    let lease = c.acquire(&command.command_id, worker, now, ttl)?;
                    return Ok(Some(Assignment {
                        run_id: id,
                        command,
                        lease,
                    }));
                }
            }
        }
        Ok(None)
    }
}
