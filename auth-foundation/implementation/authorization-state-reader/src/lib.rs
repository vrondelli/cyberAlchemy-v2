//! Read-only, transaction-scoped authorization-state resolution.
//! This crate has no dependency on an authorization-policy decision engine.

use std::collections::BTreeSet;
use std::marker::PhantomData;

use auth_foundation_authorization_state_model::{
    AuthorizationCommand, PortFailure, ResolvedAuthorizationState, RolePermission, RoleRecord,
    RoleResolution, SessionRecord, SessionStatus,
};
use rusqlite::{OptionalExtension, Transaction};

pub const SCHEMA_V1: &str =
    include_str!("../../authorization-schema/migrations/0001_auth_state.sql");

/// State read in the caller's transaction. No policy decision is exposed here.
pub struct SqliteAuthorizationStateSnapshot<'transaction> {
    state: ResolvedAuthorizationState,
    _transaction: PhantomData<&'transaction ()>,
}

impl SqliteAuthorizationStateSnapshot<'_> {
    pub fn sessions(&self) -> &[SessionRecord] {
        self.state.sessions()
    }

    pub fn current_authorization_revision(&self) -> u64 {
        self.state.current_authorization_revision()
    }

    pub fn trusted_scope_evidence(&self) -> bool {
        self.state.trusted_scope_evidence()
    }

    pub fn is_complete(&self) -> bool {
        self.state.is_complete() && self.state.roles().complete
    }

    pub fn into_state(self) -> ResolvedAuthorizationState {
        self.state
    }
}

pub fn resolve_authorization_state_in_transaction<'transaction>(
    transaction: &'transaction Transaction<'_>,
    command: &AuthorizationCommand,
) -> Result<SqliteAuthorizationStateSnapshot<'transaction>, PortFailure> {
    let provider = SqliteSnapshot { transaction };
    let sessions = provider.resolve_sessions(&command.session_id)?;
    let matching_sessions: Vec<_> = sessions
        .iter()
        .filter(|session| session.session_id == command.session_id)
        .collect();
    let roles = if matching_sessions.len() == 1 {
        provider.resolve_active_roles(matching_sessions[0])?
    } else {
        RoleResolution {
            roles: Vec::new(),
            complete: false,
        }
    };
    let current_authorization_revision =
        provider.current_authorization_revision(&command.session_id)?;
    let trusted_scope_evidence = provider.verify_scope_evidence(command)?;
    let revision_complete = if let [session] = matching_sessions.as_slice() {
        session.authorization_revision == current_authorization_revision
            && relation_revisions_are_current(
                transaction,
                &command.session_id,
                current_authorization_revision,
            )?
    } else {
        false
    };

    Ok(SqliteAuthorizationStateSnapshot {
        state: ResolvedAuthorizationState::new(
            sessions,
            roles,
            trusted_scope_evidence,
            current_authorization_revision,
            revision_complete,
        ),
        _transaction: PhantomData,
    })
}

struct SqliteSnapshot<'transaction, 'connection> {
    transaction: &'transaction Transaction<'connection>,
}

impl SqliteSnapshot<'_, '_> {
    fn resolve_sessions(&self, session_id: &str) -> Result<Vec<SessionRecord>, PortFailure> {
        let mut statement = self
            .transaction
            .prepare(
                "SELECT session_row_id, session_id, user_id, status, authorization_revision, expires_at
                 FROM auth_sessions
                 WHERE session_id = ?1
                 ORDER BY session_row_id
                 LIMIT 2",
            )
            .map_err(|_| PortFailure)?;
        let rows = statement
            .query_map([session_id], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, i64>(5)?,
                ))
            })
            .map_err(|_| PortFailure)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| PortFailure)?;
        drop(statement);

        rows.into_iter()
            .map(
                |(row_id, resolved_session_id, user_id, status, revision, expires_at)| {
                    let active_role_ids = active_role_ids(self.transaction, row_id)?;
                    Ok(SessionRecord {
                        session_id: resolved_session_id,
                        user_id,
                        status: parse_status(&status)?,
                        active_role_ids,
                        authorization_revision: to_u64(revision)?,
                        expires_at: to_u64(expires_at)?,
                    })
                },
            )
            .collect()
    }
}

fn relation_revisions_are_current(
    transaction: &Transaction<'_>,
    session_id: &str,
    current_revision: u64,
) -> Result<bool, PortFailure> {
    let schema_epoch = transaction
        .query_row("PRAGMA user_version", [], |row| row.get::<_, i64>(0))
        .map_err(|_| PortFailure)?;
    if schema_epoch < 2 {
        return Ok(true);
    }
    let revision = to_i64(current_revision)?;
    let session_rows = transaction
        .prepare(
            "SELECT session_row_id
             FROM auth_sessions
             WHERE session_id = ?1
             ORDER BY session_row_id
             LIMIT 2",
        )
        .map_err(|_| PortFailure)?
        .query_map([session_id], |row| row.get::<_, i64>(0))
        .map_err(|_| PortFailure)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| PortFailure)?;
    let [session_row_id] = session_rows.as_slice() else {
        return Ok(false);
    };
    let stale_roles = transaction
        .query_row(
            "SELECT COUNT(*)
             FROM auth_session_active_roles
             WHERE session_row_id = ?1
               AND authorization_revision != ?2",
            rusqlite::params![session_row_id, revision],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|_| PortFailure)?;
    let stale_grants = transaction
        .query_row(
            "SELECT COUNT(*)
             FROM auth_role_permissions
             WHERE role_id IN (
                 SELECT role_id
                 FROM auth_session_active_roles
                 WHERE session_row_id = ?1
             )
               AND authorization_revision != ?2",
            rusqlite::params![session_row_id, revision],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|_| PortFailure)?;
    Ok(stale_roles == 0 && stale_grants == 0)
}

impl SqliteSnapshot<'_, '_> {
    fn resolve_active_roles(&self, session: &SessionRecord) -> Result<RoleResolution, PortFailure> {
        let status = status_text(session.status);
        let revision = to_i64(session.authorization_revision)?;
        let expires_at = to_i64(session.expires_at)?;
        let mut statement = self
            .transaction
            .prepare(
                "SELECT session_row_id
                 FROM auth_sessions
                 WHERE session_id = ?1
                   AND user_id = ?2
                   AND status = ?3
                   AND authorization_revision = ?4
                   AND expires_at = ?5
                 ORDER BY session_row_id",
            )
            .map_err(|_| PortFailure)?;
        let row_ids = statement
            .query_map(
                rusqlite::params![
                    session.session_id,
                    session.user_id,
                    status,
                    revision,
                    expires_at
                ],
                |row| row.get::<_, i64>(0),
            )
            .map_err(|_| PortFailure)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| PortFailure)?;
        drop(statement);

        if row_ids.len() != 1 {
            return Ok(RoleResolution {
                roles: Vec::new(),
                complete: false,
            });
        }

        let resolved_role_ids = active_role_ids(self.transaction, row_ids[0])?;
        if resolved_role_ids != session.active_role_ids {
            return Ok(RoleResolution {
                roles: Vec::new(),
                complete: false,
            });
        }

        let mut roles = Vec::with_capacity(resolved_role_ids.len());
        for role_id in &resolved_role_ids {
            let exists = self
                .transaction
                .query_row(
                    "SELECT role_id FROM auth_roles WHERE role_id = ?1",
                    [role_id],
                    |row| row.get::<_, String>(0),
                )
                .optional()
                .map_err(|_| PortFailure)?;
            if exists.is_none() {
                return Ok(RoleResolution {
                    roles: Vec::new(),
                    complete: false,
                });
            }
            roles.push(RoleRecord {
                role_id: role_id.clone(),
                permissions: role_permissions(self.transaction, role_id)?,
            });
        }

        Ok(RoleResolution {
            roles,
            complete: true,
        })
    }
}

impl SqliteSnapshot<'_, '_> {
    fn verify_scope_evidence(&self, command: &AuthorizationCommand) -> Result<bool, PortFailure> {
        let count = self
            .transaction
            .query_row(
                "SELECT COUNT(*)
                 FROM auth_scope_evidence
                 WHERE evidence_ref = ?1
                   AND resource = ?2
                   AND action = ?3
                   AND scope = ?4
                   AND trusted = 1",
                rusqlite::params![
                    command.scope_evidence_ref,
                    command.required_permission.resource,
                    command.required_permission.action,
                    command.required_permission.scope
                ],
                |row| row.get::<_, i64>(0),
            )
            .map_err(|_| PortFailure)?;
        Ok(count == 1)
    }
}

impl SqliteSnapshot<'_, '_> {
    fn current_authorization_revision(&self, session_id: &str) -> Result<u64, PortFailure> {
        let revision = self
            .transaction
            .query_row(
                "SELECT revision
                 FROM auth_authorization_revisions
                 WHERE session_id = ?1",
                [session_id],
                |row| row.get::<_, i64>(0),
            )
            .optional()
            .map_err(|_| PortFailure)?
            .ok_or(PortFailure)?;
        to_u64(revision)
    }
}

fn active_role_ids(
    transaction: &Transaction<'_>,
    session_row_id: i64,
) -> Result<BTreeSet<String>, PortFailure> {
    let mut statement = transaction
        .prepare(
            "SELECT role_id
             FROM auth_session_active_roles
             WHERE session_row_id = ?1
             ORDER BY role_id",
        )
        .map_err(|_| PortFailure)?;
    statement
        .query_map([session_row_id], |row| row.get::<_, String>(0))
        .map_err(|_| PortFailure)?
        .collect::<Result<BTreeSet<_>, _>>()
        .map_err(|_| PortFailure)
}

fn role_permissions(
    transaction: &Transaction<'_>,
    role_id: &str,
) -> Result<BTreeSet<RolePermission>, PortFailure> {
    let mut statement = transaction
        .prepare(
            "SELECT resource, action, scope
             FROM auth_role_permissions
             WHERE role_id = ?1
             ORDER BY resource, action, scope",
        )
        .map_err(|_| PortFailure)?;
    statement
        .query_map([role_id], |row| {
            Ok(RolePermission {
                resource: row.get(0)?,
                action: row.get(1)?,
                scope: row.get(2)?,
            })
        })
        .map_err(|_| PortFailure)?
        .collect::<Result<BTreeSet<_>, _>>()
        .map_err(|_| PortFailure)
}

fn parse_status(value: &str) -> Result<SessionStatus, PortFailure> {
    match value {
        "active" => Ok(SessionStatus::Active),
        "inactive" => Ok(SessionStatus::Inactive),
        "revoked" => Ok(SessionStatus::Revoked),
        _ => Err(PortFailure),
    }
}

fn status_text(value: SessionStatus) -> &'static str {
    match value {
        SessionStatus::Active => "active",
        SessionStatus::Inactive => "inactive",
        SessionStatus::Revoked => "revoked",
    }
}

fn to_u64(value: i64) -> Result<u64, PortFailure> {
    value.try_into().map_err(|_| PortFailure)
}

fn to_i64(value: u64) -> Result<i64, PortFailure> {
    value.try_into().map_err(|_| PortFailure)
}
