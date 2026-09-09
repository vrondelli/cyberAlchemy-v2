import test from "node:test";
import assert from "node:assert/strict";
import {assessIntentRealization, materializeIntentContract, materializeUserControlProfile, verifyIntentContract, verifyUserControlProfile} from "../index.mjs";

function contract(overrides = {}) {
  return materializeIntentContract({request_ref: "request:1", request_digest: "a".repeat(64), objective: "Write natural product copy", target: "homepage narrative", construction_directives: [{instruction: "definition then example", posture: "structural", render_verbatim: false}], surface_requirements: ["continuous natural narrative"], surface_prohibitions: ["Definition", "Example"], referent_bindings: {}, assumptions: [], unresolved_questions: [], risk_projections: ["meta-instruction-leakage"], disposition: "act", source_refs: [], ...overrides});
}

test("Intent Contracts are canonical, immutable, and self-verifying", () => {
  const left = contract({surface_requirements: ["z", "continuous natural narrative", "z"]});
  const right = contract({surface_requirements: ["continuous natural narrative", "z"]});
  assert.equal(left.intent_contract_digest, right.intent_contract_digest);
  assert.equal(verifyIntentContract(left).ok, true);
  assert.equal(Object.isFrozen(left), true);
  assert.throws(() => { left.objective = "changed"; }, TypeError);
  assert.equal(verifyIntentContract({...left, objective: "tampered"}).ok, false);
});

test("ask contracts require a concrete unresolved question", () => {
  assert.throws(() => contract({disposition: "ask"}), /unresolved question/);
  assert.equal(verifyIntentContract(contract({disposition: "ask", unresolved_questions: ["Which target?"]})).ok, true);
});

test("realization detects leaked construction scaffolds", () => {
  const failed = assessIntentRealization(contract(), {surface_text: "Definition\nThe protocol...\nExample\nA researcher...", observed_risks: ["meta-instruction-leakage"]});
  assert.equal(failed.ok, true);
  assert.equal(failed.value.disposition, "mismatch");
  assert.deepEqual(failed.value.violations.map((entry) => entry.kind).sort(), ["prohibited-surface-observed", "prohibited-surface-observed", "projected-risk-realized"]);
  const passed = assessIntentRealization(contract(), {surface_text: "The protocol lets a researcher share knowledge while origin remains."});
  assert.equal(passed.value.disposition, "satisfied");
});

test("control profiles preserve optional depth and prohibit automatic adoption", () => {
  const profile = materializeUserControlProfile({visibility: "inspect", correction_retention: "current-product", automatic_improvement_adoption: true});
  assert.equal(profile.automatic_improvement_adoption, false);
  assert.equal(verifyUserControlProfile(profile).ok, true);
  assert.equal(verifyUserControlProfile({...profile, visibility: "unknown"}).ok, false);
});
