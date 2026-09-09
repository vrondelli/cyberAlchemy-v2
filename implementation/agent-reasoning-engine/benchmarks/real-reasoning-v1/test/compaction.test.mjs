import assert from "node:assert/strict";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runCompactionBenchmark} from "../src/compaction.mjs";

test("compaction benchmark compares four arms and observes Codex telemetry", async () => {
  const result = await runCompactionBenchmark(loadBenchmark(packageRoot));
  assert.equal(result.status, "PASS", JSON.stringify(result.summary.checks));
  assert.equal(result.authority_effect, "none");
  assert.equal(result.cases.length, 2);
  assert.equal(result.cases.every((entry) => entry.arms.length === 4), true);
  assert.equal(result.metrics.minimum_treatment_pinned_survival_rate, 1);
  assert.equal(result.metrics.minimum_treatment_recoverability_rate, 1);
  assert.equal(result.metrics.compaction_completed_observations, 2);
  assert.equal(result.metrics.token_usage_observations, 2);
});
