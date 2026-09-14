use axum::extract::{Path as AxumPath, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post, put};
use axum::{Json, Router};
use cyberalchemy_orchestrator_runtime::{
    AcceptOutcome, EffectDisposition, OrchestratorRuntime, WorkerApi, WorkerRequest,
};
use orchestrator_capabilities::{DispatchProposal, RunTemplate, Strategy, StrategyTemplate};
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone, Debug, PartialEq, serde::Serialize)]
pub struct CatalogImport {
    pub strategy_templates: usize,
    pub run_templates: usize,
}

#[derive(Clone, Debug)]
pub struct GatewayConfig {
    pub socket_path: Option<PathBuf>,
    pub profile_ref: Option<String>,
}

#[derive(Clone, Debug)]
pub struct ApiState {
    runtime: OrchestratorRuntime,
    data_root: PathBuf,
    gateway: GatewayConfig,
}

impl ApiState {
    pub fn open(
        data_root: impl Into<PathBuf>,
        max_active_assignments: usize,
        gateway: GatewayConfig,
    ) -> Result<Self, String> {
        let data_root = data_root.into();
        fs::create_dir_all(data_root.join("proposals"))
            .map_err(|error| format!("API_PROPOSAL_ROOT_CREATE:{error}"))?;
        fs::create_dir_all(data_root.join("templates"))
            .map_err(|error| format!("API_TEMPLATE_ROOT_CREATE:{error}"))?;
        fs::create_dir_all(data_root.join("run-templates"))
            .map_err(|error| format!("API_RUN_TEMPLATE_ROOT_CREATE:{error}"))?;
        let runtime = OrchestratorRuntime::open(data_root.join("runtime"), max_active_assignments)?;
        Ok(Self {
            runtime,
            data_root,
            gateway,
        })
    }

    pub fn runtime(&self) -> &OrchestratorRuntime {
        &self.runtime
    }

    /// Import immutable template versions from immediate child directories.
    /// Each child may contain `strategy-template.json`, `run-template.json`, or both.
    pub fn import_catalog(&self, catalog_root: impl AsRef<Path>) -> Result<CatalogImport, String> {
        let catalog_root = catalog_root.as_ref();
        let mut directories = fs::read_dir(catalog_root)
            .map_err(|error| format!("CATALOG_READ:{error}"))?
            .filter_map(Result::ok)
            .filter(|entry| entry.path().is_dir())
            .map(|entry| entry.path())
            .collect::<Vec<_>>();
        directories.sort();
        let mut strategy_templates = 0;
        for directory in &directories {
            let source = directory.join("strategy-template.json");
            if !source.is_file() {
                continue;
            }
            let value: StrategyTemplate = read_catalog_json(&source)?;
            catalog_id(&value.template_id)?;
            catalog_id(&value.version)?;
            let destination = template_path(self, &value.template_id, &value.version);
            store_catalog_item(&destination, &value, "CATALOG_STRATEGY_CONFLICT")?;
            strategy_templates += 1;
        }
        let mut run_templates = 0;
        for directory in &directories {
            let source = directory.join("run-template.json");
            if !source.is_file() {
                continue;
            }
            let value: RunTemplate = read_catalog_json(&source)?;
            value.validate()?;
            catalog_id(&value.run_template_id)?;
            catalog_id(&value.version)?;
            read_catalog_json::<StrategyTemplate>(&template_path(
                self,
                &value.strategy_template_id,
                &value.strategy_template_version,
            ))
            .map_err(|_| format!("CATALOG_STRATEGY_MISSING:{}", value.strategy_template_id))?;
            let destination = run_template_path(self, &value.run_template_id, &value.version);
            store_catalog_item(&destination, &value, "CATALOG_RUN_TEMPLATE_CONFLICT")?;
            run_templates += 1;
        }
        Ok(CatalogImport {
            strategy_templates,
            run_templates,
        })
    }
}

fn catalog_id(value: &str) -> Result<(), String> {
    if !value.is_empty()
        && value.len() <= 160
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
    {
        Ok(())
    } else {
        Err("CATALOG_ID_INVALID".into())
    }
}

fn read_catalog_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T, String> {
    let bytes = fs::read(path).map_err(|error| format!("CATALOG_ITEM_READ:{error}"))?;
    serde_json::from_slice(&bytes).map_err(|error| format!("CATALOG_ITEM_DECODE:{error}"))
}

fn store_catalog_item<T>(path: &Path, value: &T, conflict: &str) -> Result<(), String>
where
    T: serde::Serialize + serde::de::DeserializeOwned + PartialEq,
{
    if path.exists() {
        let existing: T = read_catalog_json(path)?;
        if existing != *value {
            return Err(conflict.to_owned());
        }
        return Ok(());
    }
    atomic_json(path, value).map_err(|error| error.code)
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    code: String,
}

impl ApiError {
    fn bad(code: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            code: code.into(),
        }
    }
    fn not_found(code: impl Into<String>) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            code: code.into(),
        }
    }
    fn conflict(code: impl Into<String>) -> Self {
        Self {
            status: StatusCode::CONFLICT,
            code: code.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(json!({"error":self.code,"authority_effect":"none"})),
        )
            .into_response()
    }
}

impl From<String> for ApiError {
    fn from(value: String) -> Self {
        Self::bad(value)
    }
}

pub fn router(state: ApiState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/api/v1/state", get(list_state))
        .route("/api/v1/operations", get(get_operations))
        .route("/api/v1/workers", post(worker_operation))
        .route("/api/v1/runs/{run_id}", get(get_run))
        .route("/api/v1/runs/{run_id}/cancel", post(cancel_run))
        .route("/api/v1/runs/{run_id}/recovery", get(get_recovery))
        .route(
            "/api/v1/runs/{run_id}/recovery/{command_id}/resolve",
            post(resolve_recovery),
        )
        .route("/api/v1/adapters", get(list_adapters))
        .route("/api/v1/templates", get(list_templates))
        .route(
            "/api/v1/templates/{template_id}/{version}",
            put(save_template),
        )
        .route(
            "/api/v1/templates/{template_id}/{version}/proposals",
            post(propose_template),
        )
        .route("/api/v1/run-templates", get(list_run_templates))
        .route(
            "/api/v1/run-templates/{run_template_id}/{version}",
            put(save_run_template),
        )
        .route(
            "/api/v1/run-templates/{run_template_id}/{version}/proposals",
            post(propose_run_template),
        )
        .route("/api/v1/proposals/direct", post(propose_direct))
        .route("/api/v1/proposals/{proposal_id}", get(get_proposal))
        .route(
            "/api/v1/proposals/{proposal_id}/admit",
            post(admit_proposal),
        )
        .with_state(state)
}

pub fn router_with_frontend(state: ApiState, static_root: impl Into<PathBuf>) -> Router {
    let static_root = static_root.into();
    let index = static_root.join("index.html");
    router(state)
        .route_service("/", ServeFile::new(&index))
        .route_service("/runs", ServeFile::new(&index))
        .route_service("/runs/{*path}", ServeFile::new(&index))
        .route_service("/adapters", ServeFile::new(&index))
        .route_service("/lab", ServeFile::new(&index))
        .route_service("/ontology", ServeFile::new(&index))
        .route_service("/operations", ServeFile::new(&index))
        .fallback_service(ServeDir::new(&static_root))
}

async fn health(State(state): State<ApiState>) -> Json<Value> {
    let socket = state.gateway.socket_path.as_ref();
    Json(json!({
        "status":"ok",
        "edition":"local",
        "gateway":{
            "configured":socket.is_some(),
            "reachable":socket.is_some_and(|path| path.exists()),
            "profile_ref":state.gateway.profile_ref,
        },
        "authority_effect":"none"
    }))
}

async fn list_adapters(State(state): State<ApiState>) -> Json<Value> {
    let socket = state.gateway.socket_path.as_ref();
    Json(json!({
        "adapters":[{
            "adapter_ref":"are-gateway/v1",
            "kind":"agent",
            "configured":socket.is_some(),
            "available":socket.is_some_and(|path| path.exists()),
            "profile_ref":state.gateway.profile_ref,
            "authority_effect":"none"
        }],
        "authority_effect":"none"
    }))
}

async fn list_state(State(state): State<ApiState>) -> Result<Json<Value>, ApiError> {
    let mut runs = Vec::new();
    for run_id in state.runtime.run_ids()? {
        runs.push(project_run(&state, &run_id, now_ms())?);
    }
    Ok(Json(json!({
        "schema_version":"orchestrator-control-center/v1",
        "runs":runs,
        "authority_effect":"none"
    })))
}

async fn get_operations(State(state): State<ApiState>) -> Result<Json<Value>, ApiError> {
    let observed_at_ms = now_ms();
    let active_assignments = state.runtime.active_assignment_count(observed_at_ms)?;
    let maximum = state.runtime.max_active_assignments();
    let mut phases = std::collections::BTreeMap::<String, usize>::new();
    let mut pending_commands = 0usize;
    let mut recovery_items = 0usize;
    let mut durable_leases = 0usize;
    let mut durable_receipts = 0usize;
    let run_ids = state.runtime.run_ids()?;
    for run_id in &run_ids {
        let run = project_run(&state, run_id, observed_at_ms)?;
        let phase = run["phase"].as_str().unwrap_or("unknown").to_owned();
        *phases.entry(phase).or_default() += 1;
        pending_commands += run["history"]["pending_commands"]
            .as_object()
            .map_or(0, serde_json::Map::len);
        recovery_items += run["recovery"].as_array().map_or(0, Vec::len);
        if let Some(commands) = run["execution"]["commands"].as_array() {
            durable_leases += commands
                .iter()
                .filter(|command| !command["lease"].is_null())
                .count();
            durable_receipts += commands
                .iter()
                .filter(|command| !command["receipt"].is_null())
                .count();
        }
    }
    let socket = state.gateway.socket_path.as_ref();
    Ok(Json(json!({
        "schema_version":"orchestrator-operations/v1",
        "observed_at_ms":observed_at_ms,
        "capacity":{
            "active_assignments":active_assignments,
            "max_active_assignments":maximum,
            "available_assignments":maximum.saturating_sub(active_assignments),
            "status":if active_assignments >= maximum { "saturated" } else { "available" }
        },
        "runs":{
            "total":run_ids.len(),
            "by_phase":phases,
            "pending_commands":pending_commands,
            "recovery_items":recovery_items,
            "durable_leases":durable_leases,
            "durable_receipts":durable_receipts
        },
        "gateway":{
            "configured":socket.is_some(),
            "reachable":socket.is_some_and(|path| path.exists()),
            "profile_ref":state.gateway.profile_ref
        },
        "storage":{"runtime":"available","durability":"file-backed"},
        "authority_effect":"none"
    })))
}

async fn worker_operation(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(request): Json<WorkerRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "worker-operation")?;
    let response = WorkerApi::new(state.runtime.clone()).handle(request);
    if response.ok {
        Ok(Json(json!({
            "schema_version":"orchestrator-worker-response/v1",
            "kind":response.kind,
            "value":response.value,
            "authority_effect":"none"
        })))
    } else {
        Err(ApiError::conflict(
            response
                .error
                .unwrap_or_else(|| "WORKER_OPERATION_FAILED".into()),
        ))
    }
}

async fn get_run(
    State(state): State<ApiState>,
    AxumPath(run_id): AxumPath<String>,
) -> Result<Json<Value>, ApiError> {
    Ok(Json(project_run(&state, &run_id, now_ms())?))
}

fn project_run(state: &ApiState, run_id: &str, now: u128) -> Result<Value, ApiError> {
    let controller = state
        .runtime
        .run(run_id)
        .map_err(|_| ApiError::not_found("RUN_NOT_FOUND"))?;
    let history = controller.snapshot()?;
    let mut recovery = Vec::new();
    for command_id in history.pending_commands.keys() {
        recovery.push(controller.recovery(command_id, now)?);
    }
    let mut commands = Vec::new();
    let mut command_ids = history
        .pending_commands
        .keys()
        .cloned()
        .collect::<std::collections::BTreeSet<_>>();
    command_ids.extend(
        history
            .accepted_events
            .iter()
            .filter_map(|event| event.command_id.clone()),
    );
    for command_id in command_ids {
        let pending = history.pending_commands.get(&command_id);
        let event = history
            .accepted_events
            .iter()
            .find(|event| event.command_id.as_deref() == Some(command_id.as_str()));
        let node_id = pending
            .map(|command| command.node_id.as_str())
            .or_else(|| event.map(|event| event.node_id.as_str()))
            .unwrap_or("unknown");
        let node = controller.bundle().graph.nodes.get(node_id);
        let receipt = controller.receipt(&command_id)?;
        let effective_disposition = receipt
            .as_ref()
            .map(|receipt| controller.effective_disposition(receipt))
            .transpose()?;
        commands.push(json!({
            "command_id":command_id,
            "node_id":node_id,
            "contract":pending.map(|command| command.contract.as_str()).or_else(|| node.map(|node| node.contract.as_str())),
            "role_id":pending.map(|command| command.role_id.as_str()).or_else(|| node.map(|node| node.role_id.as_str())),
            "attempt":pending.map(|command| command.attempt).or_else(|| history.cursor.attempts.get(node_id).copied()),
            "status":history.cursor.node_status.get(node_id),
            "lease":controller.lease(&command_id)?,
            "receipt":receipt,
            "effective_disposition":effective_disposition,
            "pending":pending.is_some()
        }));
    }
    let result_previews = history
        .cursor
        .outputs
        .iter()
        .map(|(node_id, output_ref)| {
            (
                node_id.clone(),
                project_result_preview(controller.root(), output_ref),
            )
        })
        .collect::<std::collections::BTreeMap<_, _>>();
    let failed = history
        .cursor
        .node_status
        .values()
        .any(|status| status == "failed");
    let phase = if history.cursor.cancelled {
        "cancelled"
    } else if failed {
        "failed"
    } else if history.pending_commands.is_empty() {
        "completed"
    } else if recovery.iter().any(|item| {
        matches!(
            item.action,
            cyberalchemy_orchestrator_runtime::RecoveryAction::BlockedUnknownEffect
                | cyberalchemy_orchestrator_runtime::RecoveryAction::Reconcile
        )
    }) {
        "needs_attention"
    } else {
        "active"
    };
    let next = match phase {
        "completed" => "Review outputs and decide result acceptance.",
        "cancelled" => "Review the cancellation record and retained residue.",
        "failed" => "Inspect failed nodes and decide whether to create a new run.",
        "needs_attention" => "Resolve the reported recovery item before retrying.",
        _ => "Wait for or assign a compatible worker to the next command.",
    };
    Ok(json!({
        "run_id":run_id,
        "phase":phase,
        "revision":history.revision,
        "bundle":controller.bundle(),
        "history":history,
        "recovery":recovery,
        "execution":{
            "commands":commands,
            "accepted_events":history.accepted_events,
            "control_records":history.control_records,
            "result_previews":result_previews
        },
        "explanation":{
            "state":format!("Run is {phase}."),
            "why":format!("The accepted structural history is at revision {} with {} pending command(s).",history.revision,history.pending_commands.len()),
            "next":next,
            "authority":"Completion records structural progress only. Result acceptance and external effects remain separate owner decisions."
        },
        "authority_effect":"none"
    }))
}

fn project_result_preview(run_root: &Path, output_ref: &Value) -> Value {
    const MAX_PREVIEW_BYTES: u64 = 128 * 1024;
    let Some(uri) = output_ref.get("uri").and_then(Value::as_str) else {
        return json!({"status":"reference_only","reason":"OUTPUT_URI_MISSING"});
    };
    let Some(expected_digest) = output_ref.get("sha256").and_then(Value::as_str) else {
        return json!({"status":"reference_only","reason":"OUTPUT_DIGEST_MISSING"});
    };
    let Ok(root) = fs::canonicalize(run_root) else {
        return json!({"status":"unavailable","reason":"RUN_ROOT_UNAVAILABLE"});
    };
    let Ok(path) = fs::canonicalize(uri) else {
        return json!({"status":"unavailable","reason":"OUTPUT_UNAVAILABLE"});
    };
    let Ok(metadata) = fs::symlink_metadata(&path) else {
        return json!({"status":"unavailable","reason":"OUTPUT_UNAVAILABLE"});
    };
    if !path.starts_with(&root) || !metadata.is_file() || metadata.len() > MAX_PREVIEW_BYTES {
        return json!({"status":"reference_only","reason":"OUTPUT_PREVIEW_BOUNDARY"});
    }
    let Ok(bytes) = fs::read(&path) else {
        return json!({"status":"unavailable","reason":"OUTPUT_UNAVAILABLE"});
    };
    let actual_digest = format!("{:x}", Sha256::digest(&bytes));
    if expected_digest.trim_start_matches("sha256:") != actual_digest {
        return json!({
            "status":"digest_mismatch",
            "expected_sha256":expected_digest,
            "actual_sha256":actual_digest
        });
    }
    match serde_json::from_slice::<Value>(&bytes) {
        Ok(content) => json!({
            "status":"verified",
            "media_type":"application/json",
            "size_bytes":bytes.len(),
            "sha256":actual_digest,
            "content":content
        }),
        Err(_) => json!({
            "status":"verified_reference",
            "media_type":"application/octet-stream",
            "size_bytes":bytes.len(),
            "sha256":actual_digest
        }),
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct DirectProposalRequest {
    strategy: Strategy,
    selected_adapter_refs: Vec<String>,
}

async fn propose_direct(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(request): Json<DirectProposalRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "compose-dispatch")?;
    let proposal =
        DispatchProposal::from_strategy(&request.strategy, request.selected_adapter_refs)?;
    save_proposal(&state, &proposal)?;
    Ok(Json(
        json!({"result":"proposal_ready","proposal":proposal,"authority_effect":"none"}),
    ))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct TemplateProposalRequest {
    parameters: std::collections::BTreeMap<String, Value>,
    selected_adapter_refs: Vec<String>,
}

async fn propose_template(
    State(state): State<ApiState>,
    AxumPath((template_id, version)): AxumPath<(String, String)>,
    headers: HeaderMap,
    Json(request): Json<TemplateProposalRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "compose-template-dispatch")?;
    let template = load_template(&state, &template_id, &version)?;
    let instance = template.instantiate(request.parameters, request.selected_adapter_refs)?;
    let proposal = DispatchProposal::from_instantiation(&instance)?;
    save_proposal(&state, &proposal)?;
    Ok(Json(
        json!({"result":"proposal_ready","proposal":proposal,"authority_effect":"none"}),
    ))
}

async fn get_proposal(
    State(state): State<ApiState>,
    AxumPath(proposal_id): AxumPath<String>,
) -> Result<Json<Value>, ApiError> {
    Ok(Json(json!({
        "proposal":load_proposal(&state, &proposal_id)?,
        "authority_effect":"none"
    })))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct AdmissionRequest {
    run_id: String,
    admitted_at_ms: u128,
    deadline_at_ms: u128,
    admission_authority_ref: String,
}

async fn admit_proposal(
    State(state): State<ApiState>,
    AxumPath(proposal_id): AxumPath<String>,
    headers: HeaderMap,
    Json(request): Json<AdmissionRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "admit-dispatch")?;
    let proposal = load_proposal(&state, &proposal_id)?;
    let bundle = proposal.admit(
        &request.run_id,
        request.admitted_at_ms,
        request.deadline_at_ms,
        &request.admission_authority_ref,
    )?;
    let bundle_digest = bundle.bundle_digest.clone();
    state.runtime.register(bundle)?;
    Ok(Json(json!({
        "result":"registered",
        "run_id":request.run_id,
        "proposal_id":proposal_id,
        "bundle_digest":bundle_digest,
        "authority_effect":"none"
    })))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CancellationRequest {
    expected_revision: u64,
    control_id: String,
    reason: String,
    now_ms: u128,
}

async fn cancel_run(
    State(state): State<ApiState>,
    AxumPath(run_id): AxumPath<String>,
    headers: HeaderMap,
    Json(request): Json<CancellationRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "cancel-run")?;
    let outcome = state.runtime.run(&run_id)?.cancel(
        request.expected_revision,
        &request.control_id,
        &request.reason,
        request.now_ms,
    )?;
    match outcome {
        AcceptOutcome::Conflict { expected, actual } => Err(ApiError::conflict(format!(
            "REVISION_CONFLICT:{expected}:{actual}"
        ))),
        AcceptOutcome::Accepted(history) | AcceptOutcome::Duplicate(history) => Ok(Json(json!({
            "result":"cancelled",
            "revision":history.revision,
            "authority_effect":"none"
        }))),
    }
}

#[derive(Deserialize)]
struct RecoveryQuery {
    command_id: String,
    now_ms: u128,
}

async fn get_recovery(
    State(state): State<ApiState>,
    AxumPath(run_id): AxumPath<String>,
    Query(query): Query<RecoveryQuery>,
) -> Result<Json<Value>, ApiError> {
    let assessment = state
        .runtime
        .run(&run_id)?
        .recovery(&query.command_id, query.now_ms)?;
    Ok(Json(
        json!({"assessment":assessment,"authority_effect":"none"}),
    ))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ResolutionRequest {
    disposition: EffectDisposition,
}

async fn resolve_recovery(
    State(state): State<ApiState>,
    AxumPath((run_id, command_id)): AxumPath<(String, String)>,
    headers: HeaderMap,
    Json(request): Json<ResolutionRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "resolve-recovery")?;
    let assessment = state
        .runtime
        .run(&run_id)?
        .resolve_unknown(&command_id, request.disposition)?;
    Ok(Json(
        json!({"result":"resolved","assessment":assessment,"authority_effect":"none"}),
    ))
}

async fn list_templates(State(state): State<ApiState>) -> Result<Json<Value>, ApiError> {
    let mut templates = Vec::new();
    for id in read_dirs(&state.data_root.join("templates"))? {
        for version in read_files(&state.data_root.join("templates").join(&id))? {
            if let Some(version) = version.strip_suffix(".json") {
                templates.push(load_template(&state, &id, version)?);
            }
        }
    }
    Ok(Json(
        json!({"templates":templates,"authority_effect":"none"}),
    ))
}

async fn save_template(
    State(state): State<ApiState>,
    AxumPath((template_id, version)): AxumPath<(String, String)>,
    headers: HeaderMap,
    Json(template): Json<StrategyTemplate>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "save-template")?;
    if template.template_id != template_id || template.version != version {
        return Err(ApiError::bad("TEMPLATE_PATH_IDENTITY_MISMATCH"));
    }
    valid_id(&template_id)?;
    valid_id(&version)?;
    let path = template_path(&state, &template_id, &version);
    if path.exists() {
        let existing: StrategyTemplate = read_json(&path)?;
        if existing != template {
            return Err(ApiError::conflict("TEMPLATE_VERSION_IMMUTABLE"));
        }
    } else {
        atomic_json(&path, &template)?;
    }
    Ok(Json(
        json!({"result":"saved","template_id":template_id,"version":version,"authority_effect":"none"}),
    ))
}

async fn list_run_templates(State(state): State<ApiState>) -> Result<Json<Value>, ApiError> {
    let mut templates = Vec::new();
    for id in read_dirs(&state.data_root.join("run-templates"))? {
        for version in read_files(&state.data_root.join("run-templates").join(&id))? {
            if let Some(version) = version.strip_suffix(".json") {
                templates.push(load_run_template(&state, &id, version)?);
            }
        }
    }
    Ok(Json(
        json!({"run_templates":templates,"authority_effect":"none"}),
    ))
}

async fn save_run_template(
    State(state): State<ApiState>,
    AxumPath((run_template_id, version)): AxumPath<(String, String)>,
    headers: HeaderMap,
    Json(template): Json<RunTemplate>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "save-run-template")?;
    if template.run_template_id != run_template_id || template.version != version {
        return Err(ApiError::bad("RUN_TEMPLATE_PATH_IDENTITY_MISMATCH"));
    }
    template.validate()?;
    valid_id(&run_template_id)?;
    valid_id(&version)?;
    load_template(
        &state,
        &template.strategy_template_id,
        &template.strategy_template_version,
    )?;
    let path = run_template_path(&state, &run_template_id, &version);
    if path.exists() {
        let existing: RunTemplate = read_json(&path)?;
        if existing != template {
            return Err(ApiError::conflict("RUN_TEMPLATE_VERSION_IMMUTABLE"));
        }
    } else {
        atomic_json(&path, &template)?;
    }
    Ok(Json(
        json!({"result":"saved","run_template_id":run_template_id,"version":version,"authority_effect":"none"}),
    ))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RunTemplateProposalRequest {
    #[serde(default)]
    parameter_overrides: std::collections::BTreeMap<String, Value>,
    adapter_overrides: Option<Vec<String>>,
}

async fn propose_run_template(
    State(state): State<ApiState>,
    AxumPath((run_template_id, version)): AxumPath<(String, String)>,
    headers: HeaderMap,
    Json(request): Json<RunTemplateProposalRequest>,
) -> Result<Json<Value>, ApiError> {
    require_intent(&headers, "compose-run-template-dispatch")?;
    let run_template = load_run_template(&state, &run_template_id, &version)?;
    let strategy_template = load_template(
        &state,
        &run_template.strategy_template_id,
        &run_template.strategy_template_version,
    )?;
    let proposal = run_template.propose(
        &strategy_template,
        request.parameter_overrides,
        request.adapter_overrides,
    )?;
    save_proposal(&state, &proposal)?;
    Ok(Json(json!({
        "result":"proposal_ready",
        "run_template":run_template,
        "proposal":proposal,
        "authority_effect":"none"
    })))
}

fn require_intent(headers: &HeaderMap, expected: &str) -> Result<(), ApiError> {
    if headers
        .get("x-orchestrator-intent")
        .and_then(|value| value.to_str().ok())
        == Some(expected)
    {
        Ok(())
    } else {
        Err(ApiError::bad("INTENT_HEADER_REQUIRED"))
    }
}

fn valid_id(value: &str) -> Result<(), ApiError> {
    if !value.is_empty()
        && value.len() <= 160
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
    {
        Ok(())
    } else {
        Err(ApiError::bad("RESOURCE_ID_INVALID"))
    }
}

fn proposal_path(state: &ApiState, proposal_id: &str) -> Result<PathBuf, ApiError> {
    let digest = proposal_id
        .strip_prefix("sha256:")
        .ok_or_else(|| ApiError::bad("PROPOSAL_ID_INVALID"))?;
    if digest.len() != 64 || !digest.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(ApiError::bad("PROPOSAL_ID_INVALID"));
    }
    Ok(state
        .data_root
        .join("proposals")
        .join(format!("{digest}.json")))
}

fn save_proposal(state: &ApiState, proposal: &DispatchProposal) -> Result<(), ApiError> {
    let path = proposal_path(state, &proposal.proposal_id)?;
    if !path.exists() {
        atomic_json(&path, proposal)?;
    }
    Ok(())
}

fn load_proposal(state: &ApiState, proposal_id: &str) -> Result<DispatchProposal, ApiError> {
    let path = proposal_path(state, proposal_id)?;
    read_json(&path).map_err(|_| ApiError::not_found("PROPOSAL_NOT_FOUND"))
}

fn template_path(state: &ApiState, template_id: &str, version: &str) -> PathBuf {
    state
        .data_root
        .join("templates")
        .join(template_id)
        .join(format!("{version}.json"))
}

fn run_template_path(state: &ApiState, run_template_id: &str, version: &str) -> PathBuf {
    state
        .data_root
        .join("run-templates")
        .join(run_template_id)
        .join(format!("{version}.json"))
}

fn load_template(
    state: &ApiState,
    template_id: &str,
    version: &str,
) -> Result<StrategyTemplate, ApiError> {
    valid_id(template_id)?;
    valid_id(version)?;
    read_json(&template_path(state, template_id, version))
        .map_err(|_| ApiError::not_found("TEMPLATE_NOT_FOUND"))
}

fn load_run_template(
    state: &ApiState,
    run_template_id: &str,
    version: &str,
) -> Result<RunTemplate, ApiError> {
    valid_id(run_template_id)?;
    valid_id(version)?;
    read_json(&run_template_path(state, run_template_id, version))
        .map_err(|_| ApiError::not_found("RUN_TEMPLATE_NOT_FOUND"))
}

fn read_dirs(path: &Path) -> Result<Vec<String>, ApiError> {
    let mut values = fs::read_dir(path)
        .map_err(|error| ApiError::bad(format!("RESOURCE_LIST:{error}")))?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect::<Vec<_>>();
    values.sort();
    Ok(values)
}

fn read_files(path: &Path) -> Result<Vec<String>, ApiError> {
    let mut values = fs::read_dir(path)
        .map_err(|error| ApiError::bad(format!("RESOURCE_LIST:{error}")))?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().is_file())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect::<Vec<_>>();
    values.sort();
    Ok(values)
}

fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T, ApiError> {
    let bytes = fs::read(path).map_err(|error| ApiError::bad(format!("READ:{error}")))?;
    serde_json::from_slice(&bytes).map_err(|error| ApiError::bad(format!("DECODE:{error}")))
}

fn atomic_json<T: serde::Serialize>(path: &Path, value: &T) -> Result<(), ApiError> {
    let parent = path
        .parent()
        .ok_or_else(|| ApiError::bad("PATH_PARENT_MISSING"))?;
    fs::create_dir_all(parent)
        .map_err(|error| ApiError::bad(format!("RESOURCE_ROOT_CREATE:{error}")))?;
    let temporary = path.with_extension("tmp");
    let bytes = serde_json::to_vec_pretty(value)
        .map_err(|error| ApiError::bad(format!("ENCODE:{error}")))?;
    let mut file =
        File::create(&temporary).map_err(|error| ApiError::bad(format!("CREATE:{error}")))?;
    file.write_all(&bytes)
        .and_then(|_| file.write_all(b"\n"))
        .and_then(|_| file.sync_all())
        .map_err(|error| ApiError::bad(format!("WRITE:{error}")))?;
    fs::rename(&temporary, path).map_err(|error| ApiError::bad(format!("RENAME:{error}")))?;
    Ok(())
}

fn now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}
