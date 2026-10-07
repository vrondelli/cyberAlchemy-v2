#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {inspectProduct, materializeProductClosure} from "../../src/product.mjs";
import {materializeProductTestPlan} from "../../src/product-test-plan.mjs";

const qualificationRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const qualificationPath = resolve(qualificationRoot, "qualification.json");
const defaultPortabilityReceiptPath = resolve(qualificationRoot, "../../docs/releases/0.10.0-rc.1-portability-receipt.json");
const defaultCompositionReceiptPath = resolve(qualificationRoot, "../../docs/releases/0.10.0-rc.1-optional-module-composition-receipt.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function exactKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function unique(values) {
  return [...new Set(values)].sort();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validateLifecycleReceipt(candidate) {
  const reasons = [];
  try {
    const receipt = readJson(resolve(qualificationRoot, "../../docs/releases/0.10.0-rc.1-lifecycle-receipt.json"));
    const material = {...receipt};
    delete material.receipt_digest;
    if (receipt.schema_version !== "are.source-distribution-lifecycle-receipt/v2") reasons.push("lifecycle.schema-version-invalid");
    if (receipt.status !== "PASS") reasons.push("lifecycle.not-pass");
    if (receipt.receipt_digest !== sha256(JSON.stringify(material))) reasons.push("lifecycle.receipt-digest-invalid");
    if (receipt.candidate?.candidate_id !== candidate.candidate_id
      || receipt.candidate?.candidate_digest !== candidate.candidate_digest
      || receipt.candidate?.closure_digest !== candidate.source_closure.closure_digest) reasons.push("lifecycle.candidate-binding-invalid");
    if (receipt.artifact?.reproducibility_runs !== 2 || receipt.artifact?.emitted !== true) reasons.push("lifecycle.reproducibility-invalid");
    if (receipt.lifecycle?.install?.status !== "PASS"
      || receipt.lifecycle?.start_and_health?.status !== "PASS"
      || receipt.lifecycle?.reconnect_stop_restart?.status !== "PASS"
      || receipt.lifecycle?.failure_injection?.status !== "EXPECTED_FAILURE"
      || receipt.lifecycle?.rollback_and_restore?.status !== "PASS"
      || receipt.lifecycle?.uninstall?.status !== "PASS"
      || receipt.lifecycle?.durable_store_backup_restore?.status !== "PASS") reasons.push("lifecycle.checks-incomplete");
    if (receipt.retention?.storage_class !== "repository-local-compressed-canonical"
      || receipt.retention?.external_replication !== "NOT_RUN") reasons.push("lifecycle.retention-invalid");
    const archivePath = resolve(qualificationRoot, "../..", receipt.retention.artifact_path.replace("implementation/agent-reasoning-engine/", ""));
    const archive = readFileSync(archivePath);
    if (archive.byteLength !== receipt.artifact?.bytes || sha256(archive) !== receipt.artifact?.sha256) reasons.push("lifecycle.artifact-invalid");
  } catch {
    reasons.push("lifecycle.receipt-or-artifact-unreadable");
  }
  return unique(reasons);
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith("--")) {
    throw new Error(`argument.value-required:${name}`);
  }
  return process.argv[index + 1];
}

function validatePortabilityReceipt(path, closureDigest) {
  if (!path) return {status: "BLOCK", reason_codes: ["portability.receipt-not-supplied"]};
  let receipt;
  try { receipt = readJson(resolve(path)); }
  catch { return {status: "BLOCK", reason_codes: ["portability.receipt-unreadable"]}; }
  const reasons = [];
  if (!exactKeys(receipt, [
    "schema_version", "status", "source_closure_digest", "packaged_artifact_mode",
    "git_checkout_context", "reason_codes", "claim_limit", "authority_effect",
  ])) reasons.push("portability.receipt-shape-invalid");
  if (receipt.schema_version !== "are.portability-qualification/v1") reasons.push("portability.schema-version-invalid");
  if (receipt.status !== "PASS") reasons.push("portability.not-pass");
  if (receipt.source_closure_digest !== closureDigest) reasons.push("portability.source-closure-mismatch");
  if (receipt.packaged_artifact_mode !== "0555-exact") reasons.push("portability.packaged-mode-not-exact");
  if (receipt.git_checkout_context !== "separate-named-fail-closed") reasons.push("portability.git-context-invalid");
  if (!Array.isArray(receipt.reason_codes) || receipt.reason_codes.length !== 0) reasons.push("portability.reason-codes-present");
  if (receipt.authority_effect !== "none") reasons.push("portability.authority-effect-invalid");
  return {status: reasons.length === 0 ? "PASS" : "BLOCK", reason_codes: unique(reasons)};
}

function validateCompositionReceipt(path, candidate) {
  if (!path) return {status: "BLOCK", reason_codes: ["composition.receipt-not-supplied"]};
  let receipt;
  try { receipt = readJson(resolve(path)); }
  catch { return {status: "BLOCK", reason_codes: ["composition.receipt-unreadable"]}; }
  const reasons = [];
  const material = {...receipt};
  delete material.receipt_digest;
  if (!exactKeys(receipt, [
    "schema_version", "status", "candidate", "execution", "modules", "fail_closed",
    "reason_codes", "claim_limit", "authority_effect", "receipt_digest",
  ])) reasons.push("composition.receipt-shape-invalid");
  if (receipt.schema_version !== "are.optional-module-composition-qualification/v1") reasons.push("composition.schema-version-invalid");
  if (receipt.status !== "PASS") reasons.push("composition.not-pass");
  if (receipt.receipt_digest !== sha256(JSON.stringify(material))) reasons.push("composition.receipt-digest-invalid");
  if (receipt.candidate?.candidate_id !== candidate.candidate_id
    || receipt.candidate?.candidate_digest !== candidate.candidate_digest
    || receipt.candidate?.source_closure_digest !== candidate.source_closure.closure_digest) reasons.push("composition.candidate-binding-invalid");
  if (receipt.execution?.mode !== "single-synthetic-turn"
    || receipt.execution?.provider_calls !== 0
    || receipt.execution?.external_effects !== 0) reasons.push("composition.execution-posture-invalid");
  for (const name of ["semantic_evaluation", "evolution_signals", "intent_compilation", "cache_telemetry"]) {
    if (receipt.modules?.[name]?.status !== "PASS") reasons.push(`composition.module-not-pass:${name}`);
  }
  for (const name of ["invalid_semantic_input", "mismatched_cache_identity", "missing_required_observation"]) {
    if (receipt.fail_closed?.[name] !== "PASS") reasons.push(`composition.fail-closed-check-not-pass:${name}`);
  }
  if (!Array.isArray(receipt.reason_codes) || receipt.reason_codes.length !== 0) reasons.push("composition.reason-codes-present");
  if (receipt.authority_effect !== "none") reasons.push("composition.authority-effect-invalid");
  return {status: reasons.length === 0 ? "PASS" : "BLOCK", reason_codes: unique(reasons)};
}

function compareWithCandidate018(currentClosure) {
  const candidate = readJson(resolve(qualificationRoot, "../../evidence/product-candidate.018.json"));
  const frozenClosure = candidate.source_closure;
  const frozen = new Map(frozenClosure.files.map((file) => [file.path, file]));
  const current = new Map(currentClosure.files.map((file) => [file.path, file]));
  const added = [...current.keys()].filter((path) => !frozen.has(path)).sort();
  const removed = [...frozen.keys()].filter((path) => !current.has(path)).sort();
  const contentChanged = [];
  const modeOnlyChanged = [];
  for (const [path, observed] of current) {
    const expected = frozen.get(path);
    if (!expected) continue;
    if (observed.sha256 !== expected.sha256 || observed.bytes !== expected.bytes) contentChanged.push(path);
    else if (observed.mode !== expected.mode) modeOnlyChanged.push(path);
  }
  return {
    candidate_id: candidate.candidate_id,
    candidate_digest: candidate.candidate_digest,
    closure_digest: frozenClosure.closure_digest,
    file_count: frozenClosure.files.length,
    total_bytes: frozenClosure.files.reduce((sum, file) => sum + file.bytes, 0),
    added_paths: added,
    removed_paths: removed,
    content_changed_paths: contentChanged.sort(),
    mode_only_changed_paths: modeOnlyChanged.sort(),
  };
}

export function validateQualification({portabilityReceiptPath = defaultPortabilityReceiptPath, compositionReceiptPath = defaultCompositionReceiptPath} = {}) {
  const reasons = [];
  let qualification;
  try { qualification = readJson(qualificationPath); }
  catch { return {schema_version: "are.successor-qualification-validation/v1", package_status: "BLOCK", qualification_status: "BLOCK", reason_codes: ["qualification.unreadable"], authority_effect: "none"}; }

  if (!exactKeys(qualification, [
    "schema_version", "qualification_id", "status", "product_id", "reported_product_version",
    "successor_identity", "source_observation", "candidate_018_comparison", "source_drift",
    "documentation_findings", "gates", "archive_retention_requirements", "claim_limit",
    "product_approval", "authority_effect",
  ])) reasons.push("qualification.shape-invalid");
  if (qualification.schema_version !== "are.successor-qualification/v1") reasons.push("qualification.schema-version-invalid");
  if (qualification.status !== "candidate-working-evidence") reasons.push("qualification.status-invalid");
  if (qualification.successor_identity?.version !== "0.10.0-rc.1"
    || qualification.successor_identity?.status !== "frozen-testable-candidate"
    || qualification.successor_identity?.candidate_id !== "ARE-PRODUCT-CANDIDATE-020") reasons.push("qualification.successor-identity-invalid");
  if (qualification.authority_effect !== "none") reasons.push("qualification.authority-effect-invalid");
  if (qualification.product_approval?.status !== "not-requested" || qualification.product_approval?.bound_digest !== null) reasons.push("qualification.approval-posture-invalid");

  const closure = materializeProductClosure();
  const successor = readJson(resolve(qualificationRoot, "../../evidence/product-candidate.020.json"));
  if (successor.candidate_id !== qualification.successor_identity?.candidate_id
    || successor.source_closure?.closure_digest !== closure.closure_digest) reasons.push("qualification.successor-candidate-binding-invalid");
  reasons.push(...validateLifecycleReceipt(successor));
  if (closure.closure_digest !== qualification.source_observation?.closure_digest) reasons.push("qualification.source-closure-drift");
  if (closure.files.length !== qualification.source_observation?.file_count) reasons.push("qualification.source-file-count-drift");
  const totalBytes = closure.files.reduce((sum, file) => sum + file.bytes, 0);
  if (totalBytes !== qualification.source_observation?.total_bytes) reasons.push("qualification.source-byte-count-drift");

  const comparison = compareWithCandidate018(closure);
  if (comparison.candidate_id !== qualification.candidate_018_comparison?.candidate_id
    || comparison.candidate_digest !== qualification.candidate_018_comparison?.candidate_digest
    || comparison.closure_digest !== qualification.candidate_018_comparison?.closure_digest
    || comparison.file_count !== qualification.candidate_018_comparison?.file_count
    || comparison.total_bytes !== qualification.candidate_018_comparison?.total_bytes) reasons.push("qualification.candidate-018-binding-invalid");
  if (JSON.stringify(comparison.added_paths) !== JSON.stringify([...(qualification.source_drift?.added_paths ?? [])].sort())) reasons.push("qualification.added-path-drift");
  if (JSON.stringify(comparison.removed_paths) !== JSON.stringify([...(qualification.source_drift?.removed_paths ?? [])].sort())) reasons.push("qualification.removed-path-drift");
  if (JSON.stringify(comparison.content_changed_paths) !== JSON.stringify([...(qualification.source_drift?.content_changed_paths ?? [])].sort())) reasons.push("qualification.content-changed-path-drift");
  if (JSON.stringify(comparison.mode_only_changed_paths) !== JSON.stringify([...(qualification.source_drift?.mode_only_changed_paths ?? [])].sort())) reasons.push("qualification.mode-only-path-drift");
  if (comparison.added_paths.length !== qualification.source_drift?.added_count
    || comparison.removed_paths.length !== qualification.source_drift?.removed_count
    || comparison.content_changed_paths.length !== qualification.source_drift?.content_changed_count
    || comparison.mode_only_changed_paths.length !== qualification.source_drift?.mode_only_changed_count) reasons.push("qualification.source-drift-count-invalid");

  const health = inspectProduct({require_exact_runtime: true});
  if (health.status !== "PASS") reasons.push(...health.reason_codes.map((reason) => `product-health.${reason}`));
  if (health.components.length === 0 || health.components.some((component) => !component.present)) reasons.push("product-health.component-set-invalid");
  if (health.integrations.length !== 2 || health.integrations.some((integration) => !integration.present)) reasons.push("product-health.integration-set-invalid");

  const plan = materializeProductTestPlan();
  if (plan.source_closure_digest !== closure.closure_digest) reasons.push("test-plan.source-closure-mismatch");
  if (plan.suites.length === 0) reasons.push("test-plan.suite-count-invalid");
  if (plan.unowned_test_files.length !== 0) reasons.push("test-plan.unowned-test-files");

  const expectedGates = [
    "source-closure-stable", "product-health", "portability", "full-product-tests-isolated",
    "optional-modules-composed", "documentation-current", "archive-lifecycle-and-retention",
    "product-owner-approval",
  ];
  const gateIds = qualification.gates?.map((gate) => gate.gate_id) ?? [];
  if (JSON.stringify([...gateIds].sort()) !== JSON.stringify([...expectedGates].sort())) reasons.push("qualification.gate-set-invalid");
  if (qualification.gates?.some((gate) => !["PASS", "BLOCK", "NOT_REQUESTED"].includes(gate.status))) reasons.push("qualification.gate-status-invalid");
  if (!(qualification.documentation_findings ?? []).length) reasons.push("qualification.documentation-findings-incomplete");
  if (!(qualification.archive_retention_requirements?.candidate_018?.length > 0)
    || !(qualification.archive_retention_requirements?.successor?.length > 0)) reasons.push("qualification.archive-retention-incomplete");

  const portability = validatePortabilityReceipt(portabilityReceiptPath, closure.closure_digest);
  const composition = validateCompositionReceipt(compositionReceiptPath, successor);
  const effectiveGates = (qualification.gates ?? []).map((gate) => {
    if (gate.gate_id === "portability") return {
      ...gate,
      status: portability.status,
      evidence: portability.status === "PASS"
        ? `Validated external portability receipt: ${resolve(portabilityReceiptPath)}`
        : "A closure-bound portability receipt is missing or invalid.",
    };
    if (gate.gate_id === "optional-modules-composed") return {
      ...gate,
      status: composition.status,
      evidence: composition.status === "PASS"
        ? `Validated optional-module composition receipt: ${resolve(compositionReceiptPath)}`
        : "A closure-bound optional-module composition receipt is missing or invalid.",
    };
    return gate;
  });
  const blockingGates = effectiveGates.filter((gate) => gate.required && gate.status !== "PASS").map((gate) => gate.gate_id).sort();

  return {
    schema_version: "are.successor-qualification-validation/v1",
    package_status: reasons.length === 0 ? "PASS" : "BLOCK",
    qualification_status: reasons.length === 0 && blockingGates.length === 0 ? "PASS" : "BLOCK",
    qualification_id: qualification.qualification_id ?? null,
    current_source_closure: {
      closure_digest: closure.closure_digest,
      file_count: closure.files.length,
      total_bytes: totalBytes,
    },
    product_health: {
      status: health.status,
      component_count: health.components.length,
      integration_count: health.integrations.length,
    },
    test_plan: {
      plan_digest: plan.plan_digest,
      suite_count: plan.suites.length,
      test_file_count: plan.suites.reduce((sum, suite) => sum + suite.test_refs.length, 0),
      unowned_test_file_count: plan.unowned_test_files.length,
    },
    portability,
    optional_module_composition: composition,
    blocking_gates: blockingGates,
    reason_codes: unique(reasons),
    claim_limit: qualification.claim_limit ?? null,
    authority_effect: "none",
  };
}

let result;
try {
  result = validateQualification({
    portabilityReceiptPath: argumentValue("--portability-receipt") ?? defaultPortabilityReceiptPath,
    compositionReceiptPath: argumentValue("--composition-receipt") ?? defaultCompositionReceiptPath,
  });
} catch (error) {
  result = {
    schema_version: "are.successor-qualification-validation/v1",
    package_status: "BLOCK",
    qualification_status: "BLOCK",
    reason_codes: [error instanceof Error ? error.message : "qualification.validation-error"],
    authority_effect: "none",
  };
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.package_status === "PASS" ? 0 : 1;
