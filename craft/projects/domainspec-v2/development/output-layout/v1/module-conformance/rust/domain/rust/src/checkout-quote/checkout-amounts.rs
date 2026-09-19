// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"d852bd6aec19e8e720dc3ae7b17f6e3b7b52b99dbdb13560ea279afeb2a995f3","language":"rust","meta_type_id":"DS-D1.1","meta_type_label":"Entity","provider_sha256":"ac36027b3bd2678ef92929ce655f2904304321dbdc896da4d444eb7bd82bca85","source_sha256":"0df0f880a5a2a01fd06185030f9bcf5e9396cf493fdd8c27a272b9ad4fd208bb"}
// domainspec-body: {"description":"Exact subtotal and shipping fee for one checkout request.","fields":["checkout_id","subtotal_minor","shipping_minor"],"identity_field":"","typed_contract":{"ontology_node":"ALCH-16CE4A0B66E327A0D25FF342","properties":[{"cardinality":"one","identity":true,"meaning":"checkoutId is a identifier property of CheckoutAmounts.","name":"checkout_id","ontology_property":"ALCH-16CE4A0B66E327A0D25FF342#checkoutId","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"subtotalMinor is a integer property of CheckoutAmounts.","name":"subtotal_minor","ontology_property":"ALCH-16CE4A0B66E327A0D25FF342#subtotalMinor","type":{"kind":"scalar","name":"UInt64"}},{"cardinality":"one","identity":false,"meaning":"shippingMinor is a integer property of CheckoutAmounts.","name":"shipping_minor","ontology_property":"ALCH-16CE4A0B66E327A0D25FF342#shippingMinor","type":{"kind":"scalar","name":"UInt64"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: []
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-16CE4A0B66E327A0D25FF342"

#[derive(Clone, Debug, PartialEq)]
pub struct CheckoutAmounts {
    pub checkout_id: String,
    pub subtotal_minor: u64,
    pub shipping_minor: u64,
}
impl CheckoutAmounts {
    pub fn same_identity(&self, other: &Self) -> bool { self.checkout_id == other.checkout_id }
}
