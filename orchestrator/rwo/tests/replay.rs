use rwo_core::{apply_event, replay, DagDefinition, DagEngine, NodeEvent};
use serde_json::json;

fn graph() -> DagDefinition {
    DagDefinition::from_value(&json!({"dag_id":"replay","deadline_seconds":30,"max_parallelism":1,"nodes":[
      {"node_id":"a","contract":"first","role_id":"a","depends_on":[],"release":{"mode":"root"},"max_attempts":1},
      {"node_id":"b","contract":"second","role_id":"b","depends_on":["a"],"release":{"mode":"all"},"max_attempts":1}
    ]})).unwrap()
}

#[test]
fn stateless_apply_and_full_replay_are_deterministic() {
    let definition = graph();
    let mut engine = DagEngine::new(definition.clone());
    let first = engine.start().commands.remove(0);
    let e1 =
        NodeEvent::succeeded("e1", "a", json!({"artifact":"a"})).bind_command(first.command_id);
    let after = apply_event(definition.clone(), engine.cursor.clone(), e1.clone()).unwrap();
    assert_eq!(after.commands[0].node_id, "b");
    let e2 = NodeEvent::succeeded("e2", "b", json!({"artifact":"b"}))
        .bind_command(after.commands[0].command_id.clone());
    let direct = apply_event(definition.clone(), after.cursor.clone(), e2.clone()).unwrap();
    let replayed = replay(definition, [e1, e2]).unwrap();
    assert_eq!(direct, replayed);
    assert_eq!(replayed.kind, "Succeeded");
}

#[test]
fn cursor_round_trip_retains_replay_identity() {
    let definition = graph();
    let mut engine = DagEngine::new(definition.clone());
    let first = engine.start().commands.remove(0);
    let event =
        NodeEvent::succeeded("e1", "a", json!({"artifact":"a"})).bind_command(first.command_id);
    let after = engine.apply_event(event).unwrap();
    let bytes = serde_json::to_vec(&after.cursor).unwrap();
    let decoded = serde_json::from_slice(&bytes).unwrap();
    let restored = DagEngine::from_cursor(definition, decoded).unwrap();
    assert_eq!(restored.cursor, after.cursor);
}
