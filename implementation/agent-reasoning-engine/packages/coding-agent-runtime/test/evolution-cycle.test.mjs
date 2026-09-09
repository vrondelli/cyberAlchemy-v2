import assert from "node:assert/strict";
import test from "node:test";

import {runRecommendOnlyEvolutionCycle} from "../evolution-bridge.mjs";

test("selected run evidence produces a scheduled recommend-only evolution cycle", async () => {
  const result = await runRecommendOnlyEvolutionCycle({user_selected: true, required_keep_streak_met: true, evidence: {run_id: "run:1", status: "PATCH_CANDIDATE", result_digest: "result:1", source_tree_digest: "tree:1", changed_paths: ["src/a.mjs"], safety_passed: true, determinism_passed: true, holdout_passed: true}});
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.result.upgrade.disposition, "recommend-candidate");
  assert.equal(result.result.automatic_adoption, false);
  assert.equal(result.result.comparison.outcome, "KEEP");
});
