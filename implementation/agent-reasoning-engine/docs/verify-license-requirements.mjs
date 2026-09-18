#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const repositoryRoot = resolve(productRoot, "../..");
const requirementsPath = resolve(docsRoot, "license-requirements.json");
const receiptPath = resolve(docsRoot, "license-requirements-receipt.json");
const candidatePath = resolve(productRoot, "evidence/product-candidate.018.json");
const sha256 = value => createHash("sha256").update(value).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

function repositoryPath(candidatePathValue) {
  return resolve(repositoryRoot, candidatePathValue.replace(/^cyberAlchemy-v2\//u, ""));
}

function currentClosureInventory(candidate) {
  const paths = candidate.source_closure.files.map(file => file.path);
  const packagePaths = paths.filter(path => path.endsWith("/package.json"));
  let declaredLicenses = 0;
  let dependencyEdges = 0;
  for (const path of packagePaths) {
    const manifest = JSON.parse(readFileSync(repositoryPath(path), "utf8"));
    if (typeof manifest.license === "string" && manifest.license.length > 0) declaredLicenses += 1;
    for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) dependencyEdges += Object.keys(manifest[field] ?? {}).length;
  }
  return {
    package_manifest_count: packagePaths.length,
    package_manifests_with_declared_license: declaredLicenses,
    declared_npm_dependency_edges: dependencyEdges,
    license_or_notice_file_count: paths.filter(path => /(?:^|\/)(?:LICENSE|LICENCE|NOTICE)(?:\.|$)/iu.test(path)).length,
    cargo_manifest_or_lock_count: paths.filter(path => /(?:^|\/)Cargo\.(?:toml|lock)$/u.test(path)).length
  };
}

export function validateLicenseRequirements(requirements, options = {}) {
  const candidate = options.candidate ?? JSON.parse(readFileSync(candidatePath, "utf8"));
  const readSource = options.readSource ?? (ref => readFileSync(resolve(repositoryRoot, ref)));
  need(requirements?.schema_version === "are.commercial-license-requirements/v2", "license-requirements.schema-version-invalid");
  need(requirements.requirements_id === "ARE-COMMERCIAL-LICENSE-REQUIREMENTS-001", "license-requirements.id-invalid");
  need(requirements.status === "REQUIREMENTS_CANDIDATE", "license-requirements.status-invalid");
  need(requirements.authority_effect === "none", "license-requirements.authority-effect-invalid");
  need(requirements.applies_to?.candidate_id === candidate.candidate_id, "license-requirements.candidate-id-drift");
  need(requirements.applies_to?.candidate_digest === candidate.candidate_digest, "license-requirements.candidate-digest-drift");
  need(requirements.applies_to?.source_closure_digest === candidate.source_closure.closure_digest, "license-requirements.closure-digest-drift");
  need(requirements.applies_to?.source_file_count === candidate.source_closure.files.length, "license-requirements.file-count-drift");
  for (const source of [requirements.owner_decision_source, requirements.owner_decision_record, requirements.historical_notice_audit]) {
    need(typeof source?.path === "string" && source.path.length > 0, "license-requirements.source-path-missing");
    const bytes = readSource(source.path);
    need(source.sha256 === sha256(bytes), `license-requirements.source-drift:${source.path}`);
  }
  const ownerDecisions = JSON.parse(readSource(requirements.owner_decision_record.path));
  need(requirements.owner_decision_record?.status === "OWNER_DECISIONS_RECORDED", "license-requirements.owner-decisions-status-invalid");
  need(ownerDecisions.status === "OWNER_DECISIONS_RECORDED", "license-requirements.owner-decisions-source-status-invalid");
  need(requirements.commercial_identity?.product_name === ownerDecisions.commercial_identity.product_name, "license-requirements.commercial-identity-drift");
  need(requirements.commercial_identity?.merchant_legal_name === "Keld", "license-requirements.merchant-invalid");
  need(!/cyber\s*alchemy/iu.test(JSON.stringify(requirements.commercial_identity)), "license-requirements.legacy-commercial-identity");
  need(requirements.current_source_rights_inventory?.status === "TECHNICAL_INVENTORY_COMPLETE_RIGHTS_REVIEW_PENDING", "license-requirements.rights-inventory-status-invalid");
  const rightsBytes = readSource(requirements.current_source_rights_inventory.path);
  need(requirements.current_source_rights_inventory.sha256 === sha256(rightsBytes), "license-requirements.rights-inventory-drift");
  const rightsInventory = JSON.parse(rightsBytes);
  need(rightsInventory.applies_to?.candidate_id === candidate.candidate_id, "license-requirements.rights-inventory-candidate-drift");
  need(rightsInventory.summary?.file_count === candidate.source_closure.files.length, "license-requirements.rights-inventory-coverage-drift");
  need(rightsInventory.owner_assertion?.copyright_owner === ownerDecisions.commercial_identity.copyright_owner, "license-requirements.rights-owner-drift");
  const rightsReceiptBytes = readSource(requirements.current_source_rights_inventory.receipt_path);
  need(requirements.current_source_rights_inventory.receipt_sha256 === sha256(rightsReceiptBytes), "license-requirements.rights-receipt-drift");
  need(requirements.customer_delivery?.offer === "paid download of the complete self-contained ARE software", "license-requirements.offer-invalid");
  need(requirements.customer_delivery?.delivered_scope === "the complete accepted successor source closure", "license-requirements.delivery-scope-invalid");
  need(JSON.stringify(requirements.permission_intent) === JSON.stringify(["use", "copy", "modify", "share", "commercial-use"]), "license-requirements.permissions-invalid");
  need(JSON.stringify(requirements.resale_rule?.qualifying_changes) === JSON.stringify(["added working function", "added working integration"]), "license-requirements.qualifying-changes-invalid");
  need(JSON.stringify(requirements.resale_rule?.non_qualifying_changes) === JSON.stringify(["cosmetic edits", "renaming", "bug fixes alone"]), "license-requirements.non-qualifying-changes-invalid");
  need(JSON.stringify(requirements.resale_rule?.outside_rule) === JSON.stringify(["hosted access", "paid support services"]), "license-requirements.outside-rule-invalid");
  const actualInventory = currentClosureInventory(candidate);
  for (const [field, value] of Object.entries(actualInventory)) need(requirements.current_closure_inventory?.[field] === value, `license-requirements.inventory-drift:${field}`);
  need(requirements.historical_notice_audit?.disposition === "HISTORICAL_DIFFERENT_CLOSURE", "license-requirements.historical-audit-conflation");
  need(Array.isArray(requirements.required_customer_release_materials) && requirements.required_customer_release_materials.length === 5, "license-requirements.release-materials-incomplete");
  need(Array.isArray(requirements.resolved_owner_decisions) && requirements.resolved_owner_decisions.length === 8, "license-requirements.resolved-decisions-incomplete");
  need(Array.isArray(requirements.remaining_qualified_review_requirements) && requirements.remaining_qualified_review_requirements.length === 2, "license-requirements.qualified-review-incomplete");
  need(typeof requirements.activation_rule === "string" && requirements.activation_rule.length > 0, "license-requirements.activation-rule-missing");
  need(typeof requirements.claim_limit === "string" && requirements.claim_limit.length > 0, "license-requirements.claim-limit-missing");
  return Object.freeze({inventory: actualInventory, resolved_count: requirements.resolved_owner_decisions.length, qualified_review_count: requirements.remaining_qualified_review_requirements.length});
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function receipt(bytes, validation) {
  return {
    schema_version: "are.commercial-license-requirements-receipt/v2",
    requirements_id: "ARE-COMMERCIAL-LICENSE-REQUIREMENTS-001",
    status: "PASS",
    requirements_sha256: sha256(bytes),
    candidate_id: "ARE-PRODUCT-CANDIDATE-018",
    current_closure_inventory: validation.inventory,
    resolved_owner_decision_count: validation.resolved_count,
    remaining_qualified_review_count: validation.qualified_review_count,
    activation_status: "BLOCKED_PENDING_EXACT_LEGAL_AND_RIGHTS_REVIEW",
    claim_limit: "PASS verifies resolved intent, source digests, and Candidate 018 closure inventory. It is not legal text, rights clearance, sale approval, or a license grant.",
    authority_effect: "none"
  };
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:verify-license-requirements [--check|--write]");
  const bytes = readFileSync(requirementsPath);
  const validation = validateLicenseRequirements(JSON.parse(bytes));
  const value = receipt(bytes, validation);
  const receiptBytes = stableJson(value);
  if (mode === "--write") writeFileSync(receiptPath, receiptBytes);
  else {
    need(existsSync(receiptPath), "license-requirements.receipt-missing");
    need(readFileSync(receiptPath, "utf8") === receiptBytes, "license-requirements.receipt-drift");
  }
  process.stdout.write(stableJson({...value, mode}));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
