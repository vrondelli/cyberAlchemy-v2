import assert from "node:assert/strict";
import test from "node:test";
import {addSummarySymbolClosure} from "./summary-symbol-closure-r1.mjs";

const prediction = () => ({instance_id: "case", traj_data: {
  pred_files: ["package/selected.py"], pred_spans: {"package/selected.py": [{start: 1, end: 4}]}, pred_steps: []}});
const source = "def saferepr(value):\n    return str(value)\n\nclass Other:\n    pass\n";

test("adds one bounded source declaration and leaves input unchanged", () => {
  const input = prediction();
  const result = addSummarySymbolClosure(input, "`saferepr(x)` is called", () =>
    [{path: "package/saferepr.py", line: 1, source}]);
  assert.deepEqual(result.prediction.traj_data.pred_files,
    ["package/selected.py", "package/saferepr.py"]);
  assert.deepEqual(result.prediction.traj_data.pred_spans["package/saferepr.py"],
    [{start: 1, end: 2}]);
  assert.equal(result.additions.length, 1);
  assert.deepEqual(input, prediction());
});

test("ambiguous new symbols and multiple selected files make no change", () => {
  const input = prediction();
  const both = addSummarySymbolClosure(input, "`alpha()` and `beta()`", symbol =>
    [{path: `package/${symbol}.py`, line: 1, source: `def ${symbol}():\n    pass\n`}]);
  assert.equal(both.additions.length, 0);
  input.traj_data.pred_files.push("package/second.py");
  assert.equal(addSummarySymbolClosure(input, "`saferepr()`", () =>
    [{path: "package/saferepr.py", line: 1, source}]).additions.length, 0);
});

test("non-unique definitions and overlong functions are rejected", () => {
  const input = prediction();
  assert.equal(addSummarySymbolClosure(input, "`saferepr()`", () =>
    [{path: "package/a.py", line: 1, source}, {path: "package/b.py", line: 1, source}])
    .additions.length, 0);
  const long = `def saferepr():\n${"    work()\n".repeat(35)}`;
  assert.equal(addSummarySymbolClosure(input, "`saferepr()`", () =>
    [{path: "package/a.py", line: 1, source: long}]).additions.length, 0);
});
