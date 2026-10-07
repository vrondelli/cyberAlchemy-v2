import assert from "node:assert/strict";
import {test} from "node:test";
import {sourceOutForFreeze} from "./run.mjs";

test("frozen G01 source checkout may use its exact per-arm tmpfs path", () => {
  const root = "/opt/are/evolution-runtime/g01-product-replication-r9/task-a/control";
  assert.equal(sourceOutForFreeze({output_root: root}), `${root}/source/00`);
  const expected = "/tmp/are-g01-product-replication-r9-source/task-a/control/source/00";
  assert.equal(sourceOutForFreeze({output_root: root, source_out: expected}), expected);
  assert.throws(() => sourceOutForFreeze({output_root: root, source_out: expected.replace("control", "candidate")}));
  assert.throws(() => sourceOutForFreeze({output_root: root, source_out: "/opt/are/evolution-runtime/g01-product-replication-r9/task-a/control/source/00"}));
  assert.throws(() => sourceOutForFreeze({output_root: "/tmp/other/task-a/control", source_out: expected}));
});
