use std::cell::Cell;
use std::num::NonZeroU64;

use auth_foundation_authorization_ready_authority::{
    AdmissionOutcome, ReadyAuthorization, with_ready_in_transaction,
};
use auth_foundation_authorization_ready_decision::authorize;
use auth_foundation_authorization_state_model::{
    BinaryAuthorizationDecision, InboundAuthorizationRequest,
};
use rusqlite::Connection;

const SCHEMA: &str =
    include_str!("../../authorization-schema/migrations/0002_auth_service_epoch.sql");

thread_local! {
    static DECISION_CALLS: Cell<usize> = const { Cell::new(0) };
}

fn counted_authorize(ready: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision {
    DECISION_CALLS.with(|calls| calls.set(calls.get() + 1));
    authorize(ready)
}

fn seeded_connection() -> Connection {
    let connection = Connection::open_in_memory().unwrap();
    connection.execute_batch(SCHEMA).unwrap();
    connection
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
                  evidence_revision, authenticated_subject_id)
             VALUES (1, 'auth-1', 'session-1', 1, 0, 101, 3, 'user-1');
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
             VALUES (1, 'session-1', 'user-1', 'active', 7, 101);
             INSERT INTO auth_session_active_roles
                 (session_row_id, role_id, authorization_revision)
             VALUES (1, 'reader', 7);
             INSERT INTO auth_authorization_revisions (session_id, revision)
             VALUES ('session-1', 7);
             INSERT INTO auth_scope_evidence (evidence_ref, resource, action, scope, trusted)
             VALUES ('scope-1', 'documents', 'read', 'tenant-7', 1);",
        )
        .unwrap();
    connection
}

fn request() -> InboundAuthorizationRequest {
    InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-1".into(),
        route_id: "documents.read".into(),
    }
}

fn decide(connection: &mut Connection) -> (AdmissionOutcome<BinaryAuthorizationDecision>, usize) {
    let transaction = connection.transaction().unwrap();
    DECISION_CALLS.with(|calls| calls.set(0));
    let result = with_ready_in_transaction(
        &transaction,
        &request(),
        NonZeroU64::new(1).unwrap(),
        100,
        counted_authorize,
    );
    transaction.rollback().unwrap();
    (result, DECISION_CALLS.with(Cell::get))
}

#[test]
fn admitted_exact_grant_allows_once() {
    let mut connection = seeded_connection();
    let (result, calls) = decide(&mut connection);
    assert_eq!(
        result,
        AdmissionOutcome::Ready(BinaryAuthorizationDecision::Allow)
    );
    assert_eq!(calls, 1);
}

#[test]
fn admitted_command_with_no_active_grant_is_policy_deny_once() {
    let mut connection = seeded_connection();
    connection
        .execute("UPDATE auth_sessions SET status = 'inactive'", [])
        .unwrap();
    let (result, calls) = decide(&mut connection);
    assert_eq!(
        result,
        AdmissionOutcome::Ready(BinaryAuthorizationDecision::Deny)
    );
    assert_eq!(calls, 1);
}

#[test]
fn duplicate_gate_input_never_calls_decision() {
    let mut connection = seeded_connection();
    connection
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
                  evidence_revision, authenticated_subject_id)
             VALUES (2, 'auth-1', 'session-1', 1, 0, 101, 3, 'user-1');",
        )
        .unwrap();
    let (result, calls) = decide(&mut connection);
    assert_eq!(result, AdmissionOutcome::Denied);
    assert_eq!(calls, 0);
}
