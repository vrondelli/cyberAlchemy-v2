// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"4c5b4d8f9e6febb255117a7a3e207b30dc369bfe61d8dc1933d792a7bbadb6e8","language":"typescript","meta_type_id":"DS-D1.1","meta_type_label":"Entity","provider_sha256":"b53128e807f734043019e75e6b892900b83c320b909d859644f6a820a9c960f1","source_sha256":"c174f82e19e72b30f9305f005809bf8a63b52d102e708a9739a3d898b704b197"}
// domainspec-body: {"description":"A supplied order identity and explicit urgency and priority facts.","fields":["order_id","urgent","priority"],"identity_field":"","typed_contract":{"ontology_node":"ALCH-EXAMPLE-ORDER","properties":[{"cardinality":"one","identity":true,"meaning":"Explicit order identity.","name":"order_id","ontology_property":"ALCH-EXAMPLE-ORDER#orderId","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"Whether express handling was requested.","name":"urgent","ontology_property":"ALCH-EXAMPLE-ORDER#urgent","type":{"kind":"scalar","name":"Bool"}},{"cardinality":"one","identity":false,"meaning":"Whether priority handling was requested.","name":"priority","ontology_property":"ALCH-EXAMPLE-ORDER#priority","type":{"kind":"scalar","name":"Bool"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: []
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-EXAMPLE-ORDER"
type DomainspecRef<Selector extends string> = string & { readonly __domainspecRef: Selector };
export interface OrderFields {
  readonly order_id: string;
  readonly urgent: boolean;
  readonly priority: boolean;
}
export class Order {
  constructor(private readonly fields: Readonly<OrderFields>) { this.fields = Object.freeze({ ...fields }); }
  sameIdentity(other: Order): boolean { return Object.is(this.fields.order_id, other.fields.order_id); }
  snapshot(): Readonly<OrderFields> { return this.fields; }
}
