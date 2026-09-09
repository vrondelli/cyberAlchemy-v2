// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"d852bd6aec19e8e720dc3ae7b17f6e3b7b52b99dbdb13560ea279afeb2a995f3","language":"rust","meta_type_id":"DS-D1.1","meta_type_label":"Entity","provider_sha256":"ac36027b3bd2678ef92929ce655f2904304321dbdc896da4d444eb7bd82bca85","source_sha256":"0df0f880a5a2a01fd06185030f9bcf5e9396cf493fdd8c27a272b9ad4fd208bb"}
// domainspec-body: {"description":"QuoteRequest prototype for the bounded base-price quote.","fields":["request_id","requested_currency","requested_quantity"],"identity_field":"","typed_contract":{"ontology_node":"ALCH-2F4212BDCCC24748192FDC2A","properties":[{"cardinality":"one","identity":true,"meaning":"requestId is a identifier property of QuoteRequest.","name":"request_id","ontology_property":"ALCH-2F4212BDCCC24748192FDC2A#requestId","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"requestedCurrency is a string property of QuoteRequest.","name":"requested_currency","ontology_property":"ALCH-2F4212BDCCC24748192FDC2A#requestedCurrency","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"requestedQuantity is a integer property of QuoteRequest.","name":"requested_quantity","ontology_property":"ALCH-2F4212BDCCC24748192FDC2A#requestedQuantity","type":{"kind":"scalar","name":"UInt64"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: []
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-2F4212BDCCC24748192FDC2A"

#[derive(Clone, Debug, PartialEq)]
pub struct QuoteRequest {
    pub request_id: String,
    pub requested_currency: String,
    pub requested_quantity: u64,
}
impl QuoteRequest {
    pub fn same_identity(&self, other: &Self) -> bool { self.request_id == other.request_id }
}
