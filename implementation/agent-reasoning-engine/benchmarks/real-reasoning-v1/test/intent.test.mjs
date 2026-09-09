import assert from "node:assert/strict";
import test from "node:test";
import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runIntentBenchmark} from "../src/intent.mjs";

test("intent benchmark distinguishes content from construction and classifies corrections", async () => {
  const result = await runIntentBenchmark(loadBenchmark(packageRoot), {timing_iterations: 20, enforce_performance: false});
  assert.equal(result.status, "PASS");
  assert.equal(result.cases.intent.length, 8);
  assert.equal(result.summary.intent_alignment, 1);
});
