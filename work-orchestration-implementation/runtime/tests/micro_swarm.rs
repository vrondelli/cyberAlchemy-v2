use cav2_work_orchestration_etl_demo::dag::{DagDefinition, DagEngine, NodeEvent};
use cav2_work_orchestration_etl_demo::host::replay_events;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

fn package_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .to_path_buf()
}

fn definition() -> DagDefinition {
    let value: Value = serde_json::from_slice(
        &fs::read(package_root().join("generated/micro-swarm-dag.json")).unwrap(),
    )
    .unwrap();
    DagDefinition::from_value(&value).unwrap()
}

#[test]
fn compiled_micro_swarm_releases_27_9_3_3_and_replays() {
    let definition = definition();
    assert_eq!(definition.nodes.len(), 42);
    let mut engine = DagEngine::new(definition.clone());
    let mut batch = engine.start().commands;
    let mut batch_sizes = Vec::new();
    let mut events = Vec::new();
    while !batch.is_empty() {
        batch_sizes.push(batch.len());
        let current = std::mem::take(&mut batch);
        for command in current {
            let event = NodeEvent::succeeded(
                format!("{}:succeeded", command.command_id),
                command.node_id.clone(),
                json!({"path": format!("/fixture/{}.json", command.node_id)}),
            )
            .bind_command(&command.command_id);
            batch.extend(engine.apply_event(event.clone()).unwrap().commands);
            events.push(event);
        }
    }
    assert_eq!(batch_sizes, [27, 9, 3, 3]);
    assert!(engine.is_terminal());
    assert_eq!(engine.terminal_status(), "Succeeded");
    assert_eq!(events.len(), 42);
    assert_eq!(replay_events(definition, &events).unwrap(), engine.cursor);
}
