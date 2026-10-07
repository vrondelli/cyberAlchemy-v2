use std::cell::Cell;
use std::num::NonZeroU64;

use auth_foundation_authorization_ready_authority::{
    AdmissionOutcome, PreparationFailure, ReadyAuthorization, ReadyStateFailure,
    with_ready_in_transaction,
};
use auth_foundation_authorization_state_model::InboundAuthorizationRequest;
use rusqlite::Connection;

const SCHEMA: &str =
    include_str!("../../authorization-schema/migrations/0002_auth_service_epoch.sql");

thread_local! {
    static READY_CALLS: Cell<usize> = const { Cell::new(0) };
}

fn observe_ready(ready: ReadyAuthorization<'_, '_>) -> String {
    READY_CALLS.with(|calls| calls.set(calls.get() + 1));
    assert_eq!(ready.evaluation_epoch_id(), 42);
    assert_eq!(ready.decision_time(), 100);
    assert!(ready.is_transaction_bound());
    ready.command().request_id.clone()
}

fn observe_transaction_ready(ready: ReadyAuthorization<'_, '_>) {
    READY_CALLS.with(|calls| calls.set(calls.get() + 1));
    assert_eq!(ready.command().session_id, "session-1");
    assert_eq!(ready.command().required_permission.scope, "tenant-8");
    assert_eq!(ready.command().scope_evidence_ref, "scope-1");
    assert_eq!(ready.authenticated_subject_id(), "user-1");
    assert_eq!(ready.authentication_evidence_revision(), 3);
    assert_eq!(ready.route_binding_revision(), 5);
    assert_eq!(ready.state().sessions().len(), 1);
    assert!(ready.state().is_complete());
}

fn request() -> InboundAuthorizationRequest {
    InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-1".into(),
        route_id: "documents.read".into(),
    }
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

fn evaluate(
    connection: &mut Connection,
    request: &InboundAuthorizationRequest,
) -> (AdmissionOutcome<()>, usize) {
    let transaction = connection.transaction().unwrap();
    READY_CALLS.with(|calls| calls.set(0));
    let result = with_ready_in_transaction(
        &transaction,
        request,
        NonZeroU64::new(42).unwrap(),
        100,
        observe_ready,
    );
    transaction.rollback().unwrap();
    let entries = READY_CALLS.with(Cell::get);
    let result = match result {
        AdmissionOutcome::Ready(request_id) => {
            assert_eq!(request_id, request.request_id);
            AdmissionOutcome::Ready(())
        }
        AdmissionOutcome::Denied => AdmissionOutcome::Denied,
        AdmissionOutcome::PreparationFailed(error) => AdmissionOutcome::PreparationFailed(error),
        AdmissionOutcome::ReadyStateFailed(error) => AdmissionOutcome::ReadyStateFailed(error),
    };
    (result, entries)
}

#[test]
fn ready_owns_exact_same_row_command_and_state_in_actual_transaction() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    transaction
        .execute(
            "UPDATE auth_route_authorization_bindings SET scope = 'tenant-8' WHERE binding_row_id = 1",
            [],
        )
        .unwrap();
    transaction
        .execute(
            "UPDATE auth_role_permissions SET scope = 'tenant-8' WHERE role_id = 'reader'",
            [],
        )
        .unwrap();
    transaction
        .execute(
            "UPDATE auth_scope_evidence SET scope = 'tenant-8' WHERE evidence_ref = 'scope-1'",
            [],
        )
        .unwrap();
    READY_CALLS.with(|calls| calls.set(0));
    let outcome = with_ready_in_transaction(
        &transaction,
        &request(),
        NonZeroU64::new(7).unwrap(),
        100,
        observe_transaction_ready,
    );
    assert_eq!(outcome, AdmissionOutcome::Ready(()));
    assert_eq!(READY_CALLS.with(Cell::get), 1);
}

#[test]
fn blank_request_id_denies_before_any_reader() {
    let mut connection = Connection::open_in_memory().unwrap();
    let mut inbound = request();
    inbound.request_id.clear();
    let (outcome, entries) = evaluate(&mut connection, &inbound);
    assert_eq!(outcome, AdmissionOutcome::Denied);
    assert_eq!(entries, 0);
}

#[test]
fn representable_nonempty_long_fields_do_not_change_the_gate_predicate() {
    let mut connection = seeded_connection();
    let long_session = "s".repeat(257);
    let long_action = "a".repeat(257);
    connection
        .execute(
            "UPDATE auth_authentication_evidence SET session_id = ?1",
            [&long_session],
        )
        .unwrap();
    connection
        .execute("UPDATE auth_sessions SET session_id = ?1", [&long_session])
        .unwrap();
    connection
        .execute(
            "UPDATE auth_authorization_revisions SET session_id = ?1",
            [&long_session],
        )
        .unwrap();
    connection
        .execute(
            "UPDATE auth_route_authorization_bindings SET action = ?1",
            [&long_action],
        )
        .unwrap();
    connection
        .execute(
            "UPDATE auth_role_permissions SET action = ?1",
            [&long_action],
        )
        .unwrap();
    connection
        .execute("UPDATE auth_scope_evidence SET action = ?1", [&long_action])
        .unwrap();
    let mut inbound = request();
    inbound.request_id = "r".repeat(257);
    let (outcome, entries) = evaluate(&mut connection, &inbound);
    assert_eq!(outcome, AdmissionOutcome::Ready(()));
    assert_eq!(entries, 1);
}

#[test]
fn duplicate_qualifying_entries_deny_without_continuation() {
    for duplicate in [
        "INSERT INTO auth_authentication_evidence
             (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
              evidence_revision, authenticated_subject_id)
         VALUES (2, 'auth-1', 'session-1', 1, 0, 101, 3, 'user-1');",
        "INSERT INTO auth_route_authorization_bindings
             (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
              complete, enabled, binding_revision)
         VALUES (2, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1, 5);",
    ] {
        let mut connection = seeded_connection();
        connection.execute_batch(duplicate).unwrap();
        let (outcome, entries) = evaluate(&mut connection, &request());
        assert_eq!(outcome, AdmissionOutcome::Denied);
        assert_eq!(entries, 0);
    }
}

#[test]
fn nonqualifying_siblings_preserve_order_but_do_not_defeat_unique_ready() {
    let mut connection = seeded_connection();
    connection
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
             (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
              evidence_revision, authenticated_subject_id)
         VALUES (2, 'auth-1', 'session-other', 0, 0, 101, 4, 'user-2');
         INSERT INTO auth_route_authorization_bindings
             (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
              complete, enabled, binding_revision)
         VALUES (2, 'documents.read', 'documents', 'read', 'tenant-9', 'scope-other', 0, 1, 6);",
        )
        .unwrap();
    let (outcome, entries) = evaluate(&mut connection, &request());
    assert_eq!(outcome, AdmissionOutcome::Ready(()));
    assert_eq!(entries, 1);
}

#[test]
fn expired_revoked_and_disabled_rows_deny_without_continuation() {
    for mutation in [
        "UPDATE auth_authentication_evidence SET revoked = 1;",
        "UPDATE auth_authentication_evidence SET expires_at = 100;",
        "UPDATE auth_route_authorization_bindings SET enabled = 0;",
        "UPDATE auth_route_authorization_bindings SET complete = 0;",
    ] {
        let mut connection = seeded_connection();
        connection.execute_batch(mutation).unwrap();
        let (outcome, entries) = evaluate(&mut connection, &request());
        assert_eq!(outcome, AdmissionOutcome::Denied);
        assert_eq!(entries, 0);
    }
}

#[test]
fn trusted_input_errors_and_post_ready_metadata_errors_are_distinct() {
    let mut connection = Connection::open_in_memory().unwrap();
    let (outcome, entries) = evaluate(&mut connection, &request());
    assert_eq!(
        outcome,
        AdmissionOutcome::PreparationFailed(PreparationFailure::TrustedInputRead)
    );
    assert_eq!(entries, 0);

    let mut connection = seeded_connection();
    connection
        .execute_batch(
            "PRAGMA ignore_check_constraints = ON;
         UPDATE auth_authentication_evidence SET evidence_revision = -1;
         PRAGMA ignore_check_constraints = OFF;",
        )
        .unwrap();
    let (outcome, entries) = evaluate(&mut connection, &request());
    assert_eq!(
        outcome,
        AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::MetadataRead)
    );
    assert_eq!(entries, 0);
}

#[test]
fn post_ready_state_read_and_join_failures_are_not_gate_denials() {
    let mut connection = seeded_connection();
    connection
        .execute("DELETE FROM auth_authorization_revisions", [])
        .unwrap();
    let (outcome, entries) = evaluate(&mut connection, &request());
    assert_eq!(
        outcome,
        AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::StateRead)
    );
    assert_eq!(entries, 0);

    let mut connection = seeded_connection();
    connection
        .execute(
            "UPDATE auth_sessions SET user_id = 'different-user' WHERE session_row_id = 1",
            [],
        )
        .unwrap();
    let (outcome, entries) = evaluate(&mut connection, &request());
    assert_eq!(
        outcome,
        AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::StateJoin)
    );
    assert_eq!(entries, 0);
}
