use cav2_work_orchestration_etl_demo::dag::{DagCommand, DagDefinition, DagEngine, NodeEvent};
use serde_json::{json, Value};

fn graph(nodes: Value, parallelism: usize) -> DagDefinition {
    DagDefinition::from_value(&json!({
        "dag_id": "test-dag",
        "deadline_seconds": 30,
        "max_parallelism": parallelism,
        "nodes": nodes,
    }))
    .expect("valid graph")
}

fn node(id: &str, dependencies: &[&str], mode: &str) -> Value {
    json!({
        "node_id": id,
        "contract": "extractor",
        "role_id": id,
        "depends_on": dependencies,
        "release": {"mode": mode},
        "max_attempts": 2,
        "static_input": {"fixture": id},
    })
}

fn success(command: &DagCommand) -> NodeEvent {
    NodeEvent::succeeded(
        format!("event-{}", command.node_id),
        &command.node_id,
        json!({"path": format!("/{}.json", command.node_id)}),
    )
    .bind_command(&command.command_id)
}

#[test]
fn fanout_and_all_join_emit_deterministic_batches() {
    let mut engine = DagEngine::new(graph(
        json!([
            node("a", &[], "root"),
            node("b", &[], "root"),
            node("c", &[], "root"),
            node("join", &["a", "b", "c"], "all"),
        ]),
        8,
    ));
    let start = engine.start();
    assert_eq!(
        start
            .commands
            .iter()
            .map(|item| item.node_id.as_str())
            .collect::<Vec<_>>(),
        ["a", "b", "c"]
    );
    assert!(engine
        .apply_event(success(&start.commands[0]))
        .unwrap()
        .commands
        .is_empty());
    assert!(engine
        .apply_event(success(&start.commands[1]))
        .unwrap()
        .commands
        .is_empty());
    let released = engine.apply_event(success(&start.commands[2])).unwrap();
    assert_eq!(released.commands.len(), 1);
    assert_eq!(released.commands[0].node_id, "join");
    assert_eq!(
        released.commands[0].input["dependencies"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
}

#[test]
fn any_and_quorum_release_at_the_declared_threshold() {
    let mut engine = DagEngine::new(graph(
        json!([
            node("a", &[], "root"),
            node("b", &[], "root"),
            node("c", &[], "root"),
            node("any", &["a", "b", "c"], "any"),
            {
                "node_id": "quorum",
                "contract": "reducer",
                "role_id": "quorum",
                "depends_on": ["a", "b", "c"],
                "release": {"mode": "quorum", "quorum": 2},
                "max_attempts": 1
            }
        ]),
        8,
    ));
    let start = engine.start();
    let first = engine.apply_event(success(&start.commands[0])).unwrap();
    assert_eq!(
        first
            .commands
            .iter()
            .map(|item| item.node_id.as_str())
            .collect::<Vec<_>>(),
        ["any"]
    );
    let second = engine.apply_event(success(&start.commands[1])).unwrap();
    assert_eq!(
        second
            .commands
            .iter()
            .map(|item| item.node_id.as_str())
            .collect::<Vec<_>>(),
        ["quorum"]
    );
}

#[test]
fn impossible_join_blocks_and_retry_is_bounded() {
    let mut engine = DagEngine::new(graph(
        json!([node("a", &[], "root"), node("b", &["a"], "all")]),
        2,
    ));
    let first_command = engine.start().commands.remove(0);
    let retry = engine
        .apply_event(
            NodeEvent::retryable_failure("failure-1", "a", "temporary")
                .bind_command(&first_command.command_id),
        )
        .unwrap();
    assert_eq!(retry.commands.len(), 1);
    assert_ne!(retry.commands[0].command_id, first_command.command_id);
    let terminal = engine
        .apply_event(
            NodeEvent::retryable_failure("failure-2", "a", "still-broken")
                .bind_command(&retry.commands[0].command_id),
        )
        .unwrap();
    assert_eq!(terminal.kind, "Failed");
    assert_eq!(terminal.cursor.node_status["a"], "failed");
    assert_eq!(terminal.cursor.node_status["b"], "blocked");
}

#[test]
fn duplicate_is_idempotent_and_divergent_duplicate_is_rejected() {
    let mut engine = DagEngine::new(graph(json!([node("a", &[], "root")]), 1));
    let command = engine.start().commands.remove(0);
    let event = success(&command);
    engine.apply_event(event.clone()).unwrap();
    assert_eq!(engine.apply_event(event).unwrap().kind, "Duplicate");
    let divergent = NodeEvent::succeeded("event-a", "a", json!({"path": "/different.json"}))
        .bind_command(&command.command_id);
    assert!(engine
        .apply_event(divergent)
        .unwrap_err()
        .starts_with("DAG_DIVERGENT_DUPLICATE"));
}

#[test]
fn accepted_retry_replay_is_duplicate_after_next_attempt_is_issued() {
    let mut engine = DagEngine::new(graph(json!([node("a", &[], "root")]), 1));
    let first = engine.start().commands.remove(0);
    let event =
        NodeEvent::retryable_failure("retry-1", "a", "temporary").bind_command(&first.command_id);
    let retried = engine.apply_event(event.clone()).unwrap();
    assert_eq!(retried.commands.len(), 1);
    assert_ne!(retried.commands[0].command_id, first.command_id);
    let before = engine.cursor.to_value();

    let duplicate = engine.apply_event(event.clone()).unwrap();
    assert_eq!(duplicate.kind, "Duplicate");
    assert!(duplicate.commands.is_empty());
    assert_eq!(engine.cursor.to_value(), before);

    let divergent =
        NodeEvent::retryable_failure("retry-1", "a", "changed").bind_command(&first.command_id);
    assert!(engine
        .apply_event(divergent)
        .unwrap_err()
        .starts_with("DAG_DIVERGENT_DUPLICATE"));
    assert_eq!(engine.cursor.to_value(), before);
}

#[test]
fn rejected_events_are_command_bound_and_reducer_atomic() {
    let mut engine = DagEngine::new(graph(json!([node("a", &[], "root")]), 1));
    let command = engine.start().commands.remove(0);
    let before = engine.cursor.to_value();
    let missing = NodeEvent::succeeded("missing", "a", json!({"ok":true}));
    assert!(engine
        .apply_event(missing)
        .unwrap_err()
        .starts_with("DAG_EVENT_COMMAND_REQUIRED"));
    assert_eq!(engine.cursor.to_value(), before);

    let wrong = NodeEvent::succeeded("wrong", "a", json!({"ok":true})).bind_command("wrong");
    assert!(engine
        .apply_event(wrong)
        .unwrap_err()
        .starts_with("DAG_EVENT_COMMAND_MISMATCH"));
    assert_eq!(engine.cursor.to_value(), before);

    let no_output = NodeEvent {
        event_id: "no-output".to_owned(),
        command_id: Some(command.command_id.clone()),
        node_id: "a".to_owned(),
        outcome: "succeeded".to_owned(),
        output_ref: None,
        error: None,
    };
    assert_eq!(
        engine.apply_event(no_output).unwrap_err(),
        "DAG_SUCCESS_OUTPUT_REQUIRED"
    );
    assert_eq!(engine.cursor.to_value(), before);

    let unknown = NodeEvent {
        event_id: "unknown".to_owned(),
        command_id: Some(command.command_id),
        node_id: "a".to_owned(),
        outcome: "invented".to_owned(),
        output_ref: None,
        error: None,
    };
    assert!(engine
        .apply_event(unknown)
        .unwrap_err()
        .starts_with("DAG_EVENT_OUTCOME_UNKNOWN"));
    assert_eq!(engine.cursor.to_value(), before);
}

#[test]
fn cycles_unknown_dependencies_and_invalid_quorums_fail_closed() {
    let cycle = json!({
        "dag_id": "cycle",
        "deadline_seconds": 10,
        "max_parallelism": 2,
        "nodes": [node("a", &["b"], "all"), node("b", &["a"], "all")]
    });
    assert_eq!(
        DagDefinition::from_value(&cycle).unwrap_err(),
        "DAG_CYCLE_DETECTED"
    );

    let missing = json!({
        "dag_id": "missing",
        "deadline_seconds": 10,
        "max_parallelism": 2,
        "nodes": [node("a", &["absent"], "all")]
    });
    assert!(DagDefinition::from_value(&missing)
        .unwrap_err()
        .starts_with("DAG_DEPENDENCY_MISSING"));

    let quorum = json!({
        "dag_id": "quorum",
        "deadline_seconds": 10,
        "max_parallelism": 2,
        "nodes": [
            node("a", &[], "root"),
            {"node_id":"q","contract":"reducer","role_id":"q","depends_on":["a"],"release":{"mode":"quorum","quorum":2}}
        ]
    });
    assert!(DagDefinition::from_value(&quorum)
        .unwrap_err()
        .starts_with("DAG_QUORUM_UNREACHABLE"));
}
