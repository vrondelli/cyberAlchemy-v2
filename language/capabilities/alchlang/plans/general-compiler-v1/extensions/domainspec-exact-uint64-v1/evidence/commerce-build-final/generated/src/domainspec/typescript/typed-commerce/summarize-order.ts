// domainspec.typescript-exact-uint64/v1
// typed-commerce:summarize-order
const contract: any = {"fields":[{"default":null,"source":"order_id","target":"summary_id"},{"default":null,"source":"amount","target":"total"},{"default":{"type":"String","value":"standard"},"source":null,"target":"risk_band"}],"ontology_mapping":"ALCH-COMMERCE-SUMMARIZE-ORDER","schema_version":"domainspec.typed-mapping/v1","source":"typed-commerce:order","target":"typed-commerce:order-summary","total":true};

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

export function evaluate_summarizeOrder(source: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const field of contract.fields) {
    if (field.source !== null && Object.hasOwn(source,field.source)) result[field.target] = required(source,field.source);
    else if (field.default !== null) result[field.target] = field.default.value;
    else if (contract.total) throw new Error("MAPPING_REQUIRED_VALUE:" + field.target);
  }
  return Object.freeze(result);
}
