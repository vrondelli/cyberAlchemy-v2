import assert from "node:assert/strict";
import test from "node:test";
import {addExactSingleIncludeMirrors} from "./mirror-source-context-r1.mjs";

const prediction = () => ({instance_id: "task", traj_data: {pred_files: ["include/pkg/code.hpp"], pred_spans: {"include/pkg/code.hpp": [{start: 2, end: 3}]}, pred_steps: [{files: ["include/pkg/code.hpp"], spans: {"include/pkg/code.hpp": [{start: 2, end: 3}]}}]}});

test("adds only a unique exact generated mirror without removing source evidence", () => {
  const files = {"include/pkg/code.hpp": "preamble\nalpha\nbeta\nend", "single_include/pkg/code.hpp": "other\nalpha\nbeta\npost"};
  const input = prediction(), output = addExactSingleIncludeMirrors(input, path => files[path] ?? null);
  assert.deepEqual(input.traj_data.pred_files, ["include/pkg/code.hpp"]);
  assert.deepEqual(output.prediction.traj_data.pred_files, ["include/pkg/code.hpp", "single_include/pkg/code.hpp"]);
  assert.deepEqual(output.prediction.traj_data.pred_spans["single_include/pkg/code.hpp"], [{start: 2, end: 3}]);
  assert.equal(output.additions.length, 1);
});

test("rejects ambiguous, missing, changed and overlong mirror spans", () => {
  const source = "x\nalpha\nbeta\ny";
  for (const mirror of [null, "alpha\nbeta\nalpha\nbeta", "alpha\nchanged"]) {
    const result = addExactSingleIncludeMirrors(prediction(), path => path.startsWith("single_include/") ? mirror : source);
    assert.equal(result.additions.length, 0);
  }
  const invalid = prediction(); invalid.traj_data.pred_spans["include/pkg/code.hpp"] = [{start: 1, end: 300}];
  assert.equal(addExactSingleIncludeMirrors(invalid, path => path.startsWith("single_include/") ? source : source).additions.length, 0);
});
