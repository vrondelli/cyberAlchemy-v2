import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {advanceUntilGate, evaluateContinuation, loadVerifiedDecisionProfile} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const profile = loadVerifiedDecisionProfile(resolve(packageRoot, "profiles/cyberalchemy-v1.json"), repositoryRoot).value;

function completion(id, continuation_required = true) {
  return {completion_id: id, status: "completed", continuation_required, evidence_refs: [`receipt:${id}`]};
}

function option(id, effect_classes, reversible = true, owner_gate_ref = null) {
  return {option_id: id, route_id: "CA2-ROUTE-VALIDATE", effect_classes, reversible, owner_gate_ref, structurally_admissible: true, rejection_reasons: []};
}

test("no required continuation completes", () => {
  assert.equal(evaluateContinuation({completion: completion("C0", false), options: []}, profile).kind, "complete");
});

test("sole reversible non-consequential continuation is direct", () => {
  const result = evaluateContinuation({completion: completion("C1"), options: [option("O1", ["non-effectful-validate"])]}, profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected_option_id, "O1");
});

test("multiple safe continuations require a gate", () => {
  const result = evaluateContinuation({completion: completion("C2"), options: [option("O1", ["local-read"]), option("O2", ["draft"])]}, profile);
  assert.equal(result.kind, "gate");
  assert.deepEqual(result.reason_codes, ["continuation.multiple-admissible"]);
});

test("consequential and protected choices require gates", () => {
  const implementation = evaluateContinuation({completion: completion("C3"), options: [option("O1", ["implementation"])]}, profile);
  assert.equal(implementation.kind, "gate");
  const publication = evaluateContinuation({completion: completion("C4"), options: [option("O2", ["publication"])]}, profile);
  assert.equal(publication.kind, "gate");
  assert.ok(publication.owner_gate_refs.includes("Owner of the exact publication envelope"));
});

test("zero admissible options block", () => {
  const rejected = {...option("O1", ["draft"]), structurally_admissible: false, rejection_reasons: ["fixture.rejected"]};
  assert.equal(evaluateContinuation({completion: completion("C5"), options: [rejected]}, profile).kind, "block");
});

test("missing safety metadata and malformed options fail closed", () => {
  const missing = {option_id: "O1", route_id: "CA2-ROUTE-VALIDATE", structurally_admissible: true};
  const missingResult = evaluateContinuation({completion: completion("C5A"), options: [missing]}, profile);
  assert.equal(missingResult.kind, "block");
  assert.ok(missingResult.options[0].rejection_reasons.includes("option.effect-classes-required"));
  assert.ok(missingResult.options[0].rejection_reasons.includes("option.reversibility-required"));
  assert.equal(evaluateContinuation({completion: completion("C5B"), options: [null]}, profile).kind, "block");
});

test("continuation sequence follows direct steps until a gate", () => {
  const result = advanceUntilGate([
    {completion: completion("C6"), options: [option("O1", ["local-read"])]},
    {completion: completion("C7"), options: [option("O2", ["implementation"])]},
  ], profile);
  assert.equal(result.kind, "gate");
  assert.deepEqual(result.traversed.map((item) => item.kind), ["direct", "gate"]);
});
