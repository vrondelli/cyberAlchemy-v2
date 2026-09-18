#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const repositoryRoot = resolve(productRoot, "../..");
const policyPath = resolve(docsRoot, "release-policy.json");
const receiptPath = resolve(docsRoot, "release-policy-receipt.json");
const candidatePath = resolve(productRoot, "evidence/product-candidate.018.json");
const expectedCategories = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];
const sha256 = value => createHash("sha256").update(value).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

export function validateReleasePolicy(policy, options = {}) {
  const candidate = options.candidate ?? JSON.parse(readFileSync(candidatePath, "utf8"));
  const pathExists = options.pathExists ?? (ref => {
    const path = resolve(repositoryRoot, ref);
    return path.startsWith(`${repositoryRoot}/`) && existsSync(path);
  });
  need(policy?.schema_version === "are.release-policy/v1", "release-policy.schema-version-invalid");
  need(policy.policy_id === "ARE-RELEASE-POLICY-001", "release-policy.id-invalid");
  need(policy.decision_status === "SELECTED_NOT_ACTIVATED", "release-policy.activation-claim-invalid");
  need(policy.authority_effect === "none", "release-policy.authority-effect-invalid");
  need(policy.applies_to?.baseline_candidate_id === candidate.candidate_id, "release-policy.candidate-id-drift");
  need(policy.applies_to?.baseline_candidate_digest === candidate.candidate_digest, "release-policy.candidate-digest-drift");
  need(policy.applies_to?.baseline_source_closure_digest === candidate.source_closure.closure_digest, "release-policy.closure-digest-drift");
  need(policy.applies_to?.first_accepted_successor_version === "0.10.0-rc.1", "release-policy.first-version-invalid");
  need(policy.applies_to?.first_accepted_successor_tag === "v0.10.0-rc.1", "release-policy.first-tag-invalid");
  need(policy.distribution?.kind === "self-contained-source-closure", "release-policy.distribution-invalid");
  need(policy.distribution?.offer_model === "paid-download-of-complete-software", "release-policy.offer-model-invalid");
  need(policy.distribution?.customer_receives === "the complete self-contained ARE successor source closure", "release-policy.customer-scope-invalid");
  need(JSON.stringify(policy.distribution?.excluded_build_and_runtime_dependencies) === JSON.stringify(["Alch", "DomainSpec"]), "release-policy.dependency-exclusions-invalid");
  need(policy.commercial_identity?.product_name === "Agent Reasoning Engine (ARE)", "release-policy.commercial-product-name-invalid");
  need(policy.commercial_identity?.merchant_legal_name === "Keld", "release-policy.merchant-invalid");
  need(policy.commercial_identity?.copyright_owner === "Vladimir Rondelli", "release-policy.copyright-owner-invalid");
  need(!/cyber\s*alchemy/iu.test(JSON.stringify(policy.commercial_identity)), "release-policy.legacy-commercial-identity");
  need(policy.commercial_identity?.owner_decision_ref === "implementation/agent-reasoning-engine/docs/release-owner-decisions.json", "release-policy.owner-decision-ref-invalid");
  need(pathExists(policy.commercial_identity.owner_decision_ref), "release-policy.owner-decision-missing");
  need(policy.commercial_identity?.owner_decision_receipt_ref === "implementation/agent-reasoning-engine/docs/release-owner-decisions-receipt.json", "release-policy.owner-decision-receipt-ref-invalid");
  need(pathExists(policy.commercial_identity.owner_decision_receipt_ref), "release-policy.owner-decision-receipt-missing");
  need(policy.license_direction?.status === "CANDIDATE_TERMS_LEGAL_TEXT_REQUIRED", "release-policy.license-status-invalid");
  need(policy.license_direction?.license_family === "custom-source-available", "release-policy.license-family-invalid");
  need(policy.license_direction?.source_ref === "keld-project/docs/LICENSE-PAYMENT-RESEARCH.md", "release-policy.license-source-invalid");
  need(pathExists(policy.license_direction.source_ref), "release-policy.license-source-missing");
  const licenseSourcePath = resolve(repositoryRoot, policy.license_direction.source_ref);
  need(policy.license_direction?.source_sha256 === sha256(readFileSync(licenseSourcePath)), "release-policy.license-source-drift");
  need(policy.license_direction?.requirements_ref === "implementation/agent-reasoning-engine/docs/license-requirements.json", "release-policy.license-requirements-ref-invalid");
  need(pathExists(policy.license_direction.requirements_ref), "release-policy.license-requirements-missing");
  need(policy.license_direction?.requirements_receipt_ref === "implementation/agent-reasoning-engine/docs/license-requirements-receipt.json", "release-policy.license-requirements-receipt-ref-invalid");
  need(pathExists(policy.license_direction.requirements_receipt_ref), "release-policy.license-requirements-receipt-missing");
  need(JSON.stringify(policy.license_direction?.permissions) === JSON.stringify(["use", "copy", "modify", "share", "commercial-use"]), "release-policy.license-permissions-invalid");
  need(policy.license_direction?.resale_rule === "Selling a redistributed software copy requires an added function or integration.", "release-policy.resale-rule-invalid");
  need(policy.license_direction?.resale_rule_scope?.covered_activity === "sale of redistributed software copies", "release-policy.resale-covered-activity-invalid");
  need(JSON.stringify(policy.license_direction?.resale_rule_scope?.qualifying_changes) === JSON.stringify(["added working function", "added working integration"]), "release-policy.resale-qualifying-changes-invalid");
  need(JSON.stringify(policy.license_direction?.resale_rule_scope?.non_qualifying_changes) === JSON.stringify(["cosmetic edits", "renaming", "bug fixes alone"]), "release-policy.resale-non-qualifying-changes-invalid");
  need(JSON.stringify(policy.license_direction?.resale_rule_scope?.outside_rule) === JSON.stringify(["hosted access", "paid support services"]), "release-policy.resale-outside-rule-invalid");
  need(policy.license_direction?.open_source_claim === false, "release-policy.open-source-claim-invalid");
  need(typeof policy.license_direction?.finalization_gate === "string" && policy.license_direction.finalization_gate.length > 0, "release-policy.license-finalization-gate-missing");
  need(Array.isArray(policy.supported_surface?.contracts) && policy.supported_surface.contracts.length === 2, "release-policy.contract-count-invalid");
  const contractIds = policy.supported_surface.contracts.map(item => item.contract_id).sort();
  need(JSON.stringify(contractIds) === JSON.stringify(["are-decision-cli", "are-json-lines-process-backend-adapter"]), "release-policy.contract-identities-invalid");
  for (const contract of policy.supported_surface.contracts) {
    need(contract.support_class === "supported-on-first-accepted-successor", `release-policy.support-class-invalid:${contract.contract_id}`);
    need(Array.isArray(contract.refs) && contract.refs.length > 0, `release-policy.refs-empty:${contract.contract_id}`);
    for (const ref of contract.refs) need(pathExists(ref), `release-policy.ref-missing:${contract.contract_id}:${ref}`);
  }
  need(policy.supported_surface.javascript_package_imports === "candidate-internal", "release-policy.package-import-posture-invalid");
  need(Array.isArray(policy.supported_surface.public_package_exports) && policy.supported_surface.public_package_exports.length === 0, "release-policy.public-package-export-claim");
  need(policy.version_policy?.scheme === "Semantic Versioning 2.0.0 prerelease", "release-policy.version-scheme-invalid");
  need(policy.version_policy?.tag_pattern === "v{version}", "release-policy.tag-pattern-invalid");
  need(policy.version_policy?.candidate_ids_are_release_versions === false, "release-policy.candidate-release-conflation");
  need(JSON.stringify(policy.change_policy?.categories) === JSON.stringify(expectedCategories), "release-policy.change-categories-invalid");
  for (const field of ["corrections", "deprecation_window", "security_exception"]) need(typeof policy.change_policy?.[field] === "string" && policy.change_policy[field].length > 0, `release-policy.change-field-missing:${field}`);
  need(Array.isArray(policy.activation_gates) && policy.activation_gates.length >= 4, "release-policy.activation-gates-incomplete");
  need(typeof policy.claim_limit === "string" && policy.claim_limit.length > 0, "release-policy.claim-limit-missing");
  return Object.freeze({contract_count: policy.supported_surface.contracts.length, first_version: policy.applies_to.first_accepted_successor_version, first_tag: policy.applies_to.first_accepted_successor_tag, offer_model: policy.distribution.offer_model, license_status: policy.license_direction.status});
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildReceipt(bytes, result) {
  return {
    schema_version: "are.release-policy-receipt/v1",
    policy_id: "ARE-RELEASE-POLICY-001",
    status: "PASS",
    policy_sha256: sha256(bytes),
    candidate_id: "ARE-PRODUCT-CANDIDATE-018",
    contract_count: result.contract_count,
    first_accepted_successor_version: result.first_version,
    first_accepted_successor_tag: result.first_tag,
    offer_model: result.offer_model,
    license_status: result.license_status,
    activation_status: "SELECTED_NOT_ACTIVATED",
    claim_limit: "PASS verifies the selected commercial release policy, candidate Keld license direction, and source references. It does not execute legal terms, accept payment, create, tag, sign, publish, deliver, deploy, or activate a release.",
    authority_effect: "none"
  };
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:verify-release-policy [--check|--write]");
  const bytes = readFileSync(policyPath);
  const result = validateReleasePolicy(JSON.parse(bytes));
  const receipt = buildReceipt(bytes, result);
  const receiptBytes = stableJson(receipt);
  if (mode === "--write") writeFileSync(receiptPath, receiptBytes);
  else {
    need(existsSync(receiptPath), "release-policy.receipt-missing");
    need(readFileSync(receiptPath, "utf8") === receiptBytes, "release-policy.receipt-drift");
  }
  process.stdout.write(stableJson({...receipt, mode}));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
