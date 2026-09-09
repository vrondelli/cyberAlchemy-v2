// domainspec.typescript-exact-uint64/v1
// quantity-price:line-subtotal
const contract: any = {"division_rounding":"reject","expression":{"left":{"name":"amount_minor","op":"input"},"op":"multiply","right":{"name":"requested_quantity","op":"input"}},"inputs":[{"name":"amount_minor","type":{"kind":"scalar","name":"UInt64"}},{"name":"requested_quantity","type":{"kind":"scalar","name":"UInt64"}}],"ontology_calculation":"ALCH-QUANTITY-LINESUBTOTAL","result":{"kind":"scalar","name":"UInt64"},"schema_version":"domainspec.typed-calculation/v1"};

function required(record: Readonly<Record<string, unknown>>, name: string): any {
  const descriptor = Object.getOwnPropertyDescriptor(record, name);
  if (!descriptor || !("value" in descriptor)) throw new Error("MISSING_TYPED_VALUE:" + name);
  return descriptor.value;
}
function uint64(value: unknown): bigint {
  let result: bigint;
  if (typeof value === "bigint") result = value;
  else if (typeof value === "number" && Number.isSafeInteger(value)) result = BigInt(value);
  else if (typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value)) result = BigInt(value);
  else throw new Error("CALCULATION_INPUT_TYPE");
  if (result < 0n || result > 18446744073709551615n) throw new Error("CALCULATION_RANGE");
  return result;
}
function numeric(e: any, inputs: Readonly<Record<string, unknown>>): bigint {
  if (e.op === "literal") return uint64(e.value);
  if (e.op === "input") return uint64(required(inputs, e.name));
  const left = numeric(e.left, inputs), right = numeric(e.right, inputs);
  let result: bigint;
  if (e.op === "add") result = left + right;
  else if (e.op === "subtract") { if (left < right) throw new Error("CALCULATION_UNDERFLOW"); result = left - right; }
  else if (e.op === "multiply") result = left * right;
  else if (e.op === "divide") {
    if (right === 0n) throw new Error("CALCULATION_DIVIDE_BY_ZERO");
    if (left % right !== 0n && contract.division_rounding === "reject") throw new Error("CALCULATION_INEXACT");
    result = left / right + (contract.division_rounding === "ceil" && left % right !== 0n ? 1n : 0n);
  } else throw new Error("CALCULATION_OPERATOR");
  if (result > 18446744073709551615n) throw new Error("CALCULATION_OVERFLOW");
  return result;
}
function value(e: any, row: Readonly<Record<string, unknown>>, inputs: Readonly<Record<string, unknown>>): any {
  return e.kind === "literal" ? e.value : required(e.kind === "field" ? row : inputs, e.name);
}
function predicate(e: any, row: Readonly<Record<string, unknown>>, inputs: Readonly<Record<string, unknown>>): boolean {
  if (e.op === "all") return e.terms.every((term: any) => predicate(term, row, inputs));
  if (e.op === "any") return e.terms.some((term: any) => predicate(term, row, inputs));
  if (e.op === "not") return !predicate(e.term, row, inputs);
  const left = value(e.left, row, inputs), right = value(e.right, row, inputs);
  if (e.op === "eq") return left === right;
  if (e.op === "lt") return left < right;
  if (e.op === "lte") return left <= right;
  if (e.op === "gt") return left > right;
  if (e.op === "gte") return left >= right;
  throw new Error("PREDICATE_OPERATOR");
}
function predicateFields(e: any): string[] {
  if (e === null) return [];
  if (e.op === "all" || e.op === "any") return e.terms.flatMap(predicateFields);
  if (e.op === "not") return predicateFields(e.term);
  return [e.left, e.right].filter(v => v.kind === "field").map(v => v.name);
}

export function evaluate_lineSubtotal(inputs: Readonly<Record<string, unknown>>): bigint {
  for (const p of contract.inputs) { if (!Object.hasOwn(inputs,p.name)) throw new Error("MISSING_CALCULATION_INPUT:" + p.name); uint64(required(inputs,p.name)); }
  return numeric(contract.expression, inputs);
}
