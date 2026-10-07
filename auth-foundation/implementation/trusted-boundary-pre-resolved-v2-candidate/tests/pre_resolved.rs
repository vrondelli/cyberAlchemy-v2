use auth_foundation_trusted_boundary_pre_resolved_v2_candidate::authorize_pre_resolved;
use auth_foundation_trusted_boundary_v2::{
    AuthenticatedSessionEvidence, AuthorizationCommand, AuthorizationDecisionService,
    BinaryAuthorizationDecision, InboundAuthorizationRequest, Permission,
    RouteAuthorizationBinding,
};

struct CountedDownstream {
    result: BinaryAuthorizationDecision,
    commands: Vec<AuthorizationCommand>,
}

impl AuthorizationDecisionService for CountedDownstream {
    fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        self.commands.push(command);
        self.result
    }
}

fn request() -> InboundAuthorizationRequest {
    InboundAuthorizationRequest {
        request_id: "request-1".into(),
        authentication_evidence_ref: "auth-1".into(),
        route_id: "documents.read".into(),
    }
}

fn authentication() -> AuthenticatedSessionEvidence {
    AuthenticatedSessionEvidence {
        evidence_ref: "auth-1".into(),
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
        scope_evidence_ref: "scope-1".into(),
        complete: true,
    }
}

fn run(
    request: InboundAuthorizationRequest,
    authentication: Vec<AuthenticatedSessionEvidence>,
    bindings: Vec<RouteAuthorizationBinding>,
    downstream_result: BinaryAuthorizationDecision,
) -> (BinaryAuthorizationDecision, Vec<AuthorizationCommand>) {
    let mut downstream = CountedDownstream {
        result: downstream_result,
        commands: Vec::new(),
    };
    let decision = authorize_pre_resolved(request, authentication, bindings, &mut downstream);
    (decision, downstream.commands)
}

#[test]
fn ready_calls_once_with_the_unique_qualifying_row() {
    let mut nonqualifying = authentication();
    nonqualifying.session_id.clear();
    let (decision, commands) = run(
        request(),
        vec![nonqualifying, authentication()],
        vec![binding()],
        BinaryAuthorizationDecision::Allow,
    );
    assert_eq!(decision, BinaryAuthorizationDecision::Allow);
    assert_eq!(
        commands,
        vec![AuthorizationCommand {
            request_id: "request-1".into(),
            session_id: "session-1".into(),
            required_permission: binding().required_permission,
            scope_evidence_ref: "scope-1".into(),
        }]
    );
}

#[test]
fn ready_uses_the_qualifying_route_when_another_route_row_does_not_qualify() {
    let mut nonqualifying = binding();
    nonqualifying.required_permission.action.clear();
    let (decision, commands) = run(
        request(),
        vec![authentication()],
        vec![nonqualifying, binding()],
        BinaryAuthorizationDecision::Allow,
    );
    assert_eq!(decision, BinaryAuthorizationDecision::Allow);
    assert_eq!(commands.len(), 1);
    assert_eq!(
        commands[0].required_permission,
        binding().required_permission
    );
    assert_eq!(commands[0].scope_evidence_ref, "scope-1");
}

#[test]
fn downstream_deny_after_ready_still_counts_as_one_call() {
    let (decision, commands) = run(
        request(),
        vec![authentication()],
        vec![binding()],
        BinaryAuthorizationDecision::Deny,
    );
    assert_eq!(decision, BinaryAuthorizationDecision::Deny);
    assert_eq!(commands.len(), 1);
}

#[test]
fn kernel_denials_make_no_downstream_call_in_this_composition() {
    let mut blank_request = request();
    blank_request.request_id.clear();
    let mut untrusted = authentication();
    untrusted.trusted = false;
    let mut incomplete = binding();
    incomplete.complete = false;
    let mut empty_action = binding();
    empty_action.required_permission.action.clear();

    for (request, authentication, bindings) in [
        (blank_request, vec![authentication()], vec![binding()]),
        (request(), vec![], vec![binding()]),
        (
            request(),
            vec![authentication(), authentication()],
            vec![binding()],
        ),
        (request(), vec![authentication()], vec![]),
        (
            request(),
            vec![authentication()],
            vec![binding(), binding()],
        ),
        (request(), vec![untrusted], vec![binding()]),
        (request(), vec![authentication()], vec![incomplete]),
        (request(), vec![authentication()], vec![empty_action]),
    ] {
        let (decision, commands) = run(
            request,
            authentication,
            bindings,
            BinaryAuthorizationDecision::Allow,
        );
        assert_eq!(decision, BinaryAuthorizationDecision::Deny);
        assert!(commands.is_empty());
    }
}
