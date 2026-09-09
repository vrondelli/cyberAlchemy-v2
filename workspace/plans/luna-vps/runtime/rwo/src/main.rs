// Pure bridge to the frozen RWO kernel. Open questions: ../README.md
use std::io::{self, Read};
use rwo_rust::{compile_work_graph, initial_cursor, reduce_event};
use serde_json::{json, Value};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut input = String::new();
    io::stdin().take(1048577).read_to_string(&mut input)?;
    if input.len() > 1048576 { return Err("INPUT_LIMIT".into()); }
    let request: Value = serde_json::from_str(&input)?;
    let compile = compile_work_graph(&request["composition"]);
    let compiled = compile.compiled.ok_or_else(|| format!("COMPILE_REJECTED:{:?}", compile.defects))?;
    let initial = initial_cursor(&compiled, request["stream_id"].as_str().ok_or("STREAM_REQUIRED")?)?;
    let mut response = json!({"graph_identity": compiled.graph_identity, "initial_cursor": initial.cursor});
    if !request["event"].is_null() {
        let cursor = request.get("cursor").unwrap_or(&initial.cursor);
        let outcome = reduce_event(&compiled, cursor, &request["event"]);
        response["transition"] = json!({"kind": outcome.kind, "cursor": outcome.cursor,
            "command": outcome.command, "accepted_event_identity": outcome.accepted_event_identity,
            "command_intent_identity": outcome.command_intent_identity,
            "defects": outcome.defects.iter().map(|d| d.code.clone()).collect::<Vec<_>>()});
    }
    println!("{}", response);
    Ok(())
}
