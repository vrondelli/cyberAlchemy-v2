//! Versioned fail-closed HTTP projection of the concurrent in-process Auth Service.

use std::num::NonZeroUsize;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::Path;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use auth_foundation_authorization_service::{EpochAllocator, SqliteAuthService};
use auth_foundation_runtime_adapter::{BinaryAuthorizationDecision, DecisionClock, PortFailure};
use auth_foundation_trusted_boundary::InboundAuthorizationRequest;
use axum::body::{Body, to_bytes};
use axum::extract::State;
use axum::http::{Request, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::sync::Semaphore;
use tokio::time::timeout;

pub const AUTHORIZE_PATH: &str = "/v1/authorize";
pub const MAX_AUTHORIZATION_BODY_BYTES: usize = 1024;

#[derive(Clone, Copy, Debug, Default)]
pub struct SystemDecisionClock;

impl DecisionClock for SystemDecisionClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_secs())
            .map_err(|_| PortFailure)
    }
}

/// Minimal mutable capability owned by one pool slot.
pub trait AuthorizationEngine: Send + 'static {
    fn authorize(&mut self, request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision;
}

impl<C> AuthorizationEngine for SqliteAuthService<C>
where
    C: DecisionClock + Send + 'static,
{
    fn authorize(&mut self, request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
        SqliteAuthService::authorize(self, request)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AuthorizationApiConfig {
    pub pool_size: NonZeroUsize,
    pub acquisition_timeout: Duration,
    pub evaluation_timeout: Duration,
}

impl AuthorizationApiConfig {
    pub fn new(
        pool_size: usize,
        acquisition_timeout: Duration,
        evaluation_timeout: Duration,
    ) -> Result<Self, PortFailure> {
        let pool_size = NonZeroUsize::new(pool_size).ok_or(PortFailure)?;
        if acquisition_timeout.is_zero() || evaluation_timeout.is_zero() {
            return Err(PortFailure);
        }
        Ok(Self {
            pool_size,
            acquisition_timeout,
            evaluation_timeout,
        })
    }
}

impl Default for AuthorizationApiConfig {
    fn default() -> Self {
        Self {
            pool_size: NonZeroUsize::new(4).expect("four is nonzero"),
            acquisition_timeout: Duration::from_millis(50),
            evaluation_timeout: Duration::from_millis(250),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AuthorizationRuntimeError {
    Saturated,
    TimedOut,
    WorkerUnavailable,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct AuthorizationMetricsSnapshot {
    pub requests: u64,
    pub allows: u64,
    pub denies: u64,
    pub saturated: u64,
    pub timed_out: u64,
    pub worker_unavailable: u64,
    pub in_flight: usize,
    pub maximum_in_flight: usize,
}

#[derive(Default)]
struct AuthorizationMetrics {
    requests: AtomicU64,
    allows: AtomicU64,
    denies: AtomicU64,
    saturated: AtomicU64,
    timed_out: AtomicU64,
    worker_unavailable: AtomicU64,
    in_flight: AtomicUsize,
    maximum_in_flight: AtomicUsize,
}

impl AuthorizationMetrics {
    fn snapshot(&self) -> AuthorizationMetricsSnapshot {
        AuthorizationMetricsSnapshot {
            requests: self.requests.load(Ordering::Relaxed),
            allows: self.allows.load(Ordering::Relaxed),
            denies: self.denies.load(Ordering::Relaxed),
            saturated: self.saturated.load(Ordering::Relaxed),
            timed_out: self.timed_out.load(Ordering::Relaxed),
            worker_unavailable: self.worker_unavailable.load(Ordering::Relaxed),
            in_flight: self.in_flight.load(Ordering::Relaxed),
            maximum_in_flight: self.maximum_in_flight.load(Ordering::Relaxed),
        }
    }
}

struct EnginePool {
    engines: Mutex<Vec<Box<dyn AuthorizationEngine>>>,
}

impl EnginePool {
    fn take(&self) -> Result<Box<dyn AuthorizationEngine>, AuthorizationRuntimeError> {
        self.engines
            .lock()
            .map_err(|_| AuthorizationRuntimeError::WorkerUnavailable)?
            .pop()
            .ok_or(AuthorizationRuntimeError::WorkerUnavailable)
    }

    fn put(&self, engine: Box<dyn AuthorizationEngine>) -> Result<(), AuthorizationRuntimeError> {
        self.engines
            .lock()
            .map_err(|_| AuthorizationRuntimeError::WorkerUnavailable)?
            .push(engine);
        Ok(())
    }

    fn available(&self) -> usize {
        self.engines.lock().map_or(0, |engines| engines.len())
    }
}

struct AuthorizationRuntimeInner {
    pool: Arc<EnginePool>,
    permits: Arc<Semaphore>,
    acquisition_timeout: Duration,
    evaluation_timeout: Duration,
    metrics: Arc<AuthorizationMetrics>,
}

#[derive(Clone)]
pub struct AuthorizationRuntime {
    inner: Arc<AuthorizationRuntimeInner>,
}

impl AuthorizationRuntime {
    pub fn from_engines(
        engines: Vec<Box<dyn AuthorizationEngine>>,
        acquisition_timeout: Duration,
        evaluation_timeout: Duration,
    ) -> Result<Self, PortFailure> {
        let capacity = NonZeroUsize::new(engines.len()).ok_or(PortFailure)?;
        if acquisition_timeout.is_zero() || evaluation_timeout.is_zero() {
            return Err(PortFailure);
        }
        Ok(Self {
            inner: Arc::new(AuthorizationRuntimeInner {
                pool: Arc::new(EnginePool {
                    engines: Mutex::new(engines),
                }),
                permits: Arc::new(Semaphore::new(capacity.get())),
                acquisition_timeout,
                evaluation_timeout,
                metrics: Arc::new(AuthorizationMetrics::default()),
            }),
        })
    }

    pub async fn authorize(
        &self,
        request: InboundAuthorizationRequest,
    ) -> Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> {
        self.inner.metrics.requests.fetch_add(1, Ordering::Relaxed);
        let permit = match timeout(
            self.inner.acquisition_timeout,
            Arc::clone(&self.inner.permits).acquire_owned(),
        )
        .await
        {
            Ok(Ok(permit)) => permit,
            _ => {
                self.inner.metrics.saturated.fetch_add(1, Ordering::Relaxed);
                return Err(AuthorizationRuntimeError::Saturated);
            }
        };

        let pool = Arc::clone(&self.inner.pool);
        let metrics = Arc::clone(&self.inner.metrics);
        let worker = tokio::task::spawn_blocking(move || {
            let _permit = permit;
            let in_flight = metrics.in_flight.fetch_add(1, Ordering::AcqRel) + 1;
            metrics
                .maximum_in_flight
                .fetch_max(in_flight, Ordering::Relaxed);
            let _in_flight = InFlightGuard { metrics: &metrics };
            let mut engine = pool.take()?;
            let outcome = catch_unwind(AssertUnwindSafe(|| engine.authorize(request)));
            match outcome {
                Ok(decision) => {
                    pool.put(engine)?;
                    Ok(decision)
                }
                Err(_) => Err(AuthorizationRuntimeError::WorkerUnavailable),
            }
        });

        let decision = match timeout(self.inner.evaluation_timeout, worker).await {
            Err(_) => {
                self.inner.metrics.timed_out.fetch_add(1, Ordering::Relaxed);
                return Err(AuthorizationRuntimeError::TimedOut);
            }
            Ok(Err(_)) | Ok(Ok(Err(_))) => {
                self.inner
                    .metrics
                    .worker_unavailable
                    .fetch_add(1, Ordering::Relaxed);
                return Err(AuthorizationRuntimeError::WorkerUnavailable);
            }
            Ok(Ok(Ok(decision))) => decision,
        };
        match decision {
            BinaryAuthorizationDecision::Allow => {
                self.inner.metrics.allows.fetch_add(1, Ordering::Relaxed);
            }
            BinaryAuthorizationDecision::Deny => {
                self.inner.metrics.denies.fetch_add(1, Ordering::Relaxed);
            }
        }
        Ok(decision)
    }

    pub fn metrics(&self) -> AuthorizationMetricsSnapshot {
        self.inner.metrics.snapshot()
    }

    pub fn is_ready(&self) -> bool {
        self.inner.pool.available() > 0 && !self.inner.permits.is_closed()
    }
}

struct InFlightGuard<'metrics> {
    metrics: &'metrics AuthorizationMetrics,
}

impl Drop for InFlightGuard<'_> {
    fn drop(&mut self) {
        self.metrics.in_flight.fetch_sub(1, Ordering::AcqRel);
    }
}

#[derive(Clone)]
struct ApiState {
    runtime: AuthorizationRuntime,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct AuthorizationApiRequest {
    request_id: String,
    authentication_evidence_ref: String,
    route_id: String,
}

impl From<AuthorizationApiRequest> for InboundAuthorizationRequest {
    fn from(value: AuthorizationApiRequest) -> Self {
        Self {
            request_id: value.request_id,
            authentication_evidence_ref: value.authentication_evidence_ref,
            route_id: value.route_id,
        }
    }
}

#[derive(Serialize)]
struct AuthorizationApiResponse {
    decision: &'static str,
}

/// Build an in-process router. This function does not bind a socket or migrate storage.
pub fn authorization_router(runtime: AuthorizationRuntime) -> Router {
    Router::new()
        .route(AUTHORIZE_PATH, post(authorize))
        .fallback(not_found)
        .method_not_allowed_fallback(method_not_allowed)
        .with_state(ApiState { runtime })
}

pub fn authorization_runtime_from_database(
    path: impl AsRef<Path>,
    config: AuthorizationApiConfig,
) -> Result<AuthorizationRuntime, PortFailure> {
    let epoch_allocator = Arc::new(EpochAllocator::new());
    let mut engines: Vec<Box<dyn AuthorizationEngine>> = Vec::new();
    for _ in 0..config.pool_size.get() {
        engines.push(Box::new(SqliteAuthService::open_with_epoch_allocator(
            path.as_ref(),
            SystemDecisionClock,
            Arc::clone(&epoch_allocator),
        )?));
    }
    AuthorizationRuntime::from_engines(
        engines,
        config.acquisition_timeout,
        config.evaluation_timeout,
    )
}

/// Open a bounded pool over one already-migrated database and construct the router.
/// This does not create schema, run migration, or bind a network listener.
pub fn authorization_router_from_database(
    path: impl AsRef<Path>,
    config: AuthorizationApiConfig,
) -> Result<Router, PortFailure> {
    authorization_runtime_from_database(path, config).map(authorization_router)
}

async fn authorize(State(state): State<ApiState>, request: Request<Body>) -> Response {
    if !is_json_content_type(request.headers().get(header::CONTENT_TYPE)) {
        return deny(StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }
    let body = match to_bytes(request.into_body(), MAX_AUTHORIZATION_BODY_BYTES).await {
        Ok(body) => body,
        Err(_) => return deny(StatusCode::PAYLOAD_TOO_LARGE),
    };
    let request: AuthorizationApiRequest = match serde_json::from_slice(&body) {
        Ok(request) => request,
        Err(_) => return deny(StatusCode::BAD_REQUEST),
    };
    match state.runtime.authorize(request.into()).await {
        Ok(decision) => respond(StatusCode::OK, decision),
        Err(AuthorizationRuntimeError::TimedOut) => deny(StatusCode::GATEWAY_TIMEOUT),
        Err(
            AuthorizationRuntimeError::Saturated | AuthorizationRuntimeError::WorkerUnavailable,
        ) => deny(StatusCode::SERVICE_UNAVAILABLE),
    }
}

async fn not_found() -> Response {
    deny(StatusCode::NOT_FOUND)
}

async fn method_not_allowed() -> Response {
    deny(StatusCode::METHOD_NOT_ALLOWED)
}

fn is_json_content_type(value: Option<&axum::http::HeaderValue>) -> bool {
    value
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(';').next())
        .is_some_and(|value| value.trim().eq_ignore_ascii_case("application/json"))
}

fn deny(status: StatusCode) -> Response {
    respond(status, BinaryAuthorizationDecision::Deny)
}

fn respond(status: StatusCode, decision: BinaryAuthorizationDecision) -> Response {
    let decision = match decision {
        BinaryAuthorizationDecision::Allow => "ALLOW",
        BinaryAuthorizationDecision::Deny => "DENY",
    };
    let mut response = (status, Json(AuthorizationApiResponse { decision })).into_response();
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        axum::http::HeaderValue::from_static("no-store"),
    );
    response
}
