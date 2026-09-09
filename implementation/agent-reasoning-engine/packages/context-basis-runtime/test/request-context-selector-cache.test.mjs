import assert from "node:assert/strict";
import test from "node:test";
import {selectRequestContext} from "../index.mjs";

function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

const snapshot = {ontology_id: "test", nodes: [{node_id: "are.ContextWindowView", lookup_terms: ["context window view"], search_terms: ["ContextWindowView"]}], edges: []};
const catalog = {definitions: [{definition_id: "ContextWindowView", primary_term: "Context Window View", aliases: ["Context Window View"], lookup_terms: ["context window view", "context", "window", "view"]}]};

test("frozen sources reuse the compiled index without changing result bytes", () => {
  const input = {raw_request: "Explain the Context Window View", catalog: freeze(structuredClone(catalog)), snapshot: freeze(structuredClone(snapshot)), context_items: freeze([])};
  const first = selectRequestContext(input);
  const second = selectRequestContext(input);
  assert.equal(first.digest, second.digest);
  assert.deepEqual(first.value, second.value);
});

test("mutable sources are never cached across a source change", () => {
  const mutable = structuredClone(catalog);
  const input = {raw_request: "Explain the Context Window View", catalog: mutable, snapshot: structuredClone(snapshot)};
  const first = selectRequestContext(input);
  mutable.definitions[0].lookup_terms = ["unrelated phrase"];
  mutable.definitions[0].primary_term = "Unrelated Phrase";
  const second = selectRequestContext(input);
  assert.equal(first.value.definition_matches.length, 1);
  assert.equal(second.value.definition_matches.length, 0);
});
