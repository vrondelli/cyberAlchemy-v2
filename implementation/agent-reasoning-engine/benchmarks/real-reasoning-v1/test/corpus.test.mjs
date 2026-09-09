import assert from "node:assert/strict";
import test from "node:test";
import {loadBenchmark, validateContinuationCorpus, validateMultiTurnCorpus} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";

test("loads the versioned benchmark corpus", () => {
  const benchmark = loadBenchmark(packageRoot);
  assert.deepEqual(Object.fromEntries(Object.entries(benchmark.corpora).map(([key, rows]) => [key, rows.length])), {routing: 20, context: 10, lifecycle: 5, failure: 6, live: 6, live_multiturn: 4, intent: 8, compaction: 4, adaptive_reuse: 8, continuation: 20});
  assert.equal(benchmark.corpora.live_multiturn.every((scenario) => scenario.turns.length === 3), true);
});

test("rejects inconsistent continuation frontiers", () => {
  assert.throws(() => validateContinuationCorpus([{
    schema_version: "are.benchmark-scenario/v1",
    scenario_id: "bad-continuation",
    benchmark_kind: "route-continuation",
    request: "Continue.",
    completion: {status: "completed"},
    objective_frontier: {state: "complete", evidence_refs: ["fixture:done"]},
    provider: {},
    expected: {continuation_needed: true, directive_kind: "direct", selected_proposal_id: null, reason_code: "invalid"},
    error_class: "none",
  }]), /completed frontier requires no continuation/);
});

test("rejects malformed or duplicate multi-turn contracts", () => {
  assert.throws(() => validateMultiTurnCorpus([{scenario_id: "bad", conversation_kind: "define", turns: [{turn_id: "same", request: "one", objective_kind: "define", required_terms: [], prohibited_patterns: [], required_context_item_ids: []}, {turn_id: "same", request: "two", objective_kind: "define", required_terms: [], prohibited_patterns: [], required_context_item_ids: []}]}]), /invalid turn/);
});
