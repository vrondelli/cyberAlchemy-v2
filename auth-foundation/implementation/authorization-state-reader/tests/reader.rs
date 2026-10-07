use auth_foundation_authorization_state_model::{AuthorizationCommand, Permission};
use auth_foundation_authorization_state_reader::{
    SCHEMA_V1, resolve_authorization_state_in_transaction,
};
use rusqlite::Connection;

fn command() -> AuthorizationCommand {
    AuthorizationCommand {
        request_id: "request-1".into(),
        session_id: "session-1".into(),
        required_permission: Permission {
            resource: "invoice".into(),
            action: "read".into(),
            scope: "tenant-7".into(),
        },
        scope_evidence_ref: "scope-evidence-1".into(),
    }
}

fn seeded_connection() -> Connection {
    let connection = Connection::open_in_memory().unwrap();
    connection.execute_batch(SCHEMA_V1).unwrap();
    connection
        .execute_batch(
            "INSERT INTO auth_roles (role_id) VALUES ('reader');
             INSERT INTO auth_role_permissions (role_id, resource, action, scope)
             VALUES ('reader', 'invoice', 'read', 'tenant-7');
             INSERT INTO auth_sessions
                 (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
             VALUES (1, 'session-1', 'user-1', 'active', 7, 101);
             INSERT INTO auth_session_active_roles (session_row_id, role_id)
             VALUES (1, 'reader');
             INSERT INTO auth_authorization_revisions (session_id, revision)
             VALUES ('session-1', 7);
             INSERT INTO auth_scope_evidence
                 (evidence_ref, resource, action, scope, trusted)
             VALUES ('scope-evidence-1', 'invoice', 'read', 'tenant-7', 1);",
        )
        .unwrap();
    connection
}

#[test]
fn reads_complete_state_in_the_callers_transaction_without_deciding() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    let snapshot = resolve_authorization_state_in_transaction(&transaction, &command()).unwrap();
    assert_eq!(snapshot.sessions().len(), 1);
    assert_eq!(snapshot.sessions()[0].user_id, "user-1");
    assert_eq!(snapshot.current_authorization_revision(), 7);
    assert!(snapshot.trusted_scope_evidence());
    assert!(snapshot.is_complete());
    let state = snapshot.into_state();
    assert_eq!(state.roles().roles.len(), 1);
    assert_eq!(state.roles().roles[0].role_id, "reader");
}

#[test]
fn duplicate_session_and_untrusted_scope_remain_incomplete() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    transaction
        .execute_batch(
            "INSERT INTO auth_sessions
                (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
             VALUES (2, 'session-1', 'user-2', 'active', 7, 101);
             UPDATE auth_scope_evidence SET trusted = 0
             WHERE evidence_ref = 'scope-evidence-1';",
        )
        .unwrap();
    let snapshot = resolve_authorization_state_in_transaction(&transaction, &command()).unwrap();
    assert_eq!(snapshot.sessions().len(), 2);
    assert!(!snapshot.trusted_scope_evidence());
    assert!(!snapshot.is_complete());
}

#[test]
fn missing_revision_fails_closed() {
    let mut connection = seeded_connection();
    let transaction = connection.transaction().unwrap();
    transaction
        .execute(
            "DELETE FROM auth_authorization_revisions WHERE session_id = 'session-1'",
            [],
        )
        .unwrap();
    assert!(resolve_authorization_state_in_transaction(&transaction, &command()).is_err());
}
