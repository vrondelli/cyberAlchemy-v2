use std::process::ExitCode;

use auth_command_boundary_kernel::{
    AuthenticatedSessionEvidence, AuthorizationCommand, BoundaryRequest, CommandBoundaryContext,
    CommandBoundaryDecision, Permission, RouteAuthorizationBinding, admit_authorization_command,
    candidate_command_provenance, unique_complete_route_binding,
    unique_trusted_authentication_evidence,
};

fn parse_boolean(value: Option<String>, name: &str) -> Result<bool, String> {
    match value.as_deref() {
        Some("true") => Ok(true),
        Some("false") => Ok(false),
        Some(other) => Err(format!("{name} must be true or false; received {other}")),
        None => Err(format!("missing {name}")),
    }
}

fn permission() -> Permission {
    Permission {
        resource: "document".to_owned(),
        action: "read".to_owned(),
        scope: "tenant-1".to_owned(),
    }
}

fn context_for(auth: bool, route: bool, provenance: bool) -> CommandBoundaryContext {
    let mut context = CommandBoundaryContext {
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
    };
    if !auth {
        context
            .resolved_authentication_evidence
            .push(context.resolved_authentication_evidence[0].clone());
    }
    if !route {
        context
            .resolved_route_bindings
            .push(context.resolved_route_bindings[0].clone());
    }
    if !provenance {
        context.candidate_command.session_id = "wrong-session".to_owned();
    }
    context
}

fn run() -> Result<bool, String> {
    let mut arguments = std::env::args().skip(1);
    let auth = parse_boolean(arguments.next(), "unique_trusted_authentication_evidence")?;
    let route = parse_boolean(arguments.next(), "unique_complete_route_binding")?;
    let provenance = parse_boolean(arguments.next(), "candidate_command_provenance")?;
    if arguments.next().is_some() {
        return Err("unexpected extra argument".to_owned());
    }

    let context = context_for(auth, route, provenance);
    if unique_trusted_authentication_evidence(&context) != auth
        || unique_complete_route_binding(&context) != route
        || candidate_command_provenance(&context) != provenance
    {
        return Err("Rust context projection does not realize requested SFOL inputs".to_owned());
    }
    Ok(matches!(
        admit_authorization_command(&context),
        CommandBoundaryDecision::Ready
    ))
}

fn main() -> ExitCode {
    match run() {
        Ok(value) => {
            println!("{value}");
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
