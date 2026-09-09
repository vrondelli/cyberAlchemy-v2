import assert from "node:assert/strict";
import test from "node:test";
import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runCoreBenchmark} from "../src/core.mjs";

test("core benchmark evaluates routing, retrieval, determinism, and local latency", async () => {
  const result = await runCoreBenchmark(loadBenchmark(packageRoot), {warm_iterations: 2, timing_iterations: 20, preflight_warm_iterations: 1, preflight_iterations: 3, enforce_performance: false});
  assert.equal(result.schema_version, "are.real-reasoning-benchmark-result/v1");
  assert.equal(result.authority_effect, "none");
  assert.equal(result.cases.routing.length, 20);
  assert.equal(result.cases.context.length, 10);
  assert.equal(result.summary.determinism_mismatches, 0);
  assert.equal(result.improvement_feedback.disposition, "no-failures");
  assert.deepEqual(result.improvement_feedback.hypotheses, []);
});
