#[path = "generated.rs"]
mod generated;

use generated::{AuthenticatedSessionEvidence, AuthorizationCommand, BoundaryRequest,
    CommandBoundaryContext, CommandBoundaryDecision, Permission, RouteAuthorizationBinding};

fn main() {
    let bits = std::env::args().nth(1).expect("one valuation argument");
    assert_eq!(std::env::args().count(), 2, "one valuation argument");
    assert_eq!(bits.len(), 3, "three Boolean digits");
    assert!(bits.bytes().all(|byte| byte == b'0' || byte == b'1'));
    let values: Vec<bool> = bits.bytes().map(|byte| byte == b'1').collect();
    let permission = Permission { resource: "account".into(), action: "read".into(), scope: "own".into() };
    let evidence = AuthenticatedSessionEvidence {
        evidence_ref: "evidence-1".into(), session_id: "session-1".into(), trusted: true,
    };
    let binding = RouteAuthorizationBinding {
        route_id: "route-1".into(), required_permission: permission.clone(),
        scope_evidence_ref: "scope-1".into(), complete: true,
    };
    let context = CommandBoundaryContext {
        request: BoundaryRequest {
            request_id: "request-1".into(), authentication_evidence_ref: "evidence-1".into(),
            route_id: "route-1".into(),
        },
        resolved_authentication_evidence: if values[0] { vec![evidence.clone()] } else { vec![evidence.clone(), evidence] },
        resolved_route_bindings: if values[1] { vec![binding.clone()] } else { vec![binding.clone(), binding] },
        candidate_command: AuthorizationCommand {
            request_id: if values[2] { "request-1" } else { "other-request" }.into(),
            session_id: "session-1".into(), required_permission: permission,
            scope_evidence_ref: "scope-1".into(),
        },
    };
    let observed = [
        generated::unique_trusted_authentication_evidence(&context),
        generated::unique_complete_route_binding(&context),
        generated::candidate_command_provenance(&context),
    ];
    let flags: String = observed.iter().map(|value| if *value { '1' } else { '0' }).collect();
    let decision = match generated::admit_authorization_command(&context) {
        CommandBoundaryDecision::Ready => "Ready",
        CommandBoundaryDecision::Deny => "Deny",
    };
    println!("{}\t{}\t{}", bits, flags, decision);
}
