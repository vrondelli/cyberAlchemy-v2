#[path = "../../../../runtime/src/dag.rs"]
mod dag;

use dag::{DagDefinition, DagEngine, NodeEvent};
use serde_json::{json, Value};
use std::io::{self, Read};

fn run(v: Value) -> Result<Value, String> {
    let mut engine = DagEngine::new(DagDefinition::from_value(&v["dag"])?);
    let start = engine.start();
    let mut transitions = vec![json!({"event":null,"cursor":start.cursor.to_value(),
        "commands":start.commands.iter().map(|c| c.to_value()).collect::<Vec<_>>()})];
    for item in v["events"].as_array().ok_or("EVENTS_REQUIRED")? {
        let text = |key: &str| -> Result<String, String> {
            item[key]
                .as_str()
                .map(str::to_owned)
                .ok_or(format!("EVENT_FIELD:{key}"))
        };
        let event = NodeEvent {
            event_id: text("event_id")?,
            command_id: Some(text("command_id")?),
            node_id: text("node_id")?,
            outcome: text("outcome")?,
            output_ref: item.get("output_ref").filter(|v| !v.is_null()).cloned(),
            error: item.get("error").and_then(Value::as_str).map(str::to_owned),
        };
        let t = engine.apply_event(event)?;
        if t.kind == "Duplicate" {
            return Err("DUPLICATE_HISTORY_ROW".into());
        }
        transitions.push(json!({"event":item,"cursor":t.cursor.to_value(),
            "commands":t.commands.iter().map(|c| c.to_value()).collect::<Vec<_>>()}));
    }
    Ok(
        json!({"transitions":transitions,"terminal":engine.is_terminal(),
        "status":if engine.is_terminal() {engine.terminal_status()} else {"Running"}}),
    )
}

fn main() {
    let result = (|| {
        let mut input = String::new();
        io::stdin()
            .take(4 * 1024 * 1024)
            .read_to_string(&mut input)
            .map_err(|e| e.to_string())?;
        run(serde_json::from_str(&input).map_err(|e| e.to_string())?)
    })();
    match result {
        Ok(value) => println!("{value}"),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(1);
        }
    }
}
