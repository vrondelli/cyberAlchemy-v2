import assert from "node:assert/strict";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runCompactionLiveBenchmark} from "../src/compaction-live.mjs";

function fakeClient() {
  let threadSequence = 0;
  const compactions = [];
  return {
    async startThread() { threadSequence += 1; return {thread: {id: `fake-thread-${threadSequence}`}}; },
    async runTurn(params) {
      const recall = params.input[0].text.startsWith("Return every exact");
      const treatment = Object.hasOwn(params.additionalContext ?? {}, "cyberalchemy.are.compaction-projection");
      if (!recall) return {text: '{"facts":[]}'};
      const facts = treatment
        ? ["CA2-COMPACT-A=amber-lattice-47", "CA2-COMPACT-B=metalabels-are-not-literal-ui", "CA2-COMPACT-C=counterbalanced-gain-was-rejected"]
        : ["CA2-COMPACT-A=amber-lattice-47"];
      return {text: JSON.stringify({facts})};
    },
    async request(_method, params) { compactions.push(params.threadId); return {}; },
    async waitForNotification(predicate) {
      const message = {method: "item/completed", params: {threadId: compactions.at(-1), item: {id: `compact-${compactions.length}`, type: "contextCompaction"}}};
      assert.equal(predicate(message), true);
      return message;
    },
  };
}

test("live compaction runner keeps baseline and treatment paired through native compaction", async () => {
  const result = await runCompactionLiveBenchmark(loadBenchmark(packageRoot), {
    client: fakeClient(),
    observed_version: "codex-cli 0.153.0-alpha.5",
    model: "gpt-5.6-luna",
  });
  assert.equal(result.status, "PASS", JSON.stringify(result.summary));
  assert.equal(result.cases.length, 2);
  assert.equal(result.summary.baseline_exact_recall, 1 / 3);
  assert.equal(result.summary.treatment_exact_recall, 1);
});
