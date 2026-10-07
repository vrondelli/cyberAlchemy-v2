//! Type-only compatibility facade by default. Historical raw-command decision
//! exports require an explicit `legacy-raw-decision` feature and are not part
//! of the selected public Auth request composition. Opt-in does not establish
//! READY dominance.

pub use auth_foundation_authorization_state_model::{
    AuthorizationCommand, BinaryAuthorizationDecision, DecisionClock, InboundAuthorizationRequest,
    Permission, PortFailure, ResolvedAuthorizationState, RolePermission, RoleRecord,
    RoleResolution, SessionRecord, SessionStatus,
};
#[cfg(feature = "legacy-raw-decision")]
mod legacy {
    use super::*;
    use auth_kernel as kernel;

    pub trait SessionResolver {
        fn resolve_sessions(&self, session_id: &str) -> Result<Vec<SessionRecord>, PortFailure>;
    }

    pub trait RoleResolver {
        fn resolve_active_roles(
            &self,
            session: &SessionRecord,
        ) -> Result<RoleResolution, PortFailure>;
    }

    pub trait ScopeEvidenceVerifier {
        fn verify_scope_evidence(
            &self,
            command: &AuthorizationCommand,
        ) -> Result<bool, PortFailure>;
    }

    pub trait AuthorizationRevisionSource {
        fn current_authorization_revision(&self, session_id: &str) -> Result<u64, PortFailure>;
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
        let (sessions, roles, trusted_scope_evidence, current_authorization_revision, complete) =
            state.into_parts();
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
                current_authorization_revision,
            },
            resolved_sessions: sessions.into_iter().map(to_kernel_session).collect(),
            resolved_roles: roles.roles.into_iter().map(to_kernel_role).collect(),
            trusted_scope_evidence: complete && trusted_scope_evidence,
            role_relation_complete: complete && roles.complete,
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
}

#[cfg(feature = "legacy-raw-decision")]
pub use legacy::*;
