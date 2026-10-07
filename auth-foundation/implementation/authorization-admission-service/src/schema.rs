//! Schema setup is an explicit operation; admission startup never migrates.

use std::path::Path;

use auth_foundation_authorization_state_model::PortFailure;
use rusqlite::{Connection, Transaction, TransactionBehavior};

pub const SCHEMA_V2: &str =
    include_str!("../../authorization-schema/migrations/0002_auth_service_epoch.sql");
pub(crate) const AUTHORIZATION_SCHEMA_V1: &str =
    include_str!("../../authorization-schema/migrations/0001_auth_state.sql");
pub(crate) const TRUSTED_INPUT_SCHEMA_V1: &str =
    include_str!("../../authorization-schema/migrations/0001_trusted_inputs.sql");
const SCHEMA_VERSION: i64 = 2;

pub fn migrate_database(path: impl AsRef<Path>) -> Result<(), PortFailure> {
    let mut connection = Connection::open(path).map_err(|_| PortFailure)?;
    migrate_connection(&mut connection)
}

pub fn migrate_connection(connection: &mut Connection) -> Result<(), PortFailure> {
    connection
        .execute_batch("PRAGMA query_only = OFF; PRAGMA foreign_keys = ON;")
        .map_err(|_| PortFailure)?;
    let version = schema_version(connection)?;
    if version > SCHEMA_VERSION {
        return Err(PortFailure);
    }
    if version == SCHEMA_VERSION {
        return validate_schema(connection);
    }

    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| PortFailure)?;
    if version == 0 {
        transaction
            .execute_batch(SCHEMA_V2)
            .map_err(|_| PortFailure)?;
    } else {
        transaction
            .execute_batch(AUTHORIZATION_SCHEMA_V1)
            .map_err(|_| PortFailure)?;
        transaction
            .execute_batch(TRUSTED_INPUT_SCHEMA_V1)
            .map_err(|_| PortFailure)?;
        apply_v1_to_v2(&transaction)?;
    }
    transaction.commit().map_err(|_| PortFailure)?;
    validate_schema(connection)
}

pub fn configure_runtime_connection(connection: &Connection) -> Result<(), PortFailure> {
    connection
        .execute_batch(
            "PRAGMA foreign_keys = ON;
         PRAGMA trusted_schema = OFF;
         PRAGMA query_only = ON;",
        )
        .map_err(|_| PortFailure)?;
    let query_only = connection
        .query_row("PRAGMA query_only", [], |row| row.get::<_, i64>(0))
        .map_err(|_| PortFailure)?;
    let foreign_keys = connection
        .query_row("PRAGMA foreign_keys", [], |row| row.get::<_, i64>(0))
        .map_err(|_| PortFailure)?;
    if query_only == 1 && foreign_keys == 1 {
        Ok(())
    } else {
        Err(PortFailure)
    }
}

fn schema_version(connection: &Connection) -> Result<i64, PortFailure> {
    connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|_| PortFailure)
}

pub fn validate_schema(connection: &Connection) -> Result<(), PortFailure> {
    if schema_version(connection)? != SCHEMA_VERSION {
        return Err(PortFailure);
    }
    for (table_info_sql, columns) in required_schema() {
        for column in columns {
            if !has_column(connection, table_info_sql, column)? {
                return Err(PortFailure);
            }
        }
    }
    Ok(())
}

fn apply_v1_to_v2(transaction: &Transaction<'_>) -> Result<(), PortFailure> {
    for (table_info_sql, column, add_column_sql) in [
        (
            "PRAGMA table_info(auth_authentication_evidence)",
            "evidence_revision",
            "ALTER TABLE auth_authentication_evidence ADD COLUMN evidence_revision INTEGER NOT NULL DEFAULT 0 CHECK (evidence_revision >= 0);",
        ),
        (
            "PRAGMA table_info(auth_authentication_evidence)",
            "authenticated_subject_id",
            "ALTER TABLE auth_authentication_evidence ADD COLUMN authenticated_subject_id TEXT NOT NULL DEFAULT '';",
        ),
        (
            "PRAGMA table_info(auth_route_authorization_bindings)",
            "binding_revision",
            "ALTER TABLE auth_route_authorization_bindings ADD COLUMN binding_revision INTEGER NOT NULL DEFAULT 0 CHECK (binding_revision >= 0);",
        ),
        (
            "PRAGMA table_info(auth_session_active_roles)",
            "authorization_revision",
            "ALTER TABLE auth_session_active_roles ADD COLUMN authorization_revision INTEGER NOT NULL DEFAULT 0 CHECK (authorization_revision >= 0);",
        ),
        (
            "PRAGMA table_info(auth_role_permissions)",
            "authorization_revision",
            "ALTER TABLE auth_role_permissions ADD COLUMN authorization_revision INTEGER NOT NULL DEFAULT 0 CHECK (authorization_revision >= 0);",
        ),
    ] {
        if !has_column(transaction, table_info_sql, column)? {
            transaction
                .execute_batch(add_column_sql)
                .map_err(|_| PortFailure)?;
        }
    }
    transaction
        .execute_batch("PRAGMA user_version = 2;")
        .map_err(|_| PortFailure)
}

fn required_schema() -> [(&'static str, &'static [&'static str]); 8] {
    [
        (
            "PRAGMA table_info(auth_authentication_evidence)",
            &[
                "evidence_row_id",
                "evidence_ref",
                "session_id",
                "trusted",
                "revoked",
                "expires_at",
                "evidence_revision",
                "authenticated_subject_id",
            ],
        ),
        (
            "PRAGMA table_info(auth_route_authorization_bindings)",
            &[
                "binding_row_id",
                "route_id",
                "resource",
                "action",
                "scope",
                "scope_evidence_ref",
                "complete",
                "enabled",
                "binding_revision",
            ],
        ),
        (
            "PRAGMA table_info(auth_sessions)",
            &[
                "session_row_id",
                "session_id",
                "user_id",
                "status",
                "authorization_revision",
                "expires_at",
            ],
        ),
        ("PRAGMA table_info(auth_roles)", &["role_id"]),
        (
            "PRAGMA table_info(auth_session_active_roles)",
            &["session_row_id", "role_id", "authorization_revision"],
        ),
        (
            "PRAGMA table_info(auth_role_permissions)",
            &[
                "role_id",
                "resource",
                "action",
                "scope",
                "authorization_revision",
            ],
        ),
        (
            "PRAGMA table_info(auth_authorization_revisions)",
            &["session_id", "revision"],
        ),
        (
            "PRAGMA table_info(auth_scope_evidence)",
            &["evidence_ref", "resource", "action", "scope", "trusted"],
        ),
    ]
}

fn has_column(
    connection: &Connection,
    table_info_sql: &str,
    column: &str,
) -> Result<bool, PortFailure> {
    let mut statement = connection
        .prepare(table_info_sql)
        .map_err(|_| PortFailure)?;
    let names = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|_| PortFailure)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| PortFailure)?;
    Ok(names.iter().any(|name| name == column))
}
