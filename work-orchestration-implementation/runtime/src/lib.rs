use rwo_rust::{
    compile_work_graph, initial_cursor, reduce_event, CompiledGraph, CONTRACT_ID, CONTRACT_VERSION,
    PROFILE_ID, PROFILE_VERSION,
};
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};

pub mod c19;
pub mod composite;
pub mod dag;
pub mod executor;
pub mod host;
pub mod l0;
pub mod ports;
pub mod repository;

const JOB_ID: &str = "customer-etl-job-001";
const STREAM_ID: &str = "customer-etl-stream-001";

#[derive(Default)]
struct Warehouse {
    rows: BTreeMap<String, Value>,
    applied_jobs: BTreeSet<String>,
}

fn text<'a>(row: &'a Map<String, Value>, field: &str) -> Result<&'a str, String> {
    row.get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("ROW_FIELD_INVALID:{field}"))
}

fn normalize_rows(rows: &[Value]) -> Result<Vec<Value>, String> {
    rows.iter()
        .map(|row| {
            let row = row.as_object().ok_or_else(|| "ROW_NOT_OBJECT".to_owned())?;
            Ok(json!({
                "customer_id": text(row, "customer_id")?.trim(),
                "name": text(row, "name")?.trim(),
                "email": text(row, "email")?.trim().to_lowercase(),
            }))
        })
        .collect()
}

fn validate_rows(rows: &[Value]) -> Result<(), String> {
    if rows.is_empty() {
        return Err("VALIDATION_GATE_REJECTED:empty-batch".to_owned());
    }
    let mut ids = BTreeSet::new();
    for row in rows {
        let row = row
            .as_object()
            .ok_or_else(|| "VALIDATION_GATE_REJECTED:row-not-object".to_owned())?;
        let customer_id = text(row, "customer_id")?;
        let name = text(row, "name")?;
        let email = text(row, "email")?;
        if customer_id.is_empty() || name.is_empty() || email.is_empty() || !email.contains('@') {
            return Err(format!("VALIDATION_GATE_REJECTED:{customer_id}"));
        }
        if !ids.insert(customer_id.to_owned()) {
            return Err(format!("VALIDATION_GATE_REJECTED:duplicate:{customer_id}"));
        }
    }
    Ok(())
}

fn accepted_event(event_number: usize, event_type: &str, source_node_id: &str) -> Value {
    json!({
        "contract_id": CONTRACT_ID,
        "contract_version": CONTRACT_VERSION,
        "profile_id": PROFILE_ID,
        "profile_version": PROFILE_VERSION,
        "schema_id": "AcceptedEventView",
        "schema_version": "1.0.0",
        "stream_id": STREAM_ID,
        "event_id": format!("etl-event-{event_number}"),
        "event_type": event_type,
        "source_node_id": source_node_id,
        "payload": {"job_id": JOB_ID},
    })
}

fn compile(composition: &Value) -> Result<CompiledGraph, String> {
    let outcome = compile_work_graph(composition);
    outcome.compiled.ok_or_else(|| {
        format!(
            "RWO_COMPILE_REJECTED:{}",
            outcome
                .defects
                .iter()
                .map(|defect| defect.code.as_str())
                .collect::<Vec<_>>()
                .join(",")
        )
    })
}

fn execute_once(
    compiled: &CompiledGraph,
    input: &[Value],
    warehouse: &mut Warehouse,
    run_label: &str,
) -> Result<Value, String> {
    let mut cursor = initial_cursor(compiled, STREAM_ID)?.cursor;
    let steps = [
        ("EtlRequested", "CustomerEtl", "RunExtract"),
        ("RowsExtracted", "ExtractCustomerRows", "RunNormalize"),
        ("RowsNormalized", "NormalizeCustomerRows", "RunValidation"),
        ("RowsValidated", "ValidateCustomerRows", "RunLoad"),
    ];
    let mut extracted = Vec::new();
    let mut normalized = Vec::new();
    let mut command_types = Vec::new();
    let mut transitions = Vec::new();
    let mut load_effect_applied = false;

    for (index, (event_type, source_node, expected_command)) in steps.iter().enumerate() {
        let event = accepted_event(index + 1, event_type, source_node);
        let outcome = reduce_event(compiled, &cursor, &event);
        if outcome.kind != "Applied" || !outcome.defects.is_empty() {
            return Err(format!("RWO_REDUCE_REJECTED:{}", outcome.kind));
        }
        let command = outcome
            .command
            .as_ref()
            .ok_or_else(|| format!("RWO_COMMAND_MISSING:{event_type}"))?;
        let command_type = command["command_type"]
            .as_str()
            .ok_or_else(|| "RWO_COMMAND_TYPE_MISSING".to_owned())?;
        if command_type != *expected_command {
            return Err(format!(
                "RWO_COMMAND_MISMATCH:{command_type}:{expected_command}"
            ));
        }
        command_types.push(command_type.to_owned());
        transitions.push(json!({
            "event_id": event["event_id"],
            "event_type": event_type,
            "outcome": outcome.kind,
            "command_type": command_type,
            "command_intent_identity": outcome.command_intent_identity,
        }));
        cursor = outcome.cursor;

        match command_type {
            "RunExtract" => extracted = input.to_vec(),
            "RunNormalize" => normalized = normalize_rows(&extracted)?,
            "RunValidation" => validate_rows(&normalized)?,
            "RunLoad" => {
                if warehouse.applied_jobs.insert(JOB_ID.to_owned()) {
                    for row in &normalized {
                        let object = row.as_object().ok_or_else(|| "ROW_NOT_OBJECT".to_owned())?;
                        warehouse
                            .rows
                            .insert(text(object, "customer_id")?.to_owned(), row.clone());
                    }
                    load_effect_applied = true;
                }
            }
            other => return Err(format!("UNSUPPORTED_COMMAND:{other}")),
        }
    }

    let terminal = accepted_event(5, "RowsLoaded", "LoadWarehouseRows");
    let terminal_outcome = reduce_event(compiled, &cursor, &terminal);
    if terminal_outcome.kind != "Applied" || terminal_outcome.command.is_some() {
        return Err("RWO_TERMINAL_EVENT_INVALID".to_owned());
    }
    cursor = terminal_outcome.cursor;
    transitions.push(json!({
        "event_id": terminal["event_id"],
        "event_type": "RowsLoaded",
        "outcome": terminal_outcome.kind,
        "command_type": null,
    }));

    let duplicate = reduce_event(
        compiled,
        &cursor,
        &accepted_event(1, "EtlRequested", "CustomerEtl"),
    );
    if duplicate.kind != "Duplicate" || duplicate.command.is_some() {
        return Err("RWO_DUPLICATE_PROBE_INVALID".to_owned());
    }

    Ok(json!({
        "run": run_label,
        "accepted_history_authority": "RWO OrchestrationCursor",
        "physical_history": "deferred",
        "command_types": command_types,
        "transitions": transitions,
        "duplicate_probe": {"outcome": duplicate.kind, "command_emitted": false},
        "load_effect_applied": load_effect_applied,
        "cursor": cursor,
    }))
}

pub fn run_demo(composition: &Value, input: &Value) -> Result<Value, String> {
    let compiled = compile(composition)?;
    let rows = input
        .as_array()
        .ok_or_else(|| "INPUT_NOT_ARRAY".to_owned())?;
    let mut warehouse = Warehouse::default();
    let first = execute_once(&compiled, rows, &mut warehouse, "initial")?;
    let replay = execute_once(&compiled, rows, &mut warehouse, "replay")?;
    if first["command_types"] != replay["command_types"] {
        return Err("REPLAY_COMMAND_DRIFT".to_owned());
    }
    if first["load_effect_applied"] != Value::Bool(true)
        || replay["load_effect_applied"] != Value::Bool(false)
    {
        return Err("IDEMPOTENCY_PROOF_FAILED".to_owned());
    }
    let warehouse_rows = warehouse.rows.into_values().collect::<Vec<_>>();
    Ok(json!({
        "schema_version": "cav2-work-orchestration-etl-demo-result/v1",
        "status": "PASS",
        "authority_effect": "none",
        "external_effect": "none",
        "graph_identity": compiled.graph_identity,
        "job_id": JOB_ID,
        "initial_run": first,
        "replay_run": replay,
        "warehouse_rows": warehouse_rows,
        "idempotency": {
            "key": "job_id",
            "initial_load_effects": 1,
            "replay_load_effects": 0,
            "total_load_effects": warehouse.applied_jobs.len()
        },
        "claim_ceiling": "Synthetic contained ETL execution and replay evidence only; no durable journal, production runtime, external effect, or admission."
    }))
}
