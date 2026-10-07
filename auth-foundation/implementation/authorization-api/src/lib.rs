//! Versioned fail-closed HTTP projection of the concurrent in-process Auth Service.

#[cfg(feature = "trace")]
use std::collections::VecDeque;
use std::num::NonZeroUsize;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::Path;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use auth_foundation_authorization_service::SqliteAuthService;
pub use auth_foundation_authorization_service::SystemDecisionClock;
use auth_foundation_authorization_service::EpochAllocator;
use auth_foundation_authorization_state_model::{
    BinaryAuthorizationDecision, InboundAuthorizationRequest, PortFailure,
};
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

/// Mock engine capability for unit probes only. Production pool slots hold
/// the concrete SQLite service and never dispatch through a trait object.
///
/// ```compile_fail
/// use auth_foundation_authorization_api::AuthorizationEngine;
/// ```
#[cfg(test)]
trait AuthorizationEngine: Send + 'static {
    fn authorize(&mut self, request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision;
}

#[cfg(test)]
impl AuthorizationEngine for SqliteAuthService<SystemDecisionClock> {
    fn authorize(&mut self, request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
        SqliteAuthService::authorize(self, request)
    }
}

#[cfg(test)]
type PoolEngine = Box<dyn AuthorizationEngine>;
#[cfg(not(test))]
type PoolEngine = SqliteAuthService<SystemDecisionClock>;

#[cfg(test)]
fn pool_engine(service: SqliteAuthService<SystemDecisionClock>) -> PoolEngine {
    Box::new(service)
}

#[cfg(not(test))]
fn pool_engine(service: SqliteAuthService<SystemDecisionClock>) -> PoolEngine {
    service
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
    engines: Mutex<Vec<PoolEngine>>,
}

impl EnginePool {
    fn take(&self) -> Result<PoolEngine, AuthorizationRuntimeError> {
        self.engines
            .lock()
            .map_err(|_| AuthorizationRuntimeError::WorkerUnavailable)?
            .pop()
            .ok_or(AuthorizationRuntimeError::WorkerUnavailable)
    }

    fn put(&self, engine: PoolEngine) -> Result<(), AuthorizationRuntimeError> {
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
    #[cfg(feature = "trace")]
    traces: Arc<Mutex<TraceBuffer>>,
    #[cfg(feature = "trace")]
    trace_enabled: std::sync::atomic::AtomicBool,
}

#[cfg(feature = "trace")]
const MAX_STORED_TRACES: usize = 64;

#[cfg(feature = "trace")]
#[derive(Default)]
struct TraceBuffer {
    traces: VecDeque<auth_foundation_authorization_trace::Trace>,
    dropped: u64,
}

#[cfg(feature = "trace")]
impl TraceBuffer {
    fn push(&mut self, trace: auth_foundation_authorization_trace::Trace) {
        if self.traces.len() == MAX_STORED_TRACES {
            self.traces.pop_front();
            self.dropped = self.dropped.saturating_add(1);
        }
        self.traces.push_back(trace);
    }

    fn drain(&mut self) -> TraceDrain {
        let dropped = std::mem::take(&mut self.dropped);
        TraceDrain {
            traces: self.traces.drain(..).collect(),
            dropped,
        }
    }
}

#[cfg(all(test, feature = "trace"))]
#[test]
fn trace_buffer_reports_bounded_loss() {
    let mut buffer = TraceBuffer::default();
    for invocation_id in 0..=MAX_STORED_TRACES {
        buffer.push(auth_foundation_authorization_trace::Trace {
            root: auth_foundation_authorization_trace::Root::Api,
            invocation_id: invocation_id as u64,
            request_id: "bounded-test".into(),
            events: Vec::new(),
        });
    }
    let batch = buffer.drain();
    assert_eq!(batch.traces.len(), MAX_STORED_TRACES);
    assert_eq!(batch.dropped, 1);
    assert_eq!(batch.traces[0].invocation_id, 1);
}

/// A nonzero dropped count invalidates any no-call inference from this batch.
#[cfg(feature = "trace")]
pub struct TraceDrain {
    pub traces: Vec<auth_foundation_authorization_trace::Trace>,
    pub dropped: u64,
}

#[derive(Clone)]
pub struct AuthorizationRuntime {
    inner: Arc<AuthorizationRuntimeInner>,
}

impl AuthorizationRuntime {
    /// Internal pool assembly for the concrete database builder and unit tests.
    ///
    /// ```compile_fail
    /// use auth_foundation_authorization_api::AuthorizationRuntime;
    /// use std::time::Duration;
    /// let _ = AuthorizationRuntime::from_engines(
    ///     Vec::new(), Duration::from_millis(1), Duration::from_millis(1));
    /// ```
    fn from_engines(
        engines: Vec<PoolEngine>,
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
                #[cfg(feature = "trace")]
                traces: Arc::new(Mutex::new(TraceBuffer::default())),
                #[cfg(feature = "trace")]
                trace_enabled: std::sync::atomic::AtomicBool::new(false),
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
        #[cfg(all(feature = "trace", not(test)))]
        let traces = Arc::clone(&self.inner.traces);
        #[cfg(all(feature = "trace", not(test)))]
        let trace_enabled = self.inner.trace_enabled.load(Ordering::Acquire);
        let worker = tokio::task::spawn_blocking(move || {
            let _permit = permit;
            let in_flight = metrics.in_flight.fetch_add(1, Ordering::AcqRel) + 1;
            metrics
                .maximum_in_flight
                .fetch_max(in_flight, Ordering::Relaxed);
            let _in_flight = InFlightGuard { metrics: &metrics };
            let mut engine = pool.take()?;
            #[cfg(all(feature = "trace", not(test)))]
            let trace_scope = trace_enabled.then(|| {
                auth_foundation_authorization_trace::Scope::enter(
                    auth_foundation_authorization_trace::Root::Api,
                    &request.request_id,
                )
            });
            #[cfg(test)]
            let outcome = catch_unwind(AssertUnwindSafe(|| engine.authorize(request)));
            #[cfg(not(test))]
            let outcome = catch_unwind(AssertUnwindSafe(|| engine.authorize(request)));
            let result = match outcome {
                Ok(decision) => {
                    pool.put(engine)?;
                    Ok(decision)
                }
                Err(_) => Err(AuthorizationRuntimeError::WorkerUnavailable),
            };
            #[cfg(all(feature = "trace", not(test)))]
            if let Some(scope) = trace_scope {
                traces
                    .lock()
                    .map_err(|_| AuthorizationRuntimeError::WorkerUnavailable)?
                    .push(scope.finish());
            }
            result
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

    /// Opt in explicitly; trace feature alone never retains request identifiers.
    #[cfg(feature = "trace")]
    pub fn enable_trace_collection(&self) {
        self.inner.trace_enabled.store(true, Ordering::Release);
    }

    /// Completed worker traces only; a timed-out worker may still be running.
    /// A nonzero dropped count invalidates no-call inference.
    #[cfg(feature = "trace")]
    pub fn drain_traces(&self) -> Result<TraceDrain, AuthorizationRuntimeError> {
        self.inner
            .traces
            .lock()
            .map(|mut traces| traces.drain())
            .map_err(|_| AuthorizationRuntimeError::WorkerUnavailable)
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
    let mut engines: Vec<PoolEngine> = Vec::new();
    for _ in 0..config.pool_size.get() {
        let service = SqliteAuthService::open_with_epoch_allocator(
            path.as_ref(),
            Arc::clone(&epoch_allocator),
        )?;
        engines.push(pool_engine(service));
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

#[cfg(test)]
mod http_api_tests;
