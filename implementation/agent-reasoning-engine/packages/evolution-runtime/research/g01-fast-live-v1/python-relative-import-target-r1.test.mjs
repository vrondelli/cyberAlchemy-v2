import {test} from "node:test";
import assert from "node:assert/strict";
import {addPythonRelativeImportTargets} from "./python-relative-import-target-r1.mjs";

const prediction = {traj_data: {pred_files: ["pkg/main.py"],
  pred_spans: {"pkg/main.py": [{start: 3, end: 3}]}, pred_steps: []}};
test("follows a used single-dot import to a bounded definition module", () => {
  const sources = {"pkg/main.py": "from .helper import convert\n\ndef f(): convert()\n",
    "pkg/helper.py": "# helper\n\n\ndef convert():\n    return 1\n\n# end\n# end2\n"};
  const result = addPythonRelativeImportTargets(prediction, path => sources[path] ?? null);
  assert.equal(result.additions.length, 1);
  assert.deepEqual(result.prediction.traj_data.pred_files, ["pkg/main.py", "pkg/helper.py"]);
  assert.deepEqual(result.prediction.traj_data.pred_spans["pkg/helper.py"], [{start: 1, end: 8}]);
  assert.deepEqual(prediction.traj_data.pred_files, ["pkg/main.py"]);
});

test("does not add unused, already selected, or oversized helpers", () => {
  const source = "from .helper import convert\n\ndef f(): convert()\n";
  const huge = `${"# line\n".repeat(120)}def convert(): pass\n`;
  assert.equal(addPythonRelativeImportTargets(prediction, path => path === "pkg/main.py" ? source : huge).additions.length, 0);
  const already = structuredClone(prediction);
  already.traj_data.pred_files.push("pkg/helper.py");
  already.traj_data.pred_spans["pkg/helper.py"] = [{start: 1, end: 1}];
  assert.equal(addPythonRelativeImportTargets(already, path => path === "pkg/main.py" ? source : "# x\n".repeat(8)).additions.length, 0);
  const unused = structuredClone(prediction);
  unused.traj_data.pred_spans["pkg/main.py"] = [{start: 1, end: 1}];
  assert.equal(addPythonRelativeImportTargets(unused, path => path === "pkg/main.py" ? source : "# x\n".repeat(8)).additions.length, 0);
});
