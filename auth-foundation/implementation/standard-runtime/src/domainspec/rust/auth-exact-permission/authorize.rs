// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"e3ab4c0f5c3cae3edebc136eea34c6277214cb5e9a1878d81bad73ff07623db2","language":"rust","meta_type_id":"DS-D1.4","meta_type_label":"Operation","provider_sha256":"c34962ceef4fa5eabd6ccef9f7df100e31e3296ae7beef1f68d19aeb317f3629","source_sha256":"49723621b79c30372b9871f1ff09a595aff0a88f63d58c5dad8ce1ca7edbdb62"}
// domainspec-body: {"description":"Return ALLOW exactly for admissible evidence with one exact active-role grant and DENY otherwise.","effects":[],"failure_continuation":"return-deny-without-state-change","guard":"allow-iff","reads":["session","role"],"typed_contract":{"effects":[],"failure_continuation":"return-deny-without-state-change","failure_result":{"payload_variant":"NoExactActiveRoleGrant","variant":"Deny"},"guard":"auth-exact-permission:allow-iff","inputs":[{"name":"context","type":{"kind":"named","selector":"auth-exact-permission:evaluation-context"}}],"ontology_operation":"AUTH-OP-AUTHORIZE","output":{"kind":"named","selector":"auth-exact-permission:authorization-decision"},"reads":["auth-exact-permission:session","auth-exact-permission:role"],"schema_version":"domainspec.typed-operation/v1","success_result":{"payload_variant":null,"variant":"Allow"},"writes":[]},"writes":[]}
// domainspec-relationships: [{"edge_id":"allow-iff-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"allow-iff"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"authorization-admissible-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"authorization-admissible"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"authorize-reads-role","relationship":"reads","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"},"target":{"feature_id":"auth-exact-permission","kind":"Entity","node_id":"role"}},{"edge_id":"authorize-reads-session","relationship":"reads","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"},"target":{"feature_id":"auth-exact-permission","kind":"Entity","node_id":"session"}},{"edge_id":"complete-active-roles-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"complete-active-roles"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"default-deny-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"default-deny"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"exact-active-role-grant-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"exact-active-role-grant"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"session-current-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"session-current"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"trusted-scope-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"trusted-scope"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}},{"edge_id":"unique-resolved-session-enforces-authorize","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-exact-permission","kind":"Rule","node_id":"unique-resolved-session"},"target":{"feature_id":"auth-exact-permission","kind":"Operation","node_id":"authorize"}}]
// domainspec-operation-sets: {"effects":[],"reads":["session","role"],"writes":[]}
// domainspec-operation-guard: "allow-iff"
// domainspec-guard-before-mutation: true
// domainspec-atomic-state-outbox: true
// domainspec-failure-continuation: "return-deny-without-state-change"
// domainspec-operation-core-instrumentation-free: true
// domainspec-operation-instrumentation-owner: "outer-wrapper"
pub const AUTHORIZE_CREATION_TARGETS: &[&str] = &[];
// domainspec-typed-closure-sha256: "9259c2510c7cbb10cc44cf21c7524dccb3488428753076badf1412fd3aa639cd"
use std::collections::BTreeSet;

pub const DOMAINSPEC_TYPED_CLOSURE_SHA256: &str =
    "9259c2510c7cbb10cc44cf21c7524dccb3488428753076badf1412fd3aa639cd";
#[rustfmt::skip]
pub const DOMAINSPEC_PROPERTY_BINDINGS: &[(&str, &str)] = &[
    ("AUTH-AUTHORIZATION-REQUEST#current_authorization_revision", "AuthorizationRequest::current_authorization_revision"),
    ("AUTH-AUTHORIZATION-REQUEST#decision_time", "AuthorizationRequest::decision_time"),
    ("AUTH-AUTHORIZATION-REQUEST#request_id", "AuthorizationRequest::request_id"),
    ("AUTH-AUTHORIZATION-REQUEST#required_permission", "AuthorizationRequest::required_permission"),
    ("AUTH-AUTHORIZATION-REQUEST#scope_evidence_ref", "AuthorizationRequest::scope_evidence_ref"),
    ("AUTH-AUTHORIZATION-REQUEST#session_id", "AuthorizationRequest::session_id"),
    ("AUTH-EVALUATION-CONTEXT#request", "EvaluationContext::request"),
    ("AUTH-EVALUATION-CONTEXT#resolved_roles", "EvaluationContext::resolved_roles"),
    ("AUTH-EVALUATION-CONTEXT#resolved_sessions", "EvaluationContext::resolved_sessions"),
    ("AUTH-EVALUATION-CONTEXT#role_relation_complete", "EvaluationContext::role_relation_complete"),
    ("AUTH-EVALUATION-CONTEXT#trusted_scope_evidence", "EvaluationContext::trusted_scope_evidence"),
    ("AUTH-PERMISSION#action", "Permission::action"),
    ("AUTH-PERMISSION#resource", "Permission::resource"),
    ("AUTH-PERMISSION#scope", "Permission::scope"),
    ("AUTH-ROLE#permissions", "Role::permissions"),
    ("AUTH-ROLE#role_id", "Role::role_id"),
    ("AUTH-SESSION#active_role_ids", "Session::active_role_ids"),
    ("AUTH-SESSION#authorization_revision", "Session::authorization_revision"),
    ("AUTH-SESSION#expires_at", "Session::expires_at"),
    ("AUTH-SESSION#session_id", "Session::session_id"),
    ("AUTH-SESSION#status", "Session::status"),
    ("AUTH-SESSION#user_id", "Session::user_id"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_VARIANT_BINDINGS: &[(&str, &str)] = &[
    ("AUTH-AUTHORIZATION-DECISION#Allow", "AuthorizationDecision::Allow"),
    ("AUTH-AUTHORIZATION-DECISION#Deny", "AuthorizationDecision::Deny"),
    ("AUTH-DENY-REASON#AmbiguousSession", "DenyReason::AmbiguousSession"),
    ("AUTH-DENY-REASON#DuplicateResolvedRole", "DenyReason::DuplicateResolvedRole"),
    ("AUTH-DENY-REASON#ExpiredSession", "DenyReason::ExpiredSession"),
    ("AUTH-DENY-REASON#InactiveSession", "DenyReason::InactiveSession"),
    ("AUTH-DENY-REASON#IncompleteRoleRelation", "DenyReason::IncompleteRoleRelation"),
    ("AUTH-DENY-REASON#MissingSession", "DenyReason::MissingSession"),
    ("AUTH-DENY-REASON#NoExactActiveRoleGrant", "DenyReason::NoExactActiveRoleGrant"),
    ("AUTH-DENY-REASON#RoleRelationMismatch", "DenyReason::RoleRelationMismatch"),
    ("AUTH-DENY-REASON#StaleAuthorizationRevision", "DenyReason::StaleAuthorizationRevision"),
    ("AUTH-DENY-REASON#UntrustedScopeEvidence", "DenyReason::UntrustedScopeEvidence"),
    ("AUTH-SESSION-STATUS#Active", "SessionStatus::Active"),
    ("AUTH-SESSION-STATUS#Inactive", "SessionStatus::Inactive"),
    ("AUTH-SESSION-STATUS#Revoked", "SessionStatus::Revoked"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_RULE_SELECTORS: &[(&str, &str)] = &[
    ("AF-RULE-ALLOW-IFF", "auth-exact-permission:allow-iff"),
    ("AF-RULE-AUTHORIZATION-ADMISSIBLE", "auth-exact-permission:authorization-admissible"),
    ("AF-RULE-COMPLETE-ACTIVE-ROLES", "auth-exact-permission:complete-active-roles"),
    ("AF-RULE-DEFAULT-DENY", "auth-exact-permission:default-deny"),
    ("AF-RULE-EXACT-ACTIVE-ROLE-GRANT", "auth-exact-permission:exact-active-role-grant"),
    ("AF-RULE-SESSION-CURRENT", "auth-exact-permission:session-current"),
    ("AF-RULE-TRUSTED-SCOPE", "auth-exact-permission:trusted-scope"),
    ("AF-RULE-UNIQUE-RESOLVED-SESSION", "auth-exact-permission:unique-resolved-session"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_RULE_IMPLEMENTATION_BINDINGS: &[(&str, &str, &str)] = &[
    ("AF-RULE-ALLOW-IFF", "auth-exact-permission:allow-iff", "allow_iff"),
    ("AF-RULE-AUTHORIZATION-ADMISSIBLE", "auth-exact-permission:authorization-admissible", "authorization_admissible"),
    ("AF-RULE-COMPLETE-ACTIVE-ROLES", "auth-exact-permission:complete-active-roles", "complete_active_roles"),
    ("AF-RULE-DEFAULT-DENY", "auth-exact-permission:default-deny", "default_deny"),
    ("AF-RULE-EXACT-ACTIVE-ROLE-GRANT", "auth-exact-permission:exact-active-role-grant", "exact_active_role_grant"),
    ("AF-RULE-SESSION-CURRENT", "auth-exact-permission:session-current", "session_current"),
    ("AF-RULE-TRUSTED-SCOPE", "auth-exact-permission:trusted-scope", "trusted_scope"),
    ("AF-RULE-UNIQUE-RESOLVED-SESSION", "auth-exact-permission:unique-resolved-session", "unique_resolved_session"),
];

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Permission {
    pub resource: String,
    pub action: String,
    pub scope: String,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct AuthorizationRequest {
    pub request_id: String,
    pub session_id: String,
    pub required_permission: Permission,
    pub scope_evidence_ref: String,
    pub decision_time: u64,
    pub current_authorization_revision: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Role {
    pub role_id: String,
    pub permissions: BTreeSet<Permission>,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum SessionStatus {
    Active,
    Inactive,
    Revoked,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Session {
    pub session_id: String,
    pub user_id: String,
    pub status: SessionStatus,
    pub active_role_ids: BTreeSet<String>,
    pub authorization_revision: u64,
    pub expires_at: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct EvaluationContext {
    pub request: AuthorizationRequest,
    pub resolved_sessions: Vec<Session>,
    pub resolved_roles: Vec<Role>,
    pub trusted_scope_evidence: bool,
    pub role_relation_complete: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum DenyReason {
    MissingSession,
    AmbiguousSession,
    InactiveSession,
    ExpiredSession,
    StaleAuthorizationRevision,
    UntrustedScopeEvidence,
    IncompleteRoleRelation,
    DuplicateResolvedRole,
    RoleRelationMismatch,
    NoExactActiveRoleGrant,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum AuthorizationDecision {
    Allow,
    Deny(DenyReason),
}

#[rustfmt::skip]
pub fn complete_active_roles(context: &EvaluationContext, session: &Session) -> bool {
    let __domainspec_rule_000 = context.role_relation_complete == true;
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        context.resolved_roles
            .iter()
            .map(|role| &role.role_id)
            .collect::<BTreeSet<_>>()
            .len() == context.resolved_roles.len()
    };
    let __domainspec_rule_002 = __domainspec_rule_001 && {
        session.active_role_ids == context.resolved_roles
            .iter()
            .map(|projected| projected.role_id.clone())
            .collect::<Vec<_>>()
            .into_iter()
            .collect::<BTreeSet<_>>()
    };
    __domainspec_rule_002
}

#[rustfmt::skip]
pub fn exact_active_role_grant(context: &EvaluationContext, session: &Session) -> bool {
    context.resolved_roles
        .iter()
        .any(|role| {
            let __domainspec_rule_000 = session.active_role_ids.contains(&role.role_id);
            let __domainspec_rule_001 = __domainspec_rule_000 && {
                role.permissions.contains(&context.request.required_permission)
            };
            __domainspec_rule_001
        })
}

#[rustfmt::skip]
pub fn session_current(context: &EvaluationContext, session: &Session) -> bool {
    let __domainspec_rule_000 = session.status == SessionStatus::Active;
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        context.request.decision_time < session.expires_at
    };
    let __domainspec_rule_002 = __domainspec_rule_001 && {
        session.authorization_revision == context.request.current_authorization_revision
    };
    __domainspec_rule_002
}

#[rustfmt::skip]
pub fn trusted_scope(context: &EvaluationContext) -> bool {
    let __domainspec_rule_000 = context.trusted_scope_evidence == true;
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        !(context.request.scope_evidence_ref == "")
    };
    __domainspec_rule_001
}

#[rustfmt::skip]
pub fn unique_resolved_session(context: &EvaluationContext) -> bool {
    context.resolved_sessions
        .iter()
        .filter(|session| {
            session.session_id == context.request.session_id
        })
        .count() == 1
}

#[rustfmt::skip]
pub fn allow_iff(context: &EvaluationContext) -> bool {
    let __domainspec_rule_000 = unique_resolved_session(context);
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        trusted_scope(context)
    };
    let __domainspec_rule_002 = __domainspec_rule_001 && {
        context.role_relation_complete == true
    };
    let __domainspec_rule_003 = __domainspec_rule_002 && {
        context.resolved_sessions
            .iter()
            .any(|session| {
                let __domainspec_rule_004 = session.session_id == context.request.session_id;
                let __domainspec_rule_005 = __domainspec_rule_004 && {
                    session_current(context, session)
                };
                let __domainspec_rule_006 = __domainspec_rule_005 && {
                    complete_active_roles(context, session)
                };
                let __domainspec_rule_007 = __domainspec_rule_006 && {
                    exact_active_role_grant(context, session)
                };
                __domainspec_rule_007
            })
    };
    __domainspec_rule_003
}

#[rustfmt::skip]
pub fn authorization_admissible(context: &EvaluationContext, session: &Session) -> bool {
    let __domainspec_rule_000 = unique_resolved_session(context);
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        session.session_id == context.request.session_id
    };
    let __domainspec_rule_002 = __domainspec_rule_001 && {
        session_current(context, session)
    };
    let __domainspec_rule_003 = __domainspec_rule_002 && {
        trusted_scope(context)
    };
    let __domainspec_rule_004 = __domainspec_rule_003 && {
        complete_active_roles(context, session)
    };
    __domainspec_rule_004
}

#[rustfmt::skip]
pub fn default_deny(context: &EvaluationContext) -> bool {
    !(allow_iff(context))
}

pub fn authorize(context: &EvaluationContext) -> AuthorizationDecision {
    if allow_iff(context) {
        AuthorizationDecision::Allow
    } else {
        AuthorizationDecision::Deny(DenyReason::NoExactActiveRoleGrant)
    }
}
