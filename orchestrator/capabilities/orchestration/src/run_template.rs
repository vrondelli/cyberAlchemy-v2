use crate::{DispatchProposal, StrategyLimits, StrategyTemplate};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RunTemplate {
    pub schema_version: String,
    pub run_template_id: String,
    pub version: String,
    pub display_name: String,
    pub description: String,
    pub strategy_template_id: String,
    pub strategy_template_version: String,
    pub default_parameters: BTreeMap<String, Value>,
    pub adapter_defaults: Vec<String>,
    pub limit_overrides: Option<StrategyLimits>,
    pub presentation: Value,
    pub admission_prompts: Vec<String>,
}

impl RunTemplate {
    pub fn validate(&self) -> Result<(), String> {
        if self.schema_version != "orchestrator-run-template/v1"
            || self.run_template_id.is_empty()
            || self.version.is_empty()
            || self.display_name.is_empty()
            || self.strategy_template_id.is_empty()
            || self.strategy_template_version.is_empty()
        {
            return Err("RUN_TEMPLATE_IDENTITY_INVALID".into());
        }
        if self.admission_prompts.iter().any(String::is_empty) {
            return Err("RUN_TEMPLATE_ADMISSION_PROMPT_INVALID".into());
        }
        if self
            .limit_overrides
            .as_ref()
            .is_some_and(|limits| limits.deadline_seconds == 0 || limits.max_parallelism == 0)
        {
            return Err("RUN_TEMPLATE_LIMIT_INVALID".into());
        }
        Ok(())
    }

    pub fn propose(
        &self,
        strategy_template: &StrategyTemplate,
        parameter_overrides: BTreeMap<String, Value>,
        adapter_overrides: Option<Vec<String>>,
    ) -> Result<DispatchProposal, String> {
        self.validate()?;
        if strategy_template.template_id != self.strategy_template_id
            || strategy_template.version != self.strategy_template_version
        {
            return Err("RUN_TEMPLATE_STRATEGY_TEMPLATE_MISMATCH".into());
        }
        let mut parameters = self.default_parameters.clone();
        parameters.extend(parameter_overrides);
        let adapters = adapter_overrides.unwrap_or_else(|| self.adapter_defaults.clone());
        let mut instance = strategy_template.instantiate(parameters, adapters)?;
        if let Some(limits) = &self.limit_overrides {
            instance.strategy.limits = limits.clone();
        }
        DispatchProposal::from_instantiation(&instance)
    }
}
