use crate::dag::{DagCommand, DagCursor, DagDefinition, DagEngine, NodeEvent};
use crate::executor::BatchExecutor;
use crate::ports::{AcceptedHistoryPort, AcceptedHistoryView, AppendOutcome, StructuralTransition};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::time::{Duration, Instant};

fn digest(value: &Value) -> String {
    format!(
        "sha256:{:x}",
        Sha256::digest(serde_json::to_vec(value).expect("JSON serializes"))
    )
}

fn persist(
    history: &mut dyn AcceptedHistoryPort,
    stream_id: &str,
    expected_cursor_identity: Option<String>,
    event: Value,
    cursor: &DagCursor,
    commands: &[DagCommand],
) -> Result<String, String> {
    let cursor_value = cursor.to_value();
    let next_identity = digest(&cursor_value);
    let event_id = event
        .get("event_id")
        .and_then(Value::as_str)
        .ok_or_else(|| "HOST_EVENT_ID_MISSING".to_owned())?
        .to_owned();
    let transition = StructuralTransition {
        stream_id: stream_id.to_owned(),
        expected_cursor_identity,
        event_id,
        accepted_event: event,
        next_cursor: cursor_value,
        next_cursor_identity: next_identity.clone(),
        command_intents: commands.iter().map(DagCommand::to_value).collect(),
    };
    match history.compare_and_append(transition) {
        AppendOutcome::Accepted => Ok(next_identity),
        AppendOutcome::Duplicate => Err("HOST_HISTORY_DUPLICATE".to_owned()),
        AppendOutcome::DivergentDuplicate => Err("HISTORY_DIVERGENT_DUPLICATE".to_owned()),
        AppendOutcome::Conflict => Err("HOST_HISTORY_CONFLICT".to_owned()),
    }
}

pub fn run_dag(
    definition: DagDefinition,
    executor: &dyn BatchExecutor,
    history: &mut dyn AcceptedHistoryPort,
    stream_id: &str,
) -> Result<Value, String> {
    let deadline = Duration::from_secs(definition.deadline_seconds);
    let max_parallelism = definition.max_parallelism;
    let dag_id = definition.dag_id.clone();
    let started = Instant::now();
    let mut engine = DagEngine::new(definition);
    let start = engine.start();
    let mut cursor_identity = Some(persist(
        history,
        stream_id,
        None,
        json!({"event_id": format!("{stream_id}:started"), "event_type": "DagStarted", "dag_id": dag_id}),
        &start.cursor,
        &start.commands,
    )?);
    let mut pending = start.commands;
    let mut command_count = pending.len();

    while !engine.is_terminal() {
        if started.elapsed() >= deadline {
            let cancelled = engine.cancel("GLOBAL_DEADLINE_EXCEEDED");
            persist(
                history,
                stream_id,
                cursor_identity,
                json!({"event_id": format!("{stream_id}:deadline"), "event_type": "DagCancelled", "reason": "GLOBAL_DEADLINE_EXCEEDED"}),
                &cancelled.cursor,
                &[],
            )?;
            return Err("GLOBAL_DEADLINE_EXCEEDED".to_owned());
        }
        if pending.is_empty() {
            return Err("HOST_DAG_STALLED".to_owned());
        }
        let remaining = deadline.saturating_sub(started.elapsed());
        let events = executor.execute_batch(&pending, max_parallelism, remaining);
        pending.clear();
        for event in events {
            let event_value = event.to_value();
            let transition = engine.apply_event(event)?;
            let next_identity = persist(
                history,
                stream_id,
                cursor_identity,
                event_value,
                &transition.cursor,
                &transition.commands,
            )?;
            cursor_identity = Some(next_identity);
            command_count += transition.commands.len();
            pending.extend(transition.commands);
        }
    }
    let history_view = history.read(stream_id);
    Ok(json!({
        "schema_version": "cav2-rwo-dag-run-receipt/v1",
        "status": engine.terminal_status(),
        "dag_id": dag_id,
        "stream_id": stream_id,
        "elapsed_ms": started.elapsed().as_millis(),
        "deadline_seconds": deadline.as_secs(),
        "commands": command_count,
        "accepted_events": history_view.events.len(),
        "command_intents": history_view.command_intents.len(),
        "cursor_identity": history_view.cursor_identity,
        "cursor": engine.cursor.to_value(),
        "authority_effect": "none",
        "external_effect": "none"
    }))
}

pub fn replay_events(definition: DagDefinition, events: &[NodeEvent]) -> Result<DagCursor, String> {
    let mut engine = DagEngine::new(definition);
    engine.start();
    for event in events {
        engine.apply_event(event.clone())?;
    }
    Ok(engine.cursor)
}

fn node_event_from_value(value: &Value) -> Result<NodeEvent, String> {
    Ok(NodeEvent {
        event_id: value
            .get("event_id")
            .and_then(Value::as_str)
            .ok_or_else(|| "HISTORY_REPLAY_EVENT_INVALID".to_owned())?
            .to_owned(),
        command_id: value
            .get("command_id")
            .and_then(Value::as_str)
            .map(str::to_owned),
        node_id: value
            .get("node_id")
            .and_then(Value::as_str)
            .ok_or_else(|| "HISTORY_REPLAY_EVENT_INVALID".to_owned())?
            .to_owned(),
        outcome: value
            .get("outcome")
            .and_then(Value::as_str)
            .ok_or_else(|| "HISTORY_REPLAY_EVENT_INVALID".to_owned())?
            .to_owned(),
        output_ref: value
            .get("output_ref")
            .filter(|value| !value.is_null())
            .cloned(),
        error: value
            .get("error")
            .and_then(Value::as_str)
            .map(str::to_owned),
    })
}

pub fn verify_accepted_history(
    definition: DagDefinition,
    history: &AcceptedHistoryView,
) -> Result<DagCursor, String> {
    let mut engine = DagEngine::new(definition);
    let started = engine.start();
    let Some(first) = history.transitions.first() else {
        return Err("HISTORY_STREAM_EMPTY".to_owned());
    };
    if first
        .accepted_event
        .get("event_type")
        .and_then(Value::as_str)
        != Some("DagStarted")
        || first.next_cursor != started.cursor.to_value()
        || first.command_intents
            != started
                .commands
                .iter()
                .map(DagCommand::to_value)
                .collect::<Vec<_>>()
    {
        return Err("HISTORY_REPLAY_MISMATCH".to_owned());
    }
    let mut expected_cursor_identity = Some(first.next_cursor_identity.clone());
    for stored in history.transitions.iter().skip(1) {
        if stored.expected_cursor_identity != expected_cursor_identity {
            return Err("HISTORY_REPLAY_MISMATCH".to_owned());
        }
        let event = node_event_from_value(&stored.accepted_event)?;
        let transition = engine.apply_event(event)?;
        let commands = transition
            .commands
            .iter()
            .map(DagCommand::to_value)
            .collect::<Vec<_>>();
        if stored.next_cursor != transition.cursor.to_value() || stored.command_intents != commands
        {
            return Err("HISTORY_REPLAY_MISMATCH".to_owned());
        }
        expected_cursor_identity = Some(stored.next_cursor_identity.clone());
    }
    if history.cursor.as_ref() != Some(&engine.cursor.to_value()) {
        return Err("HISTORY_REPLAY_MISMATCH".to_owned());
    }
    Ok(engine.cursor)
}
