use std::cell::Cell;
use std::rc::Rc;

use auth_foundation_trusted_boundary::{
    AuthenticatedSessionEvidence, AuthenticationEvidenceResolver, AuthorizationCommand,
    AuthorizationDecisionService, BinaryAuthorizationDecision, InboundAuthorizationRequest,
    Permission, PortFailure, RouteAuthorizationBinding, RouteAuthorizationBindingResolver,
    TrustedAuthorizationBoundary,
};

#[derive(Clone)]
struct AuthenticationPort(Result<Vec<AuthenticatedSessionEvidence>, PortFailure>);

impl AuthenticationEvidenceResolver for AuthenticationPort {
    fn resolve_authentication_evidence(
        &self,
        _evidence_ref: &str,
    ) -> Result<Vec<AuthenticatedSessionEvidence>, PortFailure> {
        self.0.clone()
    }
}

#[derive(Clone)]
struct RoutePort(Result<Vec<RouteAuthorizationBinding>, PortFailure>);

impl RouteAuthorizationBindingResolver for RoutePort {
    fn resolve_route_authorization_bindings(
        &self,
        _route_id: &str,
    ) -> Result<Vec<RouteAuthorizationBinding>, PortFailure> {
        self.0.clone()
    }
}

struct Downstream {
    calls: Rc<Cell<usize>>,
    result: BinaryAuthorizationDecision,
    observed: Rc<std::cell::RefCell<Vec<AuthorizationCommand>>>,
}

impl AuthorizationDecisionService for Downstream {
    fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        self.calls.set(self.calls.get() + 1);
        self.observed.borrow_mut().push(command);
        self.result
    }
}

fn request() -> InboundAuthorizationRequest {
    InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-evidence-1".into(),
        route_id: "documents.read".into(),
    }
}

fn authentication() -> AuthenticatedSessionEvidence {
    AuthenticatedSessionEvidence {
        evidence_ref: "auth-evidence-1".into(),
        session_id: "session-1".into(),
        trusted: true,
    }
}

fn binding() -> RouteAuthorizationBinding {
    RouteAuthorizationBinding {
        route_id: "documents.read".into(),
        required_permission: Permission {
            resource: "documents".into(),
            action: "read".into(),
            scope: "tenant-7".into(),
        },
        scope_evidence_ref: "route-scope-1".into(),
        complete: true,
    }
}

fn run(
    request: InboundAuthorizationRequest,
    authentication: Result<Vec<AuthenticatedSessionEvidence>, PortFailure>,
    bindings: Result<Vec<RouteAuthorizationBinding>, PortFailure>,
    downstream_result: BinaryAuthorizationDecision,
) -> (
    BinaryAuthorizationDecision,
    usize,
    Vec<AuthorizationCommand>,
) {
    let calls = Rc::new(Cell::new(0));
    let observed = Rc::new(std::cell::RefCell::new(Vec::new()));
    let downstream = Downstream {
        calls: calls.clone(),
        result: downstream_result,
        observed: observed.clone(),
    };
    let mut boundary = TrustedAuthorizationBoundary::new(
        AuthenticationPort(authentication),
        RoutePort(bindings),
        downstream,
    );
    let decision = boundary.authorize(request);
    let observed = observed.borrow().clone();
    (decision, calls.get(), observed)
}

#[test]
fn trusted_unique_resolutions_construct_the_only_downstream_command() {
    let (decision, calls, commands) = run(
        request(),
        Ok(vec![authentication()]),
        Ok(vec![binding()]),
        BinaryAuthorizationDecision::Allow,
    );

    assert_eq!(decision, BinaryAuthorizationDecision::Allow);
    assert_eq!(calls, 1);
    assert_eq!(
        commands,
        vec![AuthorizationCommand {
            request_id: "request-1".into(),
            session_id: "session-1".into(),
            required_permission: Permission {
                resource: "documents".into(),
                action: "read".into(),
                scope: "tenant-7".into(),
            },
            scope_evidence_ref: "route-scope-1".into(),
        }]
    );
}

#[test]
fn downstream_deny_is_preserved() {
    let (decision, calls, _) = run(
        request(),
        Ok(vec![authentication()]),
        Ok(vec![binding()]),
        BinaryAuthorizationDecision::Deny,
    );
    assert_eq!(decision, BinaryAuthorizationDecision::Deny);
    assert_eq!(calls, 1);
}

#[test]
fn missing_ambiguous_untrusted_or_wrong_authentication_evidence_denies_before_downstream() {
    let mut ambiguous = vec![authentication(), authentication()];
    ambiguous[1].session_id = "session-2".into();
    let mut untrusted = authentication();
    untrusted.trusted = false;
    let mut wrong = authentication();
    wrong.evidence_ref = "other".into();

    for evidence in [vec![], ambiguous, vec![untrusted], vec![wrong]] {
        let (decision, calls, _) = run(
            request(),
            Ok(evidence),
            Ok(vec![binding()]),
            BinaryAuthorizationDecision::Allow,
        );
        assert_eq!(decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(calls, 0);
    }
}

#[test]
fn missing_ambiguous_incomplete_or_wrong_route_binding_denies_before_downstream() {
    let mut incomplete = binding();
    incomplete.complete = false;
    let mut wrong = binding();
    wrong.route_id = "documents.write".into();

    for bindings in [
        vec![],
        vec![binding(), binding()],
        vec![incomplete],
        vec![wrong],
    ] {
        let (decision, calls, _) = run(
            request(),
            Ok(vec![authentication()]),
            Ok(bindings),
            BinaryAuthorizationDecision::Allow,
        );
        assert_eq!(decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(calls, 0);
    }
}

#[test]
fn empty_identity_or_empty_server_owned_permission_and_scope_denies() {
    let mut empty_request = request();
    empty_request.request_id.clear();
    let mut empty_auth_ref = request();
    empty_auth_ref.authentication_evidence_ref.clear();
    let mut empty_route = request();
    empty_route.route_id.clear();

    let cases = [
        (empty_request, authentication(), binding()),
        (
            empty_auth_ref,
            AuthenticatedSessionEvidence {
                evidence_ref: String::new(),
                ..authentication()
            },
            binding(),
        ),
        (
            empty_route,
            authentication(),
            RouteAuthorizationBinding {
                route_id: String::new(),
                ..binding()
            },
        ),
    ];
    for (request, authentication, binding) in cases {
        let (decision, calls, _) = run(
            request,
            Ok(vec![authentication]),
            Ok(vec![binding]),
            BinaryAuthorizationDecision::Allow,
        );
        assert_eq!(decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(calls, 0);
    }

    let mut empty_permission = binding();
    empty_permission.required_permission.action.clear();
    let mut empty_scope_ref = binding();
    empty_scope_ref.scope_evidence_ref.clear();
    for binding in [empty_permission, empty_scope_ref] {
        let (decision, calls, _) = run(
            request(),
            Ok(vec![authentication()]),
            Ok(vec![binding]),
            BinaryAuthorizationDecision::Allow,
        );
        assert_eq!(decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(calls, 0);
    }
}

#[test]
fn either_resolver_failure_denies_before_downstream() {
    for (authentication, bindings) in [
        (Err(PortFailure), Ok(vec![binding()])),
        (Ok(vec![authentication()]), Err(PortFailure)),
    ] {
        let (decision, calls, _) = run(
            request(),
            authentication,
            bindings,
            BinaryAuthorizationDecision::Allow,
        );
        assert_eq!(decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(calls, 0);
    }
}
