//! Counterexample to an all-path no-call claim for the generic resolver API.
//! This does not assert that any concrete deployed resolver behaves this way.

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use auth_foundation_trusted_boundary_v2::{
    AuthenticatedSessionEvidence, AuthenticationEvidenceResolver, AuthorizationCommand,
    AuthorizationDecisionService, BinaryAuthorizationDecision, InboundAuthorizationRequest,
    Permission, PortFailure, RouteAuthorizationBinding, RouteAuthorizationBindingResolver,
    TrustedAuthorizationBoundary,
};

struct CountedDownstream {
    calls: Rc<Cell<usize>>,
}

impl AuthorizationDecisionService for CountedDownstream {
    fn authorize(&mut self, _: AuthorizationCommand) -> BinaryAuthorizationDecision {
        self.calls.set(self.calls.get() + 1);
        BinaryAuthorizationDecision::Allow
    }
}

struct SharedDownstream(Rc<RefCell<CountedDownstream>>);

impl AuthorizationDecisionService for SharedDownstream {
    fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        self.0.borrow_mut().authorize(command)
    }
}

struct EffectfulAuthenticationPort(Rc<RefCell<CountedDownstream>>);

impl AuthenticationEvidenceResolver for EffectfulAuthenticationPort {
    fn resolve_authentication_evidence(
        &self,
        _: &str,
    ) -> Result<Vec<AuthenticatedSessionEvidence>, PortFailure> {
        self.0.borrow_mut().authorize(AuthorizationCommand {
            request_id: "resolver-side-call".into(),
            session_id: "session-1".into(),
            required_permission: Permission {
                resource: "documents".into(),
                action: "read".into(),
                scope: "tenant-7".into(),
            },
            scope_evidence_ref: "scope-1".into(),
        });
        Ok(Vec::new())
    }
}

struct RoutePort;

impl RouteAuthorizationBindingResolver for RoutePort {
    fn resolve_route_authorization_bindings(
        &self,
        _: &str,
    ) -> Result<Vec<RouteAuthorizationBinding>, PortFailure> {
        Ok(Vec::new())
    }
}

#[test]
fn generic_resolver_may_call_the_same_downstream_before_kernel_deny() {
    let calls = Rc::new(Cell::new(0));
    let downstream = Rc::new(RefCell::new(CountedDownstream {
        calls: calls.clone(),
    }));
    let mut boundary = TrustedAuthorizationBoundary::new(
        EffectfulAuthenticationPort(downstream.clone()),
        RoutePort,
        SharedDownstream(downstream),
    );
    let result = boundary.authorize(InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-1".into(),
        route_id: "route-1".into(),
    });

    assert_eq!(result, BinaryAuthorizationDecision::Deny);
    assert_eq!(calls.get(), 1);
}
