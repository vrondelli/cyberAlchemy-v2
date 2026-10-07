import test from "node:test";
import assert from "node:assert/strict";
import {validateDirectSelection} from "./direct-selection-contract-r1.mjs";

const packet = {issue: "Fix the issue", current_selected_files: ["a.py", "b.py"],
  delivered_reads: [{index: 0, path: "a.py", snippet: "code a", start: 1, end: 1},
    {index: 1, path: "b.py", snippet: "code b", start: 1, end: 1},
    {index: 2, path: "c.py", snippet: "code c", start: 1, end: 1},
    {index: 3, path: "c.py", snippet: "another c", start: 2, end: 2}]};

test("accepts one retained file plus a receipt-bound addition", () => {
  assert.deepEqual(validateDirectSelection({decision: "select", read_indexes: [0, 2]}, packet),
    {decision: "select", read_indexes: [0, 2], files: ["a.py", "c.py"], changed: true});
});
test("abstain preserves the baseline", () => {
  assert.equal(validateDirectSelection({decision: "abstain", read_indexes: []}, packet).changed, false);
});
test("rejects duplicate path through different read indexes", () => {
  assert.throws(() => validateDirectSelection({decision: "select", read_indexes: [0, 2, 3]}, packet));
});
test("rejects invented read indexes", () => {
  assert.throws(() => validateDirectSelection({decision: "select", read_indexes: [0, 9]}, packet));
});
test("rejects dropping every original selected file", () => {
  assert.throws(() => validateDirectSelection({decision: "select", read_indexes: [2]}, packet));
});
test("rejects extra output fields", () => {
  assert.throws(() => validateDirectSelection({decision: "abstain", read_indexes: [], reason: "x"}, packet));
});
