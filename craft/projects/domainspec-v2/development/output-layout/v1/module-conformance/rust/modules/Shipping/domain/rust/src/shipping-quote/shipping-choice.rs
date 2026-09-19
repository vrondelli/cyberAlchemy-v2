// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"d852bd6aec19e8e720dc3ae7b17f6e3b7b52b99dbdb13560ea279afeb2a995f3","language":"rust","meta_type_id":"DS-D1.1","meta_type_label":"Entity","provider_sha256":"ac36027b3bd2678ef92929ce655f2904304321dbdc896da4d444eb7bd82bca85","source_sha256":"0df0f880a5a2a01fd06185030f9bcf5e9396cf493fdd8c27a272b9ad4fd208bb"}
// domainspec-body: {"description":"An eligible shipping method with exact minor-unit fee.","fields":["option_id","amount_minor"],"identity_field":"","typed_contract":{"ontology_node":"ALCH-084EA5CFD4826379E0A90F49","properties":[{"cardinality":"one","identity":true,"meaning":"optionId is a identifier property of ShippingChoice.","name":"option_id","ontology_property":"ALCH-084EA5CFD4826379E0A90F49#optionId","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"amountMinor is a integer property of ShippingChoice.","name":"amount_minor","ontology_property":"ALCH-084EA5CFD4826379E0A90F49#amountMinor","type":{"kind":"scalar","name":"UInt64"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: []
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-084EA5CFD4826379E0A90F49"

#[derive(Clone, Debug, PartialEq)]
pub struct ShippingChoice {
    pub option_id: String,
    pub amount_minor: u64,
}
impl ShippingChoice {
    pub fn same_identity(&self, other: &Self) -> bool { self.option_id == other.option_id }
}
