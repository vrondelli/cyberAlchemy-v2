use auth_foundation_trusted_input_reader::{
    SCHEMA_V1, TrustedInputResolution, resolve_in_transaction,
};
use rusqlite::Connection;

fn seeded_connection() -> Connection {
    let connection = Connection::open_in_memory().unwrap();
    connection.execute_batch(SCHEMA_V1).unwrap();
    connection.execute_batch(
        "INSERT INTO auth_authentication_evidence
            (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
         VALUES (1, 'auth-1', 'session-1', 1, 0, 101);
         INSERT INTO auth_route_authorization_bindings
            (binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled)
         VALUES (1, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1);",
    ).unwrap();
    connection
}

#[test]
fn reads_same_transaction_and_preserves_captured_time() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    transaction
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
            (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
         VALUES (2, 'auth-1', 'session-in-transaction', 1, 0, 101);",
        )
        .unwrap();
    let (query, TrustedInputResolution::Resolved(snapshot)) =
        resolve_in_transaction(&transaction, "auth-1", "documents.read", 100).unwrap()
    else {
        panic!("expected resolved snapshot")
    };
    assert_eq!(query.decision_time, 100);
    assert_eq!(snapshot.authentication_evidence[0].session_id, "session-1");
    assert_eq!(
        snapshot.authentication_evidence[1].session_id,
        "session-in-transaction"
    );
    assert_eq!(snapshot.route_bindings[0].scope_evidence_ref, "scope-1");
}

#[test]
fn duplicate_occurrences_remain_ordered_and_untruncated() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    transaction.execute_batch(
        "INSERT INTO auth_authentication_evidence
            (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
         VALUES (2, 'auth-1', 'session-2', 0, 0, 101),
                (3, 'auth-1', 'session-3', 1, 0, 101);
         INSERT INTO auth_route_authorization_bindings
            (binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled)
         VALUES (2, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-2', 0, 1),
                (3, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-3', 1, 1);",
    ).unwrap();
    let (_, TrustedInputResolution::Resolved(snapshot)) =
        resolve_in_transaction(&transaction, "auth-1", "documents.read", 100).unwrap()
    else {
        panic!("expected resolved snapshot")
    };
    assert_eq!(
        snapshot
            .authentication_evidence
            .iter()
            .map(|row| row.evidence_identity)
            .collect::<Vec<_>>(),
        vec![1, 2, 3]
    );
    assert_eq!(
        snapshot
            .route_bindings
            .iter()
            .map(|row| row.binding_identity)
            .collect::<Vec<_>>(),
        vec![1, 2, 3]
    );
}

#[test]
fn empty_selector_denies_without_querying_missing_tables() {
    let mut connection = Connection::open_in_memory().unwrap();
    let transaction = connection.transaction().unwrap();
    let (_, result) = resolve_in_transaction(&transaction, "", "documents.read", 100).unwrap();
    assert_eq!(result, TrustedInputResolution::Deny);
}

#[test]
fn nonempty_selector_fails_closed_on_missing_tables() {
    let mut connection = Connection::open_in_memory().unwrap();
    let transaction = connection.transaction().unwrap();
    assert!(resolve_in_transaction(&transaction, "auth-1", "documents.read", 100).is_err());
}

#[test]
fn malformed_negative_row_identity_fails_closed() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    transaction
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
            (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
         VALUES (-1, 'auth-1', 'invalid', 1, 0, 101);",
        )
        .unwrap();
    assert!(resolve_in_transaction(&transaction, "auth-1", "documents.read", 100).is_err());
}
