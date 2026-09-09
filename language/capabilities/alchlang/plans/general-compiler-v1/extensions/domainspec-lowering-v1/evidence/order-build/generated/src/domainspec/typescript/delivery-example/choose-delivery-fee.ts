// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"9fa32a05a0c9d0f73aafdc7caa0c2f8c6ec83f1ef69f7b970dbbddf2850616c7","language":"typescript","meta_type_id":"DS-D1.8","meta_type_label":"Policy","provider_sha256":"179a9ccbcbad3104a9bdd33f43bd1a592c641e5e0b43c14750366d4bd92d5029","source_sha256":"dd54696315a8d6e5584bb43b4359c8f231d2b23d6a9a69a4776a96d6d5b032be"}
// domainspec-body: {"default_strategy":"","description":"Prefer the express target when urgent, otherwise priority when priority, otherwise standard; never execute the selection.","strategies":["express-fee","priority-fee","standard-fee"],"typed_contract":{"cases":[{"target":"delivery-example:express-fee","when":{"left":{"kind":"parameter","name":"urgent"},"op":"eq","right":{"kind":"literal","type":"Bool","value":true}}},{"target":"delivery-example:priority-fee","when":{"left":{"kind":"parameter","name":"priority"},"op":"eq","right":{"kind":"literal","type":"Bool","value":true}}}],"default_target":"delivery-example:standard-fee","inputs":[{"name":"urgent","type":{"kind":"scalar","name":"Bool"}},{"name":"priority","type":{"kind":"scalar","name":"Bool"}}],"ontology_policy":"ALCH-EXAMPLE-CHOOSE-FEE","schema_version":"domainspec.typed-policy/v1"}}
// domainspec-relationships: [{"edge_id":"choose-delivery-fee-applies-express-fee","relationship":"applies","scope":"feature","source":{"feature_id":"delivery-example","kind":"Policy","node_id":"choose-delivery-fee"},"target":{"feature_id":"delivery-example","kind":"Calculation","node_id":"express-fee"}},{"edge_id":"choose-delivery-fee-applies-priority-fee","relationship":"applies","scope":"feature","source":{"feature_id":"delivery-example","kind":"Policy","node_id":"choose-delivery-fee"},"target":{"feature_id":"delivery-example","kind":"Calculation","node_id":"priority-fee"}},{"edge_id":"choose-delivery-fee-applies-standard-fee","relationship":"applies","scope":"feature","source":{"feature_id":"delivery-example","kind":"Policy","node_id":"choose-delivery-fee"},"target":{"feature_id":"delivery-example","kind":"Calculation","node_id":"standard-fee"}}]
// domainspec-policy-semantics: "domainspec.typed-policy/v1"
const domainspecContract: any = Object.freeze({"cases":[{"target":"delivery-example:express-fee","when":{"left":{"kind":"parameter","name":"urgent"},"op":"eq","right":{"kind":"literal","type":"Bool","value":true}}},{"target":"delivery-example:priority-fee","when":{"left":{"kind":"parameter","name":"priority"},"op":"eq","right":{"kind":"literal","type":"Bool","value":true}}}],"default_target":"delivery-example:standard-fee","inputs":[{"name":"urgent","type":{"kind":"scalar","name":"Bool"}},{"name":"priority","type":{"kind":"scalar","name":"Bool"}}],"ontology_policy":"ALCH-EXAMPLE-CHOOSE-FEE","schema_version":"domainspec.typed-policy/v1"});
function domainspecValue(value: any, row: Readonly<Record<string, unknown>>, parameters: Readonly<Record<string, unknown>>): unknown {
  if (value.kind === "literal") return value.value;
  const source = value.kind === "field" ? row : parameters;
  if (!Object.hasOwn(source, value.name)) throw new Error("missing " + value.kind + ":" + value.name);
  return source[value.name];
}
function domainspecPredicate(predicate: any, row: Readonly<Record<string, unknown>>, parameters: Readonly<Record<string, unknown>>): boolean {
  if (predicate.op === "all" || predicate.op === "any") return predicate.op === "all" ? predicate.terms.every((term: any) => domainspecPredicate(term, row, parameters)) : predicate.terms.some((term: any) => domainspecPredicate(term, row, parameters));
  if (predicate.op === "not") return !domainspecPredicate(predicate.term, row, parameters);
  const left: any = domainspecValue(predicate.left, row, parameters); const right: any = domainspecValue(predicate.right, row, parameters);
  if (predicate.op === "eq") return Object.is(left, right);
  if ((typeof left !== "number" && typeof left !== "string") || typeof right !== typeof left) throw new Error("ordered comparison requires matching scalar values");
  if (predicate.op === "lt") return left < right;
  if (predicate.op === "lte") return left <= right;
  if (predicate.op === "gt") return left > right;
  if (predicate.op === "gte") return left >= right;
  throw new Error("unsupported predicate:" + predicate.op);
}
export function chooseDeliveryFee(parameters: Readonly<Record<string, unknown>>): string { for (const candidate of domainspecContract.cases) if (domainspecPredicate(candidate.when, {}, parameters)) return candidate.target; return domainspecContract.default_target; }
