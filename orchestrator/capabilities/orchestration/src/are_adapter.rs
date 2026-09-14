use crate::agent::{AgentExecutor, AgentTurnDraft};
use cyberalchemy_orchestrator_runtime::EffectDisposition;
use rwo_core::DagCommand;
use serde_json::{json, Value};

pub trait AreTransport {
    fn decide(&self, request: &Value) -> Result<Value, String>;
}
#[derive(Clone, Debug)]
pub struct AreAgent<T> {
    pub transport: T,
    pub objective_kind: String,
}
impl<T: AreTransport> AgentExecutor for AreAgent<T> {
    fn execute(&self, command: &DagCommand) -> Result<AgentTurnDraft, String> {
        let request = json!({"schema_version":"orchestrator-are-agent-request/v1","objective_kind":self.objective_kind,"command":{"command_id":command.command_id,"node_id":command.node_id,"contract":command.contract,"role_id":command.role_id,"attempt":command.attempt,"input":command.input},"authority_effect":"none"});
        let response = self.transport.decide(&request)?;
        let output = response
            .get("output_ref")
            .cloned()
            .unwrap_or_else(|| json!({"are_result":response}));
        Ok(AgentTurnDraft {
            outcome: "succeeded".into(),
            output_ref: Some(output),
            error: None,
            effect_disposition: EffectDisposition::NotApplicable,
            context_refs: vec![],
            tool_policy: json!({"source":"are-request"}),
            budget: json!({"source":"command-envelope"}),
            trace: json!({"adapter":"are","request_schema":"orchestrator-are-agent-request/v1","response_digest_posture":"recorded-by-receipt"}),
        })
    }
}
