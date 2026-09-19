// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"f5bddf0df2b92109c4649a6fc44a44008d2a3c6768e2438cf32a2bb21a183b33","language":"rust","meta_type_id":"DS-D1.5","meta_type_label":"Query","provider_sha256":"5ba90e635559f863be5a676b35ea7ba24e8eef6bcf102a2b40fcd9d8dae68bf0","source_sha256":"f7582d96221c6d22bcd7b030621f1fe9ac0345d59aa3553e14a37bc3d303a879"}
// domainspec-body: {"description":"Return a complete provider-supplied logical snapshot for a valid trusted-input query without selecting persistence technology.","reads":["authentication-evidence","route-authorization-binding"],"typed_contract":{"effects":[],"failure_continuation":"return-deny-without-authority","failure_result":{"payload":null,"variant":"Deny"},"guard":"trusted-input-resolution:trusted-input-query-valid","inputs":[{"name":"query","type":{"kind":"named","selector":"trusted-input-resolution:trusted-input-query"}},{"name":"snapshot","type":{"kind":"named","selector":"trusted-input-resolution:trusted-input-snapshot"}}],"ontology_operation":"AUTH-TI-QUERY-RESOLVE-TRUSTED-INPUTS","output":{"kind":"named","selector":"trusted-input-resolution:trusted-input-resolution"},"reads":["trusted-input-resolution:authentication-evidence","trusted-input-resolution:route-authorization-binding"],"schema_version":"domainspec.typed-operation/v1","success_result":{"payload":{"op":"path","properties":[],"root":"snapshot"},"variant":"Resolved"},"writes":[]}}
// domainspec-relationships: [{"edge_id":"resolve-reads-authentication-evidence","relationship":"reads","scope":"feature","source":{"feature_id":"trusted-input-resolution","kind":"Query","node_id":"resolve-trusted-inputs"},"target":{"feature_id":"trusted-input-resolution","kind":"Entity","node_id":"authentication-evidence"}},{"edge_id":"resolve-reads-route-bindings","relationship":"reads","scope":"feature","source":{"feature_id":"trusted-input-resolution","kind":"Query","node_id":"resolve-trusted-inputs"},"target":{"feature_id":"trusted-input-resolution","kind":"Entity","node_id":"route-authorization-binding"}}]
// domainspec-query-reads: ["authentication-evidence","route-authorization-binding"]
// domainspec-query-effects: []
// domainspec-query-provider-neutral: true
// domainspec-typed-closure-sha256: "1802865d58ba08c66be9cf9bebf11fe4fd319ba745b10e5ee980c0c29927ab87"
pub const DOMAINSPEC_TYPED_CLOSURE_SHA256: &str =
    "1802865d58ba08c66be9cf9bebf11fe4fd319ba745b10e5ee980c0c29927ab87";
pub const DOMAINSPEC_QUERY_CLOSURE_SHA256: &str = DOMAINSPEC_TYPED_CLOSURE_SHA256;
#[rustfmt::skip]
pub const DOMAINSPEC_PROPERTY_BINDINGS: &[(&str, &str)] = &[
    ("AUTH-TI-AUTHENTICATION-EVIDENCE#evidence_identity", "AuthenticationEvidence::evidence_identity"),
    ("AUTH-TI-AUTHENTICATION-EVIDENCE#evidence_ref", "AuthenticationEvidence::evidence_ref"),
    ("AUTH-TI-AUTHENTICATION-EVIDENCE#expires_at", "AuthenticationEvidence::expires_at"),
    ("AUTH-TI-AUTHENTICATION-EVIDENCE#revoked", "AuthenticationEvidence::revoked"),
    ("AUTH-TI-AUTHENTICATION-EVIDENCE#session_id", "AuthenticationEvidence::session_id"),
    ("AUTH-TI-AUTHENTICATION-EVIDENCE#trusted", "AuthenticationEvidence::trusted"),
    ("AUTH-TI-QUERY#authentication_evidence_ref", "TrustedInputQuery::authentication_evidence_ref"),
    ("AUTH-TI-QUERY#decision_time", "TrustedInputQuery::decision_time"),
    ("AUTH-TI-QUERY#route_id", "TrustedInputQuery::route_id"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#action", "RouteAuthorizationBinding::action"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#binding_identity", "RouteAuthorizationBinding::binding_identity"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#complete", "RouteAuthorizationBinding::complete"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#enabled", "RouteAuthorizationBinding::enabled"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#resource", "RouteAuthorizationBinding::resource"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#route_id", "RouteAuthorizationBinding::route_id"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#scope", "RouteAuthorizationBinding::scope"),
    ("AUTH-TI-ROUTE-AUTHORIZATION-BINDING#scope_evidence_ref", "RouteAuthorizationBinding::scope_evidence_ref"),
    ("AUTH-TI-SNAPSHOT#authentication_evidence", "TrustedInputSnapshot::authentication_evidence"),
    ("AUTH-TI-SNAPSHOT#route_bindings", "TrustedInputSnapshot::route_bindings"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_VARIANT_BINDINGS: &[(&str, &str)] = &[
    ("AUTH-TI-RESOLUTION#Deny", "TrustedInputResolution::Deny"),
    ("AUTH-TI-RESOLUTION#Resolved", "TrustedInputResolution::Resolved"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_RULE_SELECTORS: &[(&str, &str)] = &[
    ("AUTH-TI-RULE-QUERY-VALID", "trusted-input-resolution:trusted-input-query-valid"),
];
#[rustfmt::skip]
pub const DOMAINSPEC_RULE_IMPLEMENTATION_BINDINGS: &[(&str, &str, &str)] = &[
    ("AUTH-TI-RULE-QUERY-VALID", "trusted-input-resolution:trusted-input-query-valid", "trusted_input_query_valid"),
];

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct AuthenticationEvidence {
    pub evidence_identity: u64,
    pub evidence_ref: String,
    pub session_id: String,
    pub trusted: bool,
    pub revoked: bool,
    pub expires_at: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RouteAuthorizationBinding {
    pub binding_identity: u64,
    pub route_id: String,
    pub resource: String,
    pub action: String,
    pub scope: String,
    pub scope_evidence_ref: String,
    pub complete: bool,
    pub enabled: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TrustedInputQuery {
    pub authentication_evidence_ref: String,
    pub route_id: String,
    pub decision_time: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TrustedInputSnapshot {
    pub authentication_evidence: Vec<AuthenticationEvidence>,
    pub route_bindings: Vec<RouteAuthorizationBinding>,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TrustedInputResolution {
    Resolved(TrustedInputSnapshot),
    Deny,
}

#[rustfmt::skip]
pub fn trusted_input_query_valid(query: &TrustedInputQuery) -> bool {
    let __domainspec_rule_000 = !(query.authentication_evidence_ref == "");
    let __domainspec_rule_001 = __domainspec_rule_000 && {
        !(query.route_id == "")
    };
    __domainspec_rule_001
}

pub fn resolve_trusted_inputs(query: &TrustedInputQuery, snapshot: &TrustedInputSnapshot) -> TrustedInputResolution {
    if trusted_input_query_valid(query) {
        TrustedInputResolution::Resolved((*snapshot).clone())
    } else {
        TrustedInputResolution::Deny
    }
}
