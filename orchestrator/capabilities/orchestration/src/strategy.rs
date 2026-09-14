use rwo_core::{compile_work_graph, DagDefinition, WorkCatalog, WorkDefinition};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeSet;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Lane {
    pub lane_id: String,
    pub purpose: String,
}

/// A pre-admission capability requirement. Runtime `Assignment` remains the
/// binding to a concrete command, lease, and attempt.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AgentRequirement {
    pub requirement_id: String,
    pub agent_ref: Option<String>,
    pub lane_id: String,
    pub node_selector: String,
    pub required_capabilities: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StrategyLimits {
    pub deadline_seconds: u64,
    pub max_parallelism: usize,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Strategy {
    pub schema_version: String,
    pub strategy_id: String,
    pub version: String,
    pub intended_outcome: String,
    pub root_work_ref: String,
    pub work_definitions: Vec<WorkDefinition>,
    pub lanes: Vec<Lane>,
    pub agent_requirements: Vec<AgentRequirement>,
    pub policies: Value,
    pub limits: StrategyLimits,
    pub adapter_requirements: Vec<String>,
    pub inputs: Value,
    pub evidence_expectations: Value,
    pub result_reduction: Value,
    pub authority_refs: Vec<String>,
}

impl Strategy {
    pub fn validate(&self) -> Result<(), String> {
        if self.schema_version != "orchestrator-strategy/v1" {
            return Err("STRATEGY_VERSION_UNSUPPORTED".into());
        }
        if self.strategy_id.is_empty()
            || self.version.is_empty()
            || self.intended_outcome.is_empty()
        {
            return Err("STRATEGY_IDENTITY_INVALID".into());
        }
        if self.limits.deadline_seconds == 0 || self.limits.max_parallelism == 0 {
            return Err("STRATEGY_LIMIT_INVALID".into());
        }
        if self.authority_refs.is_empty() {
            return Err("STRATEGY_AUTHORITY_REF_REQUIRED".into());
        }

        let lanes = self
            .lanes
            .iter()
            .map(|lane| lane.lane_id.as_str())
            .collect::<BTreeSet<_>>();
        if lanes.len() != self.lanes.len()
            || self
                .lanes
                .iter()
                .any(|lane| lane.lane_id.is_empty() || lane.purpose.is_empty())
        {
            return Err("STRATEGY_LANE_INVALID_OR_DUPLICATE".into());
        }

        let requirements = self
            .agent_requirements
            .iter()
            .map(|requirement| requirement.requirement_id.as_str())
            .collect::<BTreeSet<_>>();
        if requirements.len() != self.agent_requirements.len() {
            return Err("STRATEGY_AGENT_REQUIREMENT_DUPLICATE".into());
        }
        for requirement in &self.agent_requirements {
            if requirement.requirement_id.is_empty()
                || requirement.node_selector.is_empty()
                || !lanes.contains(requirement.lane_id.as_str())
                || requirement.required_capabilities.is_empty()
            {
                return Err(format!(
                    "STRATEGY_AGENT_REQUIREMENT_INVALID:{}",
                    requirement.requirement_id
                ));
            }
        }

        WorkCatalog::new(self.work_definitions.clone())?
            .get(&self.root_work_ref)
            .ok_or_else(|| "STRATEGY_ROOT_WORK_UNKNOWN".to_owned())?;
        Ok(())
    }

    pub fn compile(&self) -> Result<DagDefinition, String> {
        self.validate()?;
        let catalog = WorkCatalog::new(self.work_definitions.clone())?;
        let graph = compile_work_graph(
            &catalog,
            &self.root_work_ref,
            &format!("{}.{}", self.strategy_id, self.version),
            self.limits.deadline_seconds,
            self.limits.max_parallelism,
        )?;

        for requirement in &self.agent_requirements {
            let node = graph.nodes.get(&requirement.node_selector).ok_or_else(|| {
                format!(
                    "STRATEGY_AGENT_REQUIREMENT_NODE_UNKNOWN:{}:{}",
                    requirement.requirement_id, requirement.node_selector
                )
            })?;
            if !requirement
                .required_capabilities
                .iter()
                .any(|capability| capability == &node.contract)
            {
                return Err(format!(
                    "STRATEGY_AGENT_REQUIREMENT_CAPABILITY_MISMATCH:{}:{}",
                    requirement.requirement_id, node.contract
                ));
            }
        }
        Ok(graph)
    }
}
