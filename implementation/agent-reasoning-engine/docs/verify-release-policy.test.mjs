import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {validateReleasePolicy} from "./verify-release-policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const policy = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/docs/release-policy.json"), "utf8"));
const candidate = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json"), "utf8"));
const validate = value => validateReleasePolicy(value, {candidate, pathExists: ref => existsSync(resolve(root, ref))});

test("release policy binds the self-contained distribution and two supported successor contracts", () => {
  const result = validate(policy);
  assert.equal(result.contract_count, 2);
  assert.equal(result.first_version, "0.10.0-rc.1");
  assert.equal(result.first_tag, "v0.10.0-rc.1");
  assert.equal(result.offer_model, "paid-download-of-complete-software");
  assert.equal(result.license_status, "CANDIDATE_TERMS_LEGAL_TEXT_REQUIRED");
});

test("release policy rejects activation and public package support claims", () => {
  const active = structuredClone(policy);
  active.decision_status = "ACTIVE";
  assert.throws(() => validate(active), /release-policy\.activation-claim-invalid/u);

  const publicExport = structuredClone(policy);
  publicExport.supported_surface.public_package_exports = ["codex-app-server-wrapper:createPersistentGateway"];
  assert.throws(() => validate(publicExport), /release-policy\.public-package-export-claim/u);
});

test("release policy rejects missing contract evidence", () => {
  const missing = structuredClone(policy);
  missing.supported_surface.contracts[0].refs = ["missing/cli-contract.md"];
  assert.throws(() => validate(missing), /release-policy\.ref-missing:are-decision-cli/u);
});

test("release policy requires the verified license-requirements evidence", () => {
  const missingRequirements = structuredClone(policy);
  missingRequirements.license_direction.requirements_ref = "missing/license-requirements.json";
  assert.throws(() => validate(missingRequirements), /release-policy\.license-requirements-ref-invalid/u);

  const missingReceipt = structuredClone(policy);
  missingReceipt.license_direction.requirements_receipt_ref = "missing/license-requirements-receipt.json";
  assert.throws(() => validate(missingReceipt), /release-policy\.license-requirements-receipt-ref-invalid/u);
});

test("release policy binds the standalone ARE and Keld commercial identity", () => {
  const legacy = structuredClone(policy);
  legacy.commercial_identity.product_name = "CyberAlchemy Agent Reasoning Engine";
  assert.throws(() => validate(legacy), /release-policy\.commercial-product-name-invalid/u);

  const missingDecision = structuredClone(policy);
  missingDecision.commercial_identity.owner_decision_ref = "missing/owner-decisions.json";
  assert.throws(() => validate(missingDecision), /release-policy\.owner-decision-ref-invalid/u);
});

test("release policy rejects an open-source claim and stale Keld license evidence", () => {
  const openSource = structuredClone(policy);
  openSource.license_direction.open_source_claim = true;
  assert.throws(() => validate(openSource), /release-policy\.open-source-claim-invalid/u);

  const stale = structuredClone(policy);
  stale.license_direction.source_sha256 = "0".repeat(64);
  assert.throws(() => validate(stale), /release-policy\.license-source-drift/u);
});

test("release policy keeps fixes below the resale threshold and services outside the rule", () => {
  const fixesQualify = structuredClone(policy);
  fixesQualify.license_direction.resale_rule_scope.qualifying_changes.push("bug fixes alone");
  assert.throws(() => validate(fixesQualify), /release-policy\.resale-qualifying-changes-invalid/u);

  const hostedCovered = structuredClone(policy);
  hostedCovered.license_direction.resale_rule_scope.outside_rule = ["paid support services"];
  assert.throws(() => validate(hostedCovered), /release-policy\.resale-outside-rule-invalid/u);
});
