use historical_command_boundary_kernel as old;

#[test]
fn pinned_v1_kernel_accepts_a_nonqualifying_provenance_witness() {
    let permission = old::Permission {
        resource: "documents".into(),
        action: "read".into(),
        scope: "tenant-7".into(),
    };
    let context = old::CommandBoundaryContext {
        request: old::BoundaryRequest {
            request_id: "request-1".into(),
            authentication_evidence_ref: "auth-evidence-1".into(),
            route_id: "documents.read".into(),
        },
        resolved_authentication_evidence: vec![
            old::AuthenticatedSessionEvidence {
                evidence_ref: "auth-evidence-1".into(),
                session_id: "session-1".into(),
                trusted: true,
            },
            old::AuthenticatedSessionEvidence {
                evidence_ref: "auth-evidence-1".into(),
                session_id: String::new(),
                trusted: true,
            },
        ],
        resolved_route_bindings: vec![old::RouteAuthorizationBinding {
            route_id: "documents.read".into(),
            required_permission: permission.clone(),
            scope_evidence_ref: "route-scope-1".into(),
            complete: true,
        }],
        candidate_command: old::AuthorizationCommand {
            request_id: "request-1".into(),
            session_id: String::new(),
            required_permission: permission,
            scope_evidence_ref: "route-scope-1".into(),
        },
    };
    assert!(old::unique_trusted_authentication_evidence(&context));
    assert!(old::unique_complete_route_binding(&context));
    assert!(old::candidate_command_provenance(&context));
    assert_eq!(
        old::admit_authorization_command(&context),
        old::CommandBoundaryDecision::Ready
    );
}
