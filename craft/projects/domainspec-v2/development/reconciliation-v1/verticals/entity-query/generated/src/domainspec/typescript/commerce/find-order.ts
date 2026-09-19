// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"5a0bff57705aa4df5957971fb0e6358f633adf16aabb6ef8e962f3367201f18e","language":"typescript","meta_type_id":"DS-D1.5","meta_type_label":"Query","provider_sha256":"46dbe007e793728e381a560278c6cdf1b8d4ffa3f158501ecf7df16347831bcb","source_sha256":"d3b365f74d234b33b0681dab4d042f916f6aeaca0daf3a50cb4fc43990943f6d"}
// domainspec-body: {"description":"Find at most one order by identity in an explicitly supplied snapshot, without mutation or database access.","reads":["commerce:order"],"typed_contract":{"filter":{"left":{"kind":"field","name":"order_id"},"op":"eq","right":{"kind":"parameter","name":"order_id"}},"inputs":[{"name":"order_id","type":{"kind":"scalar","name":"String"}}],"limit":1,"ontology_query":"COMMERCE-FIND-ORDER","order_by":{"direction":"asc","field":"order_id"},"projection":["order_id","status"],"schema_version":"domainspec.typed-query/v1","source":"commerce:order"}}
// domainspec-relationships: [{"edge_id":"find-order-reads-order","relationship":"reads","scope":"feature","source":{"feature_id":"commerce","kind":"Query","node_id":"find-order"},"target":{"feature_id":"commerce","kind":"Entity","node_id":"order"}}]
// domainspec-query-semantics: "domainspec.typed-query/v1"
const domainspecContract: any = Object.freeze({"filter":{"left":{"kind":"field","name":"order_id"},"op":"eq","right":{"kind":"parameter","name":"order_id"}},"inputs":[{"name":"order_id","type":{"kind":"scalar","name":"String"}}],"limit":1,"ontology_query":"COMMERCE-FIND-ORDER","order_by":{"direction":"asc","field":"order_id"},"projection":["order_id","status"],"schema_version":"domainspec.typed-query/v1","source":"commerce:order"});
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
export function findOrder(rows: readonly Readonly<Record<string, unknown>>[], parameters: Readonly<Record<string, unknown>> = {}): readonly Readonly<Record<string, unknown>>[] {
  let selected = rows.filter((row) => domainspecContract.filter === null || domainspecPredicate(domainspecContract.filter, row, parameters));
  if (domainspecContract.order_by !== null) selected = [...selected].sort((left, right) => { const field = domainspecContract.order_by.field; const order = left[field] === right[field] ? 0 : (left[field] as any) < (right[field] as any) ? -1 : 1; return domainspecContract.order_by.direction === "asc" ? order : -order; });
  if (domainspecContract.limit !== null) selected = selected.slice(0, domainspecContract.limit);
  return Object.freeze(selected.map((row) => Object.freeze(Object.fromEntries(domainspecContract.projection.map((field: string) => [field, row[field]])))));
}
