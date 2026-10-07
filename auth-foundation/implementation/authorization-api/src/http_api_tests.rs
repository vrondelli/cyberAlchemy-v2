use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc::{Receiver, Sender, TryRecvError, channel};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use super::{
    AuthorizationApiConfig, AuthorizationEngine, AuthorizationRuntime,
    MAX_AUTHORIZATION_BODY_BYTES, authorization_router, authorization_runtime_from_database,
};
use auth_foundation_authorization_admission_service::migrate_database;
use auth_foundation_authorization_state_model::BinaryAuthorizationDecision;
use auth_foundation_authorization_state_model::InboundAuthorizationRequest;
use axum::Router;
use axum::body::{Body, to_bytes};
use axum::http::{Method, Request, StatusCode, header};
use rusqlite::Connection;
use serde_json::{Value, json};
use tower::ServiceExt;

struct RecordingEngine {
    decision: BinaryAuthorizationDecision,
    requests: Arc<Mutex<Vec<InboundAuthorizationRequest>>>,
}

impl AuthorizationEngine for RecordingEngine {
    fn authorize(&mut self, request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
        self.requests.lock().expect("recording lock").push(request);
        self.decision
    }
}

struct ConcurrencyProbe {
    active: Arc<AtomicUsize>,
    maximum: Arc<AtomicUsize>,
    delay: Duration,
}

impl AuthorizationEngine for ConcurrencyProbe {
    fn authorize(&mut self, _: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
        let active = self.active.fetch_add(1, Ordering::SeqCst) + 1;
        self.maximum.fetch_max(active, Ordering::SeqCst);
        std::thread::sleep(self.delay);
        self.active.fetch_sub(1, Ordering::SeqCst);
        BinaryAuthorizationDecision::Deny
    }
}

// Test-only worker-lifetime witness. This engine does not model the production
// concrete SQLite service or prove its command-boundary behavior.
struct GatedEngine {
    entered: Sender<()>,
    release: Receiver<()>,
    finished: Sender<()>,
}

impl AuthorizationEngine for GatedEngine {
    fn authorize(&mut self, _: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
        self.entered.send(()).expect("entry witness receiver");
        self.release
            .recv_timeout(Duration::from_secs(5))
            .expect("bounded worker release");
        self.finished.send(()).expect("finish witness receiver");
        BinaryAuthorizationDecision::Deny
    }
}

fn runtime(
    engines: Vec<Box<dyn AuthorizationEngine>>,
    acquisition_timeout: Duration,
    evaluation_timeout: Duration,
) -> AuthorizationRuntime {
    AuthorizationRuntime::from_engines(engines, acquisition_timeout, evaluation_timeout)
        .expect("runtime")
}

fn request(method: Method, path: &str, body: impl Into<Body>) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(path)
        .header(header::CONTENT_TYPE, "application/json; charset=utf-8")
        .body(body.into())
        .expect("request")
}

fn request_body(evidence_ref: &str, route_id: &str) -> String {
    json!({
        "request_id": "request-1",
        "authentication_evidence_ref": evidence_ref,
        "route_id": route_id
    })
    .to_string()
}

fn valid_body() -> String {
    request_body("auth-1", "documents.read")
}

async fn call(app: Router, request: Request<Body>) -> (StatusCode, Value, String, String) {
    let response = app.oneshot(request).await.expect("router response");
    let status = response.status();
    let content_type = response
        .headers()
        .get(header::CONTENT_TYPE)
        .expect("content type")
        .to_str()
        .expect("content type text")
        .to_owned();
    let cache_control = response
        .headers()
        .get(header::CACHE_CONTROL)
        .expect("cache control")
        .to_str()
        .expect("cache control text")
        .to_owned();
    let bytes = to_bytes(response.into_body(), 4096).await.expect("body");
    let body = serde_json::from_slice(&bytes).expect("JSON response");
    (status, body, content_type, cache_control)
}

#[tokio::test]
async fn exact_request_is_projected_once_and_binary_decision_is_preserved() {
    for (decision, expected) in [
        (BinaryAuthorizationDecision::Allow, "ALLOW"),
        (BinaryAuthorizationDecision::Deny, "DENY"),
    ] {
        let requests = Arc::new(Mutex::new(Vec::new()));
        let runtime = runtime(
            vec![Box::new(RecordingEngine {
                decision,
                requests: Arc::clone(&requests),
            })],
            Duration::from_millis(50),
            Duration::from_millis(100),
        );
        let (status, body, content_type, cache_control) = call(
            authorization_router(runtime.clone()),
            request(Method::POST, "/v1/authorize", valid_body()),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body, json!({"decision": expected}));
        assert_eq!(content_type, "application/json");
        assert_eq!(cache_control, "no-store");
        let recorded = requests.lock().expect("requests");
        assert_eq!(recorded.len(), 1);
        assert_eq!(recorded[0].request_id, "request-1");
        assert_eq!(recorded[0].authentication_evidence_ref, "auth-1");
        assert_eq!(recorded[0].route_id, "documents.read");
        let metrics = runtime.metrics();
        assert_eq!(metrics.requests, 1);
        assert_eq!(metrics.allows + metrics.denies, 1);
    }
}

#[tokio::test]
async fn caller_authority_fields_are_rejected_before_engine_dispatch() {
    let requests = Arc::new(Mutex::new(Vec::new()));
    let app = authorization_router(runtime(
        vec![Box::new(RecordingEngine {
            decision: BinaryAuthorizationDecision::Allow,
            requests: Arc::clone(&requests),
        })],
        Duration::from_millis(50),
        Duration::from_millis(100),
    ));
    for field in [
        "required_permission",
        "scope_evidence_ref",
        "session_id",
        "roles",
    ] {
        let mut body: Value = serde_json::from_str(&valid_body()).expect("valid JSON");
        body[field] = json!("caller-controlled");
        let (status, response, _, _) = call(
            app.clone(),
            request(Method::POST, "/v1/authorize", body.to_string()),
        )
        .await;
        assert_eq!(
            status,
            StatusCode::BAD_REQUEST,
            "AUTH_CALLER_AUTHORITY_ACCEPTED"
        );
        assert_eq!(response, json!({"decision": "DENY"}));
    }
    assert!(requests.lock().expect("requests").is_empty());
}

#[tokio::test]
async fn malformed_non_exact_and_unsupported_requests_fail_closed() {
    let runtime = runtime(
        vec![Box::new(RecordingEngine {
            decision: BinaryAuthorizationDecision::Allow,
            requests: Arc::new(Mutex::new(Vec::new())),
        })],
        Duration::from_millis(50),
        Duration::from_millis(100),
    );
    let app = authorization_router(runtime);
    let cases = [
        (
            request(Method::POST, "/v1/authorize", "{"),
            StatusCode::BAD_REQUEST,
        ),
        (
            request(
                Method::POST,
                "/v1/authorize",
                json!({
                    "request_id": "request-1",
                    "authentication_evidence_ref": "auth-1",
                    "route_id": "documents.read",
                    "permission": "caller-owned"
                })
                .to_string(),
            ),
            StatusCode::BAD_REQUEST,
        ),
        (
            Request::builder()
                .method(Method::POST)
                .uri("/v1/authorize")
                .header(header::CONTENT_TYPE, "text/plain")
                .body(Body::from(valid_body()))
                .expect("request"),
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
        ),
        (
            request(
                Method::POST,
                "/v1/authorize",
                "x".repeat(MAX_AUTHORIZATION_BODY_BYTES + 1),
            ),
            StatusCode::PAYLOAD_TOO_LARGE,
        ),
        (
            request(Method::GET, "/v1/authorize", Body::empty()),
            StatusCode::METHOD_NOT_ALLOWED,
        ),
        (
            request(Method::POST, "/v1/unknown", valid_body()),
            StatusCode::NOT_FOUND,
        ),
    ];
    for (request, expected_status) in cases {
        let (status, body, content_type, cache_control) = call(app.clone(), request).await;
        assert_eq!(status, expected_status);
        assert_eq!(body, json!({"decision": "DENY"}));
        assert_eq!(content_type, "application/json");
        assert_eq!(cache_control, "no-store");
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn distinct_pool_engines_execute_authorizations_in_parallel() {
    let active = Arc::new(AtomicUsize::new(0));
    let maximum = Arc::new(AtomicUsize::new(0));
    let engines = (0..3)
        .map(|_| {
            Box::new(ConcurrencyProbe {
                active: Arc::clone(&active),
                maximum: Arc::clone(&maximum),
                delay: Duration::from_millis(40),
            }) as Box<dyn AuthorizationEngine>
        })
        .collect();
    let runtime = runtime(
        engines,
        Duration::from_millis(100),
        Duration::from_millis(250),
    );
    let app = authorization_router(runtime.clone());
    let requests = (0..3)
        .map(|_| {
            tokio::spawn(
                app.clone()
                    .oneshot(request(Method::POST, "/v1/authorize", valid_body())),
            )
        })
        .collect::<Vec<_>>();
    for request in requests {
        assert_eq!(
            request
                .await
                .expect("request task")
                .expect("response")
                .status(),
            StatusCode::OK
        );
    }
    assert!(maximum.load(Ordering::SeqCst) >= 2);
    assert!(runtime.metrics().maximum_in_flight >= 2);
    assert_eq!(active.load(Ordering::SeqCst), 0);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn pool_saturation_returns_503_deny_with_bounded_wait() {
    let active = Arc::new(AtomicUsize::new(0));
    let runtime = runtime(
        vec![Box::new(ConcurrencyProbe {
            active: Arc::clone(&active),
            maximum: Arc::new(AtomicUsize::new(0)),
            delay: Duration::from_millis(100),
        })],
        Duration::from_millis(10),
        Duration::from_millis(250),
    );
    let app = authorization_router(runtime.clone());
    let first = tokio::spawn(app.clone().oneshot(request(
        Method::POST,
        "/v1/authorize",
        valid_body(),
    )));
    while active.load(Ordering::SeqCst) == 0 {
        tokio::task::yield_now().await;
    }
    let (status, body, _, _) =
        call(app, request(Method::POST, "/v1/authorize", valid_body())).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(body, json!({"decision": "DENY"}));
    assert_eq!(
        first.await.expect("first task").expect("response").status(),
        StatusCode::OK
    );
    assert_eq!(runtime.metrics().saturated, 1);
}

#[tokio::test]
async fn evaluation_timeout_returns_504_deny_and_worker_finishes_safely() {
    let runtime = runtime(
        vec![Box::new(ConcurrencyProbe {
            active: Arc::new(AtomicUsize::new(0)),
            maximum: Arc::new(AtomicUsize::new(0)),
            delay: Duration::from_millis(60),
        })],
        Duration::from_millis(20),
        Duration::from_millis(5),
    );
    let (status, body, _, _) = call(
        authorization_router(runtime.clone()),
        request(Method::POST, "/v1/authorize", valid_body()),
    )
    .await;
    assert_eq!(status, StatusCode::GATEWAY_TIMEOUT);
    assert_eq!(body, json!({"decision": "DENY"}));
    assert_eq!(runtime.metrics().timed_out, 1);
    tokio::time::sleep(Duration::from_millis(80)).await;
    assert!(runtime.is_ready());
    assert_eq!(runtime.metrics().in_flight, 0);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn timed_out_response_precedes_blocking_worker_completion() {
    let (entered_tx, entered_rx) = channel();
    let (release_tx, release_rx) = channel();
    let (finished_tx, finished_rx) = channel();
    let runtime = runtime(
        vec![Box::new(GatedEngine {
            entered: entered_tx,
            release: release_rx,
            finished: finished_tx,
        })],
        Duration::from_millis(100),
        Duration::from_millis(100),
    );
    let request_task = tokio::spawn(authorization_router(runtime.clone()).oneshot(request(
        Method::POST,
        "/v1/authorize",
        valid_body(),
    )));
    tokio::task::spawn_blocking(move || entered_rx.recv_timeout(Duration::from_secs(5)))
        .await
        .expect("entry witness task")
        .expect("worker entered");

    let response = request_task.await.expect("request task").expect("response");
    assert_eq!(response.status(), StatusCode::GATEWAY_TIMEOUT);
    let body = to_bytes(response.into_body(), 4096)
        .await
        .expect("response body");
    assert_eq!(
        serde_json::from_slice::<Value>(&body).expect("JSON body"),
        json!({"decision": "DENY"})
    );
    assert!(matches!(finished_rx.try_recv(), Err(TryRecvError::Empty)));
    assert_eq!(runtime.metrics().in_flight, 1);

    release_tx.send(()).expect("release worker");
    tokio::task::spawn_blocking(move || finished_rx.recv_timeout(Duration::from_secs(5)))
        .await
        .expect("finish witness task")
        .expect("worker finished");
    tokio::time::timeout(Duration::from_secs(5), async {
        while !runtime.is_ready() || runtime.metrics().in_flight != 0 {
            tokio::task::yield_now().await;
        }
    })
    .await
    .expect("pool and in-flight state recovered");
}

#[tokio::test]
async fn database_pool_uses_existing_schema_system_clock_and_binary_decisions() {
    let path = unique_database_path();
    let expires_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_secs()
        + 60;
    seed(&path, expires_at);
    let runtime = authorization_runtime_from_database(
        &path,
        AuthorizationApiConfig::new(3, Duration::from_millis(50), Duration::from_millis(250))
            .expect("config"),
    )
    .expect("runtime");
    let app = authorization_router(runtime);
    let (status, body, _, _) = call(
        app.clone(),
        request(Method::POST, "/v1/authorize", valid_body()),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({"decision": "ALLOW"}));
    let (status, body, _, _) = call(
        app,
        request(
            Method::POST,
            "/v1/authorize",
            request_body("auth-1", "documents.write"),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({"decision": "DENY"}));
    remove_database(&path);
}

#[tokio::test]
async fn sql_injection_payloads_are_bound_values_and_leave_schema_intact() {
    let path = unique_database_path();
    let expires_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_secs()
        + 60;
    seed(&path, expires_at);
    let runtime = authorization_runtime_from_database(
        &path,
        AuthorizationApiConfig::new(2, Duration::from_millis(50), Duration::from_millis(250))
            .expect("config"),
    )
    .expect("runtime");
    let app = authorization_router(runtime);
    for (evidence_ref, route_id) in [
        ("' OR 1=1 --", "documents.read"),
        ("auth-1", "'; DROP TABLE auth_sessions; --"),
        ("auth-1 UNION SELECT * FROM auth_sessions", "documents.read"),
        ("auth-1", "\"; PRAGMA writable_schema=ON; --"),
    ] {
        let (status, body, _, _) = call(
            app.clone(),
            request(
                Method::POST,
                "/v1/authorize",
                request_body(evidence_ref, route_id),
            ),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body, json!({"decision": "DENY"}));
    }
    drop(app);
    let connection = Connection::open(&path).expect("integrity connection");
    assert_eq!(
        connection
            .query_row("SELECT COUNT(*) FROM auth_sessions", [], |row| row
                .get::<_, i64>(0))
            .expect("session count"),
        1
    );
    assert_eq!(
        connection
            .query_row(
                "SELECT COUNT(*) FROM auth_authentication_evidence",
                [],
                |row| row.get::<_, i64>(0),
            )
            .expect("evidence count"),
        1
    );
    drop(connection);
    remove_database(&path);
}

#[test]
fn runtime_configuration_rejects_zero_capacity_and_zero_timeouts() {
    assert!(
        AuthorizationApiConfig::new(0, Duration::from_millis(1), Duration::from_millis(1)).is_err()
    );
    assert!(AuthorizationApiConfig::new(1, Duration::ZERO, Duration::from_millis(1)).is_err());
    assert!(AuthorizationApiConfig::new(1, Duration::from_millis(1), Duration::ZERO).is_err());
    assert!(
        AuthorizationRuntime::from_engines(
            Vec::new(),
            Duration::from_millis(1),
            Duration::from_millis(1),
        )
        .is_err()
    );
}

fn unique_database_path() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "authorization-api-test-{}-{nonce}.sqlite",
        std::process::id()
    ))
}

fn seed(path: &Path, expires_at: u64) {
    migrate_database(path).expect("migrate");
    Connection::open(path)
        .expect("seed connection")
        .execute_batch(&format!(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
                  evidence_revision, authenticated_subject_id)
             VALUES (1, 'auth-1', 'session-1', 1, 0, {expires_at}, 3, 'user-1');
             INSERT INTO auth_route_authorization_bindings
                 (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
                  complete, enabled, binding_revision)
             VALUES (1, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1, 5);
             INSERT INTO auth_roles (role_id) VALUES ('reader');
             INSERT INTO auth_role_permissions
                 (role_id, resource, action, scope, authorization_revision)
             VALUES ('reader', 'documents', 'read', 'tenant-7', 7);
             INSERT INTO auth_sessions
                 (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
             VALUES (1, 'session-1', 'user-1', 'active', 7, {expires_at});
             INSERT INTO auth_session_active_roles
                 (session_row_id, role_id, authorization_revision)
             VALUES (1, 'reader', 7);
             INSERT INTO auth_authorization_revisions (session_id, revision)
             VALUES ('session-1', 7);
             INSERT INTO auth_scope_evidence (evidence_ref, resource, action, scope, trusted)
             VALUES ('scope-1', 'documents', 'read', 'tenant-7', 1);"
        ))
        .expect("seed");
}

fn remove_database(path: &Path) {
    std::fs::remove_file(path).expect("remove database");
    let _ = std::fs::remove_file(format!("{}-wal", path.display()));
    let _ = std::fs::remove_file(format!("{}-shm", path.display()));
}
