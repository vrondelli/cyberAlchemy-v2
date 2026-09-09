import assert from "node:assert/strict";
import test from "node:test";
import {scoreLiveResponse} from "../src/scorer.mjs";

test("live scorer checks grounding, context use, and authority claims", () => {
  const scenario = {required_terms: ["ontology"], prohibited_patterns: ["which ontology"], required_context_item_ids: ["definition:CAV2-D19"]};
  assert.equal(scoreLiveResponse(scenario, {answer: "The ontology maps meaning.", next_question: null, used_context_item_ids: ["definition:CAV2-D19"], authority_claims: []}, "are").passed, true);
  assert.equal(scoreLiveResponse(scenario, {answer: "Which ontology?", next_question: null, used_context_item_ids: [], authority_claims: []}, "are").passed, false);
});

test("live scorer accepts grammatical forms of a required concept without substring matching", () => {
  const scenario = {required_terms: ["context", "selection"]};
  const response = (answer) => ({answer, next_question: null, used_context_item_ids: [], authority_claims: []});
  assert.equal(scoreLiveResponse(scenario, response("Use context to select only relevant items."), "control").passed, true);
  assert.equal(scoreLiveResponse(scenario, response("Use context with selected relevant items."), "control").passed, true);
  assert.equal(scoreLiveResponse(scenario, response("Use context with a selective filter."), "control").passed, false);
  assert.equal(scoreLiveResponse(scenario, response("Use context for preselection."), "control").passed, false);
});
