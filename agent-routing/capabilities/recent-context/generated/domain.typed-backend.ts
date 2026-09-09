export const typedBackendContracts = {
  "queries": [
    {
      "id": "RelevantFiles",
      "source_ref": "ChangedFile",
      "input_facts": [],
      "predicate": {
        "operator": "eq",
        "operands": [
          {
            "node": "fact_ref",
            "ref": "inScope"
          },
          {
            "node": "literal",
            "value_type": "boolean",
            "value": true
          }
        ]
      },
      "order_by": [
        {
          "field_ref": "commitOrder",
          "direction": "asc"
        }
      ],
      "limit": 1000,
      "projection": [
        "path",
        "previousPath",
        "changeKind",
        "fileCommitId"
      ],
      "source_refs": [
        "text:54"
      ]
    }
  ],
  "calculations": [],
  "mappings": [],
  "policies": []
};
const MAX = (1n << 64n) - 1n;
const fail = (code, message) => { const error = new Error(code + ":" + message); error.code = code; throw error; };
const required = (value, field) => field in value ? value[field] : fail("MISSING_TYPED_VALUE", field);
const predicateValue = (expression, facts) => {
  if (expression.node) return expression.node === "literal" ? expression.value : expression.node === "fact_ref" ? facts[expression.ref] : expression.ref;
  const values = expression.operands.map((operand) => predicateValue(operand, facts));
  switch (expression.operator) {
    case "not": return !Boolean(values[0]); case "exists": return values[0] !== undefined && values[0] !== null; case "absent": return values[0] === undefined || values[0] === null;
    case "eq": return values[0] === values[1]; case "neq": return values[0] !== values[1]; case "lt": return values[0] < values[1]; case "lte": return values[0] <= values[1]; case "gt": return values[0] > values[1]; case "gte": return values[0] >= values[1];
    case "and": return Boolean(values[0]) && Boolean(values[1]); case "or": return Boolean(values[0]) || Boolean(values[1]); default: return fail("UNKNOWN_OPERATOR", expression.operator);
  }
};
const uint64 = (value) => { let result; try { result = typeof value === "bigint" ? value : typeof value === "number" && Number.isSafeInteger(value) ? BigInt(value) : typeof value === "string" && /^(0|[1-9]\d*)$/.test(value) ? BigInt(value) : fail("CALCULATION_INPUT_TYPE", String(value)); } catch (error) { if (error.code) throw error; return fail("CALCULATION_INPUT_TYPE", String(value)); } if (result < 0n || result > MAX) return fail("CALCULATION_RANGE", String(value)); return result; };
const calculationValue = (expression, inputs, rounding) => { if (expression.node === "uint64_literal") return uint64(expression.value); if (expression.node === "input_ref") return expression.ref in inputs ? uint64(inputs[expression.ref]) : fail("MISSING_CALCULATION_INPUT", expression.ref); const left = calculationValue(expression.operands[0], inputs, rounding); const right = calculationValue(expression.operands[1], inputs, rounding); let result; switch (expression.operator) { case "add": result = left + right; break; case "subtract": if (right > left) return fail("CALCULATION_UNDERFLOW", "subtract"); result = left - right; break; case "multiply": result = left * right; break; case "divide": if (right === 0n) return fail("CALCULATION_DIVIDE_BY_ZERO", "divide"); if (left % right !== 0n && rounding === "reject") return fail("CALCULATION_INEXACT", "divide"); result = left / right + (rounding === "ceil" && left % right !== 0n ? 1n : 0n); break; } if (result > MAX) return fail("CALCULATION_OVERFLOW", expression.operator); return result; };
export const evaluateCalculation = (id, inputs) => { const contract = typedBackendContracts.calculations.find((item) => item.id === id); if (!contract) return fail("CALCULATION_NOT_FOUND", id); for (const input of contract.input_facts) required(inputs, input); return calculationValue(contract.expression, inputs, contract.rounding); };
const predicateRefs = (expression) => !expression ? [] : expression.node ? expression.node === "fact_ref" ? [expression.ref] : [] : expression.operands.flatMap(predicateRefs);
export const evaluateQuery = (id, rows, inputs = {}) => { const contract = typedBackendContracts.queries.find((item) => item.id === id); if (!contract) return fail("QUERY_NOT_FOUND", id); for (const input of contract.input_facts) required(inputs, input); const refs = predicateRefs(contract.predicate); let selected = rows.filter((row) => { const facts = { ...inputs, ...row }; for (const ref of refs) required(facts, ref); return !contract.predicate || predicateValue(contract.predicate, facts); }); if (contract.order_by.length) selected = [...selected].sort((a, b) => { for (const order of contract.order_by) { const left = required(a, order.field_ref), right = required(b, order.field_ref); if (left < right) return order.direction === "asc" ? -1 : 1; if (left > right) return order.direction === "asc" ? 1 : -1; } return 0; }); if (contract.limit !== null) selected = selected.slice(0, contract.limit); return selected.map((row) => Object.fromEntries(contract.projection.map((field) => [field, required(row, field)]))); };
export const evaluateMapping = (id, source) => { const contract = typedBackendContracts.mappings.find((item) => item.id === id); if (!contract) return fail("MAPPING_NOT_FOUND", id); const target = {}; for (const clause of contract.clauses) { if (clause.source_field !== null && clause.source_field in source) target[clause.target_field] = source[clause.source_field]; else if (clause.default_value !== null) target[clause.target_field] = clause.default_value.value; else if (contract.total) fail("MAPPING_REQUIRED_VALUE", clause.target_field); } return target; };
export const evaluatePolicy = (id, inputs) => { const contract = typedBackendContracts.policies.find((item) => item.id === id); if (!contract) return fail("POLICY_NOT_FOUND", id); for (const input of contract.input_facts) required(inputs, input); for (const item of contract.cases) if (predicateValue(item.predicate, inputs)) return item.target_ref; return contract.default_target_ref; };
export const authorityEffect = "none";
