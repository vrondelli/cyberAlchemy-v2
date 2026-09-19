use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use auth_foundation_authorization_service::{
    MAX_REFERENCE_BYTES, SqliteAuthService, migrate_connection, migrate_database,
};
use auth_foundation_runtime_adapter::{BinaryAuthorizationDecision, DecisionClock, PortFailure};
use auth_foundation_sqlite_provider::SCHEMA_V1 as AUTHORIZATION_SCHEMA_V1;
use auth_foundation_trusted_boundary::InboundAuthorizationRequest;
use auth_foundation_trusted_input_provider::SCHEMA_V1 as TRUSTED_INPUT_SCHEMA_V1;
use rusqlite::Connection;

#[derive(Clone, Copy)]
struct FixedClock(u64);

impl DecisionClock for FixedClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        Ok(self.0)
    }
}

#[derive(Clone, Copy)]
struct FailedClock;

impl DecisionClock for FailedClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        Err(PortFailure)
    }
}

fn request() -> InboundAuthorizationRequest {
    InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-1".into(),
        route_id: "documents.read".into(),
    }
}

fn fixture() -> PathBuf {
    let path = unique_database_path();
    migrate_database(&path).expect("prepare unified schema");
    Connection::open(&path)
        .expect("open fixture")
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
        .expect("seed unified auth database");
    path
}

fn run(mutation: &str, time: u64) -> BinaryAuthorizationDecision {
    let path = fixture();
    if !mutation.is_empty() {
        Connection::open(&path)
            .expect("open mutation connection")
            .execute_batch(mutation)
            .expect("apply mutation");
    }
    let decision = SqliteAuthService::open(&path, FixedClock(time))
        .expect("open service")
        .authorize(request());
    remove_database(&path);
    decision
}

#[test]
fn one_complete_epoch_allows() {
    assert_eq!(run("", 100), BinaryAuthorizationDecision::Allow);
}

#[test]
fn missing_untrusted_revoked_or_disabled_trusted_input_denies() {
    for mutation in [
        "DELETE FROM auth_authentication_evidence;",
        "UPDATE auth_authentication_evidence SET trusted = 0;",
        "UPDATE auth_authentication_evidence SET revoked = 1;",
        // Simulate corrupt storage that bypassed the normal schema guard.
        "PRAGMA ignore_check_constraints = ON;
         UPDATE auth_authentication_evidence SET authenticated_subject_id = '';
         PRAGMA ignore_check_constraints = OFF;",
        "UPDATE auth_authentication_evidence SET expires_at = 'not-an-integer';",
        "UPDATE auth_route_authorization_bindings SET enabled = 0;",
        "UPDATE auth_route_authorization_bindings SET complete = 0;",
        "DELETE FROM auth_route_authorization_bindings;",
    ] {
        assert_eq!(run(mutation, 100), BinaryAuthorizationDecision::Deny);
    }
    assert_eq!(run("", 101), BinaryAuthorizationDecision::Deny);
}

#[test]
fn duplicate_trusted_input_rows_deny() {
    for mutation in [
        "INSERT INTO auth_authentication_evidence
             (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
              evidence_revision, authenticated_subject_id)
         VALUES (2, 'auth-1', 'session-1', 1, 0, 101, 4, 'user-1');",
        "INSERT INTO auth_route_authorization_bindings
             (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
              complete, enabled, binding_revision)
         VALUES (2, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1, 6);",
    ] {
        assert_eq!(run(mutation, 100), BinaryAuthorizationDecision::Deny);
    }
}

#[test]
fn subject_and_revision_join_failures_deny() {
    for mutation in [
        "UPDATE auth_sessions SET user_id = 'user-2';",
        "UPDATE auth_authorization_revisions SET revision = 8;",
        "UPDATE auth_session_active_roles SET authorization_revision = 6;",
        "UPDATE auth_role_permissions SET authorization_revision = 6;",
    ] {
        assert_eq!(run(mutation, 100), BinaryAuthorizationDecision::Deny);
    }
}

#[test]
fn inactive_revoked_expired_missing_or_ambiguous_session_denies() {
    for mutation in [
        "UPDATE auth_sessions SET status = 'inactive';",
        "UPDATE auth_sessions SET status = 'revoked';",
        "UPDATE auth_sessions SET expires_at = 100;",
        "DELETE FROM auth_sessions;",
        "INSERT INTO auth_sessions
             (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
         VALUES (2, 'session-1', 'user-1', 'active', 7, 101);",
    ] {
        assert_eq!(run(mutation, 100), BinaryAuthorizationDecision::Deny);
    }
}

#[test]
fn permission_and_scope_evidence_mismatches_deny() {
    for mutation in [
        "UPDATE auth_role_permissions SET resource = 'invoices';",
        "UPDATE auth_role_permissions SET action = 'write';",
        "UPDATE auth_role_permissions SET scope = 'tenant-8';",
        "DELETE FROM auth_scope_evidence;",
        "UPDATE auth_scope_evidence SET trusted = 0;",
        "UPDATE auth_scope_evidence SET resource = 'invoices';",
        "UPDATE auth_scope_evidence SET action = 'write';",
        "UPDATE auth_scope_evidence SET scope = 'tenant-8';",
    ] {
        assert_eq!(run(mutation, 100), BinaryAuthorizationDecision::Deny);
    }
}

#[test]
fn duplicate_scope_evidence_denies() {
    assert_eq!(
        run(
            "ALTER TABLE auth_scope_evidence RENAME TO original_scope_evidence;
             CREATE TABLE auth_scope_evidence AS SELECT * FROM original_scope_evidence;
             DROP TABLE original_scope_evidence;
             INSERT INTO auth_scope_evidence (evidence_ref, resource, action, scope, trusted)
             VALUES ('scope-1', 'documents', 'read', 'tenant-7', 1);",
            100,
        ),
        BinaryAuthorizationDecision::Deny,
        "AUTH_DUPLICATE_SCOPE_ACCEPTED"
    );
}

#[test]
fn authentication_expiry_is_exclusive() {
    assert_eq!(run("", 100), BinaryAuthorizationDecision::Allow);
    // Keep the session current to isolate the authentication-evidence predicate.
    assert_eq!(
        run("UPDATE auth_sessions SET expires_at = 200;", 101),
        BinaryAuthorizationDecision::Deny,
        "AUTH_EXPIRED_EVIDENCE_ACCEPTED"
    );
}

#[test]
fn missing_authorization_revision_denies() {
    assert_eq!(
        run("DELETE FROM auth_authorization_revisions;", 100),
        BinaryAuthorizationDecision::Deny,
        "AUTH_MISSING_REVISION_ACCEPTED"
    );
}

#[test]
fn decision_clock_is_read_once_per_request() {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct AdvancingClock(Arc<AtomicUsize>);
    impl DecisionClock for AdvancingClock {
        fn decision_time(&self) -> Result<u64, PortFailure> {
            Ok(100 + self.0.fetch_add(1, Ordering::SeqCst) as u64)
        }
    }

    let path = fixture();
    let calls = Arc::new(AtomicUsize::new(0));
    let mut service =
        SqliteAuthService::open(&path, AdvancingClock(Arc::clone(&calls))).expect("service");
    assert_eq!(
        service.authorize(request()),
        BinaryAuthorizationDecision::Allow
    );
    assert_eq!(calls.load(Ordering::SeqCst), 1, "AUTH_MULTIPLE_CLOCK_READS");
    assert_eq!(
        service.authorize(request()),
        BinaryAuthorizationDecision::Deny
    );
    assert_eq!(calls.load(Ordering::SeqCst), 2, "AUTH_MULTIPLE_CLOCK_READS");
    drop(service);
    remove_database(&path);
}

#[test]
fn invalid_or_oversized_inbound_identifiers_deny() {
    let path = fixture();
    let mut service = SqliteAuthService::open(&path, FixedClock(100)).expect("service");
    for candidate in [
        InboundAuthorizationRequest {
            request_id: String::new(),
            ..request()
        },
        InboundAuthorizationRequest {
            authentication_evidence_ref: String::new(),
            ..request()
        },
        InboundAuthorizationRequest {
            route_id: "documents\nread".into(),
            ..request()
        },
        InboundAuthorizationRequest {
            route_id: "x".repeat(MAX_REFERENCE_BYTES + 1),
            ..request()
        },
    ] {
        assert_eq!(
            service.authorize(candidate),
            BinaryAuthorizationDecision::Deny
        );
    }
    remove_database(&path);
}

#[test]
fn clock_and_live_provider_failures_deny() {
    let path = fixture();
    let mut failed_clock = SqliteAuthService::open(&path, FailedClock).expect("service");
    assert_eq!(
        failed_clock.authorize(request()),
        BinaryAuthorizationDecision::Deny
    );
    drop(failed_clock);

    let mut service = SqliteAuthService::open(&path, FixedClock(100)).expect("service");
    Connection::open(&path)
        .expect("writer")
        .execute("DROP TABLE auth_authentication_evidence", [])
        .expect("break provider after startup");
    assert_eq!(
        service.authorize(request()),
        BinaryAuthorizationDecision::Deny
    );
    remove_database(&path);
}

#[test]
fn explicit_migration_is_idempotent_upgrades_v1_and_rejects_unknown_newer_schema() {
    let fresh = Connection::open_in_memory().expect("fresh database");
    assert!(SqliteAuthService::from_connection(fresh, FixedClock(100)).is_err());

    let mut v1 = Connection::open_in_memory().expect("v1 database");
    v1.execute_batch(AUTHORIZATION_SCHEMA_V1)
        .expect("authorization v1");
    v1.execute_batch(TRUSTED_INPUT_SCHEMA_V1)
        .expect("trusted input v1");
    migrate_connection(&mut v1).expect("upgrade v1");
    migrate_connection(&mut v1).expect("idempotent v2");
    assert_eq!(
        v1.query_row("PRAGMA user_version", [], |row| row.get::<_, i64>(0))
            .expect("version"),
        2
    );
    assert!(SqliteAuthService::from_connection(v1, FixedClock(100)).is_ok());

    let mut newer = Connection::open_in_memory().expect("newer database");
    newer
        .execute_batch("PRAGMA user_version = 3;")
        .expect("newer version");
    assert!(migrate_connection(&mut newer).is_err());
}

#[test]
fn normal_open_does_not_create_or_migrate_a_database() {
    let path = unique_database_path();
    assert!(SqliteAuthService::open(&path, FixedClock(100)).is_err());
    assert!(
        !path.exists(),
        "validation-only open must not create a database"
    );

    Connection::open(&path).expect("create empty database");
    assert!(SqliteAuthService::open(&path, FixedClock(100)).is_err());
    remove_database(&path);
}

#[test]
fn file_backed_database_reopens_and_each_call_gets_a_fresh_epoch() {
    let path = fixture();
    for _ in 0..2 {
        let mut service = SqliteAuthService::open(&path, FixedClock(100)).expect("service");
        assert_eq!(
            service.authorize(request()),
            BinaryAuthorizationDecision::Allow
        );
        assert_eq!(
            service.authorize(request()),
            BinaryAuthorizationDecision::Allow
        );
    }
    remove_database(&path);
}

fn unique_database_path() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "auth-service-{}-{nonce}.sqlite",
        std::process::id()
    ))
}

fn remove_database(path: &Path) {
    let _ = std::fs::remove_file(path);
    let _ = std::fs::remove_file(PathBuf::from(format!("{}-wal", path.display())));
    let _ = std::fs::remove_file(PathBuf::from(format!("{}-shm", path.display())));
}
