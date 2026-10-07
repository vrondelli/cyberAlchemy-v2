//! Integration tests compile the library without `cfg(test)`, exercising the
//! concrete production pool rather than the unit-only mock-engine branch.

use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use auth_foundation_authorization_admission_service::{
    AdmissionOutcome, SqliteAdmissionService, migrate_database,
};
use auth_foundation_authorization_api::{
    AuthorizationApiConfig, authorization_runtime_from_database,
};
use auth_foundation_authorization_ready_decision::authorize as authorize_ready_decision;
use auth_foundation_authorization_state_model::{
    BinaryAuthorizationDecision, InboundAuthorizationRequest,
};
#[cfg(feature = "trace")]
use auth_foundation_authorization_trace::{EventKind, Root, Trace};
use rusqlite::Connection;

#[cfg(feature = "trace")]
fn one_trace(runtime: &auth_foundation_authorization_api::AuthorizationRuntime) -> Trace {
    let batch = runtime.drain_traces().expect("trace store");
    assert_eq!(batch.dropped, 0);
    let mut traces = batch.traces;
    assert_eq!(traces.len(), 1);
    let trace = traces.remove(0);
    assert_eq!(trace.root, Root::Api);
    assert_eq!(trace.request_id, "request-1");
    assert!(trace.events.iter().all(|event| {
        event.root == trace.root
            && event.invocation_id == trace.invocation_id
            && event.request_id == trace.request_id
            && event.epoch_id == trace.events[0].epoch_id
    }));
    trace
}

fn database_path() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "authorization-api-concrete-pool-{}-{nonce}.sqlite",
        std::process::id()
    ))
}

fn request(route_id: &str) -> InboundAuthorizationRequest {
    InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-1".into(),
        route_id: route_id.into(),
    }
}

#[tokio::test]
async fn production_pool_distinguishes_ready_allow_gate_deny_and_policy_deny() {
    let path = database_path();
    migrate_database(&path).expect("migrate");
    let expires_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_secs()
        + 60;
    Connection::open(&path)
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

    let runtime = authorization_runtime_from_database(
        &path,
        AuthorizationApiConfig::new(2, Duration::from_millis(50), Duration::from_millis(250))
            .expect("config"),
    )
    .expect("concrete runtime");
    #[cfg(feature = "trace")]
    runtime.enable_trace_collection();
    assert_eq!(
        runtime.authorize(request("documents.read")).await,
        Ok(BinaryAuthorizationDecision::Allow)
    );
    #[cfg(feature = "trace")]
    assert_eq!(
        one_trace(&runtime)
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
    assert_eq!(
        runtime.authorize(request("documents.write")).await,
        Ok(BinaryAuthorizationDecision::Deny)
    );
    #[cfg(feature = "trace")]
    assert_eq!(
        one_trace(&runtime)
            .events
            .iter()
            .map(|event| event.kind)
            .collect::<Vec<_>>(),
        [EventKind::EpochOpened,]
    );
    Connection::open(&path)
        .expect("writer")
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
                  evidence_revision, authenticated_subject_id)
             SELECT 2, evidence_ref, session_id, trusted, revoked, expires_at,
                    evidence_revision, authenticated_subject_id
             FROM auth_authentication_evidence WHERE evidence_row_id = 1;",
        )
        .expect("duplicate qualifying authentication row");
    assert_eq!(
        runtime.authorize(request("documents.read")).await,
        Ok(BinaryAuthorizationDecision::Deny)
    );
    #[cfg(feature = "trace")]
    assert_eq!(
        one_trace(&runtime)
            .events
            .iter()
            .map(|event| event.kind)
            .collect::<Vec<_>>(),
        [EventKind::EpochOpened]
    );
    Connection::open(&path)
        .expect("writer")
        .execute(
            "DELETE FROM auth_authentication_evidence WHERE evidence_row_id = 2",
            [],
        )
        .expect("remove duplicate authentication row");

    Connection::open(&path)
        .expect("writer")
        .execute_batch(
            "INSERT INTO auth_route_authorization_bindings
                 (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
                  complete, enabled, binding_revision)
             SELECT 2, route_id, resource, action, scope, scope_evidence_ref,
                    complete, enabled, binding_revision
             FROM auth_route_authorization_bindings WHERE binding_row_id = 1;",
        )
        .expect("duplicate qualifying route row");
    assert_eq!(
        runtime.authorize(request("documents.read")).await,
        Ok(BinaryAuthorizationDecision::Deny)
    );
    #[cfg(feature = "trace")]
    assert_eq!(
        one_trace(&runtime)
            .events
            .iter()
            .map(|event| event.kind)
            .collect::<Vec<_>>(),
        [EventKind::EpochOpened]
    );
    Connection::open(&path)
        .expect("writer")
        .execute(
            "DELETE FROM auth_route_authorization_bindings WHERE binding_row_id = 2",
            [],
        )
        .expect("remove duplicate route row");

    Connection::open(&path)
        .expect("writer")
        .execute(
            "UPDATE auth_sessions SET status = 'inactive' WHERE session_id = 'session-1'",
            [],
        )
        .expect("force post-READY policy denial");
    let mut probe = SqliteAdmissionService::open(&path).expect("admission probe");
    assert_eq!(
        probe.with_ready(request("documents.read"), authorize_ready_decision),
        Ok(AdmissionOutcome::Ready(BinaryAuthorizationDecision::Deny))
    );
    assert_eq!(
        runtime.authorize(request("documents.read")).await,
        Ok(BinaryAuthorizationDecision::Deny)
    );
    #[cfg(feature = "trace")]
    assert_eq!(
        one_trace(&runtime)
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
    assert_eq!(runtime.metrics().requests, 5);
    drop(runtime);
    std::fs::remove_file(&path).expect("remove test database");
    let _ = std::fs::remove_file(format!("{}-wal", path.display()));
    let _ = std::fs::remove_file(format!("{}-shm", path.display()));
}
