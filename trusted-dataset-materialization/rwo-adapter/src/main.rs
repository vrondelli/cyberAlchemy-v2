use rwo_core::{DagCursor, DagDefinition, DagEngine, NodeEvent};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::io::{self, Read};

fn digest(value: &Value) -> String {
    let bytes = serde_json::to_vec(value).expect("JSON value serializes");
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn required_text<'a>(value: &'a Value, field: &str) -> Result<&'a str, String> {
    value[field]
        .as_str()
        .ok_or_else(|| format!("RWO_ADAPTER_FIELD_REQUIRED:{field}"))
}

fn graph_from_composition(composition: &Value) -> Result<DagDefinition, String> {
    let composition_id = required_text(composition, "composition_id")?;
    let raw_nodes = composition["nodes"]
        .as_array()
        .filter(|nodes| !nodes.is_empty())
        .ok_or_else(|| "RWO_COMPOSITION_NODES_REQUIRED".to_owned())?;
    let edges = composition["edges"]
        .as_array()
        .ok_or_else(|| "RWO_COMPOSITION_EDGES_REQUIRED".to_owned())?;

    let node_ids = raw_nodes
        .iter()
        .map(|node| required_text(node, "node_id").map(str::to_owned))
        .collect::<Result<BTreeSet<_>, _>>()?;
    if node_ids.len() != raw_nodes.len() {
        return Err("RWO_COMPOSITION_NODE_DUPLICATE".to_owned());
    }

    let mut incoming = BTreeMap::<String, Vec<&Value>>::new();
    let mut outgoing = BTreeMap::<String, Vec<&Value>>::new();
    for edge in edges {
        let source = required_text(edge, "source_node_id")?;
        let target = required_text(edge, "target_node_id")?;
        if !node_ids.contains(source) || !node_ids.contains(target) {
            return Err("RWO_COMPOSITION_EDGE_NODE_UNKNOWN".to_owned());
        }
        incoming.entry(target.to_owned()).or_default().push(edge);
        outgoing.entry(source.to_owned()).or_default().push(edge);
    }

    let nodes = node_ids
        .iter()
        .map(|node_id| {
            let dependencies = incoming
                .get(node_id)
                .into_iter()
                .flatten()
                .map(|edge| required_text(edge, "source_node_id").map(str::to_owned))
                .collect::<Result<Vec<_>, _>>()?;
            let when = if let Some(values) = incoming.get(node_id) {
                if values.len() == 1 {
                    let edge = values[0];
                    let source = required_text(edge, "source_node_id")?;
                    if outgoing.get(source).map(Vec::len).unwrap_or_default() > 1 {
                        json!({
                            "dependency": source,
                            "pointer": "/event_type",
                            "equals": required_text(edge, "event_type")?,
                        })
                    } else {
                        Value::Null
                    }
                } else {
                    Value::Null
                }
            } else {
                Value::Null
            };
            Ok(json!({
                "node_id": node_id,
                "contract": if node_id == composition_id { "RequestMaterialization" } else { node_id },
                "role_id": "trusted-dataset-operation",
                "depends_on": dependencies,
                "release": {"mode": if dependencies.is_empty() { "root" } else { "all" }},
                "max_attempts": 1,
                "static_input": {"composition_id": composition_id},
                "when": when,
            }))
        })
        .collect::<Result<Vec<Value>, String>>()?;

    DagDefinition::from_value(&json!({
        "dag_id": composition_id,
        "deadline_seconds": 3600,
        "max_parallelism": 1,
        "nodes": nodes,
    }))
}

fn event_is_declared(composition: &Value, source: &str, event_type: &str) -> bool {
    let outgoing = composition["edges"]
        .as_array()
        .into_iter()
        .flatten()
        .filter(|edge| edge["source_node_id"] == source)
        .collect::<Vec<_>>();
    outgoing.is_empty() || outgoing.iter().any(|edge| edge["event_type"] == event_type)
}

fn command_view(command: &rwo_core::DagCommand) -> Value {
    json!({
        "command_type": command.contract,
        "target_node_id": command.node_id,
        "command_id": command.command_id,
        "attempt": command.attempt,
        "payload": command.input,
    })
}

fn reduce(request: &Value, graph: DagDefinition) -> Result<Value, String> {
    let composition = &request["composition"];
    let legacy_event = &request["event"];
    let source = required_text(legacy_event, "source_node_id")?;
    let event_type = required_text(legacy_event, "event_type")?;
    if !event_is_declared(composition, source, event_type) {
        return Err(format!("RWO_EVENT_NOT_DECLARED:{source}:{event_type}"));
    }
    let cursor: DagCursor = serde_json::from_value(request["cursor"].clone())
        .map_err(|error| format!("RWO_CURSOR_INVALID:{error}"))?;
    let mut engine = DagEngine::from_cursor(graph.clone(), cursor)?;
    let command = engine.command_for_attempt(source)?;
    let event = NodeEvent::succeeded(
        required_text(legacy_event, "event_id")?,
        source,
        json!({"event_type":event_type,"payload":legacy_event["payload"]}),
    )
    .bind_command(&command.command_id);
    let event_value = event.to_value();
    let transition = engine.apply_event(event)?;
    let next = transition.commands.first().map(command_view);
    Ok(json!({
        "kind": if transition.kind == "Duplicate" { "Duplicate" } else { "Applied" },
        "cursor": transition.cursor,
        "command": next,
        "defects": [],
        "accepted_event_identity": digest(&event_value),
        "event_payload_digest": digest(&legacy_event["payload"]),
        "command_intent_identity": next.as_ref().map(|value| value["command_id"].clone()),
        "command_payload_digest": next.as_ref().map(|value| digest(&value["payload"])),
        "graph_identity": digest(&serde_json::to_value(graph).expect("graph serializes")),
        "engine_version": rwo_core::ENGINE_VERSION,
    }))
}

fn handle(request: &Value) -> Result<Value, String> {
    let composition = request
        .get("composition")
        .ok_or_else(|| "RWO_COMPOSITION_REQUIRED".to_owned())?;
    let graph = graph_from_composition(composition)?;
    match request["operation"].as_str() {
        Some("compile") => {
            let mut engine = DagEngine::new(graph.clone());
            let transition = engine.start();
            Ok(json!({
                "kind":"Compiled",
                "graph_identity":digest(&serde_json::to_value(graph).expect("graph serializes")),
                "engine_version":rwo_core::ENGINE_VERSION,
                "cursor":transition.cursor,
            }))
        }
        Some("reduce") => reduce(request, graph),
        _ => Err("OPERATION_UNSUPPORTED".to_owned()),
    }
}

fn main() -> Result<(), String> {
    let mut input = String::new();
    io::stdin()
        .read_to_string(&mut input)
        .map_err(|error| error.to_string())?;
    let request: Value = serde_json::from_str(&input).map_err(|error| error.to_string())?;
    let response = handle(&request)?;
    println!(
        "{}",
        serde_json::to_string(&response).map_err(|error| error.to_string())?
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> Value {
        serde_json::from_str(include_str!("../../generated/rwo-composition.json")).unwrap()
    }

    #[test]
    fn rejects_empty_composition() {
        let value = json!({"composition": {}});
        assert!(handle(&value).is_err());
    }

    #[test]
    fn compiles_fixture_to_current_rwo_engine() {
        let response = handle(&json!({
            "operation":"compile",
            "stream_id":"test",
            "composition":fixture()
        }))
        .unwrap();
        assert_eq!(response["kind"], "Compiled");
        assert_eq!(response["engine_version"], rwo_core::ENGINE_VERSION);
        assert_eq!(
            response["cursor"]["node_status"]["world-bank-indicators-http-to-local-warehouse"],
            "issued"
        );
    }
}
