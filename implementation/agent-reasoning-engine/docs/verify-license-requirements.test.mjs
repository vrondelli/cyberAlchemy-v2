import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {validateLicenseRequirements} from "./verify-license-requirements.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const requirements = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/docs/license-requirements.json"), "utf8"));
const candidate = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json"), "utf8"));
const validate = value => validateLicenseRequirements(value, {candidate, readSource: ref => readFileSync(resolve(root, ref))});

test("license requirements bind resolved intent and the exact Candidate 018 inventory", () => {
  const result = validate(requirements);
  assert.deepEqual(result.inventory, {
    package_manifest_count: 23,
    package_manifests_with_declared_license: 0,
    declared_npm_dependency_edges: 0,
    license_or_notice_file_count: 0,
    cargo_manifest_or_lock_count: 0
  });
  assert.equal(result.resolved_count, 8);
  assert.equal(result.qualified_review_count, 2);
});

test("license requirements reject stale current-inventory claims", () => {
  const stale = structuredClone(requirements);
  stale.current_closure_inventory.package_manifest_count = 76;
  assert.throws(() => validate(stale), /license-requirements\.inventory-drift:package_manifest_count/u);
});

test("license requirements reject treating the historical notice audit as current clearance", () => {
  const conflated = structuredClone(requirements);
  conflated.historical_notice_audit.disposition = "CURRENT_CLEARED";
  assert.throws(() => validate(conflated), /license-requirements\.historical-audit-conflation/u);
});

test("license requirements bind the current source-rights inventory", () => {
  const stale = structuredClone(requirements);
  stale.current_source_rights_inventory.sha256 = "0".repeat(64);
  assert.throws(() => validate(stale), /license-requirements\.rights-inventory-drift/u);
});

test("license requirements reject lost owner decisions or qualified-review residue", () => {
  const incomplete = structuredClone(requirements);
  incomplete.resolved_owner_decisions.pop();
  assert.throws(() => validate(incomplete), /license-requirements\.resolved-decisions-incomplete/u);

  const cleared = structuredClone(requirements);
  cleared.remaining_qualified_review_requirements = [];
  assert.throws(() => validate(cleared), /license-requirements\.qualified-review-incomplete/u);
});
