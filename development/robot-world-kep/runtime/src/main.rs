//! JSON-lines host for the existing RWO DAG engine; executes no task commands.
//! Open questions are tracked in ../../OPEN-QUESTIONS.md.
use cav2_work_orchestration_etl_demo::dag::{DagDefinition, DagEngine, NodeEvent};
use serde_json::{json, Value};
use std::io::{self, BufRead, Write};

fn handle(request: Value, engine: &mut Option<DagEngine>) -> Result<Value, String> {
    match request["operation"].as_str().unwrap_or("") {
        "validate" => {
            let definition = DagDefinition::from_value(&request["definition"])?;
            Ok(json!({"status":"PASS", "dag_id":definition.dag_id, "nodes":definition.nodes.len()}))
        }
        "start" => {
            if engine.is_some() { return Err("ENGINE_ALREADY_STARTED".into()); }
            let mut active = DagEngine::new(DagDefinition::from_value(&request["definition"])?);
            let transition = active.start();
            let result = json!({"kind":transition.kind,"cursor":transition.cursor.to_value(),
                "commands":transition.commands.iter().map(|c| c.to_value()).collect::<Vec<_>>(),
                "terminal":active.is_terminal(),"status":active.terminal_status()});
            *engine = Some(active);
            Ok(result)
        }
        "complete" => {
            let active = engine.as_mut().ok_or("ENGINE_NOT_STARTED")?;
            let field = |name: &str| request[name].as_str().ok_or_else(|| format!("MISSING:{name}"));
            let event = if request["success"] == true {
                NodeEvent::succeeded(field("event_id")?, field("node_id")?, request["output"].clone())
            } else {
                NodeEvent::failed(field("event_id")?, field("node_id")?, field("error")?)
            }.bind_command(field("command_id")?);
            let transition = active.apply_event(event)?;
            Ok(json!({"kind":transition.kind,"cursor":transition.cursor.to_value(),
                "commands":transition.commands.iter().map(|c| c.to_value()).collect::<Vec<_>>(),
                "terminal":active.is_terminal(),"status":active.terminal_status()}))
        }
        _ => Err("UNKNOWN_OPERATION".into()),
    }
}

fn main() {
    let mut engine = None;
    for line in io::stdin().lock().lines() {
        let result = line.map_err(|e| e.to_string())
            .and_then(|s| serde_json::from_str(&s).map_err(|e| e.to_string()))
            .and_then(|request| handle(request, &mut engine));
        let response = match result { Ok(value) => value, Err(error) => json!({"error":error}) };
        println!("{response}");
        io::stdout().flush().expect("stdout flush");
    }
}
