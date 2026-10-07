use auth_foundation_authorization_state_model::{
    AuthenticationEvidenceResolver, DecisionClock, PortFailure, RouteAuthorizationBindingResolver,
};
use auth_foundation_trusted_input_provider::{
    SCHEMA_V1, SqliteAuthenticationEvidenceResolver, SqliteRouteAuthorizationBindingResolver,
    SqliteTrustedInputResolver, TrustedInputResolution,
};
use rusqlite::Connection;

#[derive(Clone, Copy)]
struct FixedClock(u64);

impl DecisionClock for FixedClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        Ok(self.0)
    }
}

fn seeded_connection() -> Connection {
    let connection = Connection::open_in_memory().expect("open SQLite memory database");
    connection.execute_batch(SCHEMA_V1).expect("apply schema");
    connection
        .execute_batch(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
             VALUES (1, 'auth-1', 'session-1', 1, 0, 101);
             INSERT INTO auth_route_authorization_bindings
                 (binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled)
             VALUES (1, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1);",
        )
        .expect("seed trusted input fixture");
    connection
}

#[test]
fn current_authentication_evidence_is_trusted() {
    let resolver =
        SqliteAuthenticationEvidenceResolver::from_connection(seeded_connection(), FixedClock(100))
            .expect("construct resolver");
    let resolved = resolver
        .resolve_authentication_evidence("auth-1")
        .expect("resolve evidence");
    assert_eq!(resolved.len(), 1);
    assert_eq!(resolved[0].session_id, "session-1");
    assert!(resolved[0].trusted);
}

#[test]
fn generated_query_constructs_complete_logical_snapshot() {
    let resolver =
        SqliteTrustedInputResolver::from_connection(seeded_connection(), FixedClock(100))
            .expect("construct combined resolver");
    let (query, resolution) = resolver
        .resolve("auth-1", "documents.read")
        .expect("resolve logical snapshot");
    assert_eq!(query.decision_time, 100);
    let TrustedInputResolution::Resolved(snapshot) = resolution else {
        panic!("valid selectors must produce the generated Resolved variant");
    };
    assert_eq!(snapshot.authentication_evidence.len(), 1);
    assert_eq!(snapshot.authentication_evidence[0].evidence_identity, 1);
    assert_eq!(snapshot.route_bindings.len(), 1);
    assert_eq!(snapshot.route_bindings[0].binding_identity, 1);
}

#[test]
fn matching_third_occurrence_is_not_truncated_in_combined_or_port_resolvers() {
    fn three_row_connection() -> Connection {
        let connection = seeded_connection();
        connection.execute_batch(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
             VALUES (2, 'auth-1', 'session-2', 0, 0, 101),
                    (3, 'auth-1', 'session-3', 1, 0, 101);
             INSERT INTO auth_route_authorization_bindings
                 (binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled)
             VALUES (2, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-2', 0, 1),
                    (3, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-3', 1, 1);",
        ).expect("insert occurrences");
        connection
    }
    let combined =
        SqliteTrustedInputResolver::from_connection(three_row_connection(), FixedClock(100))
            .expect("construct combined resolver");
    let (_, TrustedInputResolution::Resolved(snapshot)) = combined
        .resolve("auth-1", "documents.read")
        .expect("resolve")
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

    let authentication = SqliteAuthenticationEvidenceResolver::from_connection(
        three_row_connection(),
        FixedClock(100),
    )
    .expect("construct authentication resolver");
    let routes = SqliteRouteAuthorizationBindingResolver::from_connection(three_row_connection())
        .expect("construct route resolver");
    assert_eq!(
        authentication
            .resolve_authentication_evidence("auth-1")
            .expect("auth rows")
            .len(),
        3
    );
    assert_eq!(
        routes
            .resolve_route_authorization_bindings("documents.read")
            .expect("route rows")
            .len(),
        3
    );
}

#[test]
fn generated_query_denies_empty_selectors_without_authority() {
    let resolver =
        SqliteTrustedInputResolver::from_connection(seeded_connection(), FixedClock(100))
            .expect("construct combined resolver");
    assert!(matches!(
        resolver.resolve("", "documents.read").expect("resolve"),
        (_, TrustedInputResolution::Deny)
    ));
    assert!(matches!(
        resolver.resolve("auth-1", "").expect("resolve"),
        (_, TrustedInputResolution::Deny)
    ));
}

#[test]
fn expired_revoked_and_untrusted_evidence_remain_visible_but_non_admissible() {
    for mutation in [
        "UPDATE auth_authentication_evidence SET expires_at = 100",
        "UPDATE auth_authentication_evidence SET revoked = 1",
        "UPDATE auth_authentication_evidence SET trusted = 0",
    ] {
        let connection = seeded_connection();
        connection.execute(mutation, []).expect("mutate fixture");
        let resolver =
            SqliteAuthenticationEvidenceResolver::from_connection(connection, FixedClock(100))
                .expect("construct resolver");
        let resolved = resolver
            .resolve_authentication_evidence("auth-1")
            .expect("resolve evidence");
        assert_eq!(resolved.len(), 1);
        assert!(!resolved[0].trusted);
    }
}

#[test]
fn duplicate_authentication_rows_are_preserved_in_stable_order() {
    let connection = seeded_connection();
    connection
        .execute(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at)
             VALUES (2, 'auth-1', 'session-2', 1, 0, 101)",
            [],
        )
        .expect("insert duplicate");
    let resolver =
        SqliteAuthenticationEvidenceResolver::from_connection(connection, FixedClock(100))
            .expect("construct resolver");
    let resolved = resolver
        .resolve_authentication_evidence("auth-1")
        .expect("resolve evidence");
    assert_eq!(
        resolved
            .iter()
            .map(|evidence| evidence.session_id.as_str())
            .collect::<Vec<_>>(),
        vec!["session-1", "session-2"]
    );
}

#[test]
fn active_complete_route_binding_resolves_exact_server_owned_values() {
    let resolver = SqliteRouteAuthorizationBindingResolver::from_connection(seeded_connection())
        .expect("construct resolver");
    let resolved = resolver
        .resolve_route_authorization_bindings("documents.read")
        .expect("resolve binding");
    assert_eq!(resolved.len(), 1);
    assert_eq!(resolved[0].required_permission.resource, "documents");
    assert_eq!(resolved[0].required_permission.action, "read");
    assert_eq!(resolved[0].required_permission.scope, "tenant-7");
    assert_eq!(resolved[0].scope_evidence_ref, "scope-1");
    assert!(resolved[0].complete);
}

#[test]
fn disabled_or_incomplete_route_rows_remain_visible_but_non_admissible() {
    for mutation in [
        "UPDATE auth_route_authorization_bindings SET enabled = 0",
        "UPDATE auth_route_authorization_bindings SET complete = 0",
    ] {
        let connection = seeded_connection();
        connection.execute(mutation, []).expect("mutate fixture");
        let resolver = SqliteRouteAuthorizationBindingResolver::from_connection(connection)
            .expect("construct resolver");
        let resolved = resolver
            .resolve_route_authorization_bindings("documents.read")
            .expect("resolve binding");
        assert_eq!(resolved.len(), 1);
        assert!(!resolved[0].complete);
    }
}

#[test]
fn duplicate_route_rows_are_preserved_in_stable_order() {
    let connection = seeded_connection();
    connection
        .execute(
            "INSERT INTO auth_route_authorization_bindings
                 (binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled)
             VALUES (2, 'documents.read', 'documents', 'read', 'tenant-8', 'scope-2', 1, 1)",
            [],
        )
        .expect("insert duplicate");
    let resolver = SqliteRouteAuthorizationBindingResolver::from_connection(connection)
        .expect("construct resolver");
    let resolved = resolver
        .resolve_route_authorization_bindings("documents.read")
        .expect("resolve binding");
    assert_eq!(
        resolved
            .iter()
            .map(|binding| binding.required_permission.scope.as_str())
            .collect::<Vec<_>>(),
        vec!["tenant-7", "tenant-8"]
    );
}

#[test]
fn empty_missing_and_storage_failure_resolve_fail_closed() {
    let resolver =
        SqliteAuthenticationEvidenceResolver::from_connection(seeded_connection(), FixedClock(100))
            .expect("construct resolver");
    assert!(
        resolver
            .resolve_authentication_evidence("")
            .unwrap()
            .is_empty()
    );
    assert!(
        resolver
            .resolve_authentication_evidence("missing")
            .unwrap()
            .is_empty()
    );

    let broken = Connection::open_in_memory().expect("open broken database");
    broken
        .execute_batch(
            "CREATE TABLE auth_route_authorization_bindings (
                 binding_row_id INTEGER PRIMARY KEY,
                 route_id TEXT NOT NULL
             );
             PRAGMA user_version = 1;",
        )
        .expect("install incompatible route table");
    let resolver = SqliteRouteAuthorizationBindingResolver::from_connection(broken)
        .expect("construct resolver before query failure");
    assert!(
        resolver
            .resolve_route_authorization_bindings("documents.read")
            .is_err()
    );
}

#[test]
fn migration_is_idempotent_and_newer_schema_is_rejected() {
    let connection = Connection::open_in_memory().expect("open database");
    connection
        .execute_batch(SCHEMA_V1)
        .expect("first migration");
    connection
        .execute_batch(SCHEMA_V1)
        .expect("second migration");
    let resolver =
        SqliteAuthenticationEvidenceResolver::from_connection(connection, FixedClock(100));
    assert!(resolver.is_ok());

    let newer = Connection::open_in_memory().expect("open database");
    newer
        .execute_batch("PRAGMA user_version = 2;")
        .expect("set newer schema version");
    assert!(
        SqliteRouteAuthorizationBindingResolver::from_connection(newer).is_err(),
        "a provider must not silently operate on an unknown newer schema"
    );
}
