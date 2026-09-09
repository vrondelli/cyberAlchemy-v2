import assert from "node:assert/strict";
import test from "node:test";
import {assessRequirementChange, assessRequirementDelta, assessRequirementPatch, materializeRequirementSnapshot, reconcileRequirementDeltaLabels} from "../index.mjs";
const snapshot = materializeRequirementSnapshot({consumer_ref: "c", scope_ref: "s", objective_id: "o",
  objective_state_digest: "a".repeat(64), requirements: ["citations", "table"], source_refs: ["fixture"]});
const input = {snapshot, request: "Drop table and add examples", request_ref: "r"};
const patch = {transition: "refine", added: ["examples"], removed: ["table"]};
test("compact expansion produces byte-identical complete assessment", () => {
  assert.deepEqual(assessRequirementPatch({...input, patch}), assessRequirementChange({...input, transition: "refine",
    delta: {retained: ["citations"], added: ["examples"], removed: ["table"]}}));
  assert.deepEqual(snapshot.requirements, ["citations", "table"]);
});
test("omission cannot silently discard existing requirements", () => {
  const result = assessRequirementPatch({...input, patch: {transition: "continue", added: [], removed: []}});
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.resulting_requirements, snapshot.requirements);
});
test("malformed, unsupported, conflicting and authority-bearing patches block", () => {
  for (const p of [null, [], {}, {...patch, removed: [42]}, {...patch, removed: ["unknown"]},
    {...patch, removed: ["table", "table"]}, {...patch, added: ["citations"]}, {...patch, transition: "continue"},
    {...patch, transition: "unsupported"}, {...patch, authority_effect: "grant"}, {...patch, retained: []}]) {
    assert.equal(assessRequirementPatch({...input, patch: p}).ok, false);
  }
  for (const i of [undefined, null, {}, {...input, snapshot: {...snapshot, requirements: []}, patch}]) assert.equal(assessRequirementPatch(i).ok, false);
});
test("canonical whitespace handling preserves original contract", () => {
  const result = assessRequirementPatch({...input, patch: {...patch, removed: [" table "]}});
  assert.deepEqual(result, assessRequirementPatch({...input, patch}));
});
test("oversized compact output is blocked without truncation", () => {
  assert.equal(assessRequirementPatch({...input, patch: {...patch, added: ["x".repeat(32769)]}}).ok, false);
});
test("delta-only contract derives transition deterministically", () => {
  const changed = assessRequirementDelta({...input, delta: {posture: "applicable", added: ["examples"], removed: ["table"]}});
  assert.equal(changed.ok, true);
  assert.equal(changed.value.transition, "refine");
  assert.deepEqual(changed.value.resulting_requirements, ["citations", "examples"]);
  const unchanged = assessRequirementDelta({...input, delta: {posture: "applicable", added: [], removed: []}});
  assert.equal(unchanged.ok, true);
  assert.equal(unchanged.value.transition, "continue");
  assert.deepEqual(unchanged.value.resulting_requirements, snapshot.requirements);
});
test("delta-only contract blocks unsupported, malformed, and conflicting output", () => {
  for (const delta of [null, {}, {posture: "unsupported", added: ["examples"], removed: []},
    {posture: "unsupported", added: [], removed: []}, {posture: "applicable", added: ["citations"], removed: []},
    {posture: "applicable", added: [], removed: ["unknown"]}, {posture: "applicable", added: [], removed: [], transition: "continue"}]) {
    assert.equal(assessRequirementDelta({...input, delta}).ok, false);
  }
});
test("added labels retain exact request spans or restore one unique case variant", () => {
  const exact = reconcileRequirementDeltaLabels({request: "Please add audit trail.", delta: {posture: "applicable", added: ["audit trail"], removed: []}});
  assert.equal(exact.ok, true);assert.equal(exact.value.disposition, "unchanged");assert.equal(exact.value.labels[0].transformation, "exact");
  const restored = reconcileRequirementDeltaLabels({request: "Please add examples.", delta: {posture: "applicable", added: ["Examples"], removed: []}});
  assert.equal(restored.ok, true);assert.equal(restored.value.disposition, "reconciled");
  assert.deepEqual(restored.value.reconciled_delta.added, ["examples"]);assert.equal(restored.value.label_owner, "exact-request-span");
});
test("added-label reconciliation blocks missing, partial, and ambiguous source spans", () => {
  const delta = added => ({posture: "applicable", added: [added], removed: []});
  assert.deepEqual(reconcileRequirementDeltaLabels({request: "Please add examples.", delta: delta("diagrams")}).reason_codes,
    ["requirements.added-label-source-span-missing"]);
  assert.equal(reconcileRequirementDeltaLabels({request: "Please add examples2.", delta: delta("Examples")}).ok, false);
  assert.deepEqual(reconcileRequirementDeltaLabels({request: "Examples differ from examples.", delta: delta("EXAMPLES")}).reason_codes,
    ["requirements.added-label-source-span-ambiguous"]);
});
