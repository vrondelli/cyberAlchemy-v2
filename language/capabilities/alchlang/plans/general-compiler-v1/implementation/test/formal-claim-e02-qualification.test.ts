import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { defaultDomainSpecPackageRoot } from "../src/domainspec-cli.js";

const repo = path.resolve(defaultDomainSpecPackageRoot(), "../../../../..");
const qualificationPath = path.join(repo, "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/e02-formal-claim-projection/qualification.v2-candidate.json");
const sha256 = (file: string) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function validate(value: any): void {
  assert.equal(value.schema_version, "alchlang.e02-formal-claim-projection-qualification/v2-candidate");
  assert.equal(value.task, "E02"); assert.equal(value.result, "scoped-pass"); assert.equal(value.authority_effect, "none");
  assert.equal(sha256(path.join(repo, value.supersedes_historical_qualification.path)), value.supersedes_historical_qualification.sha256);
  assert.equal(sha256(path.join(repo, value.inherited_boundary.path)), value.inherited_boundary.sha256);
  assert.equal(sha256(path.join(repo, value.dag.path)), value.dag.sha256);
  assert.equal(value.dag.node, "E02");
  assert.deepEqual(Object.keys(value.bindings).sort(), ["projection_implementation", "lowering_implementation", "projection_test", "lowering_test", "fixture",
    "projection_schema", "v2_target_schema", "v4_source_schema", "preservation_schema", "acceptance_decision_schema",
    "business_meaning_v2_schema", "mapping_document"].sort());
  for (const binding of Object.values(value.bindings) as Array<{ path: string; sha256: string }>) {
    assert.equal(sha256(path.join(repo, binding.path)), binding.sha256, binding.path);
  }
  assert.deepEqual(value.validation.focused_lowering_and_projection, {tests: 18, passed: 18, failed: 0, skipped: 0});
  assert.equal(value.validation.typecheck, "pass");
  assert.equal(value.validation.v3_target_schema_validation, "pass");
  assert.equal(value.validation.decision_and_interpretation_currentness, "pass");
  assert.match(value.validation.full_application_regression, /^not-claimed;/u);
  assert.deepEqual(value.preservation, {semantic_loss_count: 0, representation_change_count: 5,
    meaning_repaired_or_invented: false, acceptance_and_interpretation_excluded_from_v3_claim_identity: true,
    acceptance_and_interpretation_changes_invalidate_projection_bytes: true});
  assert.match(value.claim_ceiling, /Current E02 scoped compatibility evidence only/u);
  assert.equal(value.open_questions.length, 2);
}

test("E02 qualification binds exact v4-to-v2 preservation and explicit representation loss", () => {
  validate(JSON.parse(fs.readFileSync(qualificationPath, "utf8")));
});

test("E02 qualification rejects stale implementation, semantic loss and meaning repair", () => {
  const original = JSON.parse(fs.readFileSync(qualificationPath, "utf8"));
  for (const mutate of [
    (value: any) => { value.bindings.projection_implementation.sha256 = "0".repeat(64); },
    (value: any) => { value.bindings.acceptance_decision_schema.sha256 = "0".repeat(64); },
    (value: any) => { value.preservation.semantic_loss_count = 1; },
    (value: any) => { value.preservation.meaning_repaired_or_invented = true; },
    (value: any) => { value.validation.full_application_regression = "pass"; },
  ]) {
    const changed = structuredClone(original); mutate(changed); assert.throws(() => validate(changed));
  }
});
