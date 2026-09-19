use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use auth_foundation_runtime_adapter::{
    AuthorizationCommand, BinaryAuthorizationDecision, DecisionClock, Permission, PortFailure,
};
use auth_foundation_sqlite_provider::{SCHEMA_V1, SqliteAuthorizationService};
use rusqlite::Connection;

#[derive(Clone, Copy)]
struct FixedClock(u64);

impl DecisionClock for FixedClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        Ok(self.0)
    }
}

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
    let connection = Connection::open_in_memory().expect("open SQLite memory database");
    connection.execute_batch(SCHEMA_V1).expect("apply schema");
    seed_allow_fixture(&connection);
    connection
}

fn seed_allow_fixture(connection: &Connection) {
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
        .expect("seed allow fixture");
}

fn service(connection: Connection, time: u64) -> SqliteAuthorizationService<FixedClock> {
    SqliteAuthorizationService::from_connection(connection, FixedClock(time))
        .expect("construct provider")
}

#[test]
fn in_memory_exact_evidence_allows() {
    let mut service = service(seeded_connection(), 100);
    assert_eq!(
        service.authorize(command()),
        BinaryAuthorizationDecision::Allow
    );
}

#[test]
fn file_backed_state_reopens_and_allows() {
    let path = unique_database_path();
    let connection = Connection::open(&path).expect("open file database");
    connection.execute_batch(SCHEMA_V1).expect("apply schema");
    seed_allow_fixture(&connection);
    drop(connection);

    let mut service =
        SqliteAuthorizationService::open(&path, FixedClock(100)).expect("open provider from file");
    assert_eq!(
        service.authorize(command()),
        BinaryAuthorizationDecision::Allow
    );
    drop(service);
    std::fs::remove_file(path).expect("remove test database");
}

#[test]
fn missing_or_duplicate_session_denies() {
    let missing = seeded_connection();
    missing
        .execute("DELETE FROM auth_sessions", [])
        .expect("remove session");
    assert_eq!(
        service(missing, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );

    let duplicate = seeded_connection();
    duplicate
        .execute(
            "INSERT INTO auth_sessions
                 (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
             VALUES (2, 'session-1', 'user-2', 'active', 7, 101)",
            [],
        )
        .expect("insert duplicate session identity");
    assert_eq!(
        service(duplicate, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn inactive_expired_or_stale_session_denies() {
    let inactive = seeded_connection();
    inactive
        .execute("UPDATE auth_sessions SET status = 'inactive'", [])
        .expect("make session inactive");
    assert_eq!(
        service(inactive, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );

    assert_eq!(
        service(seeded_connection(), 101).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );

    let stale = seeded_connection();
    stale
        .execute("UPDATE auth_authorization_revisions SET revision = 8", [])
        .expect("advance revision");
    assert_eq!(
        service(stale, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn missing_or_untrusted_scope_evidence_denies() {
    let missing = seeded_connection();
    missing
        .execute("DELETE FROM auth_scope_evidence", [])
        .expect("remove scope evidence");
    assert_eq!(
        service(missing, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );

    let untrusted = seeded_connection();
    untrusted
        .execute("UPDATE auth_scope_evidence SET trusted = 0", [])
        .expect("mark scope evidence untrusted");
    assert_eq!(
        service(untrusted, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn permission_mismatch_and_incomplete_role_relation_deny() {
    let mismatch = seeded_connection();
    mismatch
        .execute("UPDATE auth_role_permissions SET action = 'write'", [])
        .expect("change permission");
    assert_eq!(
        service(mismatch, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );

    let incomplete = seeded_connection();
    incomplete
        .execute_batch(
            "PRAGMA foreign_keys = OFF;
             DELETE FROM auth_roles WHERE role_id = 'reader';",
        )
        .expect("create incomplete role relation fixture");
    assert_eq!(
        service(incomplete, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn missing_authoritative_revision_denies() {
    let connection = seeded_connection();
    connection
        .execute("DELETE FROM auth_authorization_revisions", [])
        .expect("remove revision");
    assert_eq!(
        service(connection, 100).authorize(command()),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn transaction_start_failure_still_uses_fail_closed_adapter_path() {
    let connection = seeded_connection();
    connection
        .execute_batch("BEGIN DEFERRED TRANSACTION;")
        .expect("open outer transaction");
    let mut service = service(connection, 100);
    assert_eq!(
        service.authorize(command()),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn migration_is_idempotent_and_records_version_one() {
    let connection = Connection::open_in_memory().expect("open SQLite memory database");
    connection
        .execute_batch(SCHEMA_V1)
        .expect("first migration");
    connection
        .execute_batch(SCHEMA_V1)
        .expect("second migration");
    let version: i64 = connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .expect("read schema version");
    assert_eq!(version, 1);
}

#[test]
fn newer_schema_version_is_rejected() {
    let connection = Connection::open_in_memory().expect("open SQLite memory database");
    connection
        .execute_batch("PRAGMA user_version = 2;")
        .expect("mark database with a newer schema version");
    assert!(SqliteAuthorizationService::from_connection(connection, FixedClock(100)).is_err());
}

fn unique_database_path() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "auth-foundation-provider-{}-{nonce}.sqlite3",
        std::process::id()
    ))
}
