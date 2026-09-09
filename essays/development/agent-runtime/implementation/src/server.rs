use crate::{
    Command, ErrorCode, ErrorResponse, Receipt, Runtime, RuntimeError, RuntimeEvent,
    WorkspaceSnapshot,
    security::{PairRequest, redeem_pairing_code, verify_dpop},
};
use axum::{
    Json, Router,
    body::Body,
    extract::{DefaultBodyLimit, OriginalUri, Path, Query, State},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Response, Sse, sse::Event},
    routing::{get, post},
};
use futures_util::{Stream, StreamExt, stream};
use serde::Deserialize;
use std::{convert::Infallible, sync::Arc, time::Duration};
use tokio_stream::wrappers::BroadcastStream;
use tower_http::timeout::TimeoutLayer;

#[derive(Clone)]
pub struct ServerConfig {
    pub public_base_url: String,
    pub max_body_bytes: usize,
    pub request_timeout_seconds: u64,
    pub lease_duration_ms: i64,
}

#[derive(Clone)]
struct AppState {
    runtime: Runtime,
    config: Arc<ServerConfig>,
}

#[derive(Debug, Deserialize)]
struct SnapshotQuery {
    cursor: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct EventsQuery {
    workspace_id: String,
    cursor: Option<i64>,
}

pub fn router(runtime: Runtime, config: ServerConfig) -> Router {
    let max_body_bytes = config.max_body_bytes;
    let timeout_seconds = config.request_timeout_seconds;
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route(
            "/v1/pair",
            post(pair).layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                Duration::from_secs(timeout_seconds.max(1)),
            )),
        )
        .route(
            "/v1/commands",
            post(command).layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                Duration::from_secs(timeout_seconds.max(1)),
            )),
        )
        .route(
            "/v1/workspaces/{id}",
            get(snapshot).layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                Duration::from_secs(timeout_seconds.max(1)),
            )),
        )
        .route("/v1/events", get(events))
        .layer(DefaultBodyLimit::max(max_body_bytes))
        .with_state(AppState {
            runtime,
            config: Arc::new(config),
        })
}

async fn pair(
    State(state): State<AppState>,
    Json(request): Json<PairRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let lease = redeem_pairing_code(&state.runtime, &request, state.config.lease_duration_ms)?;
    Ok((StatusCode::CREATED, Json(lease)))
}

async fn command(
    State(state): State<AppState>,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
    Json(command): Json<Command>,
) -> Result<Json<Receipt>, ApiError> {
    let principal = authenticate(
        &state,
        &headers,
        &Method::POST,
        uri.path_and_query()
            .map(|value| value.as_str())
            .unwrap_or(uri.path()),
        "runtime:command",
    )?;
    state
        .runtime
        .execute(&command, &principal)
        .map(Json)
        .map_err(Into::into)
}

async fn snapshot(
    State(state): State<AppState>,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
    Path(workspace_id): Path<String>,
    Query(query): Query<SnapshotQuery>,
) -> Result<Json<WorkspaceSnapshot>, ApiError> {
    authenticate(
        &state,
        &headers,
        &Method::GET,
        uri.path_and_query()
            .map(|value| value.as_str())
            .unwrap_or(uri.path()),
        "runtime:read",
    )?;
    state
        .runtime
        .snapshot(&workspace_id, query.cursor)?
        .map(Json)
        .ok_or_else(|| RuntimeError::new(ErrorCode::NotFound, "workspace not found").into())
}

async fn events(
    State(state): State<AppState>,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
    Query(query): Query<EventsQuery>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, ApiError> {
    let principal = authenticate(
        &state,
        &headers,
        &Method::GET,
        uri.path_and_query()
            .map(|value| value.as_str())
            .unwrap_or(uri.path()),
        "runtime:read",
    )?;
    let lease_remaining_ms = principal
        .expires_at_unix_ms()
        .map(|expiry| expiry.saturating_sub(crate::runtime::now_unix_ms()).max(1) as u64)
        .unwrap_or(1);
    let workspace_id = query.workspace_id;
    let initial = state
        .runtime
        .events_after(&workspace_id, query.cursor.unwrap_or(0), 1_000)?;
    let historical = stream::iter(initial.into_iter().map(to_sse));
    let live_workspace = workspace_id.clone();
    let live = BroadcastStream::new(state.runtime.subscribe()).filter_map(move |item| {
        let workspace_id = live_workspace.clone();
        async move {
            match item {
                Ok(event) if event.workspace_id == workspace_id => Some(to_sse(event)),
                _ => None,
            }
        }
    });
    let bounded = historical
        .chain(live)
        .take_until(tokio::time::sleep(Duration::from_millis(
            lease_remaining_ms,
        )));
    Ok(Sse::new(bounded)
        .keep_alive(axum::response::sse::KeepAlive::new().interval(Duration::from_secs(15))))
}

fn authenticate(
    state: &AppState,
    headers: &HeaderMap,
    method: &Method,
    path_and_query: &str,
    scope: &str,
) -> Result<crate::AuthenticatedPrincipal, ApiError> {
    let proof = header(headers, "dpop")?;
    let client_id = header(headers, "x-essays-client-id")?;
    let target = format!(
        "{}{}",
        state.config.public_base_url.trim_end_matches('/'),
        path_and_query
    );
    verify_dpop(
        &state.runtime,
        proof,
        client_id,
        method.as_str(),
        &target,
        scope,
    )
    .map_err(Into::into)
}

fn header<'a>(headers: &'a HeaderMap, name: &str) -> Result<&'a str, ApiError> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            RuntimeError::new(ErrorCode::Unauthenticated, format!("missing {name} header")).into()
        })
}

fn to_sse(event: RuntimeEvent) -> Result<Event, Infallible> {
    let data = serde_json::to_string(&event).unwrap_or_else(|_| "{}".into());
    Ok(Event::default()
        .id(event.cursor.to_string())
        .event(event.event_type)
        .data(data))
}

pub struct ApiError(RuntimeError);

impl From<RuntimeError> for ApiError {
    fn from(error: RuntimeError) -> Self {
        Self(error)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response<Body> {
        let status = match self.0.code {
            ErrorCode::Unauthenticated => StatusCode::UNAUTHORIZED,
            ErrorCode::WorkOwnerRequired | ErrorCode::ScopeDenied | ErrorCode::GrantNotCurrent => {
                StatusCode::FORBIDDEN
            }
            ErrorCode::NotFound => StatusCode::NOT_FOUND,
            ErrorCode::ExpectedRevisionConflict | ErrorCode::IdempotencyKeyReused => {
                StatusCode::CONFLICT
            }
            ErrorCode::DeadlineExceeded => StatusCode::REQUEST_TIMEOUT,
            ErrorCode::ResourceLimitExceeded => StatusCode::PAYLOAD_TOO_LARGE,
            ErrorCode::PersistenceFailure => StatusCode::INTERNAL_SERVER_ERROR,
            _ => StatusCode::BAD_REQUEST,
        };
        (status, Json(ErrorResponse::from(&self.0))).into_response()
    }
}
