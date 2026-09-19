// Generated from the admitted DS-SFOL clause through the finite partition engine.
// Expected decisions come from SFOL evaluation. Do not edit by hand.
use auth_command_boundary_kernel::{
    AuthenticatedSessionEvidence, AuthorizationCommand, BoundaryRequest, CommandBoundaryContext,
    CommandBoundaryDecision, Permission, RouteAuthorizationBinding, admit_authorization_command,
    candidate_command_provenance, unique_complete_route_binding,
    unique_trusted_authentication_evidence,
};

fn permission() -> Permission {
    Permission {
        resource: "document".to_owned(),
        action: "read".to_owned(),
        scope: "tenant-1".to_owned(),
    }
}

fn base_context() -> CommandBoundaryContext {
    CommandBoundaryContext {
        request: BoundaryRequest {
            request_id: "request-1".to_owned(),
            authentication_evidence_ref: "auth-1".to_owned(),
            route_id: "route-1".to_owned(),
        },
        resolved_authentication_evidence: vec![AuthenticatedSessionEvidence {
            evidence_ref: "auth-1".to_owned(),
            session_id: "session-1".to_owned(),
            trusted: true,
        }],
        resolved_route_bindings: vec![RouteAuthorizationBinding {
            route_id: "route-1".to_owned(),
            required_permission: permission(),
            scope_evidence_ref: "scope-1".to_owned(),
            complete: true,
        }],
        candidate_command: AuthorizationCommand {
            request_id: "request-1".to_owned(),
            session_id: "session-1".to_owned(),
            required_permission: permission(),
            scope_evidence_ref: "scope-1".to_owned(),
        },
    }
}

#[test]
fn sfol_111() {
    let context = base_context();

    assert_eq!(unique_trusted_authentication_evidence(&context), true);
    assert_eq!(unique_complete_route_binding(&context), true);
    assert_eq!(candidate_command_provenance(&context), true);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Ready
    );
}

#[test]
fn sfol_010() {
    let mut context = base_context();
    context
        .resolved_authentication_evidence
        .push(context.resolved_authentication_evidence[0].clone());
    context.candidate_command.session_id = "wrong-session".to_owned();
    assert_eq!(unique_trusted_authentication_evidence(&context), false);
    assert_eq!(unique_complete_route_binding(&context), true);
    assert_eq!(candidate_command_provenance(&context), false);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}

#[test]
fn sfol_100() {
    let mut context = base_context();
    context
        .resolved_route_bindings
        .push(context.resolved_route_bindings[0].clone());
    context.candidate_command.session_id = "wrong-session".to_owned();
    assert_eq!(unique_trusted_authentication_evidence(&context), true);
    assert_eq!(unique_complete_route_binding(&context), false);
    assert_eq!(candidate_command_provenance(&context), false);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}

#[test]
fn sfol_000() {
    let mut context = base_context();
    context
        .resolved_authentication_evidence
        .push(context.resolved_authentication_evidence[0].clone());
    context
        .resolved_route_bindings
        .push(context.resolved_route_bindings[0].clone());
    context.candidate_command.session_id = "wrong-session".to_owned();
    assert_eq!(unique_trusted_authentication_evidence(&context), false);
    assert_eq!(unique_complete_route_binding(&context), false);
    assert_eq!(candidate_command_provenance(&context), false);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}

#[test]
fn sfol_110() {
    let mut context = base_context();
    context.candidate_command.session_id = "wrong-session".to_owned();
    assert_eq!(unique_trusted_authentication_evidence(&context), true);
    assert_eq!(unique_complete_route_binding(&context), true);
    assert_eq!(candidate_command_provenance(&context), false);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}

#[test]
fn sfol_011() {
    let mut context = base_context();
    context
        .resolved_authentication_evidence
        .push(context.resolved_authentication_evidence[0].clone());
    assert_eq!(unique_trusted_authentication_evidence(&context), false);
    assert_eq!(unique_complete_route_binding(&context), true);
    assert_eq!(candidate_command_provenance(&context), true);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}

#[test]
fn sfol_101() {
    let mut context = base_context();
    context
        .resolved_route_bindings
        .push(context.resolved_route_bindings[0].clone());
    assert_eq!(unique_trusted_authentication_evidence(&context), true);
    assert_eq!(unique_complete_route_binding(&context), false);
    assert_eq!(candidate_command_provenance(&context), true);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}

#[test]
fn sfol_001() {
    let mut context = base_context();
    context
        .resolved_authentication_evidence
        .push(context.resolved_authentication_evidence[0].clone());
    context
        .resolved_route_bindings
        .push(context.resolved_route_bindings[0].clone());
    assert_eq!(unique_trusted_authentication_evidence(&context), false);
    assert_eq!(unique_complete_route_binding(&context), false);
    assert_eq!(candidate_command_provenance(&context), true);
    assert_eq!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Deny
    );
}
