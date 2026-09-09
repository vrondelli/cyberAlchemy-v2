// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"a535cadb3cb9318e7058ee00d9d244d7e4def98cbd5bb79da13b169819180a32","language":"typescript","meta_type_id":"DS-D1.6","meta_type_label":"Calculation","provider_sha256":"3be262ce45616155de67ec6754527bc2227dc973e21823550dc889d1745ccadd","source_sha256":"c5f4cb0f65e59ef1d1e5290e7ff768fe38bbee90f4d82795a8bb3ee87a4111af"}
// domainspec-body: {"description":"The constant fee value 750.","inputs":["literal-750"],"typed_contract":{"division_rounding":"reject","expression":{"op":"literal","value":750},"inputs":[],"ontology_calculation":"ALCH-EXAMPLE-PRIORITY-FEE","result":{"kind":"scalar","name":"UInt64"},"schema_version":"domainspec.typed-calculation/v1"}}
// domainspec-relationships: [{"edge_id":"choose-delivery-fee-applies-priority-fee","relationship":"applies","scope":"feature","source":{"feature_id":"delivery-example","kind":"Policy","node_id":"choose-delivery-fee"},"target":{"feature_id":"delivery-example","kind":"Calculation","node_id":"priority-fee"}},{"edge_id":"priority-fee-calculates-priority-fee-evaluation","relationship":"calculates","scope":"feature","source":{"feature_id":"delivery-example","kind":"Calculation","node_id":"priority-fee"},"target":{"feature_id":"delivery-example","kind":"Operation","node_id":"priority-fee-evaluation"}}]
// domainspec-calculation-semantics: "domainspec.typed-calculation/v1"
const domainspecContract: any = Object.freeze({"division_rounding":"reject","expression":{"op":"literal","value":750},"inputs":[],"ontology_calculation":"ALCH-EXAMPLE-PRIORITY-FEE","result":{"kind":"scalar","name":"UInt64"},"schema_version":"domainspec.typed-calculation/v1"});
function domainspecNumeric(expression: any, inputs: Readonly<Record<string, number>>): number {
  if (expression.op === "literal") return expression.value;
  if (expression.op === "input") { const value = inputs[expression.name]; if (!Number.isSafeInteger(value) || value < 0) throw new Error("missing or invalid UInt64 input:" + expression.name); return value; }
  const left = domainspecNumeric(expression.left, inputs); const right = domainspecNumeric(expression.right, inputs);
  if (expression.op === "add") { const value = left + right; if (!Number.isSafeInteger(value)) throw new Error("Calculation overflow"); return value; }
  if (expression.op === "subtract") { if (left < right) throw new Error("Calculation underflow"); return left - right; }
  if (expression.op === "multiply") { const value = left * right; if (!Number.isSafeInteger(value)) throw new Error("Calculation overflow"); return value; }
  if (right === 0) throw new Error("Calculation division by zero");
  if (domainspecContract.division_rounding === "reject" && left % right !== 0) throw new Error("Calculation inexact division");
  return domainspecContract.division_rounding === "ceil" ? Math.ceil(left / right) : Math.floor(left / right);
}
export function priorityFee(inputs: Readonly<Record<string, number>>): number { return domainspecNumeric(domainspecContract.expression, inputs); }
