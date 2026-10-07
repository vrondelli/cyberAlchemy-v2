use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{io::{Read, Write}, path::PathBuf, process::{Command, Stdio}, sync::Mutex, time::Duration};
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tokio::io::AsyncReadExt;

const SKINS: [&str; 3] = ["verdant", "cobalt", "ember"];
const ORB_PLACEMENTS: [&str; 5] = [
    "center",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
];
const DOCTOR_TIMEOUT: Duration = Duration::from_secs(15);
const DOCTOR_MAX_BYTES: usize = 256 * 1024;
const ADAPTER_TIMEOUT: Duration = Duration::from_secs(4);
const ADAPTER_MAX_BYTES: usize = 16 * 1024;
const THREAD_MAX_BYTES: usize = 64 * 1024;
const DECISION_MAX_BYTES: usize = 64 * 1024;
const EVOLUTION_TIMEOUT: Duration = Duration::from_secs(4);
const EVOLUTION_MAX_BYTES: usize = 32 * 1024;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Preferences {
    skin: String,
    #[serde(default = "default_orb_placement")]
    orb_placement: String,
}

fn default_orb_placement() -> String {
    "center".into()
}

impl Default for Preferences {
    fn default() -> Self {
        Self {
            skin: SKINS[0].into(),
            orb_placement: default_orb_placement(),
        }
    }
}

struct CompanionState {
    preferences: Mutex<Preferences>,
    orb_owned_stdin: bool,
}

fn send_owned_orb_skin(skin: &str) -> std::io::Result<()> {
    let mut output = std::io::stdout().lock();
    output.write_all(b"ARE_COMPANION_ORB_SKIN ")?;
    output.write_all(skin.as_bytes())?;
    output.write_all(b"\n")?;
    output.flush()
}

fn send_owned_orb_position(position: tauri::PhysicalPosition<i32>) -> std::io::Result<()> {
    let mut output = std::io::stdout().lock();
    writeln!(
        output,
        "ARE_COMPANION_ORB_POSITION {} {}",
        position.x, position.y
    )?;
    output.flush()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthSnapshot {
    schema_version: &'static str,
    status: String,
    product_id: String,
    product_version: String,
    product_status: String,
    node_version_match: bool,
    selected_component_count: usize,
    component_count: usize,
    integration_count: usize,
    closure_digest: Option<String>,
    reason_codes: Vec<String>,
    observed_at_unix_ms: u128,
    authority_effect: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AdapterSnapshot {
    schema_version: &'static str,
    source: &'static str,
    observation_transport: &'static str,
    runtime_epoch_id: String,
    selected_backend_adapter_id: String,
    gateway_status: String,
    client_link_status: String,
    backend_status: String,
    selected_path_status: String,
    session_paths: SessionPathCounts,
    host_method_policy: HostMethodPolicy,
    managed_turn_ingress_status: &'static str,
    managed_turn_ingress_source: &'static str,
    managed_turn_ingress_reason_code: Option<&'static str>,
    managed_model_entry_boundary: &'static str,
    managed_model_wire_guard_status: String,
    managed_guarded_plan_input_status: &'static str,
    hosted_input_attestation_status: String,
    hosted_effect_tool_status: String,
    windows_backend_sandbox_status: String,
    mcp_hook_relay_preflight_status: String,
    session_fault_status: String,
    session_quarantine_status: String,
    host_task_control_status: String,
    backend_capabilities: AdapterCapabilities,
    retained_host_receipts: RetainedHostReceipts,
    dsh_web_activity: Option<DshWebActivity>,
    observed_at_unix_ms: u64,
    reason_codes: Vec<String>,
    authority_effect: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AdapterInventoryEntry {
    slot: usize,
    source: Option<&'static str>,
    backend_adapter_id: Option<String>,
    gateway_status: String,
    backend_status: String,
    selected_path_status: String,
    observed_at_unix_ms: Option<u64>,
    reason_code: Option<&'static str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AdapterCapabilities {
    turn_start: String,
    turn_interrupt: String,
    turn_steer: String,
    thread_resume: String,
    thread_compact: String,
    effect_requests: String,
    history_persistence: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshWebActivity {
    status: String,
    active_agent_count: Option<u64>,
    retained_model_entry_count: Option<u64>,
    retained_turn_terminal_count: Option<u64>,
    omitted_agent_count: Option<u64>,
    agents: Vec<DshWebAgentState>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshWebAgentState {
    thread_ref: String,
    last_turn_evidence: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    native_turn_state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    are_preparation: Option<DshArePreparation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    are_interpretation: Option<DshInterpretationSummary>,
    #[serde(skip_serializing_if = "Option::is_none")]
    are_plan_head: Option<DshPlanHeadSummary>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshPlanHeadSummary {
    schema_version: String,
    status: String,
    sources: String,
    selection_relation: String,
    checkpoint_digest: Option<String>,
    plan_context_digest: Option<String>,
    plan_progress: Option<DshPlanProgress>,
}

fn parse_dsh_plan_head_summary(value: &Value) -> Result<DshPlanHeadSummary, String> {
    let error = || "adapter.observation-incompatible".to_string();
    let record = value.as_object().ok_or_else(error)?;
    let text = |name: &str| value.get(name).and_then(Value::as_str).ok_or_else(error);
    if record.len() != 7 || text("schema_version")? != "are.dsh-plan-head-summary/v1" {
        return Err(error());
    }
    let retained = text("status")? == "checkpoint-retained";
    let digest = |name: &str| -> Result<Option<String>, String> {
        match value.get(name) {
            Some(Value::Null) if !retained => Ok(None),
            Some(Value::String(digest)) if retained && digest.len() == 64
                && digest.bytes().all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase()) => Ok(Some(digest.clone())),
            _ => Err(error()),
        }
    };
    let plan_progress = if retained {
        if !["verified-at-read", "unverified-at-read"].contains(&text("sources")?)
            || !["matches-startup", "different-from-startup"].contains(&text("selection_relation")?) { return Err(error()); }
        Some(parse_dsh_plan_progress(value.get("plan_progress").ok_or_else(error)?)?)
    } else {
        if !["not-retained", "unavailable"].contains(&text("status")?)
            || text("sources")? != "not-checked" || text("selection_relation")? != "not-checked"
            || value.get("plan_progress") != Some(&Value::Null) { return Err(error()); }
        None
    };
    Ok(DshPlanHeadSummary {schema_version: text("schema_version")?.to_string(), status: text("status")?.to_string(),
        sources: text("sources")?.to_string(), selection_relation: text("selection_relation")?.to_string(),
        checkpoint_digest: digest("checkpoint_digest")?, plan_context_digest: digest("plan_context_digest")?, plan_progress})
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshInterpretationSummary {
    schema_version: String,
    status: String,
    checkpoint_digest: String,
    objective_state_digest: String,
    requirements: String,
    plan_context_digest: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    plan_progress: Option<DshPlanProgress>,
}

fn parse_dsh_interpretation_summary(value: &Value) -> Result<DshInterpretationSummary, String> {
    let error = || "adapter.observation-incompatible".to_string();
    let record = value.as_object().ok_or_else(error)?;
    let text = |name: &str| value.get(name).and_then(Value::as_str).ok_or_else(error);
    let progress = text("schema_version")? == "are.dsh-objective-interpretation-summary/v2";
    if record.len() != if progress { 7 } else { 6 }
        || !["are.dsh-objective-interpretation-summary/v1", "are.dsh-objective-interpretation-summary/v2"].contains(&text("schema_version")?)
        || (!progress && record.contains_key("plan_progress"))
        || text("status")? != "checkpoint-retained-no-admission-retained"
        || !["not-selected", "continuity-reference-retained"].contains(&text("requirements")?) {
        return Err(error());
    }
    let plan_context_digest = match value.get("plan_context_digest") {
        Some(Value::Null) => None,
        Some(Value::String(digest)) => Some(digest.clone()),
        _ => return Err(error()),
    };
    let plan_progress = if progress {
        if plan_context_digest.is_none() || text("requirements")? != "continuity-reference-retained" {
            return Err(error());
        }
        Some(parse_dsh_plan_progress(value.get("plan_progress").ok_or_else(error)?)?)
    } else { None };
    for digest in [text("checkpoint_digest")?, text("objective_state_digest")?]
        .into_iter().chain(plan_context_digest.as_deref()) {
        if digest.len() != 64 || !digest.bytes().all(|byte|
            byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase()) { return Err(error()); }
    }
    Ok(DshInterpretationSummary {
        schema_version: text("schema_version")?.to_string(), status: text("status")?.to_string(),
        checkpoint_digest: text("checkpoint_digest")?.to_string(),
        objective_state_digest: text("objective_state_digest")?.to_string(),
        requirements: text("requirements")?.to_string(), plan_context_digest, plan_progress,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshArePreparation {
    status: String,
    route_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    dispatch_relation: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    objective_checkpoint: Option<DshObjectiveCheckpointSummary>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshObjectiveCheckpointSummary {
    schema_version: String,
    status: String,
    checkpoint_digest: String,
    objective_state_digest: String,
    binding_digest: String,
    requirements: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    plan_context_digest: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    plan_progress: Option<DshPlanProgress>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DshPlanProgress {
    schema_version: String,
    posture: String,
    obligation_count: u64,
    completed_count: u64,
    open_count: u64,
    active_count: u64,
    deferred_count: u64,
    open_decision_count: u64,
    active_slice_ordinal: u64,
    active_slice_status: String,
}

fn parse_dsh_plan_progress(value: &Value) -> Result<DshPlanProgress, String> {
    let error = || "adapter.observation-incompatible".to_string();
    let record = value.as_object().ok_or_else(error)?;
    let text = |key: &str| value.get(key).and_then(Value::as_str).ok_or_else(error);
    let count = |key: &str| value.get(key).and_then(Value::as_u64)
        .filter(|number| *number <= 32).ok_or_else(error);
    if record.len() != 10 || text("schema_version")? != "are.dsh-plan-progress/v1"
        || text("posture")? != "checkpointed-declaration" { return Err(error()); }
    let result = DshPlanProgress {
        schema_version: text("schema_version")?.to_string(), posture: text("posture")?.to_string(),
        obligation_count: count("obligation_count")?, completed_count: count("completed_count")?,
        open_count: count("open_count")?, active_count: count("active_count")?, deferred_count: count("deferred_count")?,
        open_decision_count: count("open_decision_count")?, active_slice_ordinal: count("active_slice_ordinal")?,
        active_slice_status: text("active_slice_status")?.to_string(),
    };
    let slice_count = match result.active_slice_status.as_str() {
        "open" => result.open_count, "active" => result.active_count, "deferred" => result.deferred_count,
        _ => return Err(error()),
    };
    if result.obligation_count == 0 || result.completed_count + result.open_count + result.active_count
        + result.deferred_count != result.obligation_count || result.active_slice_ordinal == 0
        || result.active_slice_ordinal > result.obligation_count || slice_count == 0 { return Err(error()); }
    Ok(result)
}

fn parse_dsh_objective_checkpoint_summary(value: &Value) -> Result<DshObjectiveCheckpointSummary, String> {
    let error = || "adapter.observation-incompatible".to_string();
    let record = value.as_object().ok_or_else(error)?;
    let text = |name: &str| value.get(name).and_then(Value::as_str).ok_or_else(error);
    let progress = text("schema_version")? == "are.dsh-objective-checkpoint-summary/v3";
    let selected = progress || text("schema_version")? == "are.dsh-objective-checkpoint-summary/v2";
    if record.len() != if progress { 8 } else if selected { 7 } else { 6 }
        || (progress && text("requirements")? != "continuity-reference-retained")
        || (!progress && record.contains_key("plan_progress"))
        || (!selected && (text("schema_version")? != "are.dsh-objective-checkpoint-summary/v1"
            || record.contains_key("plan_context_digest")))
        || text("status")? != "host-retained-reference"
        || !["not-selected", "continuity-reference-retained"].contains(&text("requirements")?) {
        return Err(error());
    }
    for key in ["checkpoint_digest", "objective_state_digest", "binding_digest"]
        .into_iter().chain(selected.then_some("plan_context_digest")) {
        let digest = text(key)?;
        if digest.len() != 64 || !digest.bytes().all(|byte|
            byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase()) {
            return Err(error());
        }
    }
    Ok(DshObjectiveCheckpointSummary {
        schema_version: text("schema_version")?.to_string(), status: text("status")?.to_string(),
        checkpoint_digest: text("checkpoint_digest")?.to_string(),
        objective_state_digest: text("objective_state_digest")?.to_string(),
        binding_digest: text("binding_digest")?.to_string(), requirements: text("requirements")?.to_string(),
        plan_context_digest: if selected { Some(text("plan_context_digest")?.to_string()) } else { None },
        plan_progress: if progress { Some(parse_dsh_plan_progress(value.get("plan_progress").ok_or_else(error)?)?) } else { None },
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HostMethodPolicy {
    status: String,
    codex_version: Option<String>,
    known_request_count: Option<u64>,
    admitted_request_count: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionPathCounts {
    status: String,
    total: Option<u64>,
    ready: Option<u64>,
    initializing: Option<u64>,
    backend_unavailable: Option<u64>,
    detached_backend: Option<u64>,
    inactive: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RetainedHostReceipts {
    status: String,
    turn_start_accepted: Option<u64>,
    turn_history_verified: Option<u64>,
    steer_accepted: Option<u64>,
    compaction_turn_accepted: Option<u64>,
    compaction_item_completed: Option<u64>,
    compaction_history_verified: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionSnapshot {
    schema_version: &'static str,
    source: &'static str,
    root_status: String,
    evidence_status: String,
    observed_at_unix_ms: u64,
    definitions: Vec<EvolutionDefinition>,
    cycles: Vec<EvolutionCycle>,
    commit_count: u64,
    cycle_count: u64,
    cycles_truncated: bool,
    coordination_summary: Option<EvolutionCoordinationSummary>,
    phase_summaries: Vec<EvolutionPhaseSummary>,
    phase_summaries_truncated: bool,
    projection_digest: Option<String>,
    operational_index_status: String,
    reason_codes: Vec<String>,
    authority_effect: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionCoordinationSummary {
    phase_count: u64,
    work_state_counts: EvolutionWorkStateCounts,
}

#[derive(Serialize)]
struct EvolutionWorkStateCounts {
    planned: u64,
    ready: u64,
    leased: u64,
    completed: u64,
    blocked: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionPhaseSummary {
    cycle_ref: Option<String>,
    phase: String,
    event_count: u64,
    work_state_counts: EvolutionWorkStateCounts,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionDefinition {
    definition_ref: String,
    cycle_kind: String,
    admission_status: String,
    admitted: bool,
    enabled: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionCycle {
    cycle_ref: String,
    cycle_definition_ref: String,
    event_revision: u64,
    last_event_type: Option<String>,
    derived_disposition: Option<String>,
    event_count: u64,
    recent_event_types: Vec<String>,
    events_truncated: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionSignalSnapshot {
    schema_version: &'static str,
    source: &'static str,
    evidence_status: &'static str,
    observed_at_unix_ms: u64,
    candidate_count: u64,
    candidates: Vec<EvolutionSignalCandidate>,
    candidates_truncated: bool,
    log_digest: String,
    authority_effect: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvolutionSignalCandidate {
    record_digest: String,
    kind: &'static str,
}

fn preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(path) = std::env::var_os("ARE_COMPANION_PREFERENCES_PATH") {
        let path = PathBuf::from(path);
        if !path.is_absolute()
            || path.file_name().and_then(|name| name.to_str()) != Some("companion.json")
        {
            return Err(
                "ARE_COMPANION_PREFERENCES_PATH must be an absolute companion.json path".into(),
            );
        }
        return Ok(path);
    }
    app.path()
        .app_config_dir()
        .map(|path| path.join("companion.json"))
        .map_err(|error| error.to_string())
}

fn read_preferences(app: &AppHandle) -> Preferences {
    let Ok(path) = preferences_path(app) else {
        return Preferences::default();
    };
    let Ok(bytes) = std::fs::read(path) else {
        return Preferences::default();
    };
    let Ok(mut value) = serde_json::from_slice::<Preferences>(&bytes) else {
        return Preferences::default();
    };
    if SKINS.contains(&value.skin.as_str()) {
        if !ORB_PLACEMENTS.contains(&value.orb_placement.as_str()) {
            value.orb_placement = default_orb_placement();
        }
        value
    } else {
        Preferences::default()
    }
}

fn write_preferences(app: &AppHandle, next: &Preferences) -> Result<(), String> {
    let path = preferences_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let pending = path.with_extension("json.tmp");
    std::fs::write(
        &pending,
        serde_json::to_vec(next).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;
    std::fs::rename(&pending, &path).map_err(|error| error.to_string())
}

fn placement_position(
    area: &tauri::PhysicalRect<i32, u32>,
    scale: f64,
    width: i64,
    height: i64,
    placement: &str,
) -> Result<tauri::PhysicalPosition<i32>, String> {
    let left = i64::from(area.position.x);
    let top = i64::from(area.position.y);
    let right = left + i64::from(area.size.width);
    let bottom = top + i64::from(area.size.height);
    let margin = (16.0 * scale).round().clamp(8.0, 128.0) as i64;
    let x = match placement {
        "top-left" | "bottom-left" => left + margin,
        "top-right" | "bottom-right" => right - width - margin,
        "center" => left + (right - left - width) / 2,
        _ => return Err("Unknown ARE orb placement".into()),
    }
    .clamp(left, (right - width).max(left));
    let y = match placement {
        "top-left" | "top-right" => top + margin,
        "bottom-left" | "bottom-right" => bottom - height - margin,
        "center" => top + (bottom - top - height) / 2,
        _ => return Err("Unknown ARE orb placement".into()),
    }
    .clamp(top, (bottom - height).max(top));
    let x = i32::try_from(x).map_err(|_| "Orb placement is outside desktop bounds")?;
    let y = i32::try_from(y).map_err(|_| "Orb placement is outside desktop bounds")?;
    Ok(tauri::PhysicalPosition::new(x, y))
}

fn place_orb(app: &AppHandle, placement: &str) -> Result<(), String> {
    let window = app
        .get_webview_window("orb")
        .ok_or("ARE orb is unavailable")?;
    let monitor = window
        .current_monitor()
        .map_err(|_| "Orb monitor is unavailable")?
        .or(window
            .primary_monitor()
            .map_err(|_| "Orb monitor is unavailable")?)
        .ok_or("Orb monitor is unavailable")?;
    let size = window.outer_size().map_err(|_| "Orb size is unavailable")?;
    let target = placement_position(
        monitor.work_area(),
        monitor.scale_factor(),
        i64::from(size.width),
        i64::from(size.height),
        placement,
    )?;
    window
        .set_position(target)
        .map_err(|_| "Orb placement is unsupported on this desktop".into())
}

#[cfg(target_os = "linux")]
fn linux_native_orb_x11_environment(orb_backend: &str, gtk_backend: &str, display: &str) -> bool {
    orb_backend == "x11" && gtk_backend == "x11" && !display.is_empty()
}

#[cfg(any(windows, target_os = "linux"))]
fn native_orb_position(app: &AppHandle, placement: &str) -> Result<tauri::PhysicalPosition<i32>, String> {
    #[cfg(target_os = "linux")]
    if !linux_native_orb_x11_environment(
        &std::env::var("ARE_COMPANION_NATIVE_ORB_BACKEND").unwrap_or_default(),
        &std::env::var("GDK_BACKEND").unwrap_or_default(),
        &std::env::var("DISPLAY").unwrap_or_default(),
    ) {
        return Err("Native orb placement presets require a matched X11 orb and dashboard; drag the floating mark instead".into());
    }
    let dashboard = app
        .get_webview_window("dashboard")
        .ok_or("ARE dashboard is unavailable")?;
    let monitor = dashboard
        .current_monitor()
        .map_err(|_| "Dashboard monitor is unavailable")?
        .or(dashboard
            .primary_monitor()
            .map_err(|_| "Dashboard monitor is unavailable")?)
        .ok_or("Dashboard monitor is unavailable")?;
    let orb_size = (84.0 * monitor.scale_factor()).round().clamp(16.0, 512.0) as i64;
    placement_position(
        monitor.work_area(),
        monitor.scale_factor(),
        orb_size,
        orb_size,
        placement,
    )
}

#[cfg(not(any(windows, target_os = "linux")))]
fn native_orb_position(_app: &AppHandle, _placement: &str) -> Result<tauri::PhysicalPosition<i32>, String> {
    Err("Native orb placement presets are not verified on this desktop; drag the floating mark instead".into())
}

#[tauri::command]
fn get_preferences(state: State<'_, CompanionState>) -> Result<Preferences, String> {
    state
        .preferences
        .lock()
        .map(|prefs| prefs.clone())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn restore_orb_placement(
    app: AppHandle,
    state: State<'_, CompanionState>,
) -> Result<(), String> {
    let placement = state
        .preferences
        .lock()
        .map_err(|error| error.to_string())?
        .orb_placement
        .clone();
    place_orb(&app, &placement)
}

#[tauri::command]
fn set_skin(
    app: AppHandle,
    state: State<'_, CompanionState>,
    skin: String,
) -> Result<Preferences, String> {
    if !SKINS.contains(&skin.as_str()) {
        return Err("Unknown ARE skin".into());
    }
    let previous = state
        .preferences
        .lock()
        .map_err(|error| error.to_string())?
        .clone();
    let next = Preferences { skin, ..previous };
    write_preferences(&app, &next)?;
    *state
        .preferences
        .lock()
        .map_err(|error| error.to_string())? = next.clone();
    app.emit("are-skin-changed", &next)
        .map_err(|error| error.to_string())?;
    if state.orb_owned_stdin {
        send_owned_orb_skin(&next.skin)
            .map_err(|error| format!("Skin saved, but native orb update failed: {error}"))?;
    }
    Ok(next)
}

#[tauri::command]
fn set_orb_placement(
    app: AppHandle,
    state: State<'_, CompanionState>,
    placement: String,
) -> Result<Preferences, String> {
    if !ORB_PLACEMENTS.contains(&placement.as_str()) {
        return Err("Unknown ARE orb placement".into());
    }
    let previous = state
        .preferences
        .lock()
        .map_err(|error| error.to_string())?
        .clone();
    let next = Preferences {
        orb_placement: placement,
        ..previous.clone()
    };
    if let Some(window) = app.get_webview_window("orb") {
        let prior_position = window
            .outer_position()
            .map_err(|_| "Orb position is unavailable")?;
        place_orb(&app, &next.orb_placement)?;
        if let Err(error) = write_preferences(&app, &next) {
            let _ = window.set_position(prior_position);
            return Err(error);
        }
    } else if state.orb_owned_stdin {
        let target = native_orb_position(&app, &next.orb_placement)?;
        write_preferences(&app, &next)?;
        if let Err(error) = send_owned_orb_position(target) {
            let rollback = write_preferences(&app, &previous);
            return Err(if rollback.is_ok() {
                format!("Native orb placement request failed: {error}")
            } else {
                format!("Native orb placement request failed and preference rollback failed: {error}")
            });
        }
    } else {
        return Err("ARE orb is unavailable".into());
    }
    *state
        .preferences
        .lock()
        .map_err(|error| error.to_string())? = next.clone();
    app.emit("are-placement-changed", &next)
        .map_err(|error| error.to_string())?;
    Ok(next)
}

#[tauri::command]
async fn open_dashboard(app: AppHandle) -> Result<(), String> {
    show_dashboard(&app).map_err(|error| error.to_string())
}

fn show_dashboard(app: &AppHandle) -> tauri::Result<()> {
    let window = if let Some(window) = app.get_webview_window("dashboard") {
        window
    } else {
        WebviewWindowBuilder::new(app, "dashboard", WebviewUrl::App("dashboard.html".into()))
            .title("ARE · Observatory")
            .inner_size(1120.0, 760.0)
            .min_inner_size(320.0, 540.0)
            .build()?
    };
    window.show()?;
    window.set_focus()
}

#[tauri::command]
fn start_orb_drag(app: AppHandle) -> Result<(), String> {
    app.get_webview_window("orb")
        .ok_or("ARE orb is unavailable".to_string())?
        .start_dragging()
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn set_orb_memory_target(app: AppHandle, target: String) -> Result<(), String> {
    if target != "low" && target != "normal" {
        return Err("Unknown orb memory target".into());
    }
    #[cfg(windows)]
    {
        use webview2_com::Microsoft::Web::WebView2::Win32::{
            ICoreWebView2_19, COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_LOW,
            COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_NORMAL,
        };
        use windows_core::Interface;

        let window = app
            .get_webview_window("orb")
            .ok_or("ARE orb is unavailable")?;
        let (send, receive) = tokio::sync::oneshot::channel();
        window
            .with_webview(move |webview| {
                let outcome = (|| unsafe {
                    let core = webview.controller().CoreWebView2().map_err(|_| "Orb WebView2 is unavailable")?;
                    let memory_view: ICoreWebView2_19 = core.cast().map_err(|_| "Orb low-memory API is unsupported")?;
                    let level = if target == "low" {
                        COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_LOW
                    } else {
                        COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_NORMAL
                    };
                    memory_view
                        .SetMemoryUsageTargetLevel(level)
                        .map_err(|_| "Orb memory target was rejected")
                })();
                let _ = send.send(outcome);
            })
            .map_err(|_| "Orb WebView2 access failed")?;
        return tokio::time::timeout(Duration::from_secs(2), receive)
            .await
            .map_err(|_| "Orb memory target timed out".to_string())?
            .map_err(|_| "Orb memory target was not acknowledged".to_string())?
            .map_err(|error| error.to_string());
    }
    #[cfg(not(windows))]
    {
        let _ = app;
        Ok(())
    }
}

fn backend_paths(app: &AppHandle) -> Result<(PathBuf, PathBuf), String> {
    match (
        std::env::var_os("ARE_COMPANION_NODE"),
        std::env::var_os("ARE_COMPANION_ENTRY"),
    ) {
        (Some(node), Some(entry)) => return Ok((node.into(), entry.into())),
        (Some(_), None) | (None, Some(_)) => {
            return Err(
                "Both ARE_COMPANION_NODE and ARE_COMPANION_ENTRY are required for development mode"
                    .into(),
            );
        }
        _ => {}
    }
    #[cfg(target_os = "windows")]
    {
        let root = app
            .path()
            .resource_dir()
            .map_err(|error| error.to_string())?;
        Ok((
            root.join("node/node.exe"),
            root.join("are/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs"),
        ))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = app;
        let binary = std::env::current_exe().map_err(|error| error.to_string())?;
        let root = binary
            .parent()
            .and_then(|path| path.parent())
            .ok_or("Cannot resolve ARE installation root".to_string())?;
        Ok((
            root.join("node/bin/node"),
            root.join("are/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs"),
        ))
    }
}

fn text(value: &Value, key: &str) -> String {
    value
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or("unknown")
        .to_string()
}

async fn run_bounded(
    node: PathBuf,
    entry: PathBuf,
    args: &[&str],
    timeout: Duration,
    max_bytes: usize,
) -> Result<Vec<u8>, String> {
    run_bounded_with_token(node, entry, args, timeout, max_bytes, None).await
}

async fn run_bounded_with_token(
    node: PathBuf,
    entry: PathBuf,
    args: &[&str],
    timeout: Duration,
    max_bytes: usize,
    observation_token: Option<&str>,
) -> Result<Vec<u8>, String> {
    let capture_thread_error = args.first().copied() == Some("thread-status");
    let mut command = tokio::process::Command::new(node);
    command.arg(entry)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(if capture_thread_error { Stdio::piped() } else { Stdio::null() })
        .kill_on_drop(true);
    // Named inventory credentials are selected one at a time. Do not let a
    // diagnostic child inherit credentials for other observation sources.
    for (name, _) in std::env::vars_os() {
        if name.to_string_lossy().to_ascii_uppercase().starts_with("ARE_COMPANION_ADAPTER_TOKEN_") {
            command.env_remove(name);
        }
    }
    if let Some(token) = observation_token {
        command.env("ARE_ADAPTER_OBSERVATION_TOKEN", token);
    }
    let mut child = command
        .spawn()
        .map_err(|_| "ARE diagnostic could not start".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or("ARE diagnostic output is unavailable".to_string())?;
    let stderr_task = child.stderr.take().map(|mut stderr| tokio::spawn(async move {
        let mut captured = Vec::new();
        let mut truncated = false;
        let mut chunk = [0_u8; 256];
        loop {
            let count = stderr.read(&mut chunk).await.map_err(|_| "ARE diagnostic error channel failed".to_string())?;
            if count == 0 { break; }
            let remaining = 128_usize.saturating_sub(captured.len());
            captured.extend_from_slice(&chunk[..count.min(remaining)]);
            if count > remaining { truncated = true; }
        }
        Ok::<(Vec<u8>, bool), String>((captured, truncated))
    }));
    let mut output = Vec::new();
    let capture = async {
        stdout
            .take((max_bytes + 1) as u64)
            .read_to_end(&mut output)
            .await
            .map_err(|_| "ARE diagnostic output failed".to_string())?;
        if output.len() > max_bytes {
            let _ = child.kill().await;
            if let Some(task) = &stderr_task { task.abort(); }
            return Err("ARE diagnostic output exceeded its limit".to_string());
        }
        let status = child
            .wait()
            .await
            .map_err(|_| "ARE diagnostic process failed".to_string())?;
        if !status.success() {
            if let Some(task) = stderr_task {
                let (error_bytes, truncated) = task.await
                    .map_err(|_| "ARE diagnostic error channel failed".to_string())??;
                if !truncated && String::from_utf8_lossy(&error_bytes).trim() == "thread.observation-source-changed" {
                    return Err("thread.observation-source-changed".to_string());
                }
            }
            return Err("ARE diagnostic read failed".to_string());
        }
        if let Some(task) = stderr_task { let _ = task.await; }
        Ok(output)
    };
    tokio::time::timeout(timeout, capture)
        .await
        .map_err(|_| "ARE diagnostic timed out".to_string())?
}

#[tauri::command]
async fn get_snapshot(app: AppHandle) -> Result<HealthSnapshot, String> {
    let (node, entry) = backend_paths(&app)?;
    if !node.is_file() || !entry.is_file() {
        return Err(
            "ARE runtime is missing; install the bundled package or set both development paths"
                .into(),
        );
    }
    let output = run_bounded(
        node,
        entry,
        &["doctor", "--json"],
        DOCTOR_TIMEOUT,
        DOCTOR_MAX_BYTES,
    )
    .await?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "ARE doctor returned invalid JSON".to_string())?;
    if value.get("schema_version").and_then(Value::as_str) != Some("are.product-health/v1") {
        return Err("ARE doctor returned an incompatible health schema".into());
    }
    let components = value.get("components").and_then(Value::as_array);
    let integrations = value.get("integrations").and_then(Value::as_array);
    Ok(HealthSnapshot {
        schema_version: "are.companion-health/v1",
        status: text(&value, "status"),
        product_id: text(&value, "product_id"),
        product_version: text(&value, "product_version"),
        product_status: text(&value, "product_status"),
        node_version_match: value
            .pointer("/node/exact_match")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        selected_component_count: components
            .map(|items| {
                items
                    .iter()
                    .filter(|item| item.get("selected").and_then(Value::as_bool) == Some(true))
                    .count()
            })
            .unwrap_or(0),
        component_count: components.map_or(0, Vec::len),
        integration_count: integrations.map_or(0, Vec::len),
        closure_digest: value
            .pointer("/source_closure/closure_digest")
            .and_then(Value::as_str)
            .map(str::to_string),
        reason_codes: value
            .get("reason_codes")
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(Value::as_str)
                    .map(str::to_string)
                    .take(32)
                    .collect()
            })
            .unwrap_or_default(),
        observed_at_unix_ms: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
        authority_effect: "none",
    })
}

fn status(value: &Value, pointer: &str, allowed: &[&str]) -> Result<String, String> {
    let status = value
        .pointer(pointer)
        .and_then(Value::as_str)
        .ok_or("adapter.observation-incompatible".to_string())?;
    if !allowed.contains(&status) {
        return Err("adapter.observation-incompatible".into());
    }
    Ok(status.to_string())
}

fn model_entry_ingress(value: &Value, launch_paused: bool)
    -> Result<(&'static str, &'static str, Option<&'static str>), String> {
    let gateway_ingress = value.get("model_entry_ingress");
    if gateway_ingress.is_some_and(|entry| !entry.is_object()
        || entry.get("status").and_then(Value::as_str).is_none()
        || entry.get("reason_code").is_none()) {
        return Err("adapter.observation-incompatible".into());
    }
    let gateway_status = gateway_ingress
        .and_then(|entry| entry.get("status"))
        .and_then(Value::as_str)
        .unwrap_or("unknown");
    let gateway_reason = gateway_ingress.and_then(|entry| entry.get("reason_code"));
    if !["paused", "not-paused", "unknown"].contains(&gateway_status)
        || (gateway_status == "paused"
            && gateway_reason.and_then(Value::as_str)
                != Some("windows-client.hook-boundary-unverified"))
        || (gateway_status != "paused"
            && gateway_reason.is_some_and(|reason| !reason.is_null()))
        || (launch_paused && gateway_status == "not-paused") {
        return Err("adapter.observation-incompatible".into());
    }
    let paused = gateway_status == "paused" || launch_paused;
    let status = if paused { "paused" } else if gateway_status == "not-paused" { "not-paused" }
        else { "unknown" };
    let source = if gateway_status == "paused" || gateway_status == "not-paused" { "gateway-in-process" }
        else if launch_paused { "launch-environment" } else { "none" };
    let reason = if paused { Some("windows-client.hook-boundary-unverified") } else { None };
    Ok((status, source, reason))
}

fn managed_model_entry_boundary(ingress_status: &str, launch_guarded_text: bool)
    -> Result<&'static str, String> {
    if !launch_guarded_text { return Ok("unverified"); }
    if ingress_status != "not-paused" { return Err("adapter.observation-incompatible".into()); }
    Ok("guarded-text-only-candidate")
}

fn managed_guarded_plan_input_status(declaration: Option<&str>, entry_boundary: &str,
    guard_status: &str) -> Result<&'static str, String> {
    match declaration {
        None => Ok("not-declared"),
        Some("launch-declared-candidate/v1") if entry_boundary == "guarded-text-only-candidate"
            && guard_status != "not-declared" => Ok("launch-declared-candidate"),
        _ => Err("adapter.observation-incompatible".into()),
    }
}

fn retained_host_receipts(value: &Value) -> Result<RetainedHostReceipts, String> {
    let Some(receipts) = value.get("retained_host_receipts") else {
        return Ok(RetainedHostReceipts { status: "unknown".into(), turn_start_accepted: None,
            turn_history_verified: None, steer_accepted: None, compaction_turn_accepted: None,
            compaction_item_completed: None, compaction_history_verified: None });
    };
    let posture = receipts.get("status").and_then(Value::as_str)
        .filter(|status| ["observed", "not-observed", "unknown"].contains(status))
        .ok_or("adapter.observation-incompatible".to_string())?;
    let count = |name: &str| -> Result<Option<u64>, String> {
        let field = receipts.get(name).ok_or("adapter.observation-incompatible".to_string())?;
        if posture == "unknown" {
            return if field.is_null() { Ok(None) } else { Err("adapter.observation-incompatible".into()) };
        }
        field.as_u64().filter(|number| *number <= 262_144).map(Some)
            .ok_or("adapter.observation-incompatible".into())
    };
    let compaction_turn_accepted = match receipts.get("compaction_turn_accepted") {
        None => None,
        Some(Value::Null) if posture == "unknown" => None,
        Some(value) if posture != "unknown" => Some(value.as_u64()
            .filter(|number| *number <= 262_144)
            .ok_or("adapter.observation-incompatible".to_string())?),
        _ => return Err("adapter.observation-incompatible".into()),
    };
    let compaction_history_verified = match receipts.get("compaction_history_verified") {
        None => None,
        Some(Value::Null) if posture == "unknown" => None,
        Some(value) if posture != "unknown" => Some(value.as_u64()
            .filter(|number| *number <= 262_144)
            .ok_or("adapter.observation-incompatible".to_string())?),
        _ => return Err("adapter.observation-incompatible".into()),
    };
    let result = RetainedHostReceipts { status: posture.into(),
        turn_start_accepted: count("turn_start_accepted")?,
        turn_history_verified: count("turn_history_verified")?,
        steer_accepted: count("steer_accepted")?,
        compaction_turn_accepted,
        compaction_item_completed: count("compaction_item_completed")?, compaction_history_verified };
    let observed = [result.turn_start_accepted, result.turn_history_verified,
        result.steer_accepted, result.compaction_turn_accepted,
        result.compaction_item_completed, result.compaction_history_verified]
        .iter().any(|count| count.unwrap_or(0) > 0);
    if posture != "unknown" && (posture == "observed") != observed {
        return Err("adapter.observation-incompatible".into());
    }
    Ok(result)
}

fn thread_digest(value: &Value, key: &str, prefix: &str) -> Result<String, String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|text| {
            text.starts_with(prefix)
                && text.len() == prefix.len() + 64
                && text[prefix.len()..]
                    .bytes()
                    .all(|byte| byte.is_ascii_hexdigit())
        })
        .map(str::to_string)
        .ok_or("thread.observation-incompatible".into())
}

fn project_learning_feedback(value: Option<&Value>) -> Result<Value, String> {
    let Some(value) = value.filter(|v| !v.is_null()) else { return Ok(Value::Null); };
    let counts = ["pending_feedback_count", "retained_lesson_count", "disabled_lesson_count",
        "dispatched_application_count", "evaluated_application_count"];
    let keys = ["schema_version", "source", "binding_ref", "status", "mode", "durability", "state_digest",
        "checkpoint_digest", "pending_feedback_count", "retained_lesson_count", "disabled_lesson_count",
        "dispatched_application_count", "evaluated_application_count", "authority_effect", "observation_digest"];
    let invalid = || "thread.observation-incompatible".to_string();
    let row = value.as_object().ok_or_else(invalid)?;
    if row.len() != keys.len() || !keys.iter().all(|key| row.contains_key(*key))
        || value["schema_version"] != "are.learning-feedback-observation/v1" || value["source"] != "learning-owner"
        || value["authority_effect"] != "none" { return Err(invalid()); }
    let hash = |key: &str| value[key].as_str().is_some_and(|s| s.len() == 64
        && s.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)));
    if !hash("binding_ref") || !hash("observation_digest") { return Err(invalid()); }
    let status = value["status"].as_str().ok_or_else(invalid)?;
    if ["disabled", "unavailable"].contains(&status) {
        if !["mode", "durability", "state_digest", "checkpoint_digest"].iter().chain(counts.iter())
            .all(|key| value[*key].is_null()) { return Err(invalid()); }
    } else {
        if !matches!(value["mode"].as_str(), Some("off" | "observe" | "apply-scoped"))
            || !counts.iter().all(|key| value[*key].as_u64().is_some_and(|n| n <= 1_000_000))
            || value["disabled_lesson_count"].as_u64() > value["retained_lesson_count"].as_u64()
            || value["evaluated_application_count"].as_u64() > value["dispatched_application_count"].as_u64() {
            return Err(invalid());
        }
        if status == "no-records" {
            if !["durability", "state_digest", "checkpoint_digest"].iter().all(|key| value[*key].is_null())
                || !counts.iter().all(|key| value[*key].as_u64() == Some(0)) { return Err(invalid()); }
        } else if status == "observed" {
            if !matches!(value["durability"].as_str(), Some("process-memory" | "append-only-file-fsync")) { return Err(invalid()); }
            if !hash("state_digest") || !hash("checkpoint_digest") { return Err(invalid()); }
        } else { return Err(invalid()); }
    }
    Ok(value.clone())
}

fn thread_hash(value: &Value, key: &str) -> Result<String, String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|text| text.len() == 64 && text.bytes().all(|byte| byte.is_ascii_hexdigit()))
        .map(str::to_string)
        .ok_or("thread.observation-incompatible".into())
}

#[tauri::command]
async fn get_thread_snapshot(app: AppHandle, offset: Option<u64>, snapshot_digest: Option<String>) -> Result<Value, String> {
    let offset = offset.unwrap_or(0);
    if offset % 32 != 0 || (snapshot_digest.is_some() && !snapshot_digest.as_ref().is_some_and(|digest| digest.len() == 64
            && digest.bytes().all(|byte| byte.is_ascii_hexdigit()))) {
        return Err("thread.observation-invalid-page".into());
    }
    if offset > 0 && snapshot_digest.is_none() { return Err("thread.observation-invalid-page".into()); }
    if std::env::var_os("ARE_COMPANION_NODE").is_none()
        || std::env::var_os("ARE_COMPANION_ENTRY").is_none()
    {
        return Err("thread.not-configured".into());
    }
    let socket = std::env::var("ARE_COMPANION_OBSERVATION_SOCKET")
        .map_err(|_| "thread.not-configured".to_string())?;
    if socket.is_empty()
        || std::env::var("ARE_ADAPTER_OBSERVATION_TOKEN").map_or(true, |value| value.len() < 32)
    {
        return Err("thread.not-configured".into());
    }
    let (node, entry) = backend_paths(&app)?;
    if !node.is_file() || !entry.is_file() {
        return Err("thread.runtime-missing".into());
    }
    let offset_arg = offset.to_string();
    let mut args = vec!["thread-status", "--json", "--socket", socket.as_str()];
    if snapshot_digest.is_some() {
        args.extend(["--offset", offset_arg.as_str(), "--snapshot-digest", snapshot_digest.as_deref().unwrap()]);
    }
    let output = run_bounded(
        node,
        entry,
        &args,
        ADAPTER_TIMEOUT,
        THREAD_MAX_BYTES,
    )
    .await
    .map_err(|reason| if reason == "thread.observation-source-changed" { reason }
        else { "thread.unavailable".to_string() })?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "thread.observation-incompatible".to_string())?;
    if value.get("schema_version").and_then(Value::as_str)
        != Some("are.gateway-thread-observation/v1")
        || value.get("source").and_then(Value::as_str) != Some("gateway-in-process")
        || value.get("scope").and_then(Value::as_str)
            != Some("gateway-backend-threads-not-host-activation")
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
    {
        return Err("thread.observation-incompatible".into());
    }
    let observed = value
        .get("observed_at_unix_ms")
        .and_then(Value::as_u64)
        .ok_or("thread.observation-incompatible".to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    if now.saturating_sub(observed) > 5000 || observed > now.saturating_add(1000) {
        return Err("thread.observation-stale".into());
    }
    let runtime_epoch_id = value
        .get("runtime_epoch_id")
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty() && text.len() <= 256)
        .ok_or("thread.observation-incompatible".to_string())?;
    let session_count = value
        .get("session_count")
        .and_then(Value::as_u64)
        .ok_or("thread.observation-incompatible".to_string())?;
    let thread_count = value
        .get("thread_count")
        .and_then(Value::as_u64)
        .ok_or("thread.observation-incompatible".to_string())?;
    let page_offset = value.get("page_offset").and_then(Value::as_u64)
        .filter(|page| *page == offset && (thread_count == 0 && *page == 0 || thread_count > 0 && *page < thread_count))
        .ok_or("thread.observation-incompatible".to_string())?;
    let page_snapshot_digest = value.get("snapshot_digest").and_then(Value::as_str)
        .filter(|digest| digest.len() == 64 && digest.bytes().all(|byte| byte.is_ascii_hexdigit())
            && snapshot_digest.as_deref().is_none_or(|expected| expected == *digest))
        .ok_or("thread.observation-incompatible".to_string())?;
    let next_offset = match value.get("next_offset") {
        Some(Value::Null) => None,
        Some(value) => Some(value.as_u64().ok_or("thread.observation-incompatible".to_string())?),
        None => return Err("thread.observation-incompatible".into()),
    };
    if next_offset != (page_offset + 32 < thread_count).then_some(page_offset + 32) {
        return Err("thread.observation-incompatible".into());
    }
    let ongoing_thread_count = value
        .get("ongoing_thread_count")
        .and_then(Value::as_u64)
        .filter(|count| *count <= thread_count)
        .ok_or("thread.observation-incompatible".to_string())?;
    let omitted_ongoing_thread_count = value
        .get("omitted_ongoing_thread_count")
        .and_then(Value::as_u64)
        .filter(|count| *count <= ongoing_thread_count)
        .ok_or("thread.observation-incompatible".to_string())?;
    let degraded_steer_thread_count = match value.get("degraded_steer_thread_count") {
        Some(Value::Null) => None,
        Some(value) => Some(
            value
                .as_u64()
                .filter(|count| *count <= session_count.saturating_mul(256))
                .ok_or("thread.observation-incompatible".to_string())?,
        ),
        None => return Err("thread.observation-incompatible".into()),
    };
    let unknown_dispatch_count = match value.get("unknown_dispatch_count") {
        Some(Value::Null) | None => None,
        Some(value) => Some(
            value
                .as_u64()
                .filter(|count| *count <= 1_000_000)
                .ok_or("thread.observation-incompatible".to_string())?,
        ),
    };
    let unknown_hosted_effect_dispatch_count = match value.get("unknown_hosted_effect_dispatch_count") {
        Some(Value::Null) | None => None,
        Some(value) => Some(
            value
                .as_u64()
                .filter(|count| *count <= 1_000_000)
                .ok_or("thread.observation-incompatible".to_string())?,
        ),
    };
    if let Some(effect_count) = unknown_hosted_effect_dispatch_count {
        if !unknown_dispatch_count.is_some_and(|dispatch_count| effect_count <= dispatch_count) {
            return Err("thread.observation-incompatible".into());
        }
    }
    let unknown_thread_creation_count = match value.get("unknown_thread_creation_count") {
        Some(Value::Null) | None => None,
        Some(value) => Some(
            value
                .as_u64()
                .filter(|count| *count <= 1_000_000)
                .ok_or("thread.observation-incompatible".to_string())?,
        ),
    };
    if let (Some(creation_count), Some(dispatch_count)) =
        (unknown_thread_creation_count, unknown_dispatch_count)
    {
        if creation_count > dispatch_count {
            return Err("thread.observation-incompatible".into());
        }
    }
    let accepted_unresolved_turn_count = match value.get("accepted_unresolved_turn_count") {
        Some(Value::Null) | None => None,
        Some(value) => Some(
            value
                .as_u64()
                .filter(|count| *count <= 1_000_000)
                .ok_or("thread.observation-incompatible".to_string())?,
        ),
    };
    if let Some(accepted_count) = accepted_unresolved_turn_count {
        if !unknown_dispatch_count.is_some_and(|dispatch_count| accepted_count <= dispatch_count) {
            return Err("thread.observation-incompatible".into());
        }
    }
    let recovered_dispatch_count = match value.get("recovered_dispatch_count") {
        Some(Value::Null) | None => None,
        Some(value) => Some(
            value
                .as_u64()
                .filter(|count| *count <= 1_000_000)
                .ok_or("thread.observation-incompatible".to_string())?,
        ),
    };
    let truncated = value
        .get("truncated")
        .and_then(Value::as_bool)
        .ok_or("thread.observation-incompatible".to_string())?;
    let raw_threads = value
        .get("threads")
        .and_then(Value::as_array)
        .filter(|threads| threads.len() <= 32)
        .ok_or("thread.observation-incompatible".to_string())?;
    if raw_threads.len() as u64 != (thread_count - page_offset).min(32) || truncated != (thread_count > 32) {
        return Err("thread.observation-incompatible".into());
    }
    let visible_ongoing_count = raw_threads.iter().filter(|thread| {
        matches!(thread.get("phase").and_then(Value::as_str),
            Some("recovery-unverified" | "turn-active" | "dispatch-pending"))
    }).count() as u64;
    if ongoing_thread_count != visible_ongoing_count + omitted_ongoing_thread_count {
        return Err("thread.observation-incompatible".into());
    }
    let threads = raw_threads
        .iter()
        .map(|thread| {
            let phase = thread
                .get("phase")
                .and_then(Value::as_str)
                .filter(|value| {
                    ["dispatch-pending", "turn-active", "turn-completed", "recovery-unverified", "recovery-terminal"].contains(value)
                })
                .ok_or("thread.observation-incompatible".to_string())?;
            let frontier = match thread.get("latest_frontier_digest") {
                Some(Value::Null) => None,
                Some(_) => Some(thread_hash(thread, "latest_frontier_digest")?),
                None => return Err("thread.observation-incompatible".into()),
            };
            let sequence = match thread.get("latest_frontier_event_sequence") {
                Some(Value::Null) => None,
                Some(value) => Some(
                    value
                        .as_u64()
                        .ok_or("thread.observation-incompatible".to_string())?,
                ),
                None => return Err("thread.observation-incompatible".into()),
            };
            let completion = match thread.get("last_completion_status") {
                Some(Value::Null) => None,
                Some(Value::String(value))
                    if ["completed", "failed", "interrupted", "cancelled", "unknown"]
                        .contains(&value.as_str()) =>
                {
                    Some(value.clone())
                }
                _ => return Err("thread.observation-incompatible".into()),
            };
            let relay_check = match thread.get("mcp_hook_relay_check") {
                None | Some(Value::Null) => None,
                Some(Value::Object(check)) if check.len() == 2 => {
                    let status = check.get("status").and_then(Value::as_str)
                        .filter(|status| ["listed", "not-ready"].contains(status))
                        .ok_or("thread.observation-incompatible".to_string())?;
                    let checked_at = check.get("checked_at_unix_ms").and_then(Value::as_u64)
                        .filter(|checked_at| *checked_at <= observed.saturating_add(1000))
                        .ok_or("thread.observation-incompatible".to_string())?;
                    Some(serde_json::json!({"status": status, "checkedAtUnixMs": checked_at}))
                }
                _ => return Err("thread.observation-incompatible".into()),
            };
            let plan_digest = match thread.get("plan_context_digest") {
                None | Some(Value::Null) => None,
                Some(_) => Some(thread_hash(thread, "plan_context_digest")?),
            };
            let plan_number = |key: &str| -> Result<Option<u64>, String> {
                match thread.get(key) {
                    None | Some(Value::Null) => Ok(None),
                    Some(value) => value
                        .as_u64()
                        .map(Some)
                        .ok_or("thread.observation-incompatible".to_string()),
                }
            };
            let plan_sequence = plan_number("plan_context_event_sequence")?;
            let obligation_count = plan_number("plan_obligation_count")?;
            let completed_count = plan_number("plan_completed_count")?;
            let open_decision_count = plan_number("plan_open_decision_count")?;
            let active_slice_ordinal = plan_number("plan_active_slice_ordinal")?;
            let active_slice_status = match thread.get("plan_active_slice_status") {
                None | Some(Value::Null) => None,
                Some(Value::String(value)) if ["open", "active", "deferred"].contains(&value.as_str()) => Some(value.clone()),
                _ => return Err("thread.observation-incompatible".into()),
            };
            if (plan_digest.is_none()
                && [plan_sequence, obligation_count, completed_count, open_decision_count, active_slice_ordinal]
                    .iter()
                    .any(Option::is_some))
                || (plan_digest.is_none() && active_slice_status.is_some())
                || (plan_digest.is_some()
                    && (plan_sequence.is_none_or(|value| value == 0)
                        || obligation_count.is_none_or(|value| value == 0 || value > 32)
                        || completed_count.is_none_or(|value| value > obligation_count.unwrap_or(0))
                        || open_decision_count.is_none_or(|value| value > 32)))
                || (active_slice_ordinal.is_some() != active_slice_status.is_some())
                || active_slice_ordinal.is_some_and(|value| value == 0 || value > obligation_count.unwrap_or(0))
            {
                return Err("thread.observation-incompatible".into());
            }
            let host_count = |key: &str| -> Result<Option<u64>, String> {
                match thread.get(key) {
                    None => Ok(None),
                    Some(value) => value.as_u64().filter(|count| *count <= 256)
                        .map(Some).ok_or("thread.observation-incompatible".to_string()),
                }
            };
            let accepted_turn_start_count = host_count("accepted_turn_start_count")?;
            let verified_host_turn_count = host_count("verified_host_turn_count")?;
            let marked_host_turn_count = host_count("marked_host_turn_count")?;
            let recovered_thread_dispatch_count = match thread.get("recovered_dispatch_count") {
                None | Some(Value::Null) => None,
                Some(value) => Some(value.as_u64().filter(|count| *count <= 1_000_000)
                    .ok_or("thread.observation-incompatible".to_string())?),
            };
            let unknown_thread_hosted_effect_dispatch_count = match thread.get("unknown_hosted_effect_dispatch_count") {
                None | Some(Value::Null) => None,
                Some(value) => Some(value.as_u64().filter(|count| *count <= 1_000_000)
                    .ok_or("thread.observation-incompatible".to_string())?),
            };
            if unknown_thread_hosted_effect_dispatch_count.is_some_and(|count|
                !unknown_hosted_effect_dispatch_count.is_some_and(|total| count <= total)) {
                return Err("thread.observation-incompatible".into());
            }
            let accepted_steer_count = host_count("accepted_steer_count")?;
            let accepted_compaction_turn_count = host_count("accepted_compaction_turn_count")?;
            let completed_compaction_item_count = host_count("completed_compaction_item_count")?;
            let recovered_compaction_count = host_count("recovered_compaction_count")?;
            let latest_host_observation_digest = match thread.get("latest_host_observation_digest") {
                None | Some(Value::Null) => None,
                Some(_) => Some(thread_hash(thread, "latest_host_observation_digest")?),
            };
            let recovery_host_status = match thread.get("recovery_host_status") {
                None | Some(Value::Null) => None,
                Some(Value::String(value))
                    if ["inProgress", "completed", "failed", "interrupted"]
                        .contains(&value.as_str()) => Some(value.clone()),
                _ => return Err("thread.observation-incompatible".into()),
            };
            let recovery_host_observation_digest = match thread.get("recovery_host_observation_digest") {
                None | Some(Value::Null) => None,
                Some(_) => Some(thread_hash(thread, "recovery_host_observation_digest")?),
            };
            let known_host_receipts = accepted_turn_start_count.unwrap_or(0)
                + verified_host_turn_count.unwrap_or(0)
                + marked_host_turn_count.unwrap_or(0)
                + accepted_steer_count.unwrap_or(0)
                + accepted_compaction_turn_count.unwrap_or(0)
                + completed_compaction_item_count.unwrap_or(0);
            let known_host_receipts = known_host_receipts + recovered_compaction_count.unwrap_or(0);
            if accepted_steer_count.is_some() != completed_compaction_item_count.is_some()
                || (latest_host_observation_digest.is_none() && known_host_receipts > 0)
                || (latest_host_observation_digest.is_some() && known_host_receipts == 0
                    && accepted_turn_start_count.is_some() && verified_host_turn_count.is_some()
                    && accepted_steer_count.is_some() && completed_compaction_item_count.is_some())
                || (recovery_host_status.is_some() != recovery_host_observation_digest.is_some())
                || (recovery_host_status.is_some() && !["recovery-unverified", "recovery-terminal"].contains(&phase))
                || (phase == "recovery-terminal" && !matches!(recovery_host_status.as_deref(), Some("completed" | "interrupted" | "failed")))
            {
                return Err("thread.observation-incompatible".into());
            }
            Ok(serde_json::json!({
                "threadRef": thread_digest(thread, "thread_ref", "backend-thread:")?,
                "learningFeedback": project_learning_feedback(thread.get("learning_feedback"))?,
                "consumerRef": thread_digest(thread, "consumer_ref", "gateway-consumer:")?,
                "phase": phase,
                "reasoningEpochDigest": thread_hash(thread, "reasoning_epoch_digest")?,
                "checkpointDigest": thread_hash(thread, "checkpoint_digest")?,
                "latestFrontierDigest": frontier,
                "latestFrontierEventSequence": sequence,
                "lastCompletionStatus": completion,
                "planContextDigest": plan_digest,
                "planContextEventSequence": plan_sequence,
                "planObligationCount": obligation_count,
                "planCompletedCount": completed_count,
                "planOpenDecisionCount": open_decision_count,
                "planActiveSliceOrdinal": active_slice_ordinal,
                "planActiveSliceStatus": active_slice_status,
                "acceptedTurnStartCount": accepted_turn_start_count,
                "verifiedHostTurnCount": verified_host_turn_count,
                "markedHostTurnCount": marked_host_turn_count,
                "recoveredDispatchCount": recovered_thread_dispatch_count,
                "unknownHostedEffectDispatchCount": unknown_thread_hosted_effect_dispatch_count,
                "acceptedSteerCount": accepted_steer_count,
                "acceptedCompactionTurnCount": accepted_compaction_turn_count,
                "completedCompactionItemCount": completed_compaction_item_count,
                "recoveredCompactionCount": recovered_compaction_count,
                "latestHostObservationDigest": latest_host_observation_digest,
                "recoveryHostStatus": recovery_host_status,
                "recoveryHostObservationDigest": recovery_host_observation_digest,
                "mcpHookRelayCheck": relay_check,
            }))
        })
        .collect::<Result<Vec<Value>, String>>()?;
    if let Some(total) = unknown_hosted_effect_dispatch_count {
        let visible = threads.iter().map(|thread| thread.get("unknownHostedEffectDispatchCount")
            .and_then(Value::as_u64).unwrap_or(0)).sum::<u64>();
        if visible > total {
            return Err("thread.observation-incompatible".into());
        }
    }
    Ok(serde_json::json!({
        "schemaVersion": "are.companion-thread-observation/v1",
        "source": "gateway-in-process",
        "scope": "gateway-backend-threads-not-host-activation",
        "runtimeEpochId": runtime_epoch_id,
        "observedAtUnixMs": observed,
        "sessionCount": session_count,
        "threadCount": thread_count,
        "pageOffset": page_offset,
        "nextOffset": next_offset,
        "snapshotDigest": page_snapshot_digest,
        "ongoingThreadCount": ongoing_thread_count,
        "omittedOngoingThreadCount": omitted_ongoing_thread_count,
        "degradedSteerThreadCount": degraded_steer_thread_count,
        "unknownDispatchCount": unknown_dispatch_count,
        "unknownHostedEffectDispatchCount": unknown_hosted_effect_dispatch_count,
        "unknownThreadCreationCount": unknown_thread_creation_count,
        "acceptedUnresolvedTurnCount": accepted_unresolved_turn_count,
        "recoveredDispatchCount": recovered_dispatch_count,
        "truncated": truncated,
        "threads": threads,
        "authorityEffect": "none",
    }))
}

#[tauri::command]
async fn get_hosted_rejoin_snapshot(app: AppHandle, thread_refs: Vec<String>) -> Result<Value, String> {
    if thread_refs.len() > 32 || thread_refs.iter().any(|reference| {
        !reference.starts_with("backend-thread:") || reference.len() != 79
            || !reference[15..].bytes().all(|byte| byte.is_ascii_hexdigit())
    }) || thread_refs.iter().collect::<std::collections::HashSet<_>>().len() != thread_refs.len() {
        return Err("hosted-rejoin.observation-input-invalid".into());
    }
    if std::env::var_os("ARE_COMPANION_HOSTED_REJOIN_URL").is_none()
        || std::env::var("ARE_HOSTED_REJOIN_OBSERVATION_TOKEN").map_or(true, |value| value.len() < 32) {
        return Err("hosted-rejoin.not-configured".into());
    }
    let (node, entry) = backend_paths(&app)?;
    if !node.is_file() || !entry.is_file() { return Err("hosted-rejoin.runtime-missing".into()); }
    let refs = thread_refs.join(",");
    let output = run_bounded(node, entry, &["hosted-rejoin-status", "--json", "--refs", &refs],
        ADAPTER_TIMEOUT, ADAPTER_MAX_BYTES).await
        .map_err(|_| "hosted-rejoin.unavailable".to_string())?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "hosted-rejoin.observation-incompatible".to_string())?;
    let rows = value.get("rows").and_then(Value::as_array)
        .ok_or("hosted-rejoin.observation-incompatible")?;
    if value.get("schema_version").and_then(Value::as_str) != Some("are.hosted-rejoin-observation/v1")
        || value.get("scope").and_then(Value::as_str) != Some("managed-hosted-client-only")
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
        || rows.len() > thread_refs.len()
        || rows.iter().any(|row| {
            !row.get("thread_ref").and_then(Value::as_str).is_some_and(|reference| thread_refs.iter().any(|item| item == reference))
                || !row.get("status").and_then(Value::as_str).is_some_and(|status| ["hosted-owned", "rejoined", "rejoin-ready", "blocked", "unverified"].contains(&status))
                || !row.get("pending_steer_checkpoint").is_some_and(Value::is_boolean)
                || !row.get("reason_code").is_some_and(|reason| reason.is_null()
                    || reason.as_str().is_some_and(|text| text.starts_with("windows-client.") && text.len() <= 96))
        }) {
        return Err("hosted-rejoin.observation-incompatible".into());
    }
    Ok(serde_json::json!({
        "schemaVersion": "are.companion-hosted-rejoin-observation/v1",
        "scope": "managed-hosted-client-only",
        "observedAtUnixMs": value["observed_at_unix_ms"],
        "rows": rows.iter().map(|row| serde_json::json!({
            "threadRef": row["thread_ref"], "status": row["status"], "reasonCode": row["reason_code"],
            "pendingSteerCheckpoint": row["pending_steer_checkpoint"]
        })).collect::<Vec<_>>(),
        "authorityEffect": "none",
    }))
}

#[tauri::command]
async fn get_decision_snapshot(app: AppHandle) -> Result<Value, String> {
    if std::env::var_os("ARE_COMPANION_NODE").is_none()
        || std::env::var_os("ARE_COMPANION_ENTRY").is_none()
    {
        return Err("decision.not-configured".into());
    }
    let socket = std::env::var("ARE_COMPANION_OBSERVATION_SOCKET")
        .map_err(|_| "decision.not-configured".to_string())?;
    if socket.is_empty()
        || std::env::var("ARE_ADAPTER_OBSERVATION_TOKEN").map_or(true, |value| value.len() < 32)
    {
        return Err("decision.not-configured".into());
    }
    let (node, entry) = backend_paths(&app)?;
    if !node.is_file() || !entry.is_file() {
        return Err("decision.runtime-missing".into());
    }
    let output = run_bounded(
        node,
        entry,
        &["decision-status", "--json", "--socket", &socket],
        ADAPTER_TIMEOUT,
        DECISION_MAX_BYTES,
    )
    .await
    .map_err(|_| "decision.unavailable".to_string())?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "decision.observation-incompatible".to_string())?;
    if value.get("schema_version").and_then(Value::as_str)
        != Some("are.gateway-decision-observation/v1")
        || value.get("source").and_then(Value::as_str) != Some("gateway-in-process")
        || value.get("scope").and_then(Value::as_str)
            != Some("gateway-backend-decisions-not-durable-host-history")
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
    {
        return Err("decision.observation-incompatible".into());
    }
    let observed = value
        .get("observed_at_unix_ms")
        .and_then(Value::as_u64)
        .ok_or("decision.observation-incompatible".to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    if now.saturating_sub(observed) > 5000 || observed > now.saturating_add(1000) {
        return Err("decision.observation-stale".into());
    }
    let runtime_epoch_id = value
        .get("runtime_epoch_id")
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty() && text.len() <= 256)
        .ok_or("decision.observation-incompatible".to_string())?;
    let session_count = value
        .get("session_count")
        .and_then(Value::as_u64)
        .ok_or("decision.observation-incompatible".to_string())?;
    let decision_count = value
        .get("decision_count")
        .and_then(Value::as_u64)
        .ok_or("decision.observation-incompatible".to_string())?;
    let truncated = value
        .get("truncated")
        .and_then(Value::as_bool)
        .ok_or("decision.observation-incompatible".to_string())?;
    let raw_decisions = value
        .get("decisions")
        .and_then(Value::as_array)
        .filter(|items| items.len() <= 32)
        .ok_or("decision.observation-incompatible".to_string())?;
    if raw_decisions.len() as u64 != decision_count.min(32) || truncated != (decision_count > 32) {
        return Err("decision.observation-incompatible".into());
    }
    let decisions = raw_decisions
        .iter()
        .map(|item| {
            let decision_type = item
                .get("decision_type")
                .and_then(Value::as_str)
                .filter(|value| {
                    ["turn-preflight", "effect-evaluation", "turn-continuation"].contains(value)
                })
                .ok_or("decision.observation-incompatible".to_string())?;
            let outcome = item
                .get("outcome")
                .and_then(Value::as_str)
                .filter(|value| ["direct", "gate", "block", "stop", "unknown"].contains(value))
                .ok_or("decision.observation-incompatible".to_string())?;
            let reason_codes = item
                .get("reason_codes")
                .and_then(Value::as_array)
                .filter(|items| items.len() <= 8)
                .ok_or("decision.observation-incompatible".to_string())?
                .iter()
                .map(|reason| {
                    reason
                        .as_str()
                        .filter(|text| {
                            !text.is_empty()
                                && text.len() <= 128
                                && text.bytes().all(|byte| {
                                    byte.is_ascii_lowercase()
                                        || byte.is_ascii_digit()
                                        || b"._-".contains(&byte)
                                })
                        })
                        .map(str::to_string)
                        .ok_or("decision.observation-incompatible".to_string())
                })
                .collect::<Result<Vec<_>, _>>()?;
            let sequence = item
                .get("event_sequence")
                .and_then(Value::as_u64)
                .filter(|number| *number > 0)
                .ok_or("decision.observation-incompatible".to_string())?;
            let event_observed = item
                .get("observed_at_unix_ms")
                .and_then(Value::as_u64)
                .filter(|number| *number > 0 && *number <= now.saturating_add(1000))
                .ok_or("decision.observation-incompatible".to_string())?;
            Ok(serde_json::json!({
                "decisionType": decision_type,
                "outcome": outcome,
                "consumerRef": thread_digest(item, "consumer_ref", "gateway-consumer:")?,
                "threadRef": thread_digest(item, "thread_ref", "backend-thread:")?,
                "decisionDigest": thread_hash(item, "decision_digest")?,
                "evidenceEventDigest": thread_hash(item, "evidence_event_digest")?,
                "eventSequence": sequence,
                "eventObservedAtUnixMs": event_observed,
                "reasonCodes": reason_codes,
            }))
        })
        .collect::<Result<Vec<Value>, String>>()?;
    Ok(serde_json::json!({
        "schemaVersion": "are.companion-decision-observation/v1",
        "source": "gateway-in-process",
        "scope": "gateway-backend-decisions-not-durable-host-history",
        "runtimeEpochId": runtime_epoch_id,
        "observedAtUnixMs": observed,
        "sessionCount": session_count,
        "decisionCount": decision_count,
        "truncated": truncated,
        "decisions": decisions,
        "authorityEffect": "none",
    }))
}

#[tauri::command]
async fn get_adapter_snapshot(app: AppHandle) -> Result<AdapterSnapshot, String> {
    if std::env::var_os("ARE_COMPANION_NODE").is_none()
        || std::env::var_os("ARE_COMPANION_ENTRY").is_none()
    {
        return Err("adapter.not-configured".into());
    }
    let socket = std::env::var("ARE_COMPANION_OBSERVATION_SOCKET")
        .map_err(|_| "adapter.not-configured".to_string())?;
    adapter_snapshot_for_socket(&app, &socket, None).await
}

async fn adapter_snapshot_for_socket(app: &AppHandle, socket: &str, observation_token: Option<&str>) -> Result<AdapterSnapshot, String> {
    if socket.is_empty()
        || observation_token.map_or_else(
            || std::env::var("ARE_ADAPTER_OBSERVATION_TOKEN").map_or(true, |value| value.len() < 32),
            |value| value.len() < 32 || value.len() > 4096,
        )
    {
        return Err("adapter.not-configured".into());
    }
    let (node, entry) = backend_paths(app)?;
    if !node.is_file() || !entry.is_file() {
        return Err("adapter.runtime-missing".into());
    }
    let output = run_bounded_with_token(
        node,
        entry,
        &["adapter-status", "--json", "--socket", &socket],
        ADAPTER_TIMEOUT,
        ADAPTER_MAX_BYTES,
        observation_token,
    )
    .await
    .map_err(|_| "adapter.unavailable".to_string())?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "adapter.observation-incompatible".to_string())?;
    let observation_source = match value.get("source").and_then(Value::as_str) {
        Some("gateway-in-process") => "gateway-in-process",
        Some("dsh-web-host-process") => "dsh-web-host-process",
        _ => return Err("adapter.observation-incompatible".into()),
    };
    if value.get("schema_version").and_then(Value::as_str) != Some("are.adapter-observation/v1")
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
    {
        return Err("adapter.observation-incompatible".into());
    }
    let epoch = value
        .get("runtime_epoch_id")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty() && s.len() <= 256)
        .ok_or("adapter.observation-incompatible".to_string())?;
    let backend_id = value
        .get("selected_backend_adapter_id")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty() && s.len() <= 256)
        .ok_or("adapter.observation-incompatible".to_string())?;
    if observation_source == "dsh-web-host-process"
        && backend_id != "deepseek-harness-web/are-v1"
    {
        return Err("adapter.observation-incompatible".into());
    }
    let observed = value
        .get("observed_at_unix_ms")
        .and_then(Value::as_u64)
        .ok_or("adapter.observation-incompatible".to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    if now.saturating_sub(observed) > 5000 || observed > now.saturating_add(1000) {
        return Err("adapter.observation-stale".into());
    }
    let reasons = value
        .get("reason_codes")
        .and_then(Value::as_array)
        .ok_or("adapter.observation-incompatible".to_string())?;
    if reasons.len() > 16
        || reasons
            .iter()
            .any(|r| r.as_str().map_or(true, |s| s.len() > 128))
    {
        return Err("adapter.observation-incompatible".into());
    }
    let gateway_status = status(&value, "/gateway/status", &["running", "unavailable"])?;
    let client_link_status = status(&value, "/client_link/status", &["connected", "not-observed"])?;
    let backend_status = status(&value, "/backend/status", &["ready", "running", "not-observed"])?;
    let selected_path_status = status(&value, "/selected_path/status", &["ready", "not-observed", "unknown"])?;
    if selected_path_status == "ready"
        && (gateway_status != "running" || client_link_status != "connected" || backend_status != "ready")
    {
        return Err("adapter.observation-incompatible".into());
    }
    let session_paths = if value.get("session_paths").is_some() {
        let path_status = status(&value, "/session_paths/status", &["observed", "unavailable", "unknown"])?;
        let names = ["total", "ready", "initializing", "backend_unavailable", "detached_backend", "inactive"];
        let counts: Vec<Option<u64>> = names.iter().map(|name| {
            value.pointer(&format!("/session_paths/{name}")).and_then(Value::as_u64)
        }).collect();
        if path_status == "unknown" {
            if names.iter().any(|name| value.pointer(&format!("/session_paths/{name}")) != Some(&Value::Null)) {
                return Err("adapter.observation-incompatible".into());
            }
        } else {
            if counts.iter().any(|count| !count.is_some_and(|value| value <= 1024))
                || counts[0] != Some(counts[1..].iter().map(|count| count.unwrap_or(0)).sum()) {
                return Err("adapter.observation-incompatible".into());
            }
            if path_status == "unavailable" {
                if gateway_status != "unavailable" || counts[0] != Some(0)
                    || backend_status != "not-observed" {
                    return Err("adapter.observation-incompatible".into());
                }
            } else if gateway_status != "running"
                || (selected_path_status == "ready") != (counts[1].unwrap_or(0) > 0)
                || (client_link_status == "connected")
                    != (counts[1].unwrap_or(0) + counts[2].unwrap_or(0) + counts[3].unwrap_or(0) > 0)
                || (backend_status != "not-observed")
                    != (counts[1].unwrap_or(0) + counts[2].unwrap_or(0) + counts[4].unwrap_or(0) > 0)
            {
                return Err("adapter.observation-incompatible".into());
            }
        }
        SessionPathCounts { status: path_status, total: counts[0], ready: counts[1],
            initializing: counts[2], backend_unavailable: counts[3], detached_backend: counts[4],
            inactive: counts[5] }
    } else {
        SessionPathCounts { status: "unknown".to_string(), total: None, ready: None,
            initializing: None, backend_unavailable: None, detached_backend: None, inactive: None }
    };
    if observation_source == "dsh-web-host-process"
        && (client_link_status != "not-observed" || selected_path_status != "not-observed"
            || session_paths.status != "unknown")
    {
        return Err("adapter.observation-incompatible".into());
    }
    let dsh_web_activity = if observation_source == "dsh-web-host-process" {
        let activity = value.get("dsh_web_activity")
            .ok_or("adapter.observation-incompatible".to_string())?;
        let activity_status = status(&value, "/dsh_web_activity/status", &["observed", "unknown"])?;
        let names = ["active_agent_count", "retained_model_entry_count", "retained_turn_terminal_count"];
        let counts: Vec<Option<u64>> = names.iter().map(|name| activity.get(name).and_then(Value::as_u64)).collect();
        let omitted_agent_count = activity.get("omitted_agent_count").and_then(Value::as_u64);
        let raw_agents = activity.get("agents").and_then(Value::as_array)
            .ok_or("adapter.observation-incompatible".to_string())?;
        let mut agents = Vec::new();
        let mut previous_ref = String::new();
        if raw_agents.len() > 16 { return Err("adapter.observation-incompatible".into()); }
        for item in raw_agents {
            let object = item.as_object().ok_or("adapter.observation-incompatible".to_string())?;
            let thread_ref = item.get("thread_ref").and_then(Value::as_str)
                .ok_or("adapter.observation-incompatible".to_string())?;
            let evidence = item.get("last_turn_evidence").and_then(Value::as_str)
                .ok_or("adapter.observation-incompatible".to_string())?;
            let native_turn_state = item.get("native_turn_state").and_then(Value::as_str);
            let preparation = item.get("are_preparation");
            let interpretation = item.get("are_interpretation")
                .map(parse_dsh_interpretation_summary).transpose()?;
            let plan_head = item.get("are_plan_head").map(parse_dsh_plan_head_summary).transpose()?;
            let objective_checkpoint = preparation.and_then(|value| value.get("objective_checkpoint"))
                .map(parse_dsh_objective_checkpoint_summary).transpose()?;
            let valid_preparation = preparation.is_none_or(|value| {
                value.as_object().is_some_and(|record|
                    record.len() == 2 + usize::from(value.get("dispatch_relation").is_some())
                        + usize::from(value.get("objective_checkpoint").is_some()))
                    && value.get("status").and_then(Value::as_str) == Some("route-context-prepared")
                    && value.get("dispatch_relation").is_none_or(|relation|
                        relation.as_str().is_some_and(|relation| ["latest-model-entry",
                            "other-preparation", "not-retained", "legacy-unbound"].contains(&relation)))
                    && value.get("route_id").and_then(Value::as_str).is_some_and(|route| {
                        route.starts_with("CA2-ROUTE-") && route.len() > 10 && route.len() <= 90
                            && route[10..].bytes().all(|byte| byte.is_ascii_uppercase()
                                || byte.is_ascii_digit() || byte == b'-')
                    })
            });
            if object.len() != 2 + usize::from(native_turn_state.is_some())
                    + usize::from(preparation.is_some())
                    + usize::from(interpretation.is_some())
                    + usize::from(plan_head.is_some())
                || !valid_preparation
                || native_turn_state.is_some_and(|state| !["not-started", "open-observed",
                    "closed-observed", "unknown"].contains(&state))
                || !thread_ref.starts_with("backend-thread:")
                || thread_ref.len() != 79 || !thread_ref[15..].bytes().all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
                || thread_ref <= previous_ref.as_str()
                || !["model-entry-retained", "terminal-retained", "no-retained-turn-event"].contains(&evidence) {
                return Err("adapter.observation-incompatible".into());
            }
            previous_ref = thread_ref.to_string();
            agents.push(DshWebAgentState { thread_ref: previous_ref.clone(),
                last_turn_evidence: evidence.to_string(),
                native_turn_state: native_turn_state.map(str::to_string),
                are_interpretation: interpretation,
                are_plan_head: plan_head,
                are_preparation: preparation.map(|value| DshArePreparation {
                    status: "route-context-prepared".to_string(),
                    route_id: value.get("route_id").and_then(Value::as_str).unwrap().to_string(),
                    dispatch_relation: value.get("dispatch_relation").and_then(Value::as_str).map(str::to_string),
                    objective_checkpoint,
                }) });
        }
        if !activity.as_object().is_some_and(|object| object.len() == 6)
            || (activity_status == "unknown"
                && (names.iter().any(|name| activity.get(name) != Some(&Value::Null))
                    || activity.get("omitted_agent_count") != Some(&Value::Null) || !agents.is_empty()))
            || (activity_status == "observed"
                && counts.iter().enumerate().any(|(index, count)|
                    !count.is_some_and(|value| value <= if index == 0 { 1024 } else { 262_144 })))
            || (activity_status == "observed" && (omitted_agent_count.is_none_or(|count| count > 1024)
                || agents.len() as u64 + omitted_agent_count.unwrap_or(0) != counts[0].unwrap_or(0)))
        {
            return Err("adapter.observation-incompatible".into());
        }
        Some(DshWebActivity { status: activity_status,
            active_agent_count: counts[0], retained_model_entry_count: counts[1],
            retained_turn_terminal_count: counts[2], omitted_agent_count, agents })
    } else {
        if value.get("dsh_web_activity").is_some_and(|activity| !activity.is_null()) {
            return Err("adapter.observation-incompatible".into());
        }
        None
    };
    let managed_turn_ingress_paused = std::env::var("ARE_MANAGED_CLIENT_TURN_INGRESS")
        .ok()
        .as_deref()
        == Some("windows-client.hook-boundary-unverified");
    let (ingress_status, ingress_source, ingress_reason) =
        model_entry_ingress(&value, managed_turn_ingress_paused)?;
    let boundary_declaration = std::env::var("ARE_MANAGED_MODEL_ENTRY_BOUNDARY").ok();
    if boundary_declaration.as_deref().is_some_and(|value| value != "guarded-text-only-candidate") {
        return Err("adapter.observation-incompatible".into());
    }
    let launch_guarded_text = boundary_declaration.is_some();
    let entry_boundary = managed_model_entry_boundary(ingress_status, launch_guarded_text)?;
    let model_wire_guard_status = value
        .pointer("/model_wire_guard/status")
        .map(|_| status(&value, "/model_wire_guard/status", &["parent-heartbeat-observed", "not-observed", "not-declared", "unknown"]))
        .transpose()?
        .unwrap_or_else(|| "unknown".to_string());
    if launch_guarded_text && model_wire_guard_status == "not-declared" {
        return Err("adapter.observation-incompatible".into());
    }
    let plan_declaration = std::env::var("ARE_COMPANION_GUARDED_PLAN_INPUT").ok();
    let guarded_plan_input_status = managed_guarded_plan_input_status(
        plan_declaration.as_deref(), entry_boundary, &model_wire_guard_status)?;
    let host_method_policy = if value.get("host_method_policy").is_some() {
        let policy_status = status(&value, "/host_method_policy/status", &[
            "pinned-catalog", "not-applicable", "unknown",
        ])?;
        let version = value.pointer("/host_method_policy/codex_version").and_then(Value::as_str);
        let known = value.pointer("/host_method_policy/known_request_count").and_then(Value::as_u64);
        let admitted = value.pointer("/host_method_policy/admitted_request_count").and_then(Value::as_u64);
        if policy_status == "pinned-catalog" {
            if backend_id != "codex-app-server/v1"
                || !version.is_some_and(|item| !item.is_empty() && item.len() <= 128)
                || !known.is_some_and(|count| (1..=4096).contains(&count))
                || !admitted.is_some_and(|count| count <= known.unwrap_or(0)) {
                return Err("adapter.observation-incompatible".into());
            }
        } else if version.is_some() || known.is_some() || admitted.is_some()
            || value.pointer("/host_method_policy/codex_version") != Some(&Value::Null)
            || value.pointer("/host_method_policy/known_request_count") != Some(&Value::Null)
            || value.pointer("/host_method_policy/admitted_request_count") != Some(&Value::Null)
        {
            return Err("adapter.observation-incompatible".into());
        }
        HostMethodPolicy { status: policy_status, codex_version: version.map(str::to_string),
            known_request_count: known, admitted_request_count: admitted }
    } else {
        HostMethodPolicy { status: "unknown".to_string(), codex_version: None,
            known_request_count: None, admitted_request_count: None }
    };
    Ok(AdapterSnapshot {
        schema_version: "are.companion-adapter-observation/v1",
        source: observation_source,
        observation_transport: if socket.starts_with("tcp://127.0.0.1:") {
            "loopback-tcp-development"
        } else {
            "local-ipc"
        },
        runtime_epoch_id: epoch.to_string(),
        selected_backend_adapter_id: backend_id.to_string(),
        gateway_status,
        client_link_status,
        backend_status,
        selected_path_status,
        session_paths,
        dsh_web_activity,
        host_method_policy,
        managed_turn_ingress_status: ingress_status,
        managed_turn_ingress_source: ingress_source,
        managed_turn_ingress_reason_code: ingress_reason,
        managed_model_entry_boundary: entry_boundary,
        managed_model_wire_guard_status: model_wire_guard_status,
        managed_guarded_plan_input_status: guarded_plan_input_status,
        hosted_input_attestation_status: value
            .pointer("/hosted_input_attestation/status")
            .map(|_| status(&value, "/hosted_input_attestation/status", &["configured", "not-configured", "unknown"]))
            .transpose()?
            .unwrap_or_else(|| "unknown".to_string()),
        hosted_effect_tool_status: value
            .pointer("/hosted_effect_tool/status")
            .map(|_| status(&value, "/hosted_effect_tool/status", &["candidate-enabled", "disabled", "unknown"]))
            .transpose()?
            .unwrap_or_else(|| "unknown".to_string()),
        windows_backend_sandbox_status: value
            .pointer("/windows_backend_sandbox/status")
            .map(|_| status(&value, "/windows_backend_sandbox/status", &[
                "not-configured", "no-active-backend", "pending-or-mixed",
                "passed-all-active-backends", "failed",
            ]))
            .transpose()?
            .unwrap_or_else(|| "unknown".to_string()),
        mcp_hook_relay_preflight_status: value
            .pointer("/mcp_hook_relay_preflight/status")
            .map(|_| status(&value, "/mcp_hook_relay_preflight/status", &["required", "not-required", "unknown"]))
            .transpose()?
            .unwrap_or_else(|| "unknown".to_string()),
        session_fault_status: status(
            &value,
            "/session_fault/status",
            &["observed", "not-observed", "unknown"],
        )?,
        session_quarantine_status: status(
            &value,
            "/session_quarantine/status",
            &["observed", "not-observed", "unknown"],
        )?,
        host_task_control_status: status(
            &value,
            "/host_task_control/status",
            &["unverified"],
        )?,
        backend_capabilities: AdapterCapabilities {
            turn_start: status(
                &value,
                "/backend_capabilities/turn_start",
                &["supported", "unsupported", "unknown"],
            )?,
            turn_interrupt: status(
                &value,
                "/backend_capabilities/turn_interrupt",
                &["supported", "unsupported", "unknown"],
            )?,
            turn_steer: status(
                &value,
                "/backend_capabilities/turn_steer",
                &["supported", "unsupported", "unknown"],
            )?,
            thread_resume: status(
                &value,
                "/backend_capabilities/thread_resume",
                &["supported", "unsupported", "unknown"],
            )?,
            thread_compact: status(
                &value,
                "/backend_capabilities/thread_compact",
                &["supported", "unsupported", "unknown"],
            )?,
            effect_requests: status(
                &value,
                "/backend_capabilities/effect_requests",
                &["supported", "unsupported", "unknown"],
            )?,
            history_persistence: status(
                &value,
                "/backend_capabilities/history_persistence",
                &["durable", "ephemeral", "unknown"],
            )?,
        },
        retained_host_receipts: retained_host_receipts(&value)?,
        observed_at_unix_ms: observed,
        reason_codes: reasons
            .iter()
            .filter_map(Value::as_str)
            .map(str::to_string)
            .collect(),
        authority_effect: "none",
    })
}

#[tauri::command]
async fn get_adapter_inventory(app: AppHandle) -> Result<Vec<AdapterInventoryEntry>, String> {
    let raw = match std::env::var("ARE_COMPANION_ADDITIONAL_OBSERVATION_SOCKETS") {
        Ok(value) => value,
        Err(std::env::VarError::NotPresent) => return Ok(Vec::new()),
        Err(_) => return Err("adapter.inventory-config-invalid".into()),
    };
    let sources = parse_additional_observation_sockets(
        &raw, std::env::var("ARE_COMPANION_OBSERVATION_SOCKET").ok().as_deref())?;
    let mut entries = Vec::with_capacity(sources.len());
    let tasks: Vec<_> = sources.into_iter().map(|source| {
        let app = app.clone();
        tokio::spawn(async move {
            let token = match source.token_env.as_deref() {
                Some(name) => Some(std::env::var(name).map_err(|_| "adapter.not-configured".to_string())?),
                None => None,
            };
            adapter_snapshot_for_socket(&app, &source.socket, token.as_deref()).await
        })
    }).collect();
    for (index, task) in tasks.into_iter().enumerate() {
        let entry = match task.await {
            Ok(Ok(snapshot)) => AdapterInventoryEntry {
                slot: index + 1, source: Some(snapshot.source),
                backend_adapter_id: Some(snapshot.selected_backend_adapter_id),
                gateway_status: snapshot.gateway_status, backend_status: snapshot.backend_status,
                selected_path_status: snapshot.selected_path_status,
                observed_at_unix_ms: Some(snapshot.observed_at_unix_ms), reason_code: None,
            },
            _ => AdapterInventoryEntry {
                slot: index + 1, source: None, backend_adapter_id: None,
                gateway_status: "unavailable".into(), backend_status: "not-observed".into(),
                selected_path_status: "not-observed".into(),
                observed_at_unix_ms: None, reason_code: Some("adapter.unavailable"),
            },
        };
        entries.push(entry);
    }
    Ok(entries)
}

#[derive(Deserialize)]
#[serde(untagged)]
enum AdditionalObservationInput {
    SharedToken(String),
    NamedToken(AdditionalObservationNamedToken),
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct AdditionalObservationNamedToken {
    socket: String,
    token_env: String,
}

struct AdditionalObservationSource {
    socket: String,
    token_env: Option<String>,
}

fn valid_additional_observation_endpoint(socket: &str) -> bool {
    if socket.is_empty() || socket.len() > 512 { return false; }
    if cfg!(not(windows)) && socket.starts_with('/') && !socket.starts_with("//") { return true; }
    if let Some(port) = socket.strip_prefix("tcp://127.0.0.1:") {
        return !port.is_empty() && port.len() <= 5 && !port.starts_with('0')
            && port.bytes().all(|byte| byte.is_ascii_digit())
            && port.parse::<u16>().is_ok();
    }
    if let Some(name) = cfg!(windows).then(|| socket.strip_prefix("\\\\.\\pipe\\")).flatten() {
        return !name.is_empty() && name.len() <= 128
            && name.bytes().all(|byte| byte.is_ascii_alphanumeric()
                || matches!(byte, b'_' | b'-' | b'.'));
    }
    false
}

fn same_additional_observation_endpoint(left: &str, right: &str) -> bool {
    if cfg!(windows) && left.starts_with("\\\\.\\pipe\\") && right.starts_with("\\\\.\\pipe\\") {
        left.eq_ignore_ascii_case(right)
    } else {
        left == right
    }
}

fn parse_additional_observation_sockets(raw: &str, selected: Option<&str>) -> Result<Vec<AdditionalObservationSource>, String> {
    if raw.len() > 4096 {
        return Err("adapter.inventory-config-invalid".into());
    }
    let inputs: Vec<AdditionalObservationInput> = serde_json::from_str(&raw)
        .map_err(|_| "adapter.inventory-config-invalid".to_string())?;
    let sources: Vec<AdditionalObservationSource> = inputs.into_iter().map(|input| match input {
        AdditionalObservationInput::SharedToken(socket) => AdditionalObservationSource {socket, token_env: None},
        AdditionalObservationInput::NamedToken(source) => AdditionalObservationSource {
            socket: source.socket, token_env: Some(source.token_env),
        },
    }).collect();
    if sources.len() > 4 || sources.iter().any(|source| !valid_additional_observation_endpoint(&source.socket)
        || source.token_env.as_deref().is_some_and(|name| !name.starts_with("ARE_COMPANION_ADAPTER_TOKEN_")
            || name.len() > 128 || name.len() == "ARE_COMPANION_ADAPTER_TOKEN_".len()
            || !name.bytes().all(|byte| byte.is_ascii_uppercase() || byte.is_ascii_digit() || byte == b'_')))
        || sources.iter().enumerate().any(|(index, source)| sources[..index].iter().any(|prior| same_additional_observation_endpoint(&prior.socket, &source.socket)))
        || selected.is_some_and(|selected| sources.iter().any(|source| same_additional_observation_endpoint(&source.socket, selected))) {
        return Err("adapter.inventory-config-invalid".into());
    }
    Ok(sources)
}

fn evolution_text(value: &Value, key: &str, max_len: usize) -> Result<String, String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty() && text.len() <= max_len)
        .map(str::to_string)
        .ok_or("evolution.observation-incompatible".into())
}

fn evolution_optional_text(value: &Value, key: &str) -> Result<Option<String>, String> {
    match value.get(key) {
        Some(Value::Null) => Ok(None),
        Some(Value::String(text)) if !text.is_empty() && text.len() <= 256 => {
            Ok(Some(text.clone()))
        }
        _ => Err("evolution.observation-incompatible".into()),
    }
}

#[tauri::command]
async fn get_evolution_snapshot(app: AppHandle) -> Result<EvolutionSnapshot, String> {
    let root = match std::env::var("ARE_COMPANION_EVOLUTION_ROOT") {
        Ok(value) if value.is_empty() => None,
        Ok(value) => Some(value),
        Err(std::env::VarError::NotPresent) => None,
        Err(_) => return Err("evolution.root-invalid".into()),
    };
    let expected_source = if root.is_some() {
        "durable-ledger-and-candidate-registry"
    } else {
        "candidate-registry-only"
    };
    let (node, entry) = backend_paths(&app)?;
    if !node.is_file() || !entry.is_file() {
        return Err("evolution.runtime-missing".into());
    }
    let observer = entry
        .parent()
        .and_then(std::path::Path::parent)
        .ok_or("evolution.runtime-missing".to_string())?
        .join("packages/evolution-runtime/bin/observe.mjs");
    if !observer.is_file() {
        return Err("evolution.runtime-missing".into());
    }
    let observer_args = match root.as_deref() {
        Some(root) => vec!["--json", "--root", root],
        None => vec!["--json", "--registry-only"],
    };
    let output = run_bounded(
        node,
        observer,
        &observer_args,
        EVOLUTION_TIMEOUT,
        EVOLUTION_MAX_BYTES,
    )
    .await
    .map_err(|_| "evolution.unavailable".to_string())?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "evolution.observation-incompatible".to_string())?;
    if value.get("schema_version").and_then(Value::as_str) != Some("are.evolution-observation/v1")
        || value.get("source").and_then(Value::as_str) != Some(expected_source)
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
    {
        return Err("evolution.observation-incompatible".into());
    }
    let root_status = status(
        &value,
        "/root_status",
        if root.is_some() {
            &["absent", "present", "invalid", "unknown"]
        } else {
            &["not-configured"]
        },
    )
    .map_err(|_| "evolution.observation-incompatible".to_string())?;
    let evidence_status = status(
        &value,
        "/evidence_status",
        &[
            "not-observed",
            "verified",
            "corrupt",
            "unavailable",
            "registry-invalid",
        ],
    )
    .map_err(|_| "evolution.observation-incompatible".to_string())?;
    let observed = value
        .get("observed_at_unix_ms")
        .and_then(Value::as_u64)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    if now.saturating_sub(observed) > 5000 || observed > now.saturating_add(1000) {
        return Err("evolution.observation-stale".into());
    }
    let raw_definitions = value
        .get("definitions")
        .and_then(Value::as_array)
        .filter(|items| items.len() <= 5)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let definitions = raw_definitions
        .iter()
        .map(|item| {
            Ok(EvolutionDefinition {
                definition_ref: evolution_text(item, "definition_ref", 128)?,
                cycle_kind: evolution_text(item, "cycle_kind", 128)?,
                admission_status: evolution_text(item, "admission_status", 32)?,
                admitted: item
                    .get("admitted")
                    .and_then(Value::as_bool)
                    .ok_or("evolution.observation-incompatible".to_string())?,
                enabled: item
                    .get("enabled")
                    .and_then(Value::as_bool)
                    .ok_or("evolution.observation-incompatible".to_string())?,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let raw_cycles = value
        .get("cycles")
        .and_then(Value::as_array)
        .filter(|items| items.len() <= 24)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let cycles = raw_cycles
        .iter()
        .map(|item| {
            let recent_event_types = item
                .get("recent_event_types")
                .and_then(Value::as_array)
                .filter(|events| events.len() <= 8)
                .ok_or("evolution.observation-incompatible".to_string())?
                .iter()
                .map(|event| {
                    event
                        .as_str()
                        .filter(|text| !text.is_empty() && text.len() <= 128)
                        .map(str::to_string)
                        .ok_or("evolution.observation-incompatible".to_string())
                })
                .collect::<Result<Vec<_>, String>>()?;
            let event_count = item
                .get("event_count")
                .and_then(Value::as_u64)
                .ok_or("evolution.observation-incompatible".to_string())?;
            let events_truncated = item
                .get("events_truncated")
                .and_then(Value::as_bool)
                .ok_or("evolution.observation-incompatible".to_string())?;
            if event_count < recent_event_types.len() as u64
                || (event_count > recent_event_types.len() as u64) != events_truncated
                || (event_count == 0) != recent_event_types.is_empty()
            {
                return Err("evolution.observation-incompatible".into());
            }
            let last_event_type = evolution_optional_text(item, "last_event_type")?;
            if last_event_type.as_deref() != recent_event_types.last().map(String::as_str) {
                return Err("evolution.observation-incompatible".into());
            }
            Ok(EvolutionCycle {
                cycle_ref: evolution_text(item, "cycle_ref", 256)?,
                cycle_definition_ref: evolution_text(item, "cycle_definition_ref", 128)?,
                event_revision: item
                    .get("event_revision")
                    .and_then(Value::as_u64)
                    .ok_or("evolution.observation-incompatible".to_string())?,
                last_event_type,
                derived_disposition: evolution_optional_text(item, "derived_disposition")?,
                event_count,
                recent_event_types,
                events_truncated,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let reason_codes = value
        .get("reason_codes")
        .and_then(Value::as_array)
        .filter(|items| items.len() <= 8)
        .ok_or("evolution.observation-incompatible".to_string())?
        .iter()
        .map(|code| {
            code.as_str()
                .filter(|text| !text.is_empty() && text.len() <= 128)
                .map(str::to_string)
                .ok_or("evolution.observation-incompatible".to_string())
        })
        .collect::<Result<Vec<_>, String>>()?;
    let commit_count = value
        .get("commit_count")
        .and_then(Value::as_u64)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let cycle_count = value
        .get("cycle_count")
        .and_then(Value::as_u64)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let cycles_truncated = value
        .get("cycles_truncated")
        .and_then(Value::as_bool)
        .ok_or("evolution.observation-incompatible".to_string())?;
    if cycle_count < cycles.len() as u64 || (cycle_count > 24) != cycles_truncated {
        return Err("evolution.observation-incompatible".into());
    }
    let coordination_summary = match value.get("coordination_summary") {
        Some(Value::Null) if evidence_status != "verified" => None,
        Some(Value::Object(summary)) if evidence_status == "verified" => {
            let counts = summary.get("work_state_counts")
                .and_then(Value::as_object)
                .ok_or("evolution.observation-incompatible".to_string())?;
            if summary.len() != 2 || counts.len() != 5 {
                return Err("evolution.observation-incompatible".into());
            }
            let read_count = |key: &str| -> Result<u64, String> {
                counts.get(key).and_then(Value::as_u64)
                    .filter(|count| *count <= 1_000_000)
                    .ok_or("evolution.observation-incompatible".to_string())
            };
            let phase_count = summary.get("phase_count").and_then(Value::as_u64)
                .filter(|count| *count <= 1_000_000)
                .ok_or("evolution.observation-incompatible".to_string())?;
            Some(EvolutionCoordinationSummary {
                phase_count,
                work_state_counts: EvolutionWorkStateCounts {
                    planned: read_count("planned")?,
                    ready: read_count("ready")?,
                    leased: read_count("leased")?,
                    completed: read_count("completed")?,
                    blocked: read_count("blocked")?,
                },
            })
        }
        _ => return Err("evolution.observation-incompatible".into()),
    };
    let phase_rows = value.get("phase_summaries")
        .and_then(Value::as_array)
        .filter(|rows| rows.len() <= 8)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let phase_summaries_truncated = value.get("phase_summaries_truncated")
        .and_then(Value::as_bool)
        .ok_or("evolution.observation-incompatible".to_string())?;
    let phase_count = coordination_summary.as_ref().map(|summary| summary.phase_count).unwrap_or(0);
    if phase_rows.len() as u64 != phase_count.min(8)
        || phase_summaries_truncated != (phase_count > 8) {
        return Err("evolution.observation-incompatible".into());
    }
    let phase_summaries = phase_rows.iter().map(|row| {
        let counts = row.get("work_state_counts")
            .and_then(Value::as_object)
            .filter(|counts| counts.len() == 5)
            .ok_or("evolution.observation-incompatible".to_string())?;
        let read_count = |key: &str| -> Result<u64, String> {
            counts.get(key).and_then(Value::as_u64)
                .filter(|count| *count <= 1_000_000)
                .ok_or("evolution.observation-incompatible".to_string())
        };
        let cycle_ref = evolution_optional_text(row, "cycle_ref")?;
        if cycle_ref.as_ref().is_some_and(|reference| !cycles.iter().any(|cycle| &cycle.cycle_ref == reference)) {
            return Err("evolution.observation-incompatible".into());
        }
        let event_count = row.get("event_count").and_then(Value::as_u64)
            .filter(|count| *count > 0 && *count <= 1_000_000)
            .ok_or("evolution.observation-incompatible".to_string())?;
        Ok(EvolutionPhaseSummary {cycle_ref, phase: evolution_text(row, "phase", 256)?,
            event_count, work_state_counts: EvolutionWorkStateCounts {
                planned: read_count("planned")?, ready: read_count("ready")?,
                leased: read_count("leased")?, completed: read_count("completed")?,
                blocked: read_count("blocked")?,
            }})
    }).collect::<Result<Vec<_>, String>>()?;
    if let Some(summary) = coordination_summary.as_ref() {
        let projected = phase_summaries.iter().fold([0_u64; 5], |mut sum, phase| {
            let counts = &phase.work_state_counts;
            for (slot, value) in sum.iter_mut().zip([
                counts.planned, counts.ready, counts.leased, counts.completed, counts.blocked,
            ]) { *slot += value; }
            sum
        });
        let aggregate = [summary.work_state_counts.planned, summary.work_state_counts.ready,
            summary.work_state_counts.leased, summary.work_state_counts.completed,
            summary.work_state_counts.blocked];
        if (summary.phase_count <= 8 && projected != aggregate)
            || projected.iter().zip(aggregate.iter()).any(|(part, total)| part > total) {
            return Err("evolution.observation-incompatible".into());
        }
    }
    let projection_digest = match value.get("projection_digest") {
        Some(Value::Null) => None,
        Some(Value::String(text))
            if text.len() == 64 && text.bytes().all(|b| b.is_ascii_hexdigit()) =>
        {
            Some(text.clone())
        }
        _ => return Err("evolution.observation-incompatible".into()),
    };
    let operational_index_status = status(
        &value,
        "/operational_index_status",
        if evidence_status == "verified" {
            &["healthy", "rebuild-required", "unavailable"]
        } else {
            &["not-observed"]
        },
    )
    .map_err(|_| "evolution.observation-incompatible".to_string())?;
    if root.is_none()
        && (evidence_status != "not-observed" && evidence_status != "registry-invalid"
            || !cycles.is_empty()
            || cycle_count != 0
            || commit_count != 0
            || cycles_truncated
            || projection_digest.is_some())
    {
        return Err("evolution.observation-incompatible".into());
    }
    Ok(EvolutionSnapshot {
        schema_version: "are.companion-evolution-observation/v1",
        source: expected_source,
        root_status,
        evidence_status,
        observed_at_unix_ms: observed,
        definitions,
        cycles,
        commit_count,
        cycle_count,
        cycles_truncated,
        coordination_summary,
        phase_summaries,
        phase_summaries_truncated,
        projection_digest,
        operational_index_status,
        reason_codes,
        authority_effect: "none",
    })
}

fn valid_evolution_signal_rows(raw: &[Value], count: u64, truncated: bool) -> bool {
    let mut seen = std::collections::HashSet::new();
    raw.len() as u64 == count.min(16) && truncated == (count > 16)
        && raw.iter().all(|item| {
            let Some(row) = item.as_object() else { return false; };
            let Some(digest) = row.get("record_digest").and_then(Value::as_str) else { return false; };
            row.len() == 2 && row.get("kind").and_then(Value::as_str) == Some("semantic-evaluation-blocked")
                && digest.len() == 64 && digest.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
                && seen.insert(digest)
        })
}

#[tauri::command]
async fn get_evolution_signal_snapshot(app: AppHandle) -> Result<EvolutionSignalSnapshot, String> {
    let log = std::env::var("ARE_COMPANION_EVOLUTION_SIGNAL_LOG")
        .map_err(|_| "evolution.signals-not-configured".to_string())?;
    if !std::path::Path::new(&log).is_absolute() {
        return Err("evolution.signals-not-configured".into());
    }
    let (node, entry) = backend_paths(&app)?;
    if !node.is_file() || !entry.is_file() {
        return Err("evolution.runtime-missing".into());
    }
    let observer = entry
        .parent()
        .and_then(std::path::Path::parent)
        .ok_or("evolution.runtime-missing".to_string())?
        .join("packages/evolution-runtime/bin/observe-gateway-signals.mjs");
    if !observer.is_file() {
        return Err("evolution.runtime-missing".into());
    }
    let output = run_bounded(
        node,
        observer,
        &["--json", "--log", &log],
        EVOLUTION_TIMEOUT,
        EVOLUTION_MAX_BYTES,
    )
    .await
    .map_err(|_| "evolution.signals-unavailable".to_string())?;
    let value: Value = serde_json::from_slice(&output)
        .map_err(|_| "evolution.signals-incompatible".to_string())?;
    if value.get("schema_version").and_then(Value::as_str)
        != Some("are.gateway-evolution-signal-observation/v1")
        || value.get("evidence_status").and_then(Value::as_str) != Some("verified")
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
        || value
            .get("reason_codes")
            .and_then(Value::as_array)
            .is_none_or(|items| !items.is_empty())
    {
        return Err("evolution.signals-unavailable".into());
    }
    let observed = value
        .get("observed_at_unix_ms")
        .and_then(Value::as_u64)
        .ok_or("evolution.signals-incompatible".to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    if now.saturating_sub(observed) > 5000 || observed > now.saturating_add(1000) {
        return Err("evolution.signals-stale".into());
    }
    let count = value
        .get("candidate_count")
        .and_then(Value::as_u64)
        .ok_or("evolution.signals-incompatible".to_string())?;
    let raw = value
        .get("candidates")
        .and_then(Value::as_array)
        .filter(|items| items.len() <= 16)
        .ok_or("evolution.signals-incompatible".to_string())?;
    let truncated = value.get("candidates_truncated").and_then(Value::as_bool)
        .ok_or("evolution.signals-incompatible".to_string())?;
    if !valid_evolution_signal_rows(raw, count, truncated) {
        return Err("evolution.signals-incompatible".into());
    }
    let candidates = raw
        .iter()
        .map(|item| {
            let digest = evolution_text(item, "record_digest", 64)?;
            if digest.len() != 64
                || !digest.bytes().all(|byte| byte.is_ascii_hexdigit())
                || item.get("kind").and_then(Value::as_str) != Some("semantic-evaluation-blocked")
            {
                return Err("evolution.signals-incompatible".into());
            }
            Ok(EvolutionSignalCandidate {
                record_digest: digest,
                kind: "semantic-evaluation-blocked",
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let log_digest = evolution_text(&value, "log_digest", 64)?;
    if log_digest.len() != 64 || !log_digest.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err("evolution.signals-incompatible".into());
    }
    Ok(EvolutionSignalSnapshot {
        schema_version: "are.companion-evolution-signal-observation/v1",
        source: "gateway-candidate-inbox",
        evidence_status: "verified",
        observed_at_unix_ms: observed,
        candidate_count: count,
        candidates,
        candidates_truncated: truncated,
        log_digest,
        authority_effect: "none",
    })
}

fn start_orb_owned_stdin(app: AppHandle) {
    std::thread::spawn(move || {
        let mut input = std::io::stdin().lock();
        let mut command = [0u8; 16];
        let mut used = 0;
        let mut overflow = false;
        loop {
            let mut byte = [0u8; 1];
            match input.read(&mut byte) {
                Ok(0) => break,
                Ok(_) if byte[0] == b'\n' => {
                    if !overflow && &command[..used] == b"focus" {
                        let focus_app = app.clone();
                        let _ = app.run_on_main_thread(move || {
                            let _ = show_dashboard(&focus_app);
                        });
                    }
                    used = 0;
                    overflow = false;
                }
                Ok(_) if used < command.len() && !overflow => {
                    command[used] = byte[0];
                    used += 1;
                }
                Ok(_) => overflow = true,
                Err(error) if error.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(_) => break,
            }
        }
        app.exit(0);
    });
}

fn main() {
    let arguments: Vec<_> = std::env::args_os().skip(1).collect();
    let native_orb = arguments.iter().any(|argument| argument == "--native-orb");
    let webview_orb = arguments.iter().any(|argument| argument == "--webview-orb");
    let dashboard_only = arguments.iter().any(|argument| argument == "--dashboard-only");
    let orb_owned_stdin = arguments.iter().any(|argument| argument == "--orb-owned-stdin");
    if (native_orb || webview_orb) && arguments.len() != 1 {
        eprintln!("Orb startup modes cannot be combined with other arguments");
        std::process::exit(2);
    }
    if native_orb || arguments.is_empty() {
        #[cfg(any(windows, target_os = "linux"))]
        {
            let executable = std::env::current_exe().expect("ARE Companion executable path is unavailable");
            let orb_name = if cfg!(windows) { "are-native-orb.exe" } else { "are-native-orb" };
            let orb = executable
                .parent()
                .expect("ARE Companion executable has no parent directory")
                .join("native-orb")
                .join(orb_name);
            if !orb.is_file() && native_orb {
                eprintln!("Bundled native orb is unavailable: {}", orb.display());
                std::process::exit(2);
            }
            if orb.is_file() {
                if let Err(error) = Command::new(&orb)
                    .arg("--dashboard")
                    .arg(&executable)
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
                {
                    eprintln!("Bundled native orb could not start: {error}");
                    std::process::exit(2);
                }
                return;
            }
        }
        #[cfg(not(any(windows, target_os = "linux")))]
        {
            if native_orb {
                eprintln!("Bundled native orb launch is unsupported on this operating system");
                std::process::exit(2);
            }
        }
    }
    if orb_owned_stdin && !dashboard_only {
        eprintln!("--orb-owned-stdin requires --dashboard-only");
        std::process::exit(2);
    }
    tauri::Builder::default()
        .setup(move |app| {
            let preferences = read_preferences(app.handle());
            app.manage(CompanionState {
                preferences: Mutex::new(preferences.clone()),
                orb_owned_stdin,
            });
            if dashboard_only {
                show_dashboard(app.handle())?;
                if orb_owned_stdin {
                    if let Err(error) = send_owned_orb_skin(&preferences.skin) {
                        eprintln!("Native orb initial skin update failed: {error}");
                    }
                    if let Ok(target) = native_orb_position(app.handle(), &preferences.orb_placement) {
                        if let Err(error) = send_owned_orb_position(target) {
                            eprintln!("Native orb initial placement request failed: {error}");
                        }
                    }
                    start_orb_owned_stdin(app.handle().clone());
                }
            } else {
                let orb_config = app
                    .config()
                    .app
                    .windows
                    .iter()
                    .find(|window| window.label == "orb")
                    .expect("ARE Companion orb configuration is required");
                WebviewWindowBuilder::from_config(app, orb_config)?.build()?;
                let _ = place_orb(app.handle(), &preferences.orb_placement);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_preferences,
            restore_orb_placement,
            set_skin,
            set_orb_placement,
            open_dashboard,
            start_orb_drag,
            set_orb_memory_target,
            get_snapshot,
            get_adapter_snapshot,
            get_adapter_inventory,
            get_thread_snapshot,
            get_hosted_rejoin_snapshot,
            get_decision_snapshot,
            get_evolution_snapshot,
            get_evolution_signal_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("run ARE Companion");
}

#[cfg(test)]
mod evolution_signal_contract_tests {
    use super::valid_evolution_signal_rows;
    use serde_json::json;

    #[test]
    fn signal_rows_require_exact_counts_and_closed_distinct_digests() {
        let row = json!({"record_digest": "a".repeat(64), "kind": "semantic-evaluation-blocked"});
        assert!(valid_evolution_signal_rows(&[], 0, false));
        assert!(valid_evolution_signal_rows(&[row.clone()], 1, false));
        assert!(!valid_evolution_signal_rows(&[row.clone()], 2, false));
        assert!(!valid_evolution_signal_rows(&[row.clone()], 1, true));
        assert!(!valid_evolution_signal_rows(&[row.clone(), row.clone()], 2, false));
        let mut extra = row.clone(); extra["prompt"] = json!("private");
        assert!(!valid_evolution_signal_rows(&[extra], 1, false));
        assert!(!valid_evolution_signal_rows(&[json!(null)], 1, false));
        let uppercase = json!({"record_digest": "A".repeat(64), "kind": "semantic-evaluation-blocked"});
        assert!(!valid_evolution_signal_rows(&[uppercase], 1, false));
        let bounded: Vec<_> = (0..16).map(|n| json!({"record_digest": format!("{n:064x}"),
            "kind": "semantic-evaluation-blocked"})).collect();
        assert!(valid_evolution_signal_rows(&bounded, 17, true));
        assert!(!valid_evolution_signal_rows(&bounded, 17, false));
        assert!(!valid_evolution_signal_rows(&bounded[..15], 17, true));
    }

    #[test]
    fn learning_feedback_is_closed_and_withdraws_unavailable_counts() {
        let value = json!({"schema_version": "are.learning-feedback-observation/v1", "source": "learning-owner",
            "binding_ref": "a".repeat(64), "status": "observed", "mode": "off", "durability": "append-only-file-fsync",
            "state_digest": "b".repeat(64), "checkpoint_digest": "c".repeat(64), "pending_feedback_count": 2,
            "retained_lesson_count": 1, "disabled_lesson_count": 0, "dispatched_application_count": 3,
            "evaluated_application_count": 1, "authority_effect": "none", "observation_digest": "d".repeat(64)});
        assert_eq!(super::project_learning_feedback(None).unwrap(), serde_json::Value::Null);
        assert_eq!(super::project_learning_feedback(Some(&value)).unwrap(), value);
        for (key, replacement) in [("pending_feedback_count", json!(-1)), ("evaluated_application_count", json!(4)),
            ("disabled_lesson_count", json!(2)), ("checkpoint_digest", json!(null)), ("binding_ref", json!("A".repeat(64))),
            ("status", json!("disabled")), ("prompt", json!("private"))] {
            let mut invalid = value.clone(); invalid[key] = replacement;
            assert!(super::project_learning_feedback(Some(&invalid)).is_err());
        }
        let mut unavailable = value.clone(); unavailable["status"] = json!("unavailable");
        for key in ["mode", "durability", "state_digest", "checkpoint_digest", "pending_feedback_count",
            "retained_lesson_count", "disabled_lesson_count", "dispatched_application_count", "evaluated_application_count"] {
            unavailable[key] = serde_json::Value::Null;
        }
        assert!(super::project_learning_feedback(Some(&unavailable)).is_ok());
    }
}

#[cfg(test)]
mod adapter_inventory_tests {
    use super::parse_additional_observation_sockets;

    #[test]
    fn inventory_config_accepts_bounded_distinct_local_sources() {
        let (first, third, selected) = if cfg!(windows) {
            ("\\\\.\\pipe\\are-dsh", "\\\\.\\pipe\\are-gateway", "\\\\.\\pipe\\are-selected")
        } else {
            ("/private/dsh.sock", "/private/gateway.sock", "/private/selected.sock")
        };
        let config = serde_json::json!([
            {"socket": first, "tokenEnv": "ARE_COMPANION_ADAPTER_TOKEN_DSH"},
            "tcp://127.0.0.1:4500", third,
        ]).to_string();
        let sockets = parse_additional_observation_sockets(
            &config, Some(selected),
        ).unwrap();
        assert_eq!(sockets.len(), 3);
        assert_eq!(sockets[0].socket, first);
        assert_eq!(sockets[0].token_env.as_deref(), Some("ARE_COMPANION_ADAPTER_TOKEN_DSH"));
        assert_eq!(sockets[1].token_env, None);
        assert_eq!(sockets[2].socket, third);
        let duplicate = serde_json::json!([first, first]).to_string();
        assert!(parse_additional_observation_sockets(&duplicate, Some(selected)).is_err());
        let mixed_duplicate = serde_json::json!([first, {"socket": first, "tokenEnv": "ARE_COMPANION_ADAPTER_TOKEN_DSH"}]).to_string();
        assert!(parse_additional_observation_sockets(&mixed_duplicate, Some(selected)).is_err());
        let selected_duplicate = serde_json::json!([selected]).to_string();
        assert!(parse_additional_observation_sockets(&selected_duplicate, Some(selected)).is_err());
        if cfg!(windows) {
            let case_duplicate = serde_json::json!(["\\\\.\\pipe\\ARE-DSH", "\\\\.\\pipe\\are-dsh"]).to_string();
            assert!(parse_additional_observation_sockets(&case_duplicate, None).is_err());
        }
        for invalid_object in [
            serde_json::json!({"socket": first}),
            serde_json::json!({"socket": first, "tokenEnv": "PATH"}),
            serde_json::json!({"socket": first, "tokenEnv": "ARE_COMPANION_ADAPTER_TOKEN_"}),
            serde_json::json!({"socket": first, "tokenEnv": "ARE_COMPANION_ADAPTER_TOKEN_dsh"}),
            serde_json::json!({"socket": first, "tokenEnv": "ARE_COMPANION_ADAPTER_TOKEN_DSH", "token": "secret"}),
        ] {
            assert!(parse_additional_observation_sockets(&serde_json::json!([invalid_object]).to_string(), Some(selected)).is_err());
        }
        for invalid in [
            r#"["tcp://0.0.0.0:4500"]"#,
            r#"["tcp://127.0.0.1:0"]"#,
            r#"["tcp://127.0.0.1:70000"]"#,
            r#"["\\\\remote\\pipe\\are-gateway"]"#,
            r#"["\\\\.\\pipe\\are/gateway"]"#,
            r#"["relative.sock"]"#,
            r#"["/1","/2","/3","/4","/5"]"#,
        ] {
            assert!(parse_additional_observation_sockets(invalid, Some(selected)).is_err());
        }
    }
}

#[cfg(test)]
mod dsh_checkpoint_tests {
    use super::{parse_dsh_objective_checkpoint_summary, parse_dsh_interpretation_summary, parse_dsh_plan_progress, parse_dsh_plan_head_summary};

    #[test]
    fn plan_head_keeps_checkpoint_source_and_startup_postures_separate() {
        let value = serde_json::json!({"schema_version": "are.dsh-plan-head-summary/v1", "status": "checkpoint-retained",
            "checkpoint_digest": "a".repeat(64), "plan_context_digest": "b".repeat(64), "sources": "unverified-at-read",
            "selection_relation": "different-from-startup", "plan_progress": {"schema_version": "are.dsh-plan-progress/v1",
            "posture": "checkpointed-declaration", "obligation_count": 30, "completed_count": 3, "open_count": 25,
            "active_count": 1, "deferred_count": 1, "open_decision_count": 7, "active_slice_ordinal": 4, "active_slice_status": "active"}});
        let projected = serde_json::to_value(parse_dsh_plan_head_summary(&value).unwrap()).unwrap();
        assert_eq!(projected["sources"], "unverified-at-read");
        assert_eq!(projected["selectionRelation"], "different-from-startup");
        assert_eq!(projected["planProgress"]["obligationCount"], 30);
        assert_eq!(projected.as_object().unwrap().len(), 7);
        for (key, replacement) in [("status", serde_json::json!("unavailable")), ("sources", serde_json::json!("healthy")),
            ("selection_relation", serde_json::json!("advanced")), ("checkpoint_digest", serde_json::Value::Null),
            ("plan_progress", serde_json::Value::Null), ("prompt", serde_json::json!("private"))] {
            let mut changed = value.clone(); changed[key] = replacement;
            assert!(parse_dsh_plan_head_summary(&changed).is_err());
        }
        for status in ["not-retained", "unavailable"] {
            let empty = serde_json::json!({"schema_version": "are.dsh-plan-head-summary/v1", "status": status,
                "checkpoint_digest": null, "plan_context_digest": null, "plan_progress": null,
                "sources": "not-checked", "selection_relation": "not-checked"});
            assert!(parse_dsh_plan_head_summary(&empty).is_ok());
            let mut changed = empty.clone(); changed["plan_progress"] = value["plan_progress"].clone();
            assert!(parse_dsh_plan_head_summary(&changed).is_err());
        }
    }

    #[test]
    fn plan_progress_is_bounded_declared_and_content_free() {
        let value = serde_json::json!({"schema_version": "are.dsh-plan-progress/v1", "posture": "checkpointed-declaration",
            "obligation_count": 30, "completed_count": 3, "open_count": 25, "active_count": 1, "deferred_count": 1,
            "open_decision_count": 7, "active_slice_ordinal": 4, "active_slice_status": "active"});
        let projected = serde_json::to_value(parse_dsh_plan_progress(&value).unwrap()).unwrap();
        assert_eq!(projected["obligationCount"], 30);
        assert_eq!(projected["activeSliceOrdinal"], 4);
        assert_eq!(projected.as_object().unwrap().len(), 10);
        let checkpoint = serde_json::json!({"schema_version": "are.dsh-objective-checkpoint-summary/v3",
            "status": "host-retained-reference", "checkpoint_digest": "a".repeat(64), "objective_state_digest": "b".repeat(64),
            "binding_digest": "c".repeat(64), "requirements": "continuity-reference-retained",
            "plan_context_digest": "d".repeat(64), "plan_progress": value});
        assert_eq!(serde_json::to_value(parse_dsh_objective_checkpoint_summary(&checkpoint).unwrap()).unwrap()["planProgress"], projected);
        let interpretation = serde_json::json!({"schema_version": "are.dsh-objective-interpretation-summary/v2",
            "status": "checkpoint-retained-no-admission-retained", "checkpoint_digest": "a".repeat(64),
            "objective_state_digest": "b".repeat(64), "requirements": "continuity-reference-retained",
            "plan_context_digest": "d".repeat(64), "plan_progress": value});
        assert_eq!(serde_json::to_value(parse_dsh_interpretation_summary(&interpretation).unwrap()).unwrap()["planProgress"], projected);
        for (key, replacement) in [("plan_context_digest", serde_json::Value::Null),
            ("requirements", serde_json::json!("not-selected")),
            ("schema_version", serde_json::json!("are.dsh-objective-interpretation-summary/v1")),
            ("plan_progress", serde_json::json!({"prompt": "private"}))] {
            let mut changed = interpretation.clone(); changed[key] = replacement;
            assert!(parse_dsh_interpretation_summary(&changed).is_err());
        }
        for (key, replacement) in [("completed_count", serde_json::json!(31)), ("open_decision_count", serde_json::json!(33)),
            ("active_slice_ordinal", serde_json::json!(0)), ("active_slice_status", serde_json::json!("completed")),
            ("posture", serde_json::json!("verified-completion")), ("prompt", serde_json::json!("private"))] {
            let mut changed = value.clone(); changed[key] = replacement;
            assert!(parse_dsh_plan_progress(&changed).is_err());
        }
    }

    #[test]
    fn interpretation_summary_never_claims_admission_rejection_or_execution() {
        let value = serde_json::json!({
            "schema_version": "are.dsh-objective-interpretation-summary/v1",
            "status": "checkpoint-retained-no-admission-retained", "checkpoint_digest": "a".repeat(64),
            "objective_state_digest": "b".repeat(64), "requirements": "continuity-reference-retained",
            "plan_context_digest": null,
        });
        let projected = serde_json::to_value(parse_dsh_interpretation_summary(&value).unwrap()).unwrap();
        assert_eq!(projected["planContextDigest"], serde_json::Value::Null);
        assert_eq!(projected["checkpointDigest"], "a".repeat(64));
        assert_eq!(projected.as_object().unwrap().len(), 6);
        let mut selected = value.clone();
        selected["plan_context_digest"] = serde_json::json!("c".repeat(64));
        assert!(parse_dsh_interpretation_summary(&selected).is_ok());
        for (key, replacement) in [
            ("status", serde_json::json!("rejected")),
            ("checkpoint_digest", serde_json::json!("A".repeat(64))),
            ("plan_context_digest", serde_json::json!(["c".repeat(64)])),
            ("requirements", serde_json::json!("completed")),
            ("prompt", serde_json::json!("private")),
        ] {
            let mut invalid = value.clone(); invalid[key] = replacement;
            assert!(parse_dsh_interpretation_summary(&invalid).is_err());
        }
        selected.as_object_mut().unwrap().remove("plan_context_digest");
        assert!(parse_dsh_interpretation_summary(&selected).is_err());
    }

    #[test]
    fn summary_is_closed_content_free_and_serializes_for_the_dashboard() {
        let value = serde_json::json!({
            "schema_version": "are.dsh-objective-checkpoint-summary/v1",
            "status": "host-retained-reference", "checkpoint_digest": "a".repeat(64),
            "objective_state_digest": "b".repeat(64), "binding_digest": "c".repeat(64),
            "requirements": "not-selected",
        });
        let parsed = parse_dsh_objective_checkpoint_summary(&value).unwrap();
        let projected = serde_json::to_value(parsed).unwrap();
        assert_eq!(projected["checkpointDigest"], "a".repeat(64));
        assert_eq!(projected["objectiveStateDigest"], "b".repeat(64));
        assert_eq!(projected["schemaVersion"], "are.dsh-objective-checkpoint-summary/v1");
        assert_eq!(projected.as_object().unwrap().len(), 6);
        for (key, replacement) in [
            ("status", serde_json::json!("executing")),
            ("checkpoint_digest", serde_json::json!("A".repeat(64))),
            ("binding_digest", serde_json::Value::Null),
            ("requirements", serde_json::json!("plan-completed")),
            ("private_prompt", serde_json::json!("must not pass")),
        ] {
            let mut invalid = value.clone();
            invalid[key] = replacement;
            assert!(parse_dsh_objective_checkpoint_summary(&invalid).is_err());
        }
        let mut selected = value.clone();
        selected["requirements"] = serde_json::json!("continuity-reference-retained");
        assert!(parse_dsh_objective_checkpoint_summary(&selected).is_ok());
        selected["schema_version"] = serde_json::json!("are.dsh-objective-checkpoint-summary/v2");
        selected["plan_context_digest"] = serde_json::json!("d".repeat(64));
        let projected = serde_json::to_value(parse_dsh_objective_checkpoint_summary(&selected).unwrap()).unwrap();
        assert_eq!(projected["planContextDigest"], "d".repeat(64));
        assert_eq!(projected.as_object().unwrap().len(), 7);
        for replacement in [serde_json::Value::Null, serde_json::json!("D".repeat(64)), serde_json::json!("private plan")] {
            let mut invalid = selected.clone();
            invalid["plan_context_digest"] = replacement;
            assert!(parse_dsh_objective_checkpoint_summary(&invalid).is_err());
        }
        let mut invalid = selected.clone();
        invalid["schema_version"] = serde_json::json!("are.dsh-objective-checkpoint-summary/v1");
        assert!(parse_dsh_objective_checkpoint_summary(&invalid).is_err());
        selected.as_object_mut().unwrap().remove("plan_context_digest");
        assert!(parse_dsh_objective_checkpoint_summary(&selected).is_err());
        let mut missing = value.clone();
        missing.as_object_mut().unwrap().remove("binding_digest");
        assert!(parse_dsh_objective_checkpoint_summary(&missing).is_err());
    }
}

#[cfg(test)]
mod placement_tests {
    use super::placement_position;
    use tauri::{PhysicalPosition, PhysicalRect, PhysicalSize};

    #[test]
    fn presets_use_the_monitor_work_area_and_orb_size() {
        let area = PhysicalRect {
            position: PhysicalPosition::new(100, 200),
            size: PhysicalSize::new(1000, 800),
        };
        assert_eq!(placement_position(&area, 1.0, 84, 84, "top-left").unwrap().x, 116);
        assert_eq!(placement_position(&area, 1.0, 84, 84, "top-left").unwrap().y, 216);
        assert_eq!(placement_position(&area, 1.0, 84, 84, "bottom-right").unwrap().x, 1000);
        assert_eq!(placement_position(&area, 1.0, 84, 84, "bottom-right").unwrap().y, 900);
        assert_eq!(placement_position(&area, 1.0, 84, 84, "center").unwrap().x, 558);
        assert_eq!(placement_position(&area, 1.0, 84, 84, "center").unwrap().y, 558);
        assert!(placement_position(&area, 1.0, 84, 84, "unknown").is_err());
    }

    #[test]
    fn presets_clamp_within_small_or_negative_monitor_areas() {
        let area = PhysicalRect {
            position: PhysicalPosition::new(-900, -500),
            size: PhysicalSize::new(60, 60),
        };
        let point = placement_position(&area, 2.0, 84, 84, "bottom-right").unwrap();
        assert_eq!((point.x, point.y), (-900, -500));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn native_presets_require_matching_x11_orb_and_dashboard() {
        use super::linux_native_orb_x11_environment;
        assert!(linux_native_orb_x11_environment("x11", "x11", ":0"));
        assert!(!linux_native_orb_x11_environment("x11", "wayland", ":0"));
        assert!(!linux_native_orb_x11_environment("wayland", "x11", ":0"));
        assert!(!linux_native_orb_x11_environment("x11", "x11", ""));
    }
}

#[cfg(test)]
mod adapter_ingress_tests {
    use super::{managed_guarded_plan_input_status, managed_model_entry_boundary, model_entry_ingress};
    use serde_json::json;

    #[test]
    fn gateway_pause_takes_precedence_over_launch_declaration() {
        let paused = json!({"model_entry_ingress": {
            "status": "paused", "reason_code": "windows-client.hook-boundary-unverified"}});
        assert_eq!(model_entry_ingress(&paused, false).unwrap(),
            ("paused", "gateway-in-process", Some("windows-client.hook-boundary-unverified")));
        assert_eq!(model_entry_ingress(&paused, true).unwrap(),
            ("paused", "gateway-in-process", Some("windows-client.hook-boundary-unverified")));
    }

    #[test]
    fn legacy_gateway_retains_only_launch_declaration() {
        assert_eq!(model_entry_ingress(&json!({}), true).unwrap(),
            ("paused", "launch-environment", Some("windows-client.hook-boundary-unverified")));
        assert_eq!(model_entry_ingress(&json!({}), false).unwrap(), ("unknown", "none", None));
    }

    #[test]
    fn gateway_and_launcher_disagreement_is_incompatible() {
        let open = json!({"model_entry_ingress": {"status": "not-paused", "reason_code": null}});
        assert_eq!(model_entry_ingress(&open, false).unwrap(), ("not-paused", "gateway-in-process", None));
        assert!(model_entry_ingress(&open, true).is_err());
        assert!(model_entry_ingress(&json!({"model_entry_ingress": {
            "status": "paused", "reason_code": null}}), false).is_err());
    }

    #[test]
    fn guarded_text_declaration_requires_gateway_model_entry_open() {
        assert_eq!(managed_model_entry_boundary("not-paused", true).unwrap(),
            "guarded-text-only-candidate");
        assert_eq!(managed_model_entry_boundary("not-paused", false).unwrap(), "unverified");
        assert!(managed_model_entry_boundary("paused", true).is_err());
        assert!(managed_model_entry_boundary("unknown", true).is_err());
    }

    #[test]
    fn guarded_plan_input_is_only_a_bound_launch_declaration() {
        assert_eq!(managed_guarded_plan_input_status(None, "unverified", "unknown").unwrap(),
            "not-declared");
        assert_eq!(managed_guarded_plan_input_status(Some("launch-declared-candidate/v1"),
            "guarded-text-only-candidate", "parent-heartbeat-observed").unwrap(),
            "launch-declared-candidate");
        assert_eq!(managed_guarded_plan_input_status(Some("launch-declared-candidate/v1"),
            "guarded-text-only-candidate", "not-observed").unwrap(),
            "launch-declared-candidate");
        assert!(managed_guarded_plan_input_status(Some("launch-declared-candidate/v1"),
            "unverified", "parent-heartbeat-observed").is_err());
        assert!(managed_guarded_plan_input_status(Some("launch-declared-candidate/v1"),
            "guarded-text-only-candidate", "not-declared").is_err());
        assert!(managed_guarded_plan_input_status(Some("unexpected"),
            "guarded-text-only-candidate", "parent-heartbeat-observed").is_err());
    }
}
