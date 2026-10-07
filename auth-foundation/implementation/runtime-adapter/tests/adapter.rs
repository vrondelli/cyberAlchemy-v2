#![cfg(feature = "legacy-raw-decision")]

use std::collections::BTreeSet;

use auth_foundation_runtime_adapter::{
    AuthorizationAdapter, AuthorizationCommand, AuthorizationRevisionSource,
    BinaryAuthorizationDecision, DecisionClock, Permission, PortFailure, RolePermission,
    RoleRecord, RoleResolution, RoleResolver, ScopeEvidenceVerifier, SessionRecord,
    SessionResolver, SessionStatus,
};

#[derive(Clone)]
struct Providers {
    sessions: Result<Vec<SessionRecord>, PortFailure>,
    roles: Result<RoleResolution, PortFailure>,
    scope_trusted: Result<bool, PortFailure>,
    revision: Result<u64, PortFailure>,
    time: Result<u64, PortFailure>,
}

impl SessionResolver for Providers {
    fn resolve_sessions(&self, _session_id: &str) -> Result<Vec<SessionRecord>, PortFailure> {
        self.sessions.clone()
    }
}

impl RoleResolver for Providers {
    fn resolve_active_roles(
        &self,
        _session: &SessionRecord,
    ) -> Result<RoleResolution, PortFailure> {
        self.roles.clone()
    }
}

impl ScopeEvidenceVerifier for Providers {
    fn verify_scope_evidence(&self, _command: &AuthorizationCommand) -> Result<bool, PortFailure> {
        self.scope_trusted
    }
}

impl AuthorizationRevisionSource for Providers {
    fn current_authorization_revision(&self, _session_id: &str) -> Result<u64, PortFailure> {
        self.revision
    }
}

impl DecisionClock for Providers {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        self.time
    }
}

fn permission() -> Permission {
    Permission {
        resource: "invoice".into(),
        action: "read".into(),
        scope: "tenant-7".into(),
    }
}

fn command() -> AuthorizationCommand {
    AuthorizationCommand {
        request_id: "request-1".into(),
        session_id: "session-1".into(),
        required_permission: permission(),
        scope_evidence_ref: "scope-evidence-1".into(),
    }
}

fn session() -> SessionRecord {
    SessionRecord {
        session_id: "session-1".into(),
        user_id: "user-1".into(),
        status: SessionStatus::Active,
        active_role_ids: BTreeSet::from(["reader".into()]),
        authorization_revision: 7,
        expires_at: 101,
    }
}

fn role() -> RoleRecord {
    RoleRecord {
        role_id: "reader".into(),
        permissions: BTreeSet::from([RolePermission {
            resource: "invoice".into(),
            action: "read".into(),
            scope: "tenant-7".into(),
        }]),
    }
}

fn providers() -> Providers {
    Providers {
        sessions: Ok(vec![session()]),
        roles: Ok(RoleResolution {
            roles: vec![role()],
            complete: true,
        }),
        scope_trusted: Ok(true),
        revision: Ok(7),
        time: Ok(100),
    }
}

fn decide(providers: Providers) -> BinaryAuthorizationDecision {
    AuthorizationAdapter::new(
        providers.clone(),
        providers.clone(),
        providers.clone(),
        providers.clone(),
        providers,
    )
    .authorize(command())
}

#[test]
fn exact_trusted_evidence_allows() {
    assert_eq!(decide(providers()), BinaryAuthorizationDecision::Allow);
}

#[test]
fn missing_or_ambiguous_session_denies() {
    let mut missing = providers();
    missing.sessions = Ok(Vec::new());
    assert_eq!(decide(missing), BinaryAuthorizationDecision::Deny);

    let mut ambiguous = providers();
    ambiguous.sessions = Ok(vec![session(), session()]);
    assert_eq!(decide(ambiguous), BinaryAuthorizationDecision::Deny);
}

#[test]
fn inactive_or_revoked_session_denies() {
    for status in [SessionStatus::Inactive, SessionStatus::Revoked] {
        let mut candidate = session();
        candidate.status = status;
        let mut value = providers();
        value.sessions = Ok(vec![candidate]);
        assert_eq!(decide(value), BinaryAuthorizationDecision::Deny);
    }
}

#[test]
fn expiry_and_stale_revision_deny() {
    let mut expired = providers();
    expired.time = Ok(101);
    assert_eq!(decide(expired), BinaryAuthorizationDecision::Deny);

    let mut stale = providers();
    stale.revision = Ok(8);
    assert_eq!(decide(stale), BinaryAuthorizationDecision::Deny);
}

#[test]
fn untrusted_or_empty_scope_evidence_denies() {
    let mut untrusted = providers();
    untrusted.scope_trusted = Ok(false);
    assert_eq!(decide(untrusted), BinaryAuthorizationDecision::Deny);

    let value = providers();
    let adapter = AuthorizationAdapter::new(
        value.clone(),
        value.clone(),
        value.clone(),
        value.clone(),
        value,
    );
    let mut request = command();
    request.scope_evidence_ref.clear();
    assert_eq!(
        adapter.authorize(request),
        BinaryAuthorizationDecision::Deny
    );
}

#[test]
fn incomplete_duplicate_or_mismatched_roles_deny() {
    let mut incomplete = providers();
    incomplete.roles = Ok(RoleResolution {
        roles: vec![role()],
        complete: false,
    });
    assert_eq!(decide(incomplete), BinaryAuthorizationDecision::Deny);

    let mut duplicate = providers();
    duplicate.roles = Ok(RoleResolution {
        roles: vec![role(), role()],
        complete: true,
    });
    assert_eq!(decide(duplicate), BinaryAuthorizationDecision::Deny);

    let mut mismatched = providers();
    mismatched.roles = Ok(RoleResolution {
        roles: Vec::new(),
        complete: true,
    });
    assert_eq!(decide(mismatched), BinaryAuthorizationDecision::Deny);
}

#[test]
fn exact_permission_mismatch_denies_without_exposing_reason() {
    let mut mismatch = role();
    mismatch.permissions = BTreeSet::from([RolePermission {
        resource: "invoice".into(),
        action: "write".into(),
        scope: "tenant-7".into(),
    }]);
    let mut value = providers();
    value.roles = Ok(RoleResolution {
        roles: vec![mismatch],
        complete: true,
    });
    assert_eq!(decide(value), BinaryAuthorizationDecision::Deny);
}

#[test]
fn every_trusted_port_failure_denies() {
    let mut cases = Vec::new();
    let mut sessions = providers();
    sessions.sessions = Err(PortFailure);
    cases.push(sessions);
    let mut roles = providers();
    roles.roles = Err(PortFailure);
    cases.push(roles);
    let mut scope = providers();
    scope.scope_trusted = Err(PortFailure);
    cases.push(scope);
    let mut revision = providers();
    revision.revision = Err(PortFailure);
    cases.push(revision);
    let mut clock = providers();
    clock.time = Err(PortFailure);
    cases.push(clock);

    for value in cases {
        assert_eq!(decide(value), BinaryAuthorizationDecision::Deny);
    }
}
