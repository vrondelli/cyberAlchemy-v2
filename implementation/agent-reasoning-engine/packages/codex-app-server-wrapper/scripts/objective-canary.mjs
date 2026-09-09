import assert from "node:assert/strict";
import {resolve} from "node:path";
import {performance} from "node:perf_hooks";
import {createCodexAppServerWrapper, loadRepositoryProfile} from "../index.mjs";
import {OBJECTIVE_CONTEXT_KEY} from "../src/objective-lifecycle.mjs";
import {digestIntentMaterial} from "../../request-intent-runtime/index.mjs";

const root = resolve(import.meta.dirname, "..");
const loaded = loadRepositoryProfile(resolve(root, "profiles/repository-v1.json"), resolve(root, "../../../../.."));
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
const request = (id, text) => ({jsonrpc: "2.0", id, method: "turn/start", params: {threadId: "objective-canary", input: [{type: "text", text}]}});
const make = enabled => createCodexAppServerWrapper({loaded_profile: {...loaded.value, objective_resolution: {enabled}},
  decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot,
  source_snapshot: loaded.source_snapshot, context_source_provider: loaded.context_source_provider});
const fragment = result => JSON.parse(result.to_server[0].params.additionalContext[OBJECTIVE_CONTEXT_KEY].value);
const baseline = make(false);
await baseline.processClientMessage(request(1, "Research context management."));
const baselineNext = await baseline.processClientMessage(request(2, "do next"));
baseline.close();
const samples = [], receipts = [];
for (let i = 0; i < 12; i++) {
  const wrapper = make(true);
  try {
    const first = await wrapper.processClientMessage(request(1, "Research context management."));
    assert.equal(first.to_server.length, 1);
    const started = performance.now();
    const next = await wrapper.processClientMessage(request(2, "do next"));
    const elapsed = performance.now() - started;
    assert.equal(next.to_server.length, 1, JSON.stringify(next.to_client));
    assert.equal(fragment(next).active_objective.objective_id, fragment(first).active_objective.objective_id);
    assert.equal(fragment(next).transition, "continue");
    assert.equal(next.to_server[0].params.input[0].text, "do next");
    const duplicate = await wrapper.processClientMessage(request(2, "do next"));
    assert.equal(duplicate.to_server.length, 0);
    if (i >= 2) samples.push(elapsed);
    receipts.push(fragment(next).resolution_digest);
  } finally { wrapper.close(); }
}
assert.equal(new Set(receipts).size, 1);
samples.sort((a, b) => a - b);
const functional = {scenario: "research then do next", baseline_continuation_forwarded: baselineNext.to_server.length === 1,
  treatment_continuation_forwarded: true, same_objective: true, original_input_preserved: true, duplicate_redispatches: 0,
  repeated_scenario_count: receipts.length, resolution_digest: receipts[0], provider_calls: 0};
console.log(JSON.stringify({schema_version: "are.codex-objective-canary/v1", node_version: process.version, functional,
  functional_digest: digestIntentMaterial(functional), warm_samples: samples.length, warm_p95_ms: samples[Math.ceil(samples.length * 0.95) - 1],
  timing_scope: "Local wrapper turn/start including live source reload, preflight, objective checkpoint, context projection and verified dispatch construction; no upstream model or network",
  limitations: "One repeated English continuation scenario, not a general language benchmark or delivery guarantee", authority_effect: "none"}, null, 2));
