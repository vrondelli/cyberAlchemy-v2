//! Concrete normal-build witness: a fail-closed HTTP timeout is not gate DENY.
//! The library under this integration target uses its non-test SQLite pool.

#![cfg(feature = "trace")]

use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use auth_foundation_authorization_admission_service::migrate_database;
use auth_foundation_authorization_api::{
    AuthorizationApiConfig, authorization_router, authorization_runtime_from_database,
};
use auth_foundation_authorization_trace::{EventKind, Root};
use axum::body::{Body, to_bytes};
use axum::http::{Method, Request, StatusCode, header};
use rusqlite::Connection;
use serde_json::{Value, json};
use tower::ServiceExt;

fn database_path() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "authorization-api-timeout-witness-{}-{nonce}.sqlite",
        std::process::id()
    ))
}

fn seed_ready_database(path: &PathBuf) {
    migrate_database(path).expect("migrate");
    let expires_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_secs()
        + 60;
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

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn concrete_timeout_deny_precedes_later_ready_policy_entry() {
    let path = database_path();
    seed_ready_database(&path);
    let runtime = authorization_runtime_from_database(
        &path,
        AuthorizationApiConfig::new(1, Duration::from_millis(100), Duration::from_millis(150))
            .expect("config"),
    )
    .expect("concrete runtime");
    runtime.enable_trace_collection();

    let writer = Connection::open(&path).expect("lock connection");
    let journal_mode: String = writer
        .query_row("PRAGMA journal_mode", [], |row| row.get(0))
        .expect("journal mode");
    assert_eq!(journal_mode, "delete", "EXCLUSIVE must block readers");
    writer
        .execute_batch("BEGIN EXCLUSIVE")
        .expect("exclusive lock");

    let request = Request::builder()
        .method(Method::POST)
        .uri("/v1/authorize")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
            json!({"request_id":"request-1", "authentication_evidence_ref":"auth-1",
                   "route_id":"documents.read"})
            .to_string(),
        ))
        .expect("HTTP request");
    let response_task = tokio::spawn(authorization_router(runtime.clone()).oneshot(request));
    tokio::time::timeout(Duration::from_secs(2), async {
        while runtime.metrics().in_flight == 0 {
            tokio::task::yield_now().await;
        }
    })
    .await
    .expect("concrete worker started");
    let response = tokio::time::timeout(Duration::from_secs(2), response_task)
        .await
        .expect("bounded HTTP response")
        .expect("request task")
        .expect("router response");
    assert_eq!(response.status(), StatusCode::GATEWAY_TIMEOUT);
    assert_eq!(response.headers()[header::CACHE_CONTROL], "no-store");
    let body = to_bytes(response.into_body(), 4096)
        .await
        .expect("response bytes");
    assert_eq!(
        serde_json::from_slice::<Value>(&body).expect("JSON response"),
        json!({"decision":"DENY"})
    );
    assert_eq!(runtime.metrics().in_flight, 1);
    assert!(!runtime.is_ready());
    let before_release = runtime.drain_traces().expect("trace store before release");
    assert_eq!(before_release.dropped, 0);
    assert!(before_release.traces.is_empty());

    writer
        .execute_batch("ROLLBACK")
        .expect("release exclusive lock");
    drop(writer);
    tokio::time::timeout(Duration::from_secs(4), async {
        while runtime.metrics().in_flight != 0 || !runtime.is_ready() {
            tokio::task::yield_now().await;
        }
    })
    .await
    .expect("concrete worker finished after timeout");
    assert_eq!(runtime.metrics().timed_out, 1);
    let batch = runtime.drain_traces().expect("trace store after release");
    assert_eq!(batch.dropped, 0);
    assert_eq!(batch.traces.len(), 1);
    let trace = &batch.traces[0];
    assert_eq!(trace.root, Root::Api);
    assert_eq!(trace.request_id, "request-1");
    assert!(trace.events.iter().all(|event| {
        event.root == trace.root
            && event.invocation_id == trace.invocation_id
            && event.request_id == trace.request_id
            && event.epoch_id == trace.events[0].epoch_id
    }));
    assert_eq!(
        trace
            .events
            .iter()
            .map(|event| event.kind)
            .collect::<Vec<_>>(),
        [
            EventKind::EpochOpened,
            EventKind::GateReady,
            EventKind::ReadyDecisionEntered,
            EventKind::PolicyCallBefore,
            EventKind::PolicyCallReturned,
        ]
    );
    drop(runtime);
    std::fs::remove_file(&path).expect("remove disposable test database");
    let _ = std::fs::remove_file(format!("{}-wal", path.display()));
    let _ = std::fs::remove_file(format!("{}-shm", path.display()));
}
