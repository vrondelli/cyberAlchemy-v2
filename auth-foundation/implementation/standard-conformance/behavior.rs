#[path = "oracle.rs"]
mod oracle;
#[path = "../standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs"]
mod candidate;

use std::collections::BTreeSet;

#[derive(Clone)]
struct RawPermission {
    resource: &'static str,
    action: &'static str,
    scope: &'static str,
}

#[derive(Clone, Copy)]
enum RawStatus {
    Active,
    Inactive,
    Revoked,
}

#[derive(Clone)]
struct RawSession {
    session_id: &'static str,
    user_id: &'static str,
    status: RawStatus,
    active_role_ids: Vec<&'static str>,
    authorization_revision: u64,
    expires_at: u64,
}

#[derive(Clone)]
struct RawRole {
    role_id: &'static str,
    permissions: Vec<RawPermission>,
}

#[derive(Clone)]
struct RawContext {
    session_id: &'static str,
    required_permission: RawPermission,
    scope_evidence_ref: &'static str,
    decision_time: u64,
    current_authorization_revision: u64,
    sessions: Vec<RawSession>,
    roles: Vec<RawRole>,
    trusted_scope_evidence: bool,
    role_relation_complete: bool,
}

fn valid() -> RawContext {
    let permission = RawPermission { resource: "invoice", action: "read", scope: "tenant-7" };
    RawContext {
        session_id: "session-1",
        required_permission: permission.clone(),
        scope_evidence_ref: "scope-evidence-1",
        decision_time: 100,
        current_authorization_revision: 7,
        sessions: vec![RawSession {
            session_id: "session-1",
            user_id: "user-1",
            status: RawStatus::Active,
            active_role_ids: vec!["reader"],
            authorization_revision: 7,
            expires_at: 101,
        }],
        roles: vec![RawRole { role_id: "reader", permissions: vec![permission] }],
        trusted_scope_evidence: true,
        role_relation_complete: true,
    }
}

fn strings(values: &[&'static str]) -> BTreeSet<String> {
    values.iter().map(|value| (*value).to_owned()).collect()
}

fn oracle_allows(raw: &RawContext) -> bool {
    let permission = |value: &RawPermission| oracle::Permission::new(value.resource, value.action, value.scope);
    let request = oracle::AuthorizationRequest {
        request_id: "request-1".into(),
        session_id: raw.session_id.into(),
        required_permission: permission(&raw.required_permission),
        scope_evidence_ref: raw.scope_evidence_ref.into(),
        decision_time: raw.decision_time,
        current_authorization_revision: raw.current_authorization_revision,
    };
    let sessions: Vec<_> = raw.sessions.iter().map(|session| oracle::Session {
        session_id: session.session_id.into(),
        user_id: session.user_id.into(),
        status: match session.status { RawStatus::Active => oracle::SessionStatus::Active, RawStatus::Inactive => oracle::SessionStatus::Inactive, RawStatus::Revoked => oracle::SessionStatus::Revoked },
        active_role_ids: strings(&session.active_role_ids),
        authorization_revision: session.authorization_revision,
        expires_at: session.expires_at,
    }).collect();
    let roles: Vec<_> = raw.roles.iter().map(|role| oracle::Role {
        role_id: role.role_id.into(),
        permissions: role.permissions.iter().map(permission).collect(),
    }).collect();
    oracle::authorize(oracle::EvaluationContext {
        request: &request,
        resolved_sessions: &sessions,
        resolved_roles: &roles,
        trusted_scope_evidence: raw.trusted_scope_evidence,
        role_relation_complete: raw.role_relation_complete,
    }) == oracle::AuthorizationDecision::Allow
}

fn candidate_allows(raw: &RawContext) -> bool {
    let permission = |value: &RawPermission| candidate::Permission { resource: value.resource.into(), action: value.action.into(), scope: value.scope.into() };
    let context = candidate::EvaluationContext {
        request: candidate::AuthorizationRequest {
            request_id: "request-1".into(),
            session_id: raw.session_id.into(),
            required_permission: permission(&raw.required_permission),
            scope_evidence_ref: raw.scope_evidence_ref.into(),
            decision_time: raw.decision_time,
            current_authorization_revision: raw.current_authorization_revision,
        },
        resolved_sessions: raw.sessions.iter().map(|session| candidate::Session {
            session_id: session.session_id.into(),
            user_id: session.user_id.into(),
            status: match session.status { RawStatus::Active => candidate::SessionStatus::Active, RawStatus::Inactive => candidate::SessionStatus::Inactive, RawStatus::Revoked => candidate::SessionStatus::Revoked },
            active_role_ids: strings(&session.active_role_ids),
            authorization_revision: session.authorization_revision,
            expires_at: session.expires_at,
        }).collect(),
        resolved_roles: raw.roles.iter().map(|role| candidate::Role {
            role_id: role.role_id.into(),
            permissions: role.permissions.iter().map(permission).collect(),
        }).collect(),
        trusted_scope_evidence: raw.trusted_scope_evidence,
        role_relation_complete: raw.role_relation_complete,
    };
    candidate::authorize(&context) == candidate::AuthorizationDecision::Allow
}

fn cases() -> Vec<(&'static str, RawContext, bool)> {
    let mut result = vec![("valid", valid(), true)];
    let mut add = |name, mutate: fn(&mut RawContext)| {
        let mut context = valid();
        mutate(&mut context);
        result.push((name, context, false));
    };
    add("missing-session", |value| value.sessions.clear());
    add("ambiguous-identical-session", |value| value.sessions.push(value.sessions[0].clone()));
    add("ambiguous-one-inactive-session", |value| {
        let mut duplicate = value.sessions[0].clone();
        duplicate.status = RawStatus::Inactive;
        value.sessions.push(duplicate);
    });
    add("inactive-session", |value| value.sessions[0].status = RawStatus::Inactive);
    add("revoked-session", |value| value.sessions[0].status = RawStatus::Revoked);
    add("expiry-boundary", |value| value.sessions[0].expires_at = value.decision_time);
    add("stale-revision", |value| value.current_authorization_revision += 1);
    add("untrusted-scope", |value| value.trusted_scope_evidence = false);
    add("missing-scope-ref", |value| value.scope_evidence_ref = "");
    add("incomplete-role-relation", |value| value.role_relation_complete = false);
    add("missing-role", |value| value.roles.clear());
    add("extra-role", |value| value.roles.push(RawRole { role_id: "extra", permissions: vec![] }));
    add("duplicate-identical-role", |value| value.roles.push(value.roles[0].clone()));
    add("duplicate-role-with-different-permissions", |value| {
        let mut duplicate = value.roles[0].clone();
        duplicate.permissions.clear();
        value.roles.push(duplicate);
    });
    add("no-grant", |value| value.roles[0].permissions.clear());
    add("resource-mismatch", |value| value.roles[0].permissions[0].resource = "other");
    add("action-mismatch", |value| value.roles[0].permissions[0].action = "write");
    add("scope-mismatch", |value| value.roles[0].permissions[0].scope = "tenant-8");
    let mut one_grant = valid();
    one_grant.sessions[0].active_role_ids.push("empty");
    one_grant.roles.insert(0, RawRole { role_id: "empty", permissions: vec![] });
    result.push(("one-exact-grant-among-active-roles", one_grant, true));
    let mut nonmatching_duplicates = valid();
    let mut other = nonmatching_duplicates.sessions[0].clone();
    other.session_id = "other-session";
    nonmatching_duplicates.sessions.extend([other.clone(), other]);
    result.push(("nonmatching-duplicate-sessions", nonmatching_duplicates, true));
    let mut role_permutation = valid();
    role_permutation.sessions[0].active_role_ids.push("empty");
    role_permutation.roles.push(RawRole { role_id: "empty", permissions: vec![] });
    role_permutation.roles.reverse();
    result.push(("resolved-role-permutation", role_permutation, true));
    let mut whitespace_scope = valid();
    whitespace_scope.scope_evidence_ref = "   ";
    result.push(("whitespace-scope-reference", whitespace_scope, true));
    let mut combined_failures = valid();
    combined_failures.trusted_scope_evidence = false;
    combined_failures.roles.clear();
    result.push(("combined-failures", combined_failures, false));
    result
}

#[test]
fn standard_cli_candidate_matches_the_specialized_oracle_for_auth_cases() {
    for (name, context, expected) in cases() {
        let oracle = oracle_allows(&context);
        let candidate = candidate_allows(&context);
        assert_eq!(oracle, expected, "oracle expectation drift:{name}");
        assert_eq!(candidate, oracle, "standard candidate mismatch:{name}");
    }
}
