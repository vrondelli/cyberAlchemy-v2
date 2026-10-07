import test from "node:test";
import assert from "node:assert/strict";
import {addPythonImportPreamble} from "./python-import-preamble-r1.mjs";

const source = ["# module", "from .compat import builtin_str, urlparse", "", "def helper():",
  "    pass", "def request(method):", "    return builtin_str(method)", ""].join("\n");
const prediction = {traj_data: {pred_files: ["pkg/sessions.py"], pred_spans:
  {"pkg/sessions.py": [{start: 6, end: 7}]}}};

test("adds a bounded source-only preamble when a selected span uses an imported name", () => {
  const result = addPythonImportPreamble(prediction, () => source);
  assert.deepEqual(result.prediction.traj_data.pred_spans["pkg/sessions.py"],
    [{start: 6, end: 7}, {start: 1, end: 3}]);
  assert.deepEqual(result.additions[0].matched_imported_names, ["builtin_str"]);
  assert.deepEqual(prediction.traj_data.pred_spans["pkg/sessions.py"], [{start: 6, end: 7}]);
});

test("does not add an unrelated header or repeat a covered one", () => {
  const unrelated = structuredClone(prediction);
  unrelated.traj_data.pred_spans["pkg/sessions.py"] = [{start: 4, end: 5}];
  assert.equal(addPythonImportPreamble(unrelated, () => source).additions.length, 0);
  const covered = structuredClone(prediction);
  covered.traj_data.pred_spans["pkg/sessions.py"] = [{start: 1, end: 7}];
  assert.equal(addPythonImportPreamble(covered, () => source).additions.length, 0);
});

test("rejects an invalid selected span", () => {
  const invalid = structuredClone(prediction);
  invalid.traj_data.pred_spans["pkg/sessions.py"] = [{start: 6, end: 99}];
  assert.throws(() => addPythonImportPreamble(invalid, () => source), /span-shape/);
});
