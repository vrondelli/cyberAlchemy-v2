// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"4c5b4d8f9e6febb255117a7a3e207b30dc369bfe61d8dc1933d792a7bbadb6e8","language":"typescript","meta_type_id":"DS-D1.1","meta_type_label":"Entity","provider_sha256":"b53128e807f734043019e75e6b892900b83c320b909d859644f6a820a9c960f1","source_sha256":"c174f82e19e72b30f9305f005809bf8a63b52d102e708a9739a3d898b704b197"}
// domainspec-body: {"description":"A newly constructed message value; creation here performs no transport.","fields":["message_id","currency"],"identity_field":"","typed_contract":{"ontology_node":"ALCH-EXAMPLE-MESSAGE","properties":[{"cardinality":"one","identity":true,"meaning":"Message identity copied from the order.","name":"message_id","ontology_property":"ALCH-EXAMPLE-MESSAGE#messageId","type":{"kind":"scalar","name":"String"}},{"cardinality":"one","identity":false,"meaning":"Currency text supplied by the mapping default.","name":"currency","ontology_property":"ALCH-EXAMPLE-MESSAGE#currency","type":{"kind":"scalar","name":"String"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: [{"edge_id":"order-to-message-maps-message","relationship":"maps","scope":"feature","source":{"feature_id":"delivery-example","kind":"Mapping","node_id":"order-to-message"},"target":{"feature_id":"delivery-example","kind":"Entity","node_id":"message"}},{"edge_id":"partial-message-maps-message","relationship":"maps","scope":"feature","source":{"feature_id":"delivery-example","kind":"Mapping","node_id":"partial-message"},"target":{"feature_id":"delivery-example","kind":"Entity","node_id":"message"}}]
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-EXAMPLE-MESSAGE"
type DomainspecRef<Selector extends string> = string & { readonly __domainspecRef: Selector };
export interface MessageFields {
  readonly message_id: string;
  readonly currency: string;
}
export class Message {
  constructor(private readonly fields: Readonly<MessageFields>) { this.fields = Object.freeze({ ...fields }); }
  sameIdentity(other: Message): boolean { return Object.is(this.fields.message_id, other.fields.message_id); }
  snapshot(): Readonly<MessageFields> { return this.fields; }
}
