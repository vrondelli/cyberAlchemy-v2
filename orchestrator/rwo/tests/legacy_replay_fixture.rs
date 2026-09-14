use rwo_core::{DagDefinition, DagEngine, NodeEvent};
use serde_json::{json, Value};

fn new_graph() -> DagDefinition {
    DagDefinition::from_value(&json!({"dag_id":"etl-shared-subset","deadline_seconds":60,"max_parallelism":1,"nodes":[
        {"node_id":"extract","contract":"RunExtract","role_id":"extract","depends_on":[],"release":{"mode":"root"}},
        {"node_id":"normalize","contract":"RunNormalize","role_id":"normalize","depends_on":["extract"],"release":{"mode":"all"}},
        {"node_id":"validate","contract":"RunValidation","role_id":"validate","depends_on":["normalize"],"release":{"mode":"all"}},
        {"node_id":"load","contract":"RunLoad","role_id":"load","depends_on":["validate"],"release":{"mode":"all"}}
    ]}))
    .unwrap()
}

#[test]
fn frozen_legacy_sequence_remains_replay_compatible() {
    let fixture: Value = serde_json::from_str(include_str!(
        "../legacy-fixtures/etl-command-sequence.v1.json"
    ))
    .unwrap();
    let expected = fixture["command_contracts"]
        .as_array()
        .unwrap()
        .iter()
        .map(|value| value.as_str().unwrap().to_owned())
        .collect::<Vec<_>>();

    let mut engine = DagEngine::new(new_graph());
    let mut transition = engine.start();
    let mut actual = Vec::new();
    for index in 0..expected.len() {
        let command = transition.commands.first().unwrap().clone();
        actual.push(command.contract.clone());
        transition = engine
            .apply_event(
                NodeEvent::succeeded(
                    format!("replay-{index}"),
                    command.node_id,
                    json!({"step":index}),
                )
                .bind_command(command.command_id),
            )
            .unwrap();
    }
    assert_eq!(actual, expected);
    assert_eq!(transition.kind, "Succeeded");
}
