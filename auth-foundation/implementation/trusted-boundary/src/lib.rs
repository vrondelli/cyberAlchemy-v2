//! Legacy v1 boundary fixture, isolated from the selected public Auth request.
//!
//! The generic resolver and downstream callback are not an all-path no-call
//! proof. This crate deliberately has no concrete SQLite decision-service
//! implementation; use the transaction-bound READY composition instead.

use auth_command_boundary_kernel as boundary_kernel;

pub use auth_foundation_authorization_state_model::{
    AuthenticatedSessionEvidence, AuthenticationEvidenceResolver, RouteAuthorizationBinding,
    RouteAuthorizationBindingResolver,
};
pub use auth_foundation_authorization_state_model::{
    AuthorizationCommand, BinaryAuthorizationDecision, InboundAuthorizationRequest, Permission,
    PortFailure,
};

pub trait AuthorizationDecisionService {
    fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision;
}

pub struct TrustedAuthorizationBoundary<A, R, D> {
    authentication_evidence: A,
    route_bindings: R,
    downstream: D,
}

impl<A, R, D> TrustedAuthorizationBoundary<A, R, D>
where
    A: AuthenticationEvidenceResolver,
    R: RouteAuthorizationBindingResolver,
    D: AuthorizationDecisionService,
{
    pub fn new(authentication_evidence: A, route_bindings: R, downstream: D) -> Self {
        Self {
            authentication_evidence,
            route_bindings,
            downstream,
        }
    }

    pub fn authorize(
        &mut self,
        request: InboundAuthorizationRequest,
    ) -> BinaryAuthorizationDecision {
        let authentication_evidence = self
            .authentication_evidence
            .resolve_authentication_evidence(&request.authentication_evidence_ref)
            .unwrap_or_default();
        let route_bindings = self
            .route_bindings
            .resolve_route_authorization_bindings(&request.route_id)
            .unwrap_or_default();

        let candidate = construct_candidate(&request, &authentication_evidence, &route_bindings);
        let context = boundary_kernel::CommandBoundaryContext {
            request: boundary_kernel::BoundaryRequest {
                request_id: request.request_id,
                authentication_evidence_ref: request.authentication_evidence_ref,
                route_id: request.route_id,
            },
            resolved_authentication_evidence: authentication_evidence
                .into_iter()
                .map(to_kernel_authentication_evidence)
                .collect(),
            resolved_route_bindings: route_bindings
                .into_iter()
                .map(to_kernel_route_binding)
                .collect(),
            candidate_command: to_kernel_command(&candidate),
        };

        match boundary_kernel::admit_authorization_command(&context) {
            boundary_kernel::CommandBoundaryDecision::Ready => self.downstream.authorize(candidate),
            boundary_kernel::CommandBoundaryDecision::Deny => BinaryAuthorizationDecision::Deny,
        }
    }
}

fn construct_candidate(
    request: &InboundAuthorizationRequest,
    authentication_evidence: &[AuthenticatedSessionEvidence],
    route_bindings: &[RouteAuthorizationBinding],
) -> AuthorizationCommand {
    let matching_authentication: Vec<_> = authentication_evidence
        .iter()
        .filter(|evidence| {
            evidence.evidence_ref == request.authentication_evidence_ref && evidence.trusted
        })
        .collect();
    let matching_bindings: Vec<_> = route_bindings
        .iter()
        .filter(|binding| binding.route_id == request.route_id && binding.complete)
        .collect();

    if matching_authentication.len() == 1 && matching_bindings.len() == 1 {
        AuthorizationCommand {
            request_id: request.request_id.clone(),
            session_id: matching_authentication[0].session_id.clone(),
            required_permission: matching_bindings[0].required_permission.clone(),
            scope_evidence_ref: matching_bindings[0].scope_evidence_ref.clone(),
        }
    } else {
        AuthorizationCommand {
            request_id: String::new(),
            session_id: String::new(),
            required_permission: Permission {
                resource: String::new(),
                action: String::new(),
                scope: String::new(),
            },
            scope_evidence_ref: String::new(),
        }
    }
}

fn to_kernel_authentication_evidence(
    evidence: AuthenticatedSessionEvidence,
) -> boundary_kernel::AuthenticatedSessionEvidence {
    boundary_kernel::AuthenticatedSessionEvidence {
        evidence_ref: evidence.evidence_ref,
        session_id: evidence.session_id,
        trusted: evidence.trusted,
    }
}

fn to_kernel_route_binding(
    binding: RouteAuthorizationBinding,
) -> boundary_kernel::RouteAuthorizationBinding {
    boundary_kernel::RouteAuthorizationBinding {
        route_id: binding.route_id,
        required_permission: to_kernel_permission(&binding.required_permission),
        scope_evidence_ref: binding.scope_evidence_ref,
        complete: binding.complete,
    }
}

fn to_kernel_command(command: &AuthorizationCommand) -> boundary_kernel::AuthorizationCommand {
    boundary_kernel::AuthorizationCommand {
        request_id: command.request_id.clone(),
        session_id: command.session_id.clone(),
        required_permission: to_kernel_permission(&command.required_permission),
        scope_evidence_ref: command.scope_evidence_ref.clone(),
    }
}

fn to_kernel_permission(permission: &Permission) -> boundary_kernel::Permission {
    boundary_kernel::Permission {
        resource: permission.resource.clone(),
        action: permission.action.clone(),
        scope: permission.scope.clone(),
    }
}
