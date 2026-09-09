"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate_eligiblePrices = evaluate_eligiblePrices;
// domainspec.typescript-exact-uint64/v1
// quantity-price:eligible-prices
const contract = { "filter": { "op": "all", "terms": [{ "op": "all", "terms": [{ "left": { "kind": "field", "name": "currency" }, "op": "eq", "right": { "kind": "parameter", "name": "requested_currency" } }, { "left": { "kind": "field", "name": "min_quantity" }, "op": "lte", "right": { "kind": "parameter", "name": "requested_quantity" } }] }, { "left": { "kind": "field", "name": "max_quantity" }, "op": "gte", "right": { "kind": "parameter", "name": "requested_quantity" } }] }, "inputs": [{ "name": "requested_currency", "type": { "kind": "scalar", "name": "String" } }, { "name": "requested_quantity", "type": { "kind": "scalar", "name": "UInt64" } }], "limit": null, "ontology_query": "ALCH-QUANTITY-ELIGIBLEPRICES", "order_by": { "direction": "asc", "field": "amount_minor" }, "projection": ["price_id", "currency", "amount_minor"], "schema_version": "domainspec.typed-query/v1", "source": "quantity-price:price-tier" };
function required(record, name) {
    const descriptor = Object.getOwnPropertyDescriptor(record, name);
    if (!descriptor || !("value" in descriptor))
        throw new Error("MISSING_TYPED_VALUE:" + name);
    return descriptor.value;
}
function uint64(value) {
    let result;
    if (typeof value === "bigint")
        result = value;
    else if (typeof value === "number" && Number.isSafeInteger(value))
        result = BigInt(value);
    else if (typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value))
        result = BigInt(value);
    else
        throw new Error("CALCULATION_INPUT_TYPE");
    if (result < 0n || result > 18446744073709551615n)
        throw new Error("CALCULATION_RANGE");
    return result;
}
function numeric(e, inputs) {
    if (e.op === "literal")
        return uint64(e.value);
    if (e.op === "input")
        return uint64(required(inputs, e.name));
    const left = numeric(e.left, inputs), right = numeric(e.right, inputs);
    let result;
    if (e.op === "add")
        result = left + right;
    else if (e.op === "subtract") {
        if (left < right)
            throw new Error("CALCULATION_UNDERFLOW");
        result = left - right;
    }
    else if (e.op === "multiply")
        result = left * right;
    else if (e.op === "divide") {
        if (right === 0n)
            throw new Error("CALCULATION_DIVIDE_BY_ZERO");
        if (left % right !== 0n && contract.division_rounding === "reject")
            throw new Error("CALCULATION_INEXACT");
        result = left / right + (contract.division_rounding === "ceil" && left % right !== 0n ? 1n : 0n);
    }
    else
        throw new Error("CALCULATION_OPERATOR");
    if (result > 18446744073709551615n)
        throw new Error("CALCULATION_OVERFLOW");
    return result;
}
function value(e, row, inputs) {
    return e.kind === "literal" ? e.value : required(e.kind === "field" ? row : inputs, e.name);
}
function predicate(e, row, inputs) {
    if (e.op === "all")
        return e.terms.every((term) => predicate(term, row, inputs));
    if (e.op === "any")
        return e.terms.some((term) => predicate(term, row, inputs));
    if (e.op === "not")
        return !predicate(e.term, row, inputs);
    const left = value(e.left, row, inputs), right = value(e.right, row, inputs);
    if (e.op === "eq")
        return left === right;
    if (e.op === "lt")
        return left < right;
    if (e.op === "lte")
        return left <= right;
    if (e.op === "gt")
        return left > right;
    if (e.op === "gte")
        return left >= right;
    throw new Error("PREDICATE_OPERATOR");
}
function predicateFields(e) {
    if (e === null)
        return [];
    if (e.op === "all" || e.op === "any")
        return e.terms.flatMap(predicateFields);
    if (e.op === "not")
        return predicateFields(e.term);
    return [e.left, e.right].filter(v => v.kind === "field").map(v => v.name);
}
function evaluate_eligiblePrices(rows, inputs = {}) {
    for (const p of contract.inputs)
        required(inputs, p.name);
    let selected = rows.filter(row => { for (const field of predicateFields(contract.filter))
        required(row, field); return contract.filter === null || predicate(contract.filter, row, inputs); });
    if (contract.order_by !== null)
        selected = [...selected].sort((a, b) => {
            const left = required(a, contract.order_by.field), right = required(b, contract.order_by.field);
            const order = left < right ? -1 : left > right ? 1 : 0;
            return contract.order_by.direction === "asc" ? order : -order;
        });
    if (contract.limit !== null)
        selected = selected.slice(0, contract.limit);
    return Object.freeze(selected.map(row => Object.freeze(Object.fromEntries(contract.projection.map((field) => [field, required(row, field)])))));
}
