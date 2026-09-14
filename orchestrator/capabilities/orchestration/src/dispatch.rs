use crate::strategy::{AgentRequirement, Lane, Strategy, StrategyLimits};
use crate::template::TemplateInstantiation;
use cyberalchemy_orchestrator_runtime::model::digest;
use cyberalchemy_orchestrator_runtime::RunBundle;
use rwo_core::DagDefinition;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DispatchProposal {
    pub schema_version: String,
    pub proposal_id: String,
    pub strategy_id: String,
    pub strategy_version: String,
    pub strategy_digest: String,
    pub template_ref: Option<String>,
    pub intended_outcome: String,
    pub graph: DagDefinition,
    pub graph_digest: String,
    pub lanes: Vec<Lane>,
    pub agent_requirements: Vec<AgentRequirement>,
    pub policies: Value,
    pub limits: StrategyLimits,
    pub selected_adapter_refs: Vec<String>,
    pub inputs: Value,
    pub evidence_expectations: Value,
    pub result_reduction: Value,
    pub authority_refs: Vec<String>,
    pub status: String,
}

impl DispatchProposal {
    pub fn from_strategy(
        strategy: &Strategy,
        selected_adapter_refs: Vec<String>,
    ) -> Result<Self, String> {
        Self::build(strategy, None, selected_adapter_refs)
    }

    pub fn from_instantiation(value: &TemplateInstantiation) -> Result<Self, String> {
        Self::build(
            &value.strategy,
            Some(format!("{}@{}", value.template_id, value.template_version)),
            value.selected_adapter_refs.clone(),
        )
    }

    fn build(
        strategy: &Strategy,
        template_ref: Option<String>,
        selected_adapter_refs: Vec<String>,
    ) -> Result<Self, String> {
        if strategy
            .adapter_requirements
            .iter()
            .any(|required| !selected_adapter_refs.contains(required))
        {
            return Err("DISPATCH_ADAPTER_INCOMPATIBLE".into());
        }
        let graph = strategy.compile()?;
        let graph_digest = digest(&graph)?;
        let strategy_digest = digest(strategy)?;
        let identity = json!({
            "strategy_digest": strategy_digest,
            "template_ref": template_ref,
            "graph_digest": graph_digest,
            "selected_adapter_refs": selected_adapter_refs,
            "authority_refs": strategy.authority_refs,
        });
        let proposal_id = digest(&identity)?;
        Ok(Self {
            schema_version: "orchestrator-dispatch-proposal/v1".into(),
            proposal_id,
            strategy_id: strategy.strategy_id.clone(),
            strategy_version: strategy.version.clone(),
            strategy_digest,
            template_ref,
            intended_outcome: strategy.intended_outcome.clone(),
            graph,
            graph_digest,
            lanes: strategy.lanes.clone(),
            agent_requirements: strategy.agent_requirements.clone(),
            policies: strategy.policies.clone(),
            limits: strategy.limits.clone(),
            selected_adapter_refs,
            inputs: strategy.inputs.clone(),
            evidence_expectations: strategy.evidence_expectations.clone(),
            result_reduction: strategy.result_reduction.clone(),
            authority_refs: strategy.authority_refs.clone(),
            status: "proposed".into(),
        })
    }

    pub fn admit(
        &self,
        run_id: &str,
        admitted_at_ms: u128,
        deadline_at_ms: u128,
        admission_authority_ref: &str,
    ) -> Result<RunBundle, String> {
        if self.status != "proposed" || admission_authority_ref.is_empty() {
            return Err("DISPATCH_ADMISSION_INVALID".into());
        }
        RunBundle::new_with_context(
            run_id,
            self.graph.clone(),
            admitted_at_ms,
            deadline_at_ms,
            vec![admission_authority_ref.into()],
            json!({
                "proposal_id": self.proposal_id,
                "strategy_id": self.strategy_id,
                "strategy_version": self.strategy_version,
                "strategy_digest": self.strategy_digest,
                "template_ref": self.template_ref,
                "intended_outcome": self.intended_outcome,
                "graph_digest": self.graph_digest,
                "lanes": self.lanes,
                "agent_requirements": self.agent_requirements,
                "policies": self.policies,
                "limits": self.limits,
                "selected_adapter_refs": self.selected_adapter_refs,
                "inputs": self.inputs,
                "evidence_expectations": self.evidence_expectations,
                "result_reduction": self.result_reduction,
                "authority_refs": self.authority_refs,
            }),
        )
    }
}
