use cyberalchemy_orchestrator_runtime::{
    AcceptOutcome, CompletionOutcome, DurableRunController, EffectDisposition, OrchestratorRuntime,
    Receipt, RecoveryAction, RunBundle, WorkerApi, WorkerRequest,
};
use rwo_core::{DagDefinition, NodeEvent};
use serde_json::json;

fn graph(nodes: serde_json::Value, parallelism: usize) -> DagDefinition {
    DagDefinition::from_value(&json!({"dag_id":"runtime-test","deadline_seconds":30,"max_parallelism":parallelism,"nodes":nodes})).unwrap()
}
fn node(id: &str, deps: &[&str], release: serde_json::Value, max: usize) -> serde_json::Value {
    json!({"node_id":id,"contract":id,"role_id":id,"depends_on":deps,"release":release,"max_attempts":max,"static_input":{"node":id}})
}
fn bundle(run: &str, graph: DagDefinition, deadline: u128) -> RunBundle {
    RunBundle::new(run, graph, 10, deadline, vec!["owner:test".into()]).unwrap()
}
fn receipt(
    command: &rwo_core::DagCommand,
    lease: &cyberalchemy_orchestrator_runtime::Lease,
    id: &str,
    effect: EffectDisposition,
    outcome: &str,
) -> Receipt {
    let event = match outcome {
        "success" => NodeEvent::succeeded(
            format!("event-{id}"),
            &command.node_id,
            json!({"artifact":id}),
        ),
        "retry" => NodeEvent::retryable_failure(format!("event-{id}"), &command.node_id, "retry"),
        _ => NodeEvent::failed(format!("event-{id}"), &command.node_id, "failed"),
    }
    .bind_command(&command.command_id);
    Receipt {
        receipt_id: id.into(),
        command_id: command.command_id.clone(),
        worker_id: lease.worker_id.clone(),
        fencing_token: lease.fencing_token,
        event,
        effect_disposition: effect,
        recorded_at_ms: 30,
    }
}

#[test]
fn crash_restart_duplicate_and_conflict_preserve_atomic_history() {
    let temp = tempfile::tempdir().unwrap();
    let c = DurableRunController::register(
        temp.path().join("run"),
        bundle(
            "run",
            graph(
                json!([
                    node("a", &[], json!({"mode":"root"}), 1),
                    node("b", &["a"], json!({"mode":"all"}), 1)
                ]),
                1,
            ),
            1000,
        ),
    )
    .unwrap();
    let a = c.pending_commands().unwrap().remove(0);
    let l = c.acquire(&a.command_id, "w", 20, 100).unwrap();
    c.begin(&a.command_id, "w", l.fencing_token, 21).unwrap();
    let r = receipt(&a, &l, "r1", EffectDisposition::NotApplicable, "success");
    assert!(matches!(
        c.complete(0, r.clone(), 30).unwrap(),
        CompletionOutcome::Accepted(_)
    ));
    std::fs::write(temp.path().join("run/accepted-history.tmp"), b"partial").unwrap();
    let reopened = DurableRunController::open(temp.path().join("run")).unwrap();
    assert_eq!(reopened.snapshot().unwrap().revision, 1);
    assert_eq!(reopened.pending_commands().unwrap()[0].node_id, "b");
    assert!(matches!(
        reopened.complete(0, r, 30).unwrap(),
        CompletionOutcome::Duplicate(_)
    ));
    let b = reopened.pending_commands().unwrap().remove(0);
    let stale = NodeEvent::succeeded("new-event", "b", json!({"x":1})).bind_command(&b.command_id);
    assert!(matches!(
        reopened.accept_event(0, stale).unwrap(),
        AcceptOutcome::Conflict {
            expected: 0,
            actual: 1
        }
    ));
}

#[test]
fn retry_quorum_cancellation_and_deadline_use_rwo_transitions() {
    let temp = tempfile::tempdir().unwrap();
    let c = DurableRunController::register(
        temp.path().join("q"),
        bundle(
            "q",
            graph(
                json!([
                    node("a", &[], json!({"mode":"root"}), 2),
                    node("b", &[], json!({"mode":"root"}), 1),
                    node("c", &[], json!({"mode":"root"}), 1),
                    node(
                        "join",
                        &["a", "b", "c"],
                        json!({"mode":"quorum","quorum":2}),
                        1
                    )
                ]),
                4,
            ),
            1000,
        ),
    )
    .unwrap();
    let commands = c.pending_commands().unwrap();
    let a = commands.iter().find(|x| x.node_id == "a").unwrap();
    let l = c.acquire(&a.command_id, "w", 20, 100).unwrap();
    c.begin(&a.command_id, "w", l.fencing_token, 21).unwrap();
    assert!(matches!(
        c.complete(
            0,
            receipt(a, &l, "retry", EffectDisposition::NotApplied, "retry"),
            30
        )
        .unwrap(),
        CompletionOutcome::Accepted(_)
    ));
    assert!(c
        .pending_commands()
        .unwrap()
        .iter()
        .any(|x| x.node_id == "a" && x.attempt == 2));
    let state = c.snapshot().unwrap();
    assert!(matches!(
        c.cancel(state.revision, "cancel-q", "operator", 40)
            .unwrap(),
        AcceptOutcome::Accepted(_)
    ));
    assert!(c.snapshot().unwrap().cursor.cancelled);
    let d = DurableRunController::register(
        temp.path().join("deadline"),
        bundle(
            "deadline",
            graph(json!([node("a", &[], json!({"mode":"root"}), 1)]), 1),
            50,
        ),
    )
    .unwrap();
    assert!(d.expire_if_due(49).unwrap().is_none());
    assert!(matches!(
        d.expire_if_due(50).unwrap(),
        Some(AcceptOutcome::Accepted(_))
    ));
}

#[test]
fn unknown_effect_blocks_until_an_owner_resolution() {
    let temp = tempfile::tempdir().unwrap();
    let c = DurableRunController::register(
        temp.path().join("u"),
        bundle(
            "u",
            graph(json!([node("effect", &[], json!({"mode":"root"}), 1)]), 1),
            1000,
        ),
    )
    .unwrap();
    let cmd = c.pending_commands().unwrap().remove(0);
    let l = c.acquire(&cmd.command_id, "w", 20, 100).unwrap();
    c.begin(&cmd.command_id, "w", l.fencing_token, 21).unwrap();
    let r = receipt(&cmd, &l, "unknown", EffectDisposition::Unknown, "success");
    let outcome = c.complete(0, r, 30).unwrap();
    assert!(
        matches!(outcome,CompletionOutcome::ReceiptOnly(ref a) if a.action==RecoveryAction::BlockedUnknownEffect)
    );
    assert_eq!(c.snapshot().unwrap().revision, 0);
    assert_eq!(
        c.resolve_unknown(&cmd.command_id, EffectDisposition::Applied)
            .unwrap()
            .action,
        RecoveryAction::AcceptRecordedEvent
    );
    assert!(matches!(
        c.accept_recorded_event(0, &cmd.command_id).unwrap(),
        AcceptOutcome::Accepted(_)
    ));
    assert_eq!(c.snapshot().unwrap().revision, 1);
}

#[test]
fn runtime_supervisor_and_worker_api_enforce_global_capacity() {
    let temp = tempfile::tempdir().unwrap();
    let runtime = OrchestratorRuntime::open(temp.path(), 1).unwrap();
    runtime
        .register(bundle(
            "a",
            graph(json!([node("work", &[], json!({"mode":"root"}), 1)]), 1),
            1000,
        ))
        .unwrap();
    runtime
        .register(bundle(
            "b",
            graph(json!([node("work", &[], json!({"mode":"root"}), 1)]), 1),
            1000,
        ))
        .unwrap();
    let api = WorkerApi::new(runtime.clone());
    let first = api.handle(WorkerRequest::Poll {
        worker_id: "w1".into(),
        capabilities: vec!["work".into()],
        now_ms: 20,
        ttl_ms: 100,
    });
    assert!(first.ok);
    assert_eq!(first.kind, "assignment");
    let second = api.handle(WorkerRequest::Poll {
        worker_id: "w2".into(),
        capabilities: vec!["work".into()],
        now_ms: 21,
        ttl_ms: 100,
    });
    assert!(second.ok);
    assert_eq!(second.kind, "idle");
}
