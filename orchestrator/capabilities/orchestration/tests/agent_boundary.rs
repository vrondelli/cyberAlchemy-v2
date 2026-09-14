use cyberalchemy_orchestrator_runtime::{
    CompletionOutcome, EffectDisposition, OrchestratorRuntime, RunBundle,
};
use orchestrator_capabilities::{
    execute_assignment, supervise_once, AgentExecutor, AgentProfile, AgentTurnDraft, AreAgent,
    AreTransport,
};
use rwo_core::DagDefinition;
use serde_json::{json, Value};

fn graph(id: &str) -> DagDefinition {
    DagDefinition::from_value(&json!({
        "dag_id": id,
        "deadline_seconds": 30,
        "max_parallelism": 1,
        "nodes": [{
            "node_id":"reason",
            "contract":"reason",
            "role_id":"analyst",
            "depends_on":[],
            "release":{"mode":"root"},
            "max_attempts":1,
            "static_input":{"question":"What should we test?"}
        }]
    }))
    .unwrap()
}

struct ScriptedAgent;
impl AgentExecutor for ScriptedAgent {
    fn execute(&self, _command: &rwo_core::DagCommand) -> Result<AgentTurnDraft, String> {
        Ok(AgentTurnDraft {
            outcome: "succeeded".into(),
            output_ref: Some(json!({"hypothesis":"leases reduce duplicate execution"})),
            error: None,
            effect_disposition: EffectDisposition::NotApplicable,
            context_refs: vec!["context:test".into()],
            tool_policy: json!({"tools":[]}),
            budget: json!({"turns":1}),
            trace: json!({"adapter":"scripted"}),
        })
    }
}

#[derive(Clone)]
struct FakeAre;
impl AreTransport for FakeAre {
    fn decide(&self, request: &Value) -> Result<Value, String> {
        assert_eq!(request["authority_effect"], "none");
        assert_eq!(request["command"]["contract"], "reason");
        Ok(json!({"output_ref":{"hypothesis":"fences reject stale workers"}}))
    }
}

fn execute_one<E: AgentExecutor>(executor: &E, run_id: &str) {
    let temp = tempfile::tempdir().unwrap();
    let runtime = OrchestratorRuntime::open(temp.path(), 1).unwrap();
    let bundle = RunBundle::new(
        run_id,
        graph(run_id),
        10,
        1_000,
        vec!["admission:test".into()],
    )
    .unwrap();
    runtime.register(bundle).unwrap();
    let assignment = runtime
        .poll("agent-1", &["reason".into()], 20, 100)
        .unwrap()
        .unwrap();
    let controller = runtime.run(run_id).unwrap();
    let profile = AgentProfile {
        agent_id: "agent-1".into(),
        capabilities: vec!["reason".into()],
    };
    let (turn, outcome) =
        execute_assignment(&controller, &assignment, &profile, executor, 0, 21).unwrap();
    assert!(matches!(outcome, CompletionOutcome::Accepted(_)));
    assert_eq!(controller.snapshot().unwrap().revision, 1);
    assert!(turn.request_digest.starts_with("sha256:"));
    assert!(turn.response_digest.starts_with("sha256:"));
    assert_eq!(turn.command_id, assignment.command.command_id);
}

#[test]
fn scripted_and_are_agents_share_the_checked_event_boundary() {
    execute_one(&ScriptedAgent, "scripted-run");
    execute_one(
        &AreAgent {
            transport: FakeAre,
            objective_kind: "hypothesis-generation".into(),
        },
        "are-run",
    );
}

#[test]
fn declared_capability_is_checked_before_agent_execution() {
    let temp = tempfile::tempdir().unwrap();
    let runtime = OrchestratorRuntime::open(temp.path(), 1).unwrap();
    runtime
        .register(
            RunBundle::new(
                "capability-run",
                graph("capability-run"),
                10,
                1_000,
                vec!["admission:test".into()],
            )
            .unwrap(),
        )
        .unwrap();
    let assignment = runtime
        .poll("agent-1", &["reason".into()], 20, 100)
        .unwrap()
        .unwrap();
    let profile = AgentProfile {
        agent_id: "agent-1".into(),
        capabilities: vec!["translate".into()],
    };
    assert_eq!(
        execute_assignment(
            &runtime.run("capability-run").unwrap(),
            &assignment,
            &profile,
            &ScriptedAgent,
            0,
            21
        )
        .unwrap_err(),
        "AGENT_CAPABILITY_MISMATCH"
    );
}

#[test]
fn supervisor_polls_and_executes_one_checked_assignment_per_step() {
    let temp = tempfile::tempdir().unwrap();
    let runtime = OrchestratorRuntime::open(temp.path(), 1).unwrap();
    runtime
        .register(
            RunBundle::new(
                "supervised-run",
                graph("supervised-run"),
                10,
                1_000,
                vec!["admission:test".into()],
            )
            .unwrap(),
        )
        .unwrap();
    let profile = AgentProfile {
        agent_id: "agent-supervised".into(),
        capabilities: vec!["reason".into()],
    };
    let executed = supervise_once(&runtime, &profile, &ScriptedAgent, 20, 100).unwrap();
    assert_eq!(executed.status, "executed");
    assert_eq!(
        executed.assignment_run_id.as_deref(),
        Some("supervised-run")
    );
    assert_eq!(executed.completion_kind.as_deref(), Some("accepted"));
    assert_eq!(
        runtime
            .run("supervised-run")
            .unwrap()
            .snapshot()
            .unwrap()
            .revision,
        1
    );

    let idle = supervise_once(&runtime, &profile, &ScriptedAgent, 21, 100).unwrap();
    assert_eq!(idle.status, "idle");
    assert!(idle.turn.is_none());
}
