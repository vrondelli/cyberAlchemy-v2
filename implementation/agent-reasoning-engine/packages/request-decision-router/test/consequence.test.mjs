import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {advanceUntilGate, evaluateContinuation, loadVerifiedDecisionProfile} from "../index.mjs";
import {G03_R3_EFFECT_SCOPE} from "../src/g03-r3-effect-scope.mjs";
import {G03_R4_EFFECT_SCOPE} from "../src/g03-r4-effect-scope.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const profile = loadVerifiedDecisionProfile(resolve(packageRoot, "profiles/cyberalchemy-v1.json"), repositoryRoot).value;

function completion(id, continuation_required = true) {
  return {completion_id: id, status: "completed", continuation_required, evidence_refs: [`receipt:${id}`]};
}

function option(id, effect_classes, reversible = true, owner_gate_ref = null, route_id = "CA2-ROUTE-VALIDATE") {
  return {option_id: id, route_id, effect_classes, reversible, owner_gate_ref, structurally_admissible: true, rejection_reasons: []};
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
  const result = evaluateContinuation({completion: completion("C2"), options: [option("O1", ["local-read"], true, null, "CA2-ROUTE-UNDERSTAND"), option("O2", ["draft"], true, null, "CA2-ROUTE-PLAN")]}, profile);
  assert.equal(result.kind, "gate");
  assert.deepEqual(result.reason_codes, ["continuation.multiple-admissible"]);
});

test("consequential and protected choices require gates", () => {
  const implementation = evaluateContinuation({completion: completion("C3"), options: [option("O1", ["implementation"], true, null, "CA2-ROUTE-IMPLEMENT")]}, profile);
  assert.equal(implementation.kind, "gate");
  const publication = evaluateContinuation({completion: completion("C4"), options: [option("O2", ["publication"], true, null, "CA2-ROUTE-PUBLISH")]}, profile);
  assert.equal(publication.kind, "gate");
  assert.ok(publication.owner_gate_refs.includes("Owner of the exact publication envelope"));
});

test("zero admissible options block", () => {
  const rejected = {...option("O1", ["draft"]), structurally_admissible: false, rejection_reasons: ["fixture.rejected"]};
  assert.equal(evaluateContinuation({completion: completion("C5"), options: [rejected]}, profile).kind, "block");
});

test("a route rejects effect classes outside its structured policy", () => {
  const result = evaluateContinuation({completion: completion("C5R"), options: [option("O1", ["persistent-mutation"])]}, profile);
  assert.equal(result.kind, "block");
  assert.ok(result.options[0].rejection_reasons.includes("option.route-effect-class-not-allowed:persistent-mutation"));
  assert.deepEqual(result.options[0].route_constraints.allowed_effect_classes, ["non-effectful-validate"]);
});

test("G03 r3 exception admits only the exact frozen protected-effect proposal", () => {
  const effects = ["implementation", "persistent-mutation", "external-effect", "spend"];
  const assess = (proposal, route_id = "CA2-ROUTE-IMPLEMENT", effect_classes = effects) =>
    evaluateContinuation({completion: completion("G03-R3"), options: [{...option("G03-R3", effect_classes, false, "G03 r3 owner approval", route_id), proposal}]}, profile);
  const exact = assess({...G03_R3_EFFECT_SCOPE});
  assert.equal(exact.kind, "gate");
  assert.ok(exact.owner_gate_refs.includes("Budget owner"));
  assert.ok(exact.owner_gate_refs.includes("Owner of the exact external effect"));
  for (const changed of [
    {...G03_R3_EFFECT_SCOPE, output_dir: "/opt/are-benchmark-runs/other"},
    {...G03_R3_EFFECT_SCOPE, workers: 3},
    {...G03_R3_EFFECT_SCOPE, retries: 1},
    {...G03_R3_EFFECT_SCOPE, selection_sha256: "0".repeat(64)},
    {...G03_R3_EFFECT_SCOPE, extra: true},
    null,
  ]) {
    assert.equal(assess(changed).kind, "block");
  }
  assert.equal(assess({...G03_R3_EFFECT_SCOPE}, "CA2-ROUTE-VALIDATE").kind, "block");
  assert.equal(assess({...G03_R3_EFFECT_SCOPE}, "CA2-ROUTE-IMPLEMENT", ["external-effect", "spend"]).kind, "block");
});

test("G03 r4 protected-effect exception is exact and retains owner gates", () => {
  const effects = ["implementation", "persistent-mutation", "external-effect", "spend"];
  const assess = (proposal, route_id = "CA2-ROUTE-IMPLEMENT", effect_classes = effects) =>
    evaluateContinuation({completion: completion("G03-R4"), options: [{...option("G03-R4", effect_classes, false, "DG-G03-R4 owner approval", route_id), proposal}]}, profile);
  const exact = assess({...G03_R4_EFFECT_SCOPE});
  assert.equal(exact.kind, "gate");
  assert.equal(exact.options[0].route_constraints.exact_scope_exception, "g03-product-replication-r4");
  assert.ok(exact.owner_gate_refs.includes("Budget owner"));
  for (const changed of [
    {...G03_R4_EFFECT_SCOPE, output_dir: "/opt/are-benchmark-runs/other"},
    {...G03_R4_EFFECT_SCOPE, workers: 3},
    {...G03_R4_EFFECT_SCOPE, provider_refusal_code: "other"},
    {...G03_R4_EFFECT_SCOPE, selection_sha256: "0".repeat(64)},
    {...G03_R4_EFFECT_SCOPE, extra: true},
    null,
  ]) assert.equal(assess(changed).kind, "block");
  assert.equal(assess({...G03_R4_EFFECT_SCOPE}, "CA2-ROUTE-VALIDATE").kind, "block");
  assert.equal(assess({...G03_R4_EFFECT_SCOPE}, "CA2-ROUTE-IMPLEMENT", ["external-effect", "spend"]).kind, "block");
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
    {completion: completion("C6"), options: [option("O1", ["local-read"], true, null, "CA2-ROUTE-UNDERSTAND")]},
    {completion: completion("C7"), options: [option("O2", ["implementation"], true, null, "CA2-ROUTE-IMPLEMENT")]},
  ], profile);
  assert.equal(result.kind, "gate");
  assert.deepEqual(result.traversed.map((item) => item.kind), ["direct", "gate"]);
});
