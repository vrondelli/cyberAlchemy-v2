//! Pure fail-closed adapter from trusted runtime ports to the generated Auth kernel.

use std::collections::BTreeSet;

use auth_kernel as kernel;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Permission {
    pub resource: String,
    pub action: String,
    pub scope: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AuthorizationCommand {
    pub request_id: String,
    pub session_id: String,
    pub required_permission: Permission,
    pub scope_evidence_ref: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BinaryAuthorizationDecision {
    Allow,
    Deny,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SessionStatus {
    Active,
    Inactive,
    Revoked,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SessionRecord {
    pub session_id: String,
    pub user_id: String,
    pub status: SessionStatus,
    pub active_role_ids: BTreeSet<String>,
    pub authorization_revision: u64,
    pub expires_at: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct RolePermission {
    pub resource: String,
    pub action: String,
    pub scope: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RoleRecord {
    pub role_id: String,
    pub permissions: BTreeSet<RolePermission>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RoleResolution {
    pub roles: Vec<RoleRecord>,
    pub complete: bool,
}

/// Complete provider result for one authorization-state evaluation.
///
/// This value is evidence supplied to the pure generated kernel. Constructing
/// it does not grant authority: `complete` remains an explicit fail-closed
/// predicate and the kernel still evaluates every session, revision, scope,
/// role, and permission condition.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ResolvedAuthorizationState {
    sessions: Vec<SessionRecord>,
    roles: RoleResolution,
    trusted_scope_evidence: bool,
    current_authorization_revision: u64,
    complete: bool,
}

impl ResolvedAuthorizationState {
    pub fn new(
        sessions: Vec<SessionRecord>,
        roles: RoleResolution,
        trusted_scope_evidence: bool,
        current_authorization_revision: u64,
        complete: bool,
    ) -> Self {
        Self {
            sessions,
            roles,
            trusted_scope_evidence,
            current_authorization_revision,
            complete,
        }
    }

    pub fn sessions(&self) -> &[SessionRecord] {
        &self.sessions
    }

    pub fn roles(&self) -> &RoleResolution {
        &self.roles
    }

    pub fn current_authorization_revision(&self) -> u64 {
        self.current_authorization_revision
    }

    pub fn trusted_scope_evidence(&self) -> bool {
        self.trusted_scope_evidence
    }

    pub fn is_complete(&self) -> bool {
        self.complete
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PortFailure;

pub trait SessionResolver {
    fn resolve_sessions(&self, session_id: &str) -> Result<Vec<SessionRecord>, PortFailure>;
}

pub trait RoleResolver {
    fn resolve_active_roles(&self, session: &SessionRecord) -> Result<RoleResolution, PortFailure>;
}

pub trait ScopeEvidenceVerifier {
    fn verify_scope_evidence(&self, command: &AuthorizationCommand) -> Result<bool, PortFailure>;
}

pub trait AuthorizationRevisionSource {
    fn current_authorization_revision(&self, session_id: &str) -> Result<u64, PortFailure>;
}

pub trait DecisionClock {
    fn decision_time(&self) -> Result<u64, PortFailure>;
}

pub struct AuthorizationAdapter<S, R, E, V, C> {
    sessions: S,
    roles: R,
    scope_evidence: E,
    revisions: V,
    clock: C,
}

impl<S, R, E, V, C> AuthorizationAdapter<S, R, E, V, C>
where
    S: SessionResolver,
    R: RoleResolver,
    E: ScopeEvidenceVerifier,
    V: AuthorizationRevisionSource,
    C: DecisionClock,
{
    pub fn new(sessions: S, roles: R, scope_evidence: E, revisions: V, clock: C) -> Self {
        Self {
            sessions,
            roles,
            scope_evidence,
            revisions,
            clock,
        }
    }

    pub fn authorize(&self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        let mut evidence_complete = true;

        let sessions = self
            .sessions
            .resolve_sessions(&command.session_id)
            .unwrap_or_else(|_| {
                evidence_complete = false;
                Vec::new()
            });
        let decision_time = self.clock.decision_time().unwrap_or_else(|_| {
            evidence_complete = false;
            u64::MAX
        });
        let current_authorization_revision = self
            .revisions
            .current_authorization_revision(&command.session_id)
            .unwrap_or_else(|_| {
                evidence_complete = false;
                u64::MAX
            });
        let trusted_scope_evidence = self
            .scope_evidence
            .verify_scope_evidence(&command)
            .unwrap_or_else(|_| {
                evidence_complete = false;
                false
            });

        let matching_sessions: Vec<_> = sessions
            .iter()
            .filter(|session| session.session_id == command.session_id)
            .collect();
        let role_resolution = if matching_sessions.len() == 1 {
            self.roles
                .resolve_active_roles(matching_sessions[0])
                .unwrap_or_else(|_| {
                    evidence_complete = false;
                    RoleResolution {
                        roles: Vec::new(),
                        complete: false,
                    }
                })
        } else {
            RoleResolution {
                roles: Vec::new(),
                complete: false,
            }
        };

        authorize_resolved(
            command,
            decision_time,
            ResolvedAuthorizationState::new(
                sessions,
                role_resolution,
                trusted_scope_evidence,
                current_authorization_revision,
                evidence_complete,
            ),
        )
    }
}

/// Evaluate one already-resolved authorization-state snapshot through the
/// generated kernel without invoking any provider a second time.
pub fn authorize_resolved(
    command: AuthorizationCommand,
    decision_time: u64,
    state: ResolvedAuthorizationState,
) -> BinaryAuthorizationDecision {
    let context = kernel::EvaluationContext {
        request: kernel::AuthorizationRequest {
            request_id: command.request_id,
            session_id: command.session_id,
            required_permission: kernel::Permission {
                resource: command.required_permission.resource,
                action: command.required_permission.action,
                scope: command.required_permission.scope,
            },
            scope_evidence_ref: command.scope_evidence_ref,
            decision_time,
            current_authorization_revision: state.current_authorization_revision,
        },
        resolved_sessions: state.sessions.into_iter().map(to_kernel_session).collect(),
        resolved_roles: state.roles.roles.into_iter().map(to_kernel_role).collect(),
        trusted_scope_evidence: state.complete && state.trusted_scope_evidence,
        role_relation_complete: state.complete && state.roles.complete,
    };

    match kernel::authorize(&context) {
        kernel::AuthorizationDecision::Allow => BinaryAuthorizationDecision::Allow,
        kernel::AuthorizationDecision::Deny(_) => BinaryAuthorizationDecision::Deny,
    }
}

fn to_kernel_session(session: SessionRecord) -> kernel::Session {
    kernel::Session {
        session_id: session.session_id,
        user_id: session.user_id,
        status: match session.status {
            SessionStatus::Active => kernel::SessionStatus::Active,
            SessionStatus::Inactive => kernel::SessionStatus::Inactive,
            SessionStatus::Revoked => kernel::SessionStatus::Revoked,
        },
        active_role_ids: session.active_role_ids,
        authorization_revision: session.authorization_revision,
        expires_at: session.expires_at,
    }
}

fn to_kernel_role(role: RoleRecord) -> kernel::Role {
    kernel::Role {
        role_id: role.role_id,
        permissions: role
            .permissions
            .into_iter()
            .map(|permission| kernel::Permission {
                resource: permission.resource,
                action: permission.action,
                scope: permission.scope,
            })
            .collect(),
    }
}
