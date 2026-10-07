//! Candidate pre-resolved composition of the exact pinned v2 trusted boundary.
//!
//! This fixes the resolver implementations *inside this call*. It does not
//! establish that a caller supplied complete server-owned lists, nor that
//! preparing those lists avoided downstream authorization calls.

use auth_foundation_trusted_boundary_v2::{
    AuthenticatedSessionEvidence, AuthenticationEvidenceResolver, AuthorizationCommand,
    AuthorizationDecisionService, BinaryAuthorizationDecision, InboundAuthorizationRequest,
    PortFailure, RouteAuthorizationBinding, RouteAuthorizationBindingResolver,
    TrustedAuthorizationBoundary,
};

struct ResolvedAuthentication(Vec<AuthenticatedSessionEvidence>);

impl AuthenticationEvidenceResolver for ResolvedAuthentication {
    fn resolve_authentication_evidence(
        &self,
        _evidence_ref: &str,
    ) -> Result<Vec<AuthenticatedSessionEvidence>, PortFailure> {
        Ok(self.0.clone())
    }
}

struct ResolvedRoutes(Vec<RouteAuthorizationBinding>);

impl RouteAuthorizationBindingResolver for ResolvedRoutes {
    fn resolve_route_authorization_bindings(
        &self,
        _route_id: &str,
    ) -> Result<Vec<RouteAuthorizationBinding>, PortFailure> {
        Ok(self.0.clone())
    }
}

struct BorrowedDecision<'a, D>(&'a mut D);

impl<D: AuthorizationDecisionService> AuthorizationDecisionService for BorrowedDecision<'_, D> {
    fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        self.0.authorize(command)
    }
}

/// Evaluate complete, already-resolved lists through the pinned v2 wrapper.
///
/// The only authorization-service invocation reachable through this concrete
/// composition is the wrapper's READY branch. Completeness, server ownership,
/// and absence of calls before entry remain obligations of the eventual caller.
pub fn authorize_pre_resolved<D: AuthorizationDecisionService>(
    request: InboundAuthorizationRequest,
    authentication_evidence: Vec<AuthenticatedSessionEvidence>,
    route_bindings: Vec<RouteAuthorizationBinding>,
    downstream: &mut D,
) -> BinaryAuthorizationDecision {
    TrustedAuthorizationBoundary::new(
        ResolvedAuthentication(authentication_evidence),
        ResolvedRoutes(route_bindings),
        BorrowedDecision(downstream),
    )
    .authorize(request)
}
