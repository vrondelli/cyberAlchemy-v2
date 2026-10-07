//! Trusted stdin adapter; Open Questions: ../README.md.
use auth_foundation_authorization_service::{SqliteAuthService, migrate_connection};
use auth_foundation_authorization_state_model::{
    BinaryAuthorizationDecision, InboundAuthorizationRequest,
};
use rusqlite::{Connection, params};
use serde::Deserialize;
use std::{
    io::{self, Read},
    time::{SystemTime, UNIX_EPOCH},
};
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Identity {
    issuer: String,
    subject: String,
    kind: String,
    client: String,
    expires_at: u64,
    jti: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Permission {
    resource: String,
    action: String,
    scope: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Request {
    identity: Identity,
    tenant: String,
    permissions: Vec<Permission>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Membership {
    tenant: String,
    enabled: bool,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Session {
    jti: String,
    enabled: bool,
    active_roles: Vec<String>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Principal {
    issuer: String,
    subject: String,
    kind: String,
    client: String,
    enabled: bool,
    memberships: Vec<Membership>,
    sessions: Vec<Session>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Role {
    id: String,
    permissions: Vec<Permission>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Policy {
    revision: u64,
    principals: Vec<Principal>,
    roles: Vec<Role>,
}
fn valid(s: &str) -> bool {
    !s.is_empty() && s.len() <= 256 && !s.chars().any(char::is_control)
}
fn evaluate() -> Result<Vec<bool>, Box<dyn std::error::Error>> {
    let mut input = String::new();
    io::stdin().take(262145).read_to_string(&mut input)?;
    if input.len() > 262144 {
        return Err("input bound".into());
    }
    let r: Request = serde_json::from_str(&input)?;
    let v = &r.identity;
    let mut bytes = String::new();
    std::fs::File::open(std::env::args().nth(1).ok_or("policy path")?)?
        .take(1048577)
        .read_to_string(&mut bytes)?;
    if bytes.len() > 1048576 {
        return Err("policy bound".into());
    }
    let p: Policy = serde_json::from_str(&bytes)?;
    let deny = || vec![false; r.permissions.len()];
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "clock")?
        .as_secs();
    if ![&v.issuer, &v.subject, &v.kind, &v.client, &v.jti, &r.tenant]
        .iter()
        .all(|s| valid(s))
        || v.expires_at <= now
        || v.expires_at > now + 300
        || !["human", "service"].contains(&v.kind.as_str())
        || p.revision == 0
        || p.revision > i64::MAX as u64
        || p.principals.len() > 1000
        || p.roles.len() > 1000
        || r.permissions.len() > 1000
    {
        return Ok(deny());
    }
    if r.permissions.iter().any(|x| {
        x.scope != r.tenant || ![&x.resource, &x.action, &x.scope].iter().all(|s| valid(s))
    }) {
        return Ok(deny());
    }
    let matches: Vec<_> = p
        .principals
        .iter()
        .filter(|x| x.issuer == v.issuer && x.subject == v.subject && x.kind == v.kind)
        .collect();
    if matches.len() != 1 {
        return Ok(deny());
    }
    let x = matches[0];
    let members: Vec<_> = x
        .memberships
        .iter()
        .filter(|m| m.tenant == r.tenant)
        .collect();
    let sessions: Vec<_> = x.sessions.iter().filter(|s| s.jti == v.jti).collect();
    if !x.enabled
        || x.client != v.client
        || members.len() != 1
        || !members[0].enabled
        || sessions.len() != 1
        || !sessions[0].enabled
    {
        return Ok(deny());
    }
    let session = sessions[0];
    if session.active_roles.len() > 100
        || session
            .active_roles
            .iter()
            .any(|id| p.roles.iter().filter(|role| role.id == *id).count() != 1)
    {
        return Ok(deny());
    }
    let mut db = Connection::open_in_memory()?;
    migrate_connection(&mut db).map_err(|_| "schema")?;
    db.execute("INSERT INTO auth_authentication_evidence (evidence_row_id,evidence_ref,session_id,trusted,revoked,expires_at,evidence_revision,authenticated_subject_id) VALUES (1,'verified','interaction',1,0,?1,?2,'principal')",params![v.expires_at as i64,p.revision as i64])?;
    db.execute("INSERT INTO auth_sessions (session_row_id,session_id,user_id,status,authorization_revision,expires_at) VALUES (1,'interaction','principal','active',?1,?2)",params![p.revision as i64,v.expires_at as i64])?;
    db.execute(
        "INSERT INTO auth_authorization_revisions (session_id,revision) VALUES ('interaction',?1)",
        [p.revision as i64],
    )?;
    for id in &session.active_roles {
        let role = p.roles.iter().find(|x| x.id == *id).ok_or("role")?;
        if !valid(id) || role.permissions.len() > 1000 {
            return Ok(deny());
        }
        db.execute("INSERT INTO auth_roles (role_id) VALUES (?1)", [id])?;
        db.execute("INSERT INTO auth_session_active_roles (session_row_id,role_id,authorization_revision) VALUES (1,?1,?2)",params![id,p.revision as i64])?;
        for perm in &role.permissions {
            if ![&perm.resource, &perm.action, &perm.scope]
                .iter()
                .all(|s| valid(s))
            {
                return Ok(deny());
            }
            db.execute("INSERT INTO auth_role_permissions (role_id,resource,action,scope,authorization_revision) VALUES (?1,?2,?3,?4,?5)",params![id,perm.resource,perm.action,perm.scope,p.revision as i64])?;
        }
    }
    for (i, perm) in r.permissions.iter().enumerate() {
        let key = format!("permission-{i}");
        db.execute("INSERT INTO auth_route_authorization_bindings (binding_row_id,route_id,resource,action,scope,scope_evidence_ref,complete,enabled,binding_revision) VALUES (?1,?2,?3,?4,?5,?2,1,1,?6)",params![(i+1) as i64,key,perm.resource,perm.action,perm.scope,p.revision as i64])?;
        db.execute("INSERT INTO auth_scope_evidence (evidence_ref,resource,action,scope,trusted) VALUES (?1,?2,?3,?4,1)",params![key,perm.resource,perm.action,perm.scope])?;
    }
    let mut service = SqliteAuthService::from_connection(db).map_err(|_| "service")?;
    Ok(r.permissions
        .iter()
        .enumerate()
        .map(|(i, _)| {
            let request = InboundAuthorizationRequest {
                request_id: format!("request-{i}"),
                authentication_evidence_ref: "verified".into(),
                route_id: format!("permission-{i}"),
            };
            #[cfg(feature = "trace")]
            let trace_scope = auth_foundation_authorization_trace::Scope::enter(
                auth_foundation_authorization_trace::Root::TenantBridge,
                &request.request_id,
            );
            let decision = service.authorize(request);
            #[cfg(feature = "trace")]
            auth_foundation_authorization_trace::emit_to_stderr_if_requested(&trace_scope.finish());
            decision == BinaryAuthorizationDecision::Allow
        })
        .collect())
}
fn main() {
    println!(
        "{}",
        serde_json::json!({"decisions":evaluate().unwrap_or_default()})
    );
}
