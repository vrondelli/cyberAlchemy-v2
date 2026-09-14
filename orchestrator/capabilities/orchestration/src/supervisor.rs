use crate::{execute_assignment, AgentExecutor, AgentProfile, AgentTurn};
use cyberalchemy_orchestrator_runtime::{CompletionOutcome, OrchestratorRuntime};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SupervisorStep {
    pub schema_version: String,
    pub status: String,
    pub assignment_run_id: Option<String>,
    pub command_id: Option<String>,
    pub turn: Option<AgentTurn>,
    pub completion_kind: Option<String>,
    pub authority_effect: String,
}

/// Poll and execute at most one compatible command through the checked agent
/// boundary. Hosts own repetition, timing, shutdown, and adapter lifecycle.
pub fn supervise_once<E: AgentExecutor>(
    runtime: &OrchestratorRuntime,
    profile: &AgentProfile,
    executor: &E,
    now_ms: u128,
    lease_ttl_ms: u128,
) -> Result<SupervisorStep, String> {
    let Some(assignment) = runtime.poll(
        &profile.agent_id,
        &profile.capabilities,
        now_ms,
        lease_ttl_ms,
    )?
    else {
        return Ok(SupervisorStep {
            schema_version: "orchestrator-supervisor-step/v1".into(),
            status: "idle".into(),
            assignment_run_id: None,
            command_id: None,
            turn: None,
            completion_kind: None,
            authority_effect: "none".into(),
        });
    };
    let controller = runtime.run(&assignment.run_id)?;
    let expected_revision = controller.snapshot()?.revision;
    let (turn, outcome) = execute_assignment(
        &controller,
        &assignment,
        profile,
        executor,
        expected_revision,
        now_ms,
    )?;
    let completion_kind = match outcome {
        CompletionOutcome::Accepted(_) => "accepted",
        CompletionOutcome::Duplicate(_) => "duplicate",
        CompletionOutcome::ReceiptOnly(_) => "receipt_only",
        CompletionOutcome::Conflict { .. } => "conflict",
    };
    Ok(SupervisorStep {
        schema_version: "orchestrator-supervisor-step/v1".into(),
        status: "executed".into(),
        assignment_run_id: Some(assignment.run_id),
        command_id: Some(assignment.command.command_id),
        turn: Some(turn),
        completion_kind: Some(completion_kind.into()),
        authority_effect: "none".into(),
    })
}
