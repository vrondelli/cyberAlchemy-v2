use rwo_rust::{compile_work_graph, initial_cursor, reduce_event, CompiledGraph};
use serde_json::{json, Value};
use std::io::{self, Read};

fn defects(value: &[rwo_rust::StructuralDefect]) -> Value {
    Value::Array(
        value
            .iter()
            .map(|item| {
                json!({
                    "phase": item.phase,
                    "code": item.code,
                    "detail_digest": item.detail_digest,
                })
            })
            .collect(),
    )
}

fn compile(value: &Value) -> Result<CompiledGraph, String> {
    let outcome = compile_work_graph(&value["composition"]);
    outcome
        .compiled
        .ok_or_else(|| format!("RWO_COMPILE_REJECTED:{}", defects(&outcome.defects)))
}

fn main() -> Result<(), String> {
    let mut input = String::new();
    io::stdin()
        .read_to_string(&mut input)
        .map_err(|e| e.to_string())?;
    let request: Value = serde_json::from_str(&input).map_err(|e| e.to_string())?;
    let compiled = compile(&request)?;
    let response = match request["operation"].as_str() {
        Some("compile") => {
            let stream = request["stream_id"].as_str().ok_or("STREAM_ID_MISSING")?;
            let cursor = initial_cursor(&compiled, stream)?;
            json!({"kind":"Compiled","graph_identity":compiled.graph_identity,"cursor":cursor.cursor})
        }
        Some("reduce") => {
            let outcome = reduce_event(&compiled, &request["cursor"], &request["event"]);
            json!({
                "kind": outcome.kind,
                "cursor": outcome.cursor,
                "command": outcome.command,
                "defects": defects(&outcome.defects),
                "accepted_event_identity": outcome.accepted_event_identity,
                "event_payload_digest": outcome.event_payload_digest,
                "command_intent_identity": outcome.command_intent_identity,
                "command_payload_digest": outcome.command_payload_digest,
                "graph_identity": compiled.graph_identity,
            })
        }
        _ => return Err("OPERATION_UNSUPPORTED".to_owned()),
    };
    println!(
        "{}",
        serde_json::to_string(&response).map_err(|e| e.to_string())?
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_empty_composition() {
        let value = json!({"composition": {}});
        assert!(compile(&value).is_err());
    }
}
