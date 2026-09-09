import assert from "node:assert/strict";
import test from "node:test";
import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runIntegrationBenchmark} from "../src/integration.mjs";

test("integration benchmark exercises view lifecycle and fail-closed behavior", async () => {
  const result = await runIntegrationBenchmark(loadBenchmark(packageRoot));
  assert.equal(result.authority_effect, "none");
  assert.equal(result.cases.lifecycle.length, 5);
  assert.equal(result.cases.failure_safety.length, 6);
  assert.equal(result.cases.failure_safety.every((entry) => entry.passed), true);
});
