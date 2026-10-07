//! Kernel-free data model shared by authorization state providers and decision adapters.

use std::collections::BTreeSet;

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

/// Untrusted request identifiers shared by legacy and v2 boundary adapters.
/// This data type carries no authorization capability.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct InboundAuthorizationRequest {
    pub request_id: String,
    pub authentication_evidence_ref: String,
    pub route_id: String,
}

/// Clock port shared by read-only preparation and legacy decision adapters.
/// Implementations may execute arbitrary code; dependency isolation alone does
/// not establish that an implementation is safe before admission.
pub trait DecisionClock {
    fn decision_time(&self) -> Result<u64, PortFailure>;
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AuthenticatedSessionEvidence {
    pub evidence_ref: String,
    pub session_id: String,
    pub trusted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RouteAuthorizationBinding {
    pub route_id: String,
    pub required_permission: Permission,
    pub scope_evidence_ref: String,
    pub complete: bool,
}

pub trait AuthenticationEvidenceResolver {
    fn resolve_authentication_evidence(
        &self,
        evidence_ref: &str,
    ) -> Result<Vec<AuthenticatedSessionEvidence>, PortFailure>;
}

pub trait RouteAuthorizationBindingResolver {
    fn resolve_route_authorization_bindings(
        &self,
        route_id: &str,
    ) -> Result<Vec<RouteAuthorizationBinding>, PortFailure>;
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

    /// Transfer the complete snapshot into a decision adapter without cloning.
    pub fn into_parts(self) -> (Vec<SessionRecord>, RoleResolution, bool, u64, bool) {
        (
            self.sessions,
            self.roles,
            self.trusted_scope_evidence,
            self.current_authorization_revision,
            self.complete,
        )
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PortFailure;
