// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"be17b5db82127ceb2cc80266460690355355d67ea33fa68cf890df92e5b72c03","language":"typescript","meta_type_id":"DS-D1.7","meta_type_label":"Rule","provider_sha256":"462b98e0eba7f3592a9e4c0c565cd43ebe0f332c1c8f2303e3404f871dd1d443","source_sha256":"774c3641bc95f8ee9be65c948a5c2823d55f7ad6d1713234cd14434c75dea7bc"}
// domainspec-body: {"description":"The urgent flag must be true.","predicate":"{\n  \"operator\": \"eq\",\n  \"operands\": [\n    {\n      \"node\": \"fact_ref\",\n      \"ref\": \"urgent\"\n    },\n    {\n      \"node\": \"literal\",\n      \"value_type\": \"boolean\",\n      \"value\": true\n    }\n  ]\n}","typed_contract":{"expression":{"left":{"op":"path","properties":[],"root":"urgent"},"op":"eq","right":{"op":"literal","type":"Bool","value":true}},"ontology_rule":"ALCH-EXAMPLE-URGENT-REQUIRED","parameters":[{"name":"urgent","type":{"kind":"scalar","name":"Bool"}}],"schema_version":"domainspec.typed-rule/v1"}}
// domainspec-relationships: []
// domainspec-rule-semantics: "domainspec.typed-rule/v1"
export const DOMAINSPEC_RULE_CLOSURE_SHA256 = "10cbd27637ba100cf24abff2b04974300361c443e1ea7da863164cfea3429909";
const domainspecRuleRoot = "delivery-example:urgent-required";
const domainspecRuleProperties: Readonly<Record<string, string>> = Object.freeze({});
const domainspecRuleContracts: Readonly<Record<string, any>> = Object.freeze({"delivery-example:urgent-required":{"expression":{"left":{"op":"path","properties":[],"root":"urgent"},"op":"eq","right":{"op":"literal","type":"Bool","value":true}},"ontology_rule":"ALCH-EXAMPLE-URGENT-REQUIRED","parameters":[{"name":"urgent","type":{"kind":"scalar","name":"Bool"}}],"schema_version":"domainspec.typed-rule/v1"}});
function domainspecStable(value: unknown): string {
  if (value instanceof Set) return JSON.stringify([...value].map(domainspecStable).sort());
  if (Array.isArray(value)) return JSON.stringify(value.map(domainspecStable));
  if (value !== null && typeof value === "object") return JSON.stringify(Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, domainspecStable(child)])));
  return JSON.stringify(value) ?? "undefined";
}
function domainspecValue(expression: any, environment: Readonly<Record<string, unknown>>): any {
  if (expression.op === "literal") return expression.value;
  if (expression.op === "variant") return expression.selector;
  if (expression.op === "to_set") return new Set((domainspecValue(expression.value, environment) as readonly unknown[]).map(domainspecStable));
  let current: any = environment[expression.root];
  for (const property of expression.properties as readonly string[]) {
    const field = domainspecRuleProperties[property];
    if (field === undefined) throw new Error("unresolved Rule property:" + property);
    current = Array.isArray(current) ? current.map((entry) => entry?.[field]) : current?.[field];
  }
  return current;
}
function domainspecEqual(left: unknown, right: unknown): boolean { return domainspecStable(left) === domainspecStable(right); }
function domainspecCollection(value: unknown): readonly unknown[] { return value instanceof Set ? [...value] : Array.isArray(value) ? value : (() => { throw new Error("Rule quantifier requires a collection"); })(); }
function domainspecEvaluateExpression(expression: any, environment: Readonly<Record<string, unknown>>): boolean {
  if (expression.op === "all" || expression.op === "any") return expression.op === "all" ? expression.terms.every((term: any) => domainspecEvaluateExpression(term, environment)) : expression.terms.some((term: any) => domainspecEvaluateExpression(term, environment));
  if (expression.op === "not") return !domainspecEvaluateExpression(expression.term, environment);
  if (["eq", "lt", "set_equal", "contains"].includes(expression.op)) {
    const left = domainspecValue(expression.left, environment); const right = domainspecValue(expression.right, environment);
    if (expression.op === "lt") return typeof left === "number" && typeof right === "number" && left < right;
    if (expression.op === "contains") return (left instanceof Set && left.has(domainspecStable(right))) || (Array.isArray(left) && left.some((entry) => domainspecEqual(entry, right)));
    return domainspecEqual(left, right);
  }
  if (["exactly_one", "exists", "unique"].includes(expression.op)) {
    const values = domainspecCollection(domainspecValue(expression.collection, environment));
    if (expression.op === "unique") return new Set(values.map((value) => domainspecStable(domainspecValue(expression.where.left, { ...environment, [expression.binding]: value })))).size === values.length;
    const matches = values.filter((value) => domainspecEvaluateExpression(expression.where, { ...environment, [expression.binding]: value })).length;
    return expression.op === "exactly_one" ? matches === 1 : matches > 0;
  }
  if (expression.op === "rule_ref") return domainspecEvaluate(expression.selector, Object.fromEntries(expression.arguments.map((argument: any) => [argument.parameter, domainspecValue(argument.value, environment)])));
  throw new Error("unsupported Rule operator:" + String(expression.op));
}
function domainspecEvaluate(selector: string, environment: Readonly<Record<string, unknown>>): boolean {
  const contract = domainspecRuleContracts[selector];
  if (contract === undefined) throw new Error("unresolved Rule reference:" + selector);
  if (!contract.parameters.every((parameter: any) => Object.hasOwn(environment, parameter.name))) throw new Error("missing Rule parameter:" + selector);
  return domainspecEvaluateExpression(contract.expression, environment);
}
export function urgentRequired(parameters: Readonly<Record<string, unknown>>): boolean { return domainspecEvaluate(domainspecRuleRoot, parameters); }
