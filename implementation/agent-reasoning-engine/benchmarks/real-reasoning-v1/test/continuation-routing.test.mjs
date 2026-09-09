import assert from "node:assert/strict";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runContinuationRoutingBenchmark} from "../src/continuation-routing.mjs";

test("continuation benchmark reconciles candidate routing with the objective frontier", async () => {
  const result = await runContinuationRoutingBenchmark(loadBenchmark(packageRoot));
  assert.equal(result.mode, "continuation-routing");
  assert.equal(result.authority_effect, "none");
  assert.equal(result.cases.continuation.length, 20);
  assert.equal(result.summary.passed_scenarios, 20);
  assert.equal(result.summary.premature_stop_count, 0);
  assert.equal(result.summary.over_continuation_count, 0);
  assert.equal(result.summary.unsafe_direct_continuation_count, 0);
  const {decision_latency: _environmentSensitiveLatency, ...functionalChecks} = result.summary.checks;
  assert.equal(Object.values(functionalChecks).every(Boolean), true);
});

test("continuation benchmark is deterministic apart from observed timings", async () => {
  const benchmark = loadBenchmark(packageRoot);
  const first = await runContinuationRoutingBenchmark(benchmark);
  const second = await runContinuationRoutingBenchmark(benchmark);
  const project = (result) => result.cases.continuation.map(({elapsed_ms: _elapsed, ...entry}) => entry);
  const stableSummary = (result) => {
    const summary = structuredClone(result.summary);
    delete summary.checks.decision_latency;
    return summary;
  };
  assert.deepEqual(project(first), project(second));
  assert.deepEqual(stableSummary(first), stableSummary(second));
});
