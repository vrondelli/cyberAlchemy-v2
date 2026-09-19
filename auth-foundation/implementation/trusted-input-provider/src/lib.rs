//! SQLite realizations of the two server-owned trusted command-boundary resolver ports.

use std::path::Path;

use auth_foundation_runtime_adapter::{DecisionClock, Permission, PortFailure};
use auth_foundation_trusted_boundary::{
    AuthenticatedSessionEvidence, AuthenticationEvidenceResolver, RouteAuthorizationBinding,
    RouteAuthorizationBindingResolver,
};
use auth_foundation_trusted_input_runtime::resolve_trusted_inputs;
pub use auth_foundation_trusted_input_runtime::{
    AuthenticationEvidence as LogicalAuthenticationEvidence,
    RouteAuthorizationBinding as LogicalRouteAuthorizationBinding, TrustedInputQuery,
    TrustedInputResolution, TrustedInputSnapshot,
};
use rusqlite::{Connection, OptionalExtension, Transaction};

pub const SCHEMA_V1: &str = include_str!("../migrations/0001_trusted_inputs.sql");
const SCHEMA_VERSION: i64 = 1;

pub struct SqliteTrustedInputResolver<C> {
    connection: Connection,
    clock: C,
}

impl<C> SqliteTrustedInputResolver<C>
where
    C: DecisionClock,
{
    pub fn open(path: impl AsRef<Path>, clock: C) -> Result<Self, PortFailure> {
        Self::from_connection(Connection::open(path).map_err(|_| PortFailure)?, clock)
    }

    pub fn open_in_memory(clock: C) -> Result<Self, PortFailure> {
        Self::from_connection(
            Connection::open_in_memory().map_err(|_| PortFailure)?,
            clock,
        )
    }

    pub fn from_connection(connection: Connection, clock: C) -> Result<Self, PortFailure> {
        prepare(&connection)?;
        Ok(Self { connection, clock })
    }

    pub fn resolve(
        &self,
        authentication_evidence_ref: &str,
        route_id: &str,
    ) -> Result<(TrustedInputQuery, TrustedInputResolution), PortFailure> {
        let query = TrustedInputQuery {
            authentication_evidence_ref: authentication_evidence_ref.to_owned(),
            route_id: route_id.to_owned(),
            decision_time: self.clock.decision_time()?,
        };
        if authentication_evidence_ref.is_empty() || route_id.is_empty() {
            return Ok((query, TrustedInputResolution::Deny));
        }
        let snapshot = TrustedInputSnapshot {
            authentication_evidence: self
                .logical_authentication_evidence(authentication_evidence_ref)?,
            route_bindings: self.logical_route_bindings(route_id)?,
        };
        let resolution = resolve_trusted_inputs(&query, &snapshot);
        Ok((query, resolution))
    }

    fn logical_authentication_evidence(
        &self,
        evidence_ref: &str,
    ) -> Result<Vec<LogicalAuthenticationEvidence>, PortFailure> {
        let mut statement = self
            .connection
            .prepare(
                "SELECT evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at
             FROM auth_authentication_evidence
             WHERE evidence_ref = ?1
             ORDER BY evidence_row_id
             LIMIT 2",
            )
            .map_err(|_| PortFailure)?;
        statement
            .query_map([evidence_ref], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, i64>(5)?,
                ))
            })
            .map_err(|_| PortFailure)?
            .map(|row| {
                let (identity, evidence_ref, session_id, trusted, revoked, expires_at) =
                    row.map_err(|_| PortFailure)?;
                Ok(LogicalAuthenticationEvidence {
                    evidence_identity: to_u64(identity)?,
                    evidence_ref,
                    session_id,
                    trusted: trusted == 1,
                    revoked: revoked == 1,
                    expires_at: to_u64(expires_at)?,
                })
            })
            .collect()
    }

    fn logical_route_bindings(
        &self,
        route_id: &str,
    ) -> Result<Vec<LogicalRouteAuthorizationBinding>, PortFailure> {
        let mut statement = self.connection.prepare(
            "SELECT binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled
             FROM auth_route_authorization_bindings
             WHERE route_id = ?1
             ORDER BY binding_row_id
             LIMIT 2",
        ).map_err(|_| PortFailure)?;
        statement
            .query_map([route_id], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, i64>(6)?,
                    row.get::<_, i64>(7)?,
                ))
            })
            .map_err(|_| PortFailure)?
            .map(|row| {
                let (
                    identity,
                    route_id,
                    resource,
                    action,
                    scope,
                    scope_evidence_ref,
                    complete,
                    enabled,
                ) = row.map_err(|_| PortFailure)?;
                Ok(LogicalRouteAuthorizationBinding {
                    binding_identity: to_u64(identity)?,
                    route_id,
                    resource,
                    action,
                    scope,
                    scope_evidence_ref,
                    complete: complete == 1,
                    enabled: enabled == 1,
                })
            })
            .collect()
    }
}

/// Resolve trusted inputs through a caller-owned transaction using the one
/// decision time captured for the enclosing authorization evaluation epoch.
pub fn resolve_in_transaction(
    transaction: &Transaction<'_>,
    authentication_evidence_ref: &str,
    route_id: &str,
    decision_time: u64,
) -> Result<(TrustedInputQuery, TrustedInputResolution), PortFailure> {
    let query = TrustedInputQuery {
        authentication_evidence_ref: authentication_evidence_ref.to_owned(),
        route_id: route_id.to_owned(),
        decision_time,
    };
    if authentication_evidence_ref.is_empty() || route_id.is_empty() {
        return Ok((query, TrustedInputResolution::Deny));
    }
    let snapshot = TrustedInputSnapshot {
        authentication_evidence: logical_authentication_evidence_in_transaction(
            transaction,
            authentication_evidence_ref,
        )?,
        route_bindings: logical_route_bindings_in_transaction(transaction, route_id)?,
    };
    let resolution = resolve_trusted_inputs(&query, &snapshot);
    Ok((query, resolution))
}

fn logical_authentication_evidence_in_transaction(
    transaction: &Transaction<'_>,
    evidence_ref: &str,
) -> Result<Vec<LogicalAuthenticationEvidence>, PortFailure> {
    let mut statement = transaction
        .prepare(
            "SELECT evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at
             FROM auth_authentication_evidence
             WHERE evidence_ref = ?1
             ORDER BY evidence_row_id
             LIMIT 2",
        )
        .map_err(|_| PortFailure)?;
    statement
        .query_map([evidence_ref], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, i64>(5)?,
            ))
        })
        .map_err(|_| PortFailure)?
        .map(|row| {
            let (identity, evidence_ref, session_id, trusted, revoked, expires_at) =
                row.map_err(|_| PortFailure)?;
            Ok(LogicalAuthenticationEvidence {
                evidence_identity: to_u64(identity)?,
                evidence_ref,
                session_id,
                trusted: trusted == 1,
                revoked: revoked == 1,
                expires_at: to_u64(expires_at)?,
            })
        })
        .collect()
}

fn logical_route_bindings_in_transaction(
    transaction: &Transaction<'_>,
    route_id: &str,
) -> Result<Vec<LogicalRouteAuthorizationBinding>, PortFailure> {
    let mut statement = transaction
        .prepare(
            "SELECT binding_row_id, route_id, resource, action, scope, scope_evidence_ref, complete, enabled
             FROM auth_route_authorization_bindings
             WHERE route_id = ?1
             ORDER BY binding_row_id
             LIMIT 2",
        )
        .map_err(|_| PortFailure)?;
    statement
        .query_map([route_id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
            ))
        })
        .map_err(|_| PortFailure)?
        .map(|row| {
            let (
                identity,
                route_id,
                resource,
                action,
                scope,
                scope_evidence_ref,
                complete,
                enabled,
            ) = row.map_err(|_| PortFailure)?;
            Ok(LogicalRouteAuthorizationBinding {
                binding_identity: to_u64(identity)?,
                route_id,
                resource,
                action,
                scope,
                scope_evidence_ref,
                complete: complete == 1,
                enabled: enabled == 1,
            })
        })
        .collect()
}

pub struct SqliteAuthenticationEvidenceResolver<C> {
    connection: Connection,
    clock: C,
}

impl<C> SqliteAuthenticationEvidenceResolver<C>
where
    C: DecisionClock,
{
    pub fn open(path: impl AsRef<Path>, clock: C) -> Result<Self, PortFailure> {
        Self::from_connection(Connection::open(path).map_err(|_| PortFailure)?, clock)
    }

    pub fn open_in_memory(clock: C) -> Result<Self, PortFailure> {
        Self::from_connection(
            Connection::open_in_memory().map_err(|_| PortFailure)?,
            clock,
        )
    }

    pub fn from_connection(connection: Connection, clock: C) -> Result<Self, PortFailure> {
        prepare(&connection)?;
        Ok(Self { connection, clock })
    }
}

impl<C> AuthenticationEvidenceResolver for SqliteAuthenticationEvidenceResolver<C>
where
    C: DecisionClock,
{
    fn resolve_authentication_evidence(
        &self,
        evidence_ref: &str,
    ) -> Result<Vec<AuthenticatedSessionEvidence>, PortFailure> {
        if evidence_ref.is_empty() {
            return Ok(Vec::new());
        }
        let now = self.clock.decision_time()?;
        let mut statement = self
            .connection
            .prepare(
                "SELECT evidence_ref, session_id, trusted, revoked, expires_at
                 FROM auth_authentication_evidence
                 WHERE evidence_ref = ?1
                 ORDER BY evidence_row_id
                 LIMIT 2",
            )
            .map_err(|_| PortFailure)?;
        statement
            .query_map([evidence_ref], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, i64>(4)?,
                ))
            })
            .map_err(|_| PortFailure)?
            .map(|row| {
                let (resolved_ref, session_id, trusted, revoked, expires_at) =
                    row.map_err(|_| PortFailure)?;
                let expires_at = to_u64(expires_at)?;
                Ok(AuthenticatedSessionEvidence {
                    evidence_ref: resolved_ref,
                    session_id,
                    trusted: trusted == 1 && revoked == 0 && now < expires_at,
                })
            })
            .collect()
    }
}

pub struct SqliteRouteAuthorizationBindingResolver {
    connection: Connection,
}

impl SqliteRouteAuthorizationBindingResolver {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, PortFailure> {
        Self::from_connection(Connection::open(path).map_err(|_| PortFailure)?)
    }

    pub fn open_in_memory() -> Result<Self, PortFailure> {
        Self::from_connection(Connection::open_in_memory().map_err(|_| PortFailure)?)
    }

    pub fn from_connection(connection: Connection) -> Result<Self, PortFailure> {
        prepare(&connection)?;
        Ok(Self { connection })
    }
}

impl RouteAuthorizationBindingResolver for SqliteRouteAuthorizationBindingResolver {
    fn resolve_route_authorization_bindings(
        &self,
        route_id: &str,
    ) -> Result<Vec<RouteAuthorizationBinding>, PortFailure> {
        if route_id.is_empty() {
            return Ok(Vec::new());
        }
        let mut statement = self
            .connection
            .prepare(
                "SELECT route_id, resource, action, scope, scope_evidence_ref, complete, enabled
                 FROM auth_route_authorization_bindings
                 WHERE route_id = ?1
                 ORDER BY binding_row_id
                 LIMIT 2",
            )
            .map_err(|_| PortFailure)?;
        statement
            .query_map([route_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, i64>(5)?,
                    row.get::<_, i64>(6)?,
                ))
            })
            .map_err(|_| PortFailure)?
            .map(|row| {
                let (route_id, resource, action, scope, scope_evidence_ref, complete, enabled) =
                    row.map_err(|_| PortFailure)?;
                Ok(RouteAuthorizationBinding {
                    route_id,
                    required_permission: Permission {
                        resource,
                        action,
                        scope,
                    },
                    scope_evidence_ref,
                    complete: complete == 1 && enabled == 1,
                })
            })
            .collect()
    }
}

fn prepare(connection: &Connection) -> Result<(), PortFailure> {
    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|_| PortFailure)?;
    let current = schema_version(connection)?;
    if current > SCHEMA_VERSION {
        return Err(PortFailure);
    }
    connection
        .execute_batch(SCHEMA_V1)
        .map_err(|_| PortFailure)?;
    if schema_version(connection)? != SCHEMA_VERSION {
        return Err(PortFailure);
    }
    Ok(())
}

fn schema_version(connection: &Connection) -> Result<i64, PortFailure> {
    connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .optional()
        .map_err(|_| PortFailure)?
        .ok_or(PortFailure)
}

fn to_u64(value: i64) -> Result<u64, PortFailure> {
    value.try_into().map_err(|_| PortFailure)
}
