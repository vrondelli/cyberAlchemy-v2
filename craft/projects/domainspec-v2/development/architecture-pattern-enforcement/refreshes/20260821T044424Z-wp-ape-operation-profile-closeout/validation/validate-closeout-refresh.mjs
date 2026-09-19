#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    throw new Error(`missing ${name}`);
  }
  return path.resolve(args[index + 1]);
}

const artifactRoot = option("--artifact-root");
const sourceRoot = option("--source-root");
const errors = [];

const runRel = "projects/domainspec-v2/development/refinement-runs/20260820T193401Z-ape-operation-workflow-realization-work-packs";
const candidateRel = `${runRel}/candidates`;
const productRel = "projects/domainspec-v2/development/architecture-pattern-enforcement";
const evidenceRel = `${productRel}/evidence/WP-APE-OP-PROFILE-001`;
const prototypeRel = ".task-session/runs/20260821T041210Z-wp-ape-operation-profile-fast-lane/PROTOTYPE-VALIDATION.json";
const prevalidationRel = `${productRel}/refreshes/20260821T044424Z-wp-ape-operation-profile-closeout/PRE-CLOSEOUT-VALIDATION.json`;
const swuIds = Array.from({ length: 10 }, (_, index) => `SWU-AOP-${String(index + 1).padStart(3, "0")}`);

function requireCondition(condition, message) {
  if (!condition) errors.push(message);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function shaBytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function filePath(relativePath, preferArtifact = true) {
  const staged = path.join(artifactRoot, relativePath);
  if (preferArtifact && fs.existsSync(staged)) return staged;
  return path.join(sourceRoot, relativePath);
}

function readBytes(relativePath, preferArtifact = true) {
  const resolved = filePath(relativePath, preferArtifact);
  requireCondition(fs.existsSync(resolved), `missing file: ${relativePath}`);
  if (!fs.existsSync(resolved)) return Buffer.alloc(0);
  const stat = fs.lstatSync(resolved);
  requireCondition(stat.isFile() && !stat.isSymbolicLink(), `not a regular non-symlink file: ${relativePath}`);
  return fs.readFileSync(resolved);
}

function readJson(relativePath, preferArtifact = true) {
  const bytes = readBytes(relativePath, preferArtifact);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    errors.push(`invalid JSON: ${relativePath}: ${error.message}`);
    return {};
  }
}

function exactRef(relativePath, preferArtifact = true) {
  const bytes = readBytes(relativePath, preferArtifact);
  return { path: relativePath, sha256: shaBytes(bytes), size_bytes: bytes.length };
}

function validateRef(reference, preferArtifact = true, label = "reference") {
  requireCondition(reference && typeof reference === "object", `${label}: reference must be object`);
  if (!reference || typeof reference !== "object") return;
  const actual = exactRef(reference.path, preferArtifact);
  requireCondition(reference.sha256 === actual.sha256, `${label}: digest mismatch: ${reference.path}`);
  requireCondition(reference.size_bytes === actual.size_bytes, `${label}: size mismatch: ${reference.path}`);
}

function exactKeys(value, expected, label) {
  const actual = value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).sort() : [];
  requireCondition(JSON.stringify(actual) === JSON.stringify([...expected].sort()), `${label}: exact-key mismatch`);
}

function validateSelfDigest(receipt, label) {
  const body = { ...receipt };
  delete body.receipt_digest;
  const expected = shaBytes(Buffer.from(canonicalJson(body), "utf8"));
  requireCondition(receipt.receipt_digest === expected, `${label}: self digest mismatch`);
}

const manifest = readJson(`${candidateRel}/SWU-MANIFEST.json`);
const prototype = readJson(prototypeRel, false);
const prevalidation = readJson(prevalidationRel, false);
const operationPack = manifest.work_packs?.find((workPack) => workPack.work_pack_id === "WP-APE-OP-PROFILE-001");
const workflowPack = manifest.work_packs?.find((workPack) => workPack.work_pack_id === "WP-APE-WF-PROFILE-001");
const operationSwus = operationPack?.swus ?? [];
const workflowSwus = workflowPack?.swus ?? [];

requireCondition(manifest.status === "operation-prototype-closed-workflow-blocked", "manifest mixed-frontier status mismatch");
requireCondition(manifest.selected_swu === null, "manifest selected_swu must remain null");
requireCondition(operationSwus.length === 10, "expected ten Operation SWUs");
requireCondition(workflowSwus.length === 11, "expected eleven Workflow SWUs");
requireCondition(operationSwus.every((swu) => swu.handoff_status === "closed-candidate-local"), "all Operation SWUs must be closed-candidate-local");
requireCondition(operationSwus.every((swu) => Array.isArray(swu.blockers) && swu.blockers.length === 0), "closed Operation SWUs cannot retain execution blockers");
requireCondition(workflowSwus.every((swu) => swu.handoff_status === "blocked"), "all Workflow SWUs must remain blocked");
requireCondition(manifest.prototype_closeout?.synchronized_task_session_closeout === false, "manifest must not claim synchronized Task Session closeout");
requireCondition(manifest.prototype_closeout?.profile_admitted === false, "manifest must not claim profile admission");
requireCondition(manifest.prototype_closeout?.selected_subject_result === "fail", "manifest must preserve selected subject fail");
requireCondition(manifest.prototype_closeout?.primary_finding === "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT", "manifest primary finding mismatch");

requireCondition(prototype.work_pack?.result === "prototype-pass-through-swu-aop-010", "prototype work-pack result mismatch");
requireCondition(prototype.validation?.result === "pass", "prototype validation must pass");
requireCondition(prototype.independent_audit?.result === "pass", "prototype independent audit must pass");
requireCondition(prototype.prototype_result?.observed_completion_receipt?.result === "fail", "prototype selected subject result must remain fail");
requireCondition(prototype.prototype_result?.observed_completion_receipt?.primary_failure === "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT", "prototype primary failure mismatch");
requireCondition(prevalidation.result === "pass", "pre-closeout validation must pass");
requireCondition(prevalidation.integrated_suite?.tests_passed === 100, "pre-closeout integrated suite must pass 100 tests");
requireCondition(prevalidation.strict_typescript?.exit_status === 0, "pre-closeout strict TypeScript must pass");

const reportInventory = prototype.product_inventory?.files ?? [];
const reportByPath = new Map(reportInventory.map((entry) => [`${prototype.product_inventory.root}/${entry.path}`, entry]));
const manifestPaths = operationSwus.flatMap((swu) => swu.write_scope);
requireCondition(manifestPaths.length === 24 && new Set(manifestPaths).size === 24, "Operation manifest source scope must be exactly 24 unique paths");
requireCondition(reportByPath.size === 24, "prototype report inventory must contain exactly 24 paths");
requireCondition(JSON.stringify([...new Set(manifestPaths)].sort()) === JSON.stringify([...reportByPath.keys()].sort()), "manifest/report 24-path set mismatch");

for (const [relativePath, entry] of reportByPath) {
  const current = exactRef(relativePath, false);
  requireCondition(current.sha256 === entry.sha256, `prototype product digest drift: ${relativePath}`);
  requireCondition(current.size_bytes === entry.size_bytes, `prototype product size drift: ${relativePath}`);
}

const terminalRefs = [];
const closeoutRefs = [];
for (const swuId of swuIds) {
  const swu = operationSwus.find((candidate) => candidate.swu_id === swuId);
  requireCondition(Boolean(swu), `${swuId}: absent from manifest`);
  if (!swu) continue;

  const terminalPath = `${evidenceRel}/${swuId}-terminal-source.json`;
  const closeoutPath = `${evidenceRel}/${swuId}-closeout.json`;
  const terminal = readJson(terminalPath);
  const closeout = readJson(closeoutPath);

  exactKeys(terminal, [
    "schema_version", "run_id", "work_pack_id", "swu_id", "attempt_id", "idempotency_key",
    "capability_ref", "status", "receipt_kind", "receipt_artifact", "execution_lane",
    "derived_from_consolidated_evidence", "source_evidence", "files_touched", "source_targets",
    "validation", "blockers", "residue", "reroute", "handoff_note", "authority_effect", "receipt_digest",
  ], `${swuId} terminal receipt`);
  requireCondition(terminal.schema_version === "arcanum.task-session-terminal-source-receipt/v1", `${swuId}: terminal schema version mismatch`);
  requireCondition(terminal.work_pack_id === "WP-APE-OP-PROFILE-001" && terminal.swu_id === swuId, `${swuId}: terminal identity mismatch`);
  requireCondition(terminal.status === "pass" && terminal.receipt_kind === "local-fallback", `${swuId}: terminal result/kind mismatch`);
  requireCondition(terminal.receipt_artifact === terminalPath, `${swuId}: terminal self path mismatch`);
  requireCondition(terminal.execution_lane === "candidate-local-prototype-fast-lane", `${swuId}: terminal lane mismatch`);
  requireCondition(terminal.derived_from_consolidated_evidence === true, `${swuId}: terminal derivation flag mismatch`);
  requireCondition(terminal.authority_effect === "none", `${swuId}: terminal authority growth`);
  requireCondition(Array.isArray(terminal.blockers) && terminal.blockers.length === 0, `${swuId}: terminal blockers must be empty`);
  requireCondition(JSON.stringify(terminal.files_touched) === JSON.stringify(swu.write_scope), `${swuId}: terminal write scope mismatch`);
  requireCondition(Array.isArray(terminal.source_targets) && terminal.source_targets.length === swu.write_scope.length, `${swuId}: terminal source target count mismatch`);
  for (let index = 0; index < swu.write_scope.length; index += 1) {
    requireCondition(terminal.source_targets[index]?.path === swu.write_scope[index], `${swuId}: terminal source target order/path mismatch`);
    validateRef(terminal.source_targets[index], false, `${swuId} source target`);
  }
  validateRef(terminal.source_evidence.prototype_validation, false, `${swuId} prototype evidence`);
  validateRef(terminal.validation.contract_ref, false, `${swuId} validation contract`);
  requireCondition(terminal.residue?.synchronized_task_session_closeout === false, `${swuId}: terminal synchronized overclaim`);
  requireCondition(terminal.residue?.profile_admitted === false, `${swuId}: terminal profile-admission overclaim`);
  validateSelfDigest(terminal, `${swuId} terminal receipt`);

  exactKeys(closeout, [
    "schema_version", "receipt_id", "work_pack_id", "swu_id", "owner_identity", "terminal_source_ref",
    "baseline_ref", "work_pack_preimage", "lifecycle_result", "validation_inventory", "successor",
    "authority_effect", "receipt_digest",
  ], `${swuId} closeout receipt`);
  requireCondition(closeout.schema_version === "ape.invoke-refresh-candidate-local-closeout/v1", `${swuId}: closeout schema version mismatch`);
  requireCondition(closeout.work_pack_id === "WP-APE-OP-PROFILE-001" && closeout.swu_id === swuId, `${swuId}: closeout identity mismatch`);
  requireCondition(closeout.owner_identity?.capability === "invoke" && closeout.owner_identity?.mode === "refresh", `${swuId}: closeout owner mismatch`);
  requireCondition(closeout.owner_identity?.mutation_mode === "apply-approved" && closeout.owner_identity?.activation_source === "direct-user", `${swuId}: closeout authorization binding mismatch`);
  requireCondition(closeout.terminal_source_ref?.path === terminalPath, `${swuId}: closeout terminal path mismatch`);
  validateRef(closeout.terminal_source_ref, true, `${swuId} closeout terminal`);
  validateRef(closeout.baseline_ref, false, `${swuId} baseline receipt`);
  requireCondition(closeout.lifecycle_result?.status === "closed-candidate-local", `${swuId}: closeout lifecycle status mismatch`);
  requireCondition(closeout.lifecycle_result?.synchronized_task_session_closeout === false, `${swuId}: closeout synchronized overclaim`);
  requireCondition(closeout.lifecycle_result?.canonical_closeout === false, `${swuId}: closeout canonical overclaim`);
  requireCondition(closeout.lifecycle_result?.profile_admitted === false, `${swuId}: closeout admission overclaim`);
  requireCondition(closeout.lifecycle_result?.authority_effect === "none", `${swuId}: closeout authority growth`);
  requireCondition(closeout.authority_effect === "none", `${swuId}: top-level closeout authority growth`);
  for (const entry of closeout.validation_inventory ?? []) validateRef(entry.evidence_ref, entry.evidence_ref.path.startsWith(evidenceRel), `${swuId} closeout validation`);
  validateSelfDigest(closeout, `${swuId} closeout receipt`);

  const manifestClosure = swu.closure_evidence;
  requireCondition(manifestClosure?.terminal_source_receipt?.path === terminalPath, `${swuId}: manifest terminal closure path mismatch`);
  requireCondition(manifestClosure?.closeout_receipt?.path === closeoutPath, `${swuId}: manifest closeout path mismatch`);
  validateRef(manifestClosure?.terminal_source_receipt, true, `${swuId} manifest terminal`);
  validateRef(manifestClosure?.closeout_receipt, true, `${swuId} manifest closeout`);
  requireCondition(manifestClosure?.synchronized_task_session_closeout === false, `${swuId}: manifest synchronized overclaim`);
  requireCondition(manifestClosure?.authority_effect === "none", `${swuId}: manifest authority growth`);

  terminalRefs.push(exactRef(terminalPath));
  closeoutRefs.push(exactRef(closeoutPath));
}

const verificationPath = `${evidenceRel}/WORK-PACK-VERIFICATION.json`;
const verification = readJson(verificationPath);
exactKeys(verification, [
  "schema_version", "verification_id", "run_id", "work_pack_id", "result", "execution_lane",
  "prototype_validation_ref", "precloseout_validation_ref", "terminal_receipts", "closeout_receipts",
  "product_inventory", "selected_subject_evaluation", "lifecycle_ceiling", "next_route", "authority_effect", "receipt_digest",
], "Work Pack verification receipt");
requireCondition(verification.schema_version === "ape.operation-work-pack-verification/v1", "verification schema version mismatch");
requireCondition(verification.work_pack_id === "WP-APE-OP-PROFILE-001" && verification.result === "pass", "verification identity/result mismatch");
requireCondition(JSON.stringify(verification.terminal_receipts) === JSON.stringify(terminalRefs), "verification terminal inventory mismatch");
requireCondition(JSON.stringify(verification.closeout_receipts) === JSON.stringify(closeoutRefs), "verification closeout inventory mismatch");
requireCondition(verification.product_inventory?.file_count === 24, "verification product file count mismatch");
requireCondition(verification.product_inventory?.ordered_aggregate_sha256 === prototype.product_inventory?.ordered_aggregate?.sha256, "verification product aggregate mismatch");
requireCondition(verification.selected_subject_evaluation?.result === "fail", "verification must preserve selected subject fail");
requireCondition(verification.selected_subject_evaluation?.primary_finding === "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT", "verification primary finding mismatch");
requireCondition(verification.lifecycle_ceiling?.synchronized_task_session_closeout === false, "verification synchronized overclaim");
requireCondition(verification.lifecycle_ceiling?.profile_admitted === false, "verification admission overclaim");
requireCondition(verification.lifecycle_ceiling?.canonical_closeout === false, "verification canonical overclaim");
requireCondition(verification.authority_effect === "none", "verification authority growth");
validateSelfDigest(verification, "Work Pack verification receipt");
validateRef(manifest.prototype_closeout?.verification_receipt, true, "manifest verification receipt");

const operationEntry = readJson(`${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`);
const workflowEntry = readJson(`${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`);
requireCondition(operationEntry.execution_entry?.state === "blocked", "Operation entry must remain terminal-locked in blocked vocabulary");
requireCondition(operationEntry.pre_execution_owner_prerequisite?.lifecycle_state === "closed-candidate-local-with-findings", "Operation entry closure state mismatch");
requireCondition(operationEntry.pre_execution_owner_prerequisite?.reentry_requires_new_refresh === true, "Operation entry must require new refresh for reentry");
requireCondition(workflowEntry.execution_entry?.state === "blocked", "Workflow entry must remain blocked");
requireCondition(workflowEntry.pre_execution_owner_prerequisite?.packet_predecessor?.status === "available-candidate-local", "Workflow packet predecessor must be available candidate-local");
requireCondition(workflowEntry.pre_execution_owner_prerequisite?.workflow_rmt_predecessor?.status === "absent", "Workflow RMT predecessor must remain absent");

const operationMarkdown = readBytes(`${candidateRel}/WORK-PACK-A-OPERATION-PROFILE-EXTENSION.md`).toString("utf8");
const workflowMarkdown = readBytes(`${candidateRel}/WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md`).toString("utf8");
requireCondition(operationMarkdown.includes("candidate-local prototype-closed with findings"), "Operation Work Pack closure wording missing");
requireCondition(operationMarkdown.includes("AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT"), "Operation Work Pack primary finding missing");
requireCondition(operationMarkdown.includes("synchronized Task Session closeout remains false"), "Operation Work Pack lifecycle ceiling missing");
requireCondition(workflowMarkdown.includes("AOP-001 packet prerequisite is now available"), "Workflow Work Pack packet refresh missing");
requireCondition(workflowMarkdown.includes("Workflow RMT predecessor remains absent"), "Workflow Work Pack predecessor blocker missing");

const result = {
  schema_version: "ape.closeout-refresh-validation/v1",
  result: errors.length ? "block" : "pass",
  artifact_root: artifactRoot,
  source_root: sourceRoot,
  counts: {
    product_files: reportByPath.size,
    operation_swus_closed_candidate_local: operationSwus.filter((swu) => swu.handoff_status === "closed-candidate-local").length,
    workflow_swus_blocked: workflowSwus.filter((swu) => swu.handoff_status === "blocked").length,
    terminal_receipts: terminalRefs.length,
    closeout_receipts: closeoutRefs.length,
    verification_receipts: verification.receipt_digest ? 1 : 0,
  },
  selected_subject: {
    result: prototype.prototype_result?.observed_completion_receipt?.result,
    primary_finding: prototype.prototype_result?.observed_completion_receipt?.primary_failure,
  },
  lifecycle_ceiling: {
    synchronized_task_session_closeout: false,
    canonical_closeout: false,
    profile_admitted: false,
    authority_effect: "none",
  },
  errors,
};

console.log(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = errors.length ? 1 : 0;
