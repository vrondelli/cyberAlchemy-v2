// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"d852bd6aec19e8e720dc3ae7b17f6e3b7b52b99dbdb13560ea279afeb2a995f3","language":"rust","meta_type_id":"DS-D1.1","meta_type_label":"Entity","provider_sha256":"ac36027b3bd2678ef92929ce655f2904304321dbdc896da4d444eb7bd82bca85","source_sha256":"0df0f880a5a2a01fd06185030f9bcf5e9396cf493fdd8c27a272b9ad4fd208bb"}
// domainspec-body: {"description":"PriceTier prototype for the bounded base-price quote.","fields":["price_id","currency","amount_minor","min_quantity","max_quantity"],"identity_field":"","typed_contract":{"ontology_node":"ALCH-C1EABC15E0C4DE4D0907A559","properties":[{"cardinality":"one","identity":true,"meaning":"priceId is a identifier property of PriceTier.","name":"price_id","ontology_property":"ALCH-C1EABC15E0C4DE4D0907A559#priceId","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"currency is a string property of PriceTier.","name":"currency","ontology_property":"ALCH-C1EABC15E0C4DE4D0907A559#currency","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"amountMinor is a integer property of PriceTier.","name":"amount_minor","ontology_property":"ALCH-C1EABC15E0C4DE4D0907A559#amountMinor","type":{"kind":"scalar","name":"UInt64"}},{"cardinality":"one","identity":false,"meaning":"minQuantity is a integer property of PriceTier.","name":"min_quantity","ontology_property":"ALCH-C1EABC15E0C4DE4D0907A559#minQuantity","type":{"kind":"scalar","name":"UInt64"}},{"cardinality":"one","identity":false,"meaning":"maxQuantity is a integer property of PriceTier.","name":"max_quantity","ontology_property":"ALCH-C1EABC15E0C4DE4D0907A559#maxQuantity","type":{"kind":"scalar","name":"UInt64"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: []
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-C1EABC15E0C4DE4D0907A559"

#[derive(Clone, Debug, PartialEq)]
pub struct PriceTier {
    pub price_id: String,
    pub currency: String,
    pub amount_minor: u64,
    pub min_quantity: u64,
    pub max_quantity: u64,
}
impl PriceTier {
    pub fn same_identity(&self, other: &Self) -> bool { self.price_id == other.price_id }
}
