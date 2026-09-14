use cyberalchemy_orchestrator_runtime::model::digest;
use cyberalchemy_orchestrator_runtime::{
    Assignment, CompletionOutcome, DurableRunController, EffectDisposition, Receipt,
};
use rwo_core::{DagCommand, NodeEvent};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AgentProfile {
    pub agent_id: String,
    pub capabilities: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AgentTurnDraft {
    pub outcome: String,
    pub output_ref: Option<Value>,
    pub error: Option<String>,
    pub effect_disposition: EffectDisposition,
    pub context_refs: Vec<String>,
    pub tool_policy: Value,
    pub budget: Value,
    pub trace: Value,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AgentTurn {
    pub schema_version: String,
    pub turn_id: String,
    pub attempt_id: String,
    pub agent_id: String,
    pub command_id: String,
    pub request_digest: String,
    pub context_refs: Vec<String>,
    pub tool_policy: Value,
    pub budget: Value,
    pub response_digest: String,
    pub outcome: String,
    pub trace: Value,
    pub receipt_id: String,
}

pub trait AgentExecutor {
    fn execute(&self, command: &DagCommand) -> Result<AgentTurnDraft, String>;
}

pub fn execute_assignment<E: AgentExecutor>(
    controller: &DurableRunController,
    assignment: &Assignment,
    profile: &AgentProfile,
    executor: &E,
    expected_revision: u64,
    now: u128,
) -> Result<(AgentTurn, CompletionOutcome), String> {
    if assignment.run_id != controller.bundle().run_id {
        return Err("AGENT_RUN_MISMATCH".into());
    }
    if assignment.lease.worker_id != profile.agent_id {
        return Err("AGENT_LEASE_IDENTITY_MISMATCH".into());
    }
    if !profile
        .capabilities
        .iter()
        .any(|capability| capability == &assignment.command.contract)
    {
        return Err("AGENT_CAPABILITY_MISMATCH".into());
    }

    controller.begin(
        &assignment.command.command_id,
        &profile.agent_id,
        assignment.lease.fencing_token,
        now,
    )?;
    let request_digest = digest(&assignment.command.to_value())?;
    let draft = executor.execute(&assignment.command)?;
    let response_digest = digest(&json!({
        "outcome": draft.outcome,
        "output_ref": draft.output_ref,
        "error": draft.error,
        "effect_disposition": draft.effect_disposition,
        "trace": draft.trace,
    }))?;
    let event = match draft.outcome.as_str() {
        "succeeded" => NodeEvent::succeeded(
            format!("event:{}", assignment.command.command_id),
            &assignment.command.node_id,
            draft
                .output_ref
                .clone()
                .ok_or_else(|| "AGENT_OUTPUT_REQUIRED".to_owned())?,
        ),
        "retryable_failure" => NodeEvent::retryable_failure(
            format!("event:{}", assignment.command.command_id),
            &assignment.command.node_id,
            draft
                .error
                .clone()
                .ok_or_else(|| "AGENT_ERROR_REQUIRED".to_owned())?,
        ),
        "failed" => NodeEvent::failed(
            format!("event:{}", assignment.command.command_id),
            &assignment.command.node_id,
            draft
                .error
                .clone()
                .ok_or_else(|| "AGENT_ERROR_REQUIRED".to_owned())?,
        ),
        _ => return Err("AGENT_OUTCOME_INVALID".into()),
    }
    .bind_command(&assignment.command.command_id);
    let receipt_id = digest(&event.to_value())?;
    let receipt = Receipt {
        receipt_id: receipt_id.clone(),
        command_id: assignment.command.command_id.clone(),
        worker_id: profile.agent_id.clone(),
        fencing_token: assignment.lease.fencing_token,
        event,
        effect_disposition: draft.effect_disposition.clone(),
        recorded_at_ms: now,
    };
    let outcome = controller.complete(expected_revision, receipt, now)?;
    let attempt_id = format!(
        "attempt:{}:{}:{}",
        assignment.run_id, assignment.command.node_id, assignment.command.attempt
    );
    let turn = AgentTurn {
        schema_version: "orchestrator-agent-turn/v1".into(),
        turn_id: format!("turn:{}", assignment.command.command_id),
        attempt_id,
        agent_id: profile.agent_id.clone(),
        command_id: assignment.command.command_id.clone(),
        request_digest,
        context_refs: draft.context_refs,
        tool_policy: draft.tool_policy,
        budget: draft.budget,
        response_digest,
        outcome: draft.outcome,
        trace: draft.trace,
        receipt_id,
    };
    Ok((turn, outcome))
}
