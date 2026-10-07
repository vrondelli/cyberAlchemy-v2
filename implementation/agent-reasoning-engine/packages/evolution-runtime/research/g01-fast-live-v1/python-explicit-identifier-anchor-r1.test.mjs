import assert from "node:assert/strict";
import test from "node:test";
import {addPythonExplicitIdentifierAnchors} from "./python-explicit-identifier-anchor-r1.mjs";

const prediction = () => ({traj_data: {pred_files: ["pkg/dtypes.py"],
  pred_spans: {"pkg/dtypes.py": [{start: 8, end: 9}]}}});
const source = "a\nb\nPYTHON_DTYPES_MAP = {\n    bool: 'bool',\n}\nx\ny\nz\nq\n";

test("adds a bounded declaration explicitly named by the issue", () => {
  const result = addPythonExplicitIdentifierAnchors(prediction(), "Use `dtypes.PYTHON_DTYPES_MAP.get(dtype, dtype)`", () => source);
  assert.deepEqual(result.additions.map(row => row.span), [{start: 3, end: 5}]);
  assert.deepEqual(result.prediction.traj_data.pred_spans["pkg/dtypes.py"],
    [{start: 8, end: 9}, {start: 3, end: 5}]);
});

test("does not add unmentioned, ambiguous, overlapping, or outside-file declarations", () => {
  assert.equal(addPythonExplicitIdentifierAnchors(prediction(), "no exact identifier", () => source).additions.length, 0);
  assert.equal(addPythonExplicitIdentifierAnchors(prediction(), "`PYTHON_DTYPES_MAP`", () =>
    `${source}PYTHON_DTYPES_MAP = {}\n`).additions.length, 0);
  const overlap = prediction(); overlap.traj_data.pred_spans["pkg/dtypes.py"] = [{start: 4, end: 8}];
  assert.equal(addPythonExplicitIdentifierAnchors(overlap, "`PYTHON_DTYPES_MAP`", () => source).additions.length, 0);
  const badPath = prediction(); badPath.traj_data.pred_files = ["../pkg/dtypes.py"];
  assert.equal(addPythonExplicitIdentifierAnchors(badPath, "`PYTHON_DTYPES_MAP`", () => source).additions.length, 0);
});
