// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"e3ab4c0f5c3cae3edebc136eea34c6277214cb5e9a1878d81bad73ff07623db2","language":"rust","meta_type_id":"DS-D1.4","meta_type_label":"Operation","provider_sha256":"c34962ceef4fa5eabd6ccef9f7df100e31e3296ae7beef1f68d19aeb317f3629","source_sha256":"49723621b79c30372b9871f1ff09a595aff0a88f63d58c5dad8ce1ca7edbdb62"}
// domainspec-body: {"description":"Return READY only when a candidate authorization command has exact server-owned authentication and route-binding provenance; otherwise DENY.","effects":[],"failure_continuation":"return-deny-without-downstream-call","guard":"command-boundary-admissible","reads":[],"typed_contract":{"effects":[],"failure_continuation":"return-deny-without-downstream-call","failure_result":{"payload_variant":null,"variant":"Deny"},"guard":"auth-command-boundary:command-boundary-admissible","inputs":[{"name":"context","type":{"kind":"named","selector":"auth-command-boundary:command-boundary-context"}}],"ontology_operation":"AUTH-CB-OP-ADMIT-AUTHORIZATION-COMMAND","output":{"kind":"named","selector":"auth-command-boundary:command-boundary-decision"},"reads":[],"schema_version":"domainspec.typed-operation/v1","success_result":{"payload_variant":null,"variant":"Ready"},"writes":[]},"writes":[]}
// domainspec-relationships: [{"edge_id":"candidate-command-provenance-enforces-admit","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-command-boundary","kind":"Rule","node_id":"candidate-command-provenance"},"target":{"feature_id":"auth-command-boundary","kind":"Operation","node_id":"admit-authorization-command"}},{"edge_id":"command-boundary-admissible-enforces-admit","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-command-boundary","kind":"Rule","node_id":"command-boundary-admissible"},"target":{"feature_id":"auth-command-boundary","kind":"Operation","node_id":"admit-authorization-command"}},{"edge_id":"unique-complete-route-binding-enforces-admit","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-command-boundary","kind":"Rule","node_id":"unique-complete-route-binding"},"target":{"feature_id":"auth-command-boundary","kind":"Operation","node_id":"admit-authorization-command"}},{"edge_id":"unique-trusted-authentication-evidence-enforces-admit","relationship":"enforces","scope":"feature","source":{"feature_id":"auth-command-boundary","kind":"Rule","node_id":"unique-trusted-authentication-evidence"},"target":{"feature_id":"auth-command-boundary","kind":"Operation","node_id":"admit-authorization-command"}}]
// domainspec-operation-sets: {"effects":[],"reads":[],"writes":[]}
// domainspec-operation-guard: "command-boundary-admissible"
// domainspec-guard-before-mutation: true
// domainspec-atomic-state-outbox: true
// domainspec-failure-continuation: "return-deny-without-downstream-call"
// domainspec-operation-core-instrumentation-free: true
// domainspec-operation-instrumentation-owner: "outer-wrapper"
pub const ADMITAUTHORIZATIONCOMMAND_CREATION_TARGETS: &[&str] = &[];
// domainspec-typed-closure-sha256: "9d57cdaa3d283959e39a2cfc45ca7aa99336c9708d2073c325bbcd8be90e2ddb"
pub const DOMAINSPEC_TYPED_CLOSURE_SHA256: &str =
    "9d57cdaa3d283959e39a2cfc45ca7aa99336c9708d2073c325bbcd8be90e2ddb";
#[rustfmt::skip]
pub const DOMAINSPEC_PROPERTY_BINDINGS: &[(&str, &str)] = &[
    ("AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#evidence_ref", "AuthenticatedSessionEvidence::evidence_ref"),
    ("AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id", "AuthenticatedSessionEvidence::session_id"),
    ("AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#trusted", "AuthenticatedSessionEvidence::trusted"),
    ("AUTH-CB-AUTHORIZATION-COMMAND#request_id", "AuthorizationCommand::request_id"),
    ("AUTH-CB-AUTHORIZATION-COMMAND#required_permission", "AuthorizationCommand::required_permission"),
    ("AUTH-CB-AUTHORIZATION-COMMAND#scope_evidence_ref", "AuthorizationCommand::scope_evidence_ref"),
    ("AUTH-CB-AUTHORIZATION-COMMAND#session_id", "AuthorizationCommand::session_id"),
    ("AUTH-CB-BOUNDARY-REQUEST#authentication_evidence_ref", "BoundaryRequest::authentication_evidence_ref"),
    ("AUTH-CB-BOUNDARY-REQUEST#request_id", "BoundaryRequest::request_id"),
    ("AUTH-CB-BOUNDARY-REQUEST#route_id", "BoundaryRequest::route_id"),
    ("AUTH-CB-CONTEXT#candidate_command", "CommandBoundaryContext::candidate_command"),
    ("AUTH-CB-CONTEXT#request", "CommandBoundaryContext::request"),
    ("AUTH-CB-CONTEXT#resolved_authentication_evidence", "CommandBoundaryContext::resolved_authentication_evidence"),
    ("AUTH-CB-CONTEXT#resolved_route_bindings", "CommandBoundaryContext::resolved_route_bindings"),
    ("AUTH-CB-PERMISSION#action", "Permission::action"),
    ("AUTH-CB-PERMISSION#resource", "Permission::resource"),
    ("AUTH-CB-PERMISSION#scope", "Permission::scope"),
    ("AUTH-CB-ROUTE-AUTHORIZATION-BINDING#complete", "RouteAuthorizationBinding::complete"),
    ("AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission", "RouteAuthorizationBinding::required_permission"),
    ("AUTH-CB-ROUTE-AUTHORIZATION-BINDING#route_id", "RouteAuthorizationBinding::route_id"),
    ("AUTH-CB-ROUTE-AUTHORIZATION-BINDING#scope_evidence_ref", "RouteAuthorizationBinding::scope_evidence_ref"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_VARIANT_BINDINGS: &[(&str, &str)] = &[
    ("AUTH-CB-DECISION#Deny", "CommandBoundaryDecision::Deny"),
    ("AUTH-CB-DECISION#Ready", "CommandBoundaryDecision::Ready"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_RULE_SELECTORS: &[(&str, &str)] = &[
    ("AUTH-CB-RULE-ADMISSIBLE", "auth-command-boundary:command-boundary-admissible"),
    ("AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE", "auth-command-boundary:candidate-command-provenance"),
    ("AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING", "auth-command-boundary:unique-complete-route-binding"),
    ("AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE", "auth-command-boundary:unique-trusted-authentication-evidence"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_RULE_IMPLEMENTATION_BINDINGS: &[(&str, &str, &str)] = &[
    ("AUTH-CB-RULE-ADMISSIBLE", "auth-command-boundary:command-boundary-admissible", "command_boundary_admissible"),
    ("AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE", "auth-command-boundary:candidate-command-provenance", "candidate_command_provenance"),
    ("AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING", "auth-command-boundary:unique-complete-route-binding", "unique_complete_route_binding"),
    ("AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE", "auth-command-boundary:unique-trusted-authentication-evidence", "unique_trusted_authentication_evidence"),
];

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct AuthenticatedSessionEvidence {
    pub evidence_ref: String,
    pub session_id: String,
    pub trusted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Permission {
    pub resource: String,
    pub action: String,
    pub scope: String,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct AuthorizationCommand {
    pub request_id: String,
    pub session_id: String,
    pub required_permission: Permission,
    pub scope_evidence_ref: String,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct BoundaryRequest {
    pub request_id: String,
    pub authentication_evidence_ref: String,
    pub route_id: String,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RouteAuthorizationBinding {
    pub route_id: String,
    pub required_permission: Permission,
    pub scope_evidence_ref: String,
    pub complete: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CommandBoundaryContext {
    pub request: BoundaryRequest,
    pub resolved_authentication_evidence: Vec<AuthenticatedSessionEvidence>,
    pub resolved_route_bindings: Vec<RouteAuthorizationBinding>,
    pub candidate_command: AuthorizationCommand,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum CommandBoundaryDecision {
    Ready,
    Deny,
}

#[rustfmt::skip]
pub fn candidate_command_provenance(context: &CommandBoundaryContext) -> bool {
    let __domainspec_rule_000 = !(context.request.request_id == "");
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        context.candidate_command.request_id == context.request.request_id
    };
    let __domainspec_rule_002 = __domainspec_rule_001 && {
        context.resolved_authentication_evidence
            .iter()
            .any(|evidence| {
                let __domainspec_rule_003 = evidence.evidence_ref == context.request.authentication_evidence_ref;
                let __domainspec_rule_004 = __domainspec_rule_003 && {
                    !(evidence.evidence_ref == "")
                };
                let __domainspec_rule_005 = __domainspec_rule_004 && {
                    evidence.trusted == true
                };
                let __domainspec_rule_006 = __domainspec_rule_005 && {
                    !(evidence.session_id == "")
                };
                let __domainspec_rule_007 = __domainspec_rule_006 && {
                    evidence.session_id == context.candidate_command.session_id
                };
                __domainspec_rule_007
            })
    };
    let __domainspec_rule_008 = __domainspec_rule_002 && {
        context.resolved_route_bindings
            .iter()
            .any(|binding| {
                let __domainspec_rule_009 = binding.route_id == context.request.route_id;
                let __domainspec_rule_010 = __domainspec_rule_009 && {
                    !(binding.route_id == "")
                };
                let __domainspec_rule_011 = __domainspec_rule_010 && {
                    binding.complete == true
                };
                let __domainspec_rule_012 = __domainspec_rule_011 && {
                    !(binding.scope_evidence_ref == "")
                };
                let __domainspec_rule_013 = __domainspec_rule_012 && {
                    !(binding.required_permission.resource == "")
                };
                let __domainspec_rule_014 = __domainspec_rule_013 && {
                    !(binding.required_permission.action == "")
                };
                let __domainspec_rule_015 = __domainspec_rule_014 && {
                    !(binding.required_permission.scope == "")
                };
                let __domainspec_rule_016 = __domainspec_rule_015 && {
                    binding.required_permission.resource == context.candidate_command.required_permission.resource
                };
                let __domainspec_rule_017 = __domainspec_rule_016 && {
                    binding.required_permission.action == context.candidate_command.required_permission.action
                };
                let __domainspec_rule_018 = __domainspec_rule_017 && {
                    binding.required_permission.scope == context.candidate_command.required_permission.scope
                };
                let __domainspec_rule_019 = __domainspec_rule_018 && {
                    binding.scope_evidence_ref == context.candidate_command.scope_evidence_ref
                };
                __domainspec_rule_019
            })
    };
    __domainspec_rule_008
}

#[rustfmt::skip]
pub fn unique_complete_route_binding(context: &CommandBoundaryContext) -> bool {
    context.resolved_route_bindings
        .iter()
        .filter(|binding| {
            let __domainspec_rule_000 = binding.route_id == context.request.route_id;
            let __domainspec_rule_001 = __domainspec_rule_000 && {
                !(binding.route_id == "")
            };
            let __domainspec_rule_002 = __domainspec_rule_001 && {
                binding.complete == true
            };
            let __domainspec_rule_003 = __domainspec_rule_002 && {
                !(binding.scope_evidence_ref == "")
            };
            let __domainspec_rule_004 = __domainspec_rule_003 && {
                !(binding.required_permission.resource == "")
            };
            let __domainspec_rule_005 = __domainspec_rule_004 && {
                !(binding.required_permission.action == "")
            };
            let __domainspec_rule_006 = __domainspec_rule_005 && {
                !(binding.required_permission.scope == "")
            };
            __domainspec_rule_006
        })
        .count() == 1
}

#[rustfmt::skip]
pub fn unique_trusted_authentication_evidence(context: &CommandBoundaryContext) -> bool {
    context.resolved_authentication_evidence
        .iter()
        .filter(|evidence| {
            let __domainspec_rule_000 = evidence.evidence_ref == context.request.authentication_evidence_ref;
            let __domainspec_rule_001 = __domainspec_rule_000 && {
                !(evidence.evidence_ref == "")
            };
            let __domainspec_rule_002 = __domainspec_rule_001 && {
                evidence.trusted == true
            };
            let __domainspec_rule_003 = __domainspec_rule_002 && {
                !(evidence.session_id == "")
            };
            __domainspec_rule_003
        })
        .count() == 1
}

#[rustfmt::skip]
pub fn command_boundary_admissible(context: &CommandBoundaryContext) -> bool {
    let __domainspec_rule_000 = unique_trusted_authentication_evidence(context);
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        unique_complete_route_binding(context)
    };
    let __domainspec_rule_002 = __domainspec_rule_001 && {
        candidate_command_provenance(context)
    };
    __domainspec_rule_002
}

pub fn admit_authorization_command(context: &CommandBoundaryContext) -> CommandBoundaryDecision {
    if command_boundary_admissible(context) {
        CommandBoundaryDecision::Ready
    } else {
        CommandBoundaryDecision::Deny
    }
}
