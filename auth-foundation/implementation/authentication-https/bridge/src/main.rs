//! Private stdin-only trusted bridge. Never expose this input as a network API.
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
struct Verified {
    issuer: String,
    subject: String,
    kind: String,
    client: String,
    expires_at: u64,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Principal {
    issuer: String,
    subject: String,
    kind: String,
    client: String,
    id: String,
    enabled: bool,
    read: bool,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Policy {
    revision: u64,
    principals: Vec<Principal>,
}
fn evaluate() -> Result<bool, Box<dyn std::error::Error>> {
    let mut input = String::new();
    io::stdin().take(8193).read_to_string(&mut input)?;
    if input.len() > 8192 {
        return Ok(false);
    }
    let v: Verified = serde_json::from_str(&input)?;
    let p: Policy = serde_json::from_str(&std::fs::read_to_string(
        std::env::args().nth(1).ok_or("policy path missing")?,
    )?)?;
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "clock")?
        .as_secs();
    if v.expires_at <= now
        || v.expires_at > now + 310
        || !["human", "service"].contains(&v.kind.as_str())
        || p.revision == 0
        || p.revision > i64::MAX as u64
    {
        return Ok(false);
    }
    let matches: Vec<_> = p
        .principals
        .iter()
        .filter(|x| x.issuer == v.issuer && x.subject == v.subject)
        .collect();
    if matches.len() != 1 {
        return Ok(false);
    }
    let x = matches[0];
    if !x.enabled
        || x.kind != v.kind
        || x.client != v.client
        || !x.id.starts_with(&(v.kind.clone() + ":"))
        || p.principals.iter().filter(|other| other.id == x.id).count() != 1
    {
        return Ok(false);
    }
    // Materialize a private snapshot from one policy read. Legacy user_id holds
    // the explicitly typed principal key; it does not assert a human identity.
    let mut db = Connection::open_in_memory()?;
    migrate_connection(&mut db).map_err(|_| "schema")?;
    db.execute("INSERT INTO auth_authentication_evidence (evidence_row_id,evidence_ref,session_id,trusted,revoked,expires_at,evidence_revision,authenticated_subject_id) VALUES (1,'verified','interaction',1,0,?1,?2,?3)",params![v.expires_at as i64,p.revision as i64,x.id])?;
    db.execute("INSERT INTO auth_route_authorization_bindings (binding_row_id,route_id,resource,action,scope,scope_evidence_ref,complete,enabled,binding_revision) VALUES (1,'documents.read','documents','read','prototype','scope',1,1,?1)",[p.revision as i64])?;
    db.execute("INSERT INTO auth_roles (role_id) VALUES ('reader')", [])?;
    if x.read {
        db.execute("INSERT INTO auth_role_permissions (role_id,resource,action,scope,authorization_revision) VALUES ('reader','documents','read','prototype',?1)",[p.revision as i64])?;
    }
    db.execute("INSERT INTO auth_sessions (session_row_id,session_id,user_id,status,authorization_revision,expires_at) VALUES (1,'interaction',?1,'active',?2,?3)",params![x.id,p.revision as i64,v.expires_at as i64])?;
    db.execute("INSERT INTO auth_session_active_roles (session_row_id,role_id,authorization_revision) VALUES (1,'reader',?1)",[p.revision as i64])?;
    db.execute(
        "INSERT INTO auth_authorization_revisions (session_id,revision) VALUES ('interaction',?1)",
        [p.revision as i64],
    )?;
    db.execute("INSERT INTO auth_scope_evidence (evidence_ref,resource,action,scope,trusted) VALUES ('scope','documents','read','prototype',1)",[])?;
    let mut service = SqliteAuthService::from_connection(db).map_err(|_| "service")?;
    let request = InboundAuthorizationRequest {
        request_id: "verified-request".into(),
        authentication_evidence_ref: "verified".into(),
        route_id: "documents.read".into(),
    };
    #[cfg(feature = "trace")]
    let trace_scope = auth_foundation_authorization_trace::Scope::enter(
        auth_foundation_authorization_trace::Root::HttpsBridge,
        &request.request_id,
    );
    let decision = service.authorize(request);
    #[cfg(feature = "trace")]
    auth_foundation_authorization_trace::emit_to_stderr_if_requested(&trace_scope.finish());
    Ok(decision == BinaryAuthorizationDecision::Allow)
}
fn main() {
    let allow = evaluate().unwrap_or(false);
    println!(
        "{}",
        if allow {
            "{\"decision\":\"ALLOW\"}"
        } else {
            "{\"decision\":\"DENY\"}"
        }
    );
}
