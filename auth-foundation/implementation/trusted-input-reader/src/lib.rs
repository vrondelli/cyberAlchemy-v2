//! Transaction-scoped SQLite reads for trusted input resolution.
//!
//! This crate deliberately has no dependency on a native authorization
//! decision entrypoint. The caller owns the transaction and decision time.

use auth_foundation_authorization_state_model::PortFailure;
use auth_foundation_trusted_input_runtime::resolve_trusted_inputs;
pub use auth_foundation_trusted_input_runtime::{
    AuthenticationEvidence as LogicalAuthenticationEvidence,
    RouteAuthorizationBinding as LogicalRouteAuthorizationBinding, TrustedInputQuery,
    TrustedInputResolution, TrustedInputSnapshot,
};
use rusqlite::Transaction;

pub const SCHEMA_V1: &str =
    include_str!("../../authorization-schema/migrations/0001_trusted_inputs.sql");

/// Resolve trusted inputs through the caller's evaluation transaction and
/// already-captured decision time. Row cardinality and order remain visible.
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
             ORDER BY evidence_row_id",
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
             ORDER BY binding_row_id",
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

fn to_u64(value: i64) -> Result<u64, PortFailure> {
    value.try_into().map_err(|_| PortFailure)
}
