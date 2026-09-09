// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"64ccaf79771718ad8d54266215f5022759e304fad80baca0d0fbc3ced042cfbf","language":"typescript","meta_type_id":"DS-D1.2","meta_type_label":"Value Object","provider_sha256":"f6b3f6778b50e03d774e3751b54e38ff287b0e52c9c1c5c0ce22e801ea25fb62","source_sha256":"4dd0f4ffdb9d90f4a18806343e9f39ffb2a48ce2f6056fc6cf9df90b5bee6c0d"}
// domainspec-body: {"description":"An immutable urgent flag whose declared invariant requires urgent to be true.","fields":["urgent"],"invariant_refs":["delivery-example:urgent-required"],"typed_contract":{"ontology_node":"ALCH-EXAMPLE-URGENT-FLAG","properties":[{"cardinality":"one","identity":false,"meaning":"Whether express handling was requested.","name":"urgent","ontology_property":"ALCH-EXAMPLE-URGENT-FLAG#urgent","type":{"kind":"scalar","name":"Bool"}}],"schema_version":"domainspec.typed-record/v1"}}
// domainspec-relationships: []
// domainspec-record-semantics: "domainspec.typed-record/v1"
// domainspec-ontology-node: "ALCH-EXAMPLE-URGENT-FLAG"
type DomainspecRef<Selector extends string> = string & { readonly __domainspecRef: Selector };
function domainspecStructuralEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => domainspecStructuralEqual(value, right[index]));
  if (left instanceof Set || right instanceof Set) {
    if (!(left instanceof Set) || !(right instanceof Set) || left.size !== right.size) return false;
    const unmatched = [...right];
    for (const value of left) {
      const match = unmatched.findIndex((candidate) => domainspecStructuralEqual(value, candidate));
      if (match < 0) return false;
      unmatched.splice(match, 1);
    }
    return unmatched.length === 0;
  }
  if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Readonly<Record<string, unknown>>;
    const rightRecord = right as Readonly<Record<string, unknown>>;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && domainspecStructuralEqual(leftRecord[key], rightRecord[key]));
  }
  return false;
}
function domainspecCloneValue<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map((entry) => domainspecCloneValue(entry))) as T;
  if (value instanceof Set) return new Set([...value].map((entry) => domainspecCloneValue(entry))) as T;
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) result[key] = domainspecCloneValue((value as Record<string, unknown>)[key]);
    return Object.freeze(result) as T;
  }
  return value;
}
export interface UrgentFlagFields {
  readonly urgent: boolean;
}
export class UrgentFlag {
  readonly #fields: Readonly<UrgentFlagFields>;
  constructor(fields: Readonly<UrgentFlagFields>) { this.#fields = domainspecCloneValue(fields); }
  equals(other: UrgentFlag): boolean { return domainspecStructuralEqual(this.#fields.urgent, other.#fields.urgent); }
  snapshot(): Readonly<UrgentFlagFields> { return domainspecCloneValue(this.#fields); }
}
