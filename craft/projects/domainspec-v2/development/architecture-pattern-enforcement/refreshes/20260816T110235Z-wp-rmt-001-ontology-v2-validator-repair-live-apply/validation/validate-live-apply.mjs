#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(process.argv[2] ?? process.cwd());
const validationDir = dirname(fileURLToPath(import.meta.url));
const evidenceRoot = resolve(validationDir, "..");
const evidenceRootRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T110235Z-wp-rmt-001-ontology-v2-validator-repair-live-apply";
const decisionRootRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260815T221417Z-wp-rmt-002-validator-repair-acceptance-decision";
const repairRootRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260815T214711Z-wp-rmt-001-ontology-v2-validator-repair-package";
const targetRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/validation/validate-apply-package.mjs";
const stagedRelative = `${repairRootRelative}/material/staged/${targetRelative}`;
const ordinaryRelative = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs";

const expected = {
  repairReceipt: { sha256: "dda3c156f86f3813311892bc8f04e969f669b65171f7a16d79da41cf1a2beb18", size_bytes: 11886 },
  repairInventory: { sha256: "f215bfcc08ac47c70e11ab0a27c32dc23ed04a48788ef1dae76ff4442e1ecfb7", file_count: 19, total_size_bytes: 401389 },
  targetInventorySha256: "817ef12b2ae3261b578b82570423ca984fd786363cd1488becabf1e9f3f04bb0",
  target: { sha256: "985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c", size_bytes: 149370 },
  liveStdout: { sha256: "cd5354e1a7fa17f7230e9316ee21202a5425f3dedfc05cbdc1604b9512bb12fc", size_bytes: 8951 },
  ordinaryStdout: { sha256: "9fcc614912fc9c3c3f4ea49f28aabbff507f7839c0e9e8205292b7f3a5927dc2", size_bytes: 15468 }
};

const evidenceBindings = [
  { path: "PRE-APPLY-VALIDATION.json", sha256: "bcda105f66fbe578a9e961e52bc6bd3af96264ba6ba365d68b2677bfb00d9290", size_bytes: 3375 },
  { path: "POST-APPLY-VALIDATION.json", sha256: "8dd1da5350a242b6e3bfa87b064c097ffc2db9116a223a443b696121637e8494", size_bytes: 3409 },
  { path: "live-replay.stdout.json", ...expected.liveStdout },
  { path: "ordinary-live-validator.stdout.json", ...expected.ordinaryStdout },
  { path: "refresh-report.json", sha256: "47d74efa8a91f9113256b127b03991663e98ae7671f9bcca2f7ef476bf8f0168", size_bytes: 5073 },
  { path: "REFRESH-REPORT.md", sha256: "6e5b0f7868ea092ce1b1990b5fe75030af80212de5a31bddbe40f999e918b460", size_bytes: 2450 }
];

const liveBaselines = [
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/schema/architecture-property-ontology-v2.schema.json", sha256: "d616095d63a656af121df2ebc41cd9e6cd3e88d7fd3b6f3edebf50a9a2252f59", size_bytes: 43684 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/schema/promotion-record-v1.schema.json", sha256: "9e1e144308ccaadbfc71fe9e7004f68fef82da3860fc13c2cae9fd4c29fcb86f", size_bytes: 11066 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json", sha256: "6cd5a46c8d51c3c88f16a5ee483e190c6225e5aebeffbb909070ad6cac44169a", size_bytes: 151653 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json", sha256: "43afaa7532614ddc1894b1d4760cb434792964295b1ec637e9ddcbf74f052323", size_bytes: 34206 },
  { path: ordinaryRelative, sha256: "3de34afb076339bce71b7a935a4bd7295df878cdc0c9e529600ce7f0803d9dbc", size_bytes: 169605 }
];

const requiredEvidenceFiles = [
  "POST-APPLY-VALIDATION.json",
  "PRE-APPLY-VALIDATION.json",
  "REFRESH-REPORT.md",
  "live-replay.stdout.json",
  "ordinary-live-validator.stdout.json",
  "refresh-report.json",
  "validation/validate-live-apply.mjs"
];
const optionalEvidenceFiles = new Set(["LIVE-APPLY-RECEIPT.json", "VALIDATION-RESULT.json"]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stableSort = (rows) => rows.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
const requireCondition = (condition, code, detail = "") => {
  if (!condition) throw new Error(detail ? `${code}:${detail}` : code);
};
const parseJsonBytes = (bytes, path) => {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`JSON_PARSE:${path}:${error.message}`);
  }
};
const readJson = (path) => parseJsonBytes(readFileSync(path), path);
const inspectFile = (path, binding, code) => {
  const stat = lstatSync(path);
  requireCondition(stat.isFile() && !stat.isSymbolicLink(), `${code}_TYPE`, path);
  const bytes = readFileSync(path);
  requireCondition(bytes.length === binding.size_bytes, `${code}_SIZE`, `${path}:${bytes.length}`);
  requireCondition(sha256(bytes) === binding.sha256, `${code}_SHA256`, path);
  return bytes;
};
const normalizeRelative = (path) => relative(evidenceRoot, path).split("\\").join("/");
const walkFiles = (directory) => {
  const rows = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    const stat = lstatSync(path);
    requireCondition(!stat.isSymbolicLink(), "EVIDENCE_SYMLINK_FORBIDDEN", normalizeRelative(path));
    if (stat.isDirectory()) rows.push(...walkFiles(path));
    else {
      requireCondition(stat.isFile(), "EVIDENCE_NONREGULAR_FORBIDDEN", normalizeRelative(path));
      rows.push(normalizeRelative(path));
    }
  }
  return stableSort(rows);
};
const cleanEnvironment = () => {
  const environment = { ...process.env };
  delete environment.DOMAINSPEC_REPOSITORY_ROOT;
  delete environment.DOMAINSPEC_V1_ARCHIVE_ROOT;
  delete environment.DOMAINSPEC_SKIP_APPLY_PACKAGE_REENTRY;
  return environment;
};
const runNode = (argumentsList) => spawnSync(process.execPath, argumentsList, {
  cwd: repoRoot,
  env: cleanEnvironment(),
  encoding: null,
  maxBuffer: 16 * 1024 * 1024
});

const validate = () => {
  requireCondition(relative(repoRoot, evidenceRoot).split("\\").join("/") === evidenceRootRelative, "EVIDENCE_ROOT_INVALID");
  const actualFiles = walkFiles(evidenceRoot);
  for (const required of requiredEvidenceFiles) requireCondition(actualFiles.includes(required), "EVIDENCE_FILE_MISSING", required);
  for (const actual of actualFiles) requireCondition(requiredEvidenceFiles.includes(actual) || optionalEvidenceFiles.has(actual), "EVIDENCE_FILE_UNDECLARED", actual);
  for (const relativePath of actualFiles) {
    const bytes = readFileSync(resolve(evidenceRoot, relativePath));
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const text = bytes.toString("utf8");
    requireCondition(text.endsWith("\n"), "HYGIENE_FINAL_LF", relativePath);
    requireCondition(!text.includes("\r"), "HYGIENE_CR_FORBIDDEN", relativePath);
    requireCondition(!/[ \t]+$/m.test(text), "HYGIENE_TRAILING_WHITESPACE", relativePath);
    if (relativePath.endsWith(".json")) parseJsonBytes(bytes, relativePath);
  }

  for (const binding of evidenceBindings) inspectFile(resolve(evidenceRoot, binding.path), binding, "EVIDENCE_BINDING_DRIFT");
  const repairReceiptPath = resolve(repoRoot, repairRootRelative, "REPAIR-PACKAGE-RECEIPT.json");
  const repairReceiptBytes = inspectFile(repairReceiptPath, expected.repairReceipt, "REPAIR_RECEIPT_DRIFT");
  const repairReceipt = parseJsonBytes(repairReceiptBytes, repairReceiptPath);
  requireCondition(repairReceipt.result === "pass", "REPAIR_RECEIPT_NOT_PASS");
  requireCondition(repairReceipt.pre_receipt_inventory?.sha256 === expected.repairInventory.sha256, "REPAIR_INVENTORY_BINDING_DRIFT");
  requireCondition(repairReceipt.target_inventory?.sha256 === expected.targetInventorySha256, "TARGET_INVENTORY_BINDING_DRIFT");
  const repairRows = [];
  let repairTotal = 0;
  for (const material of [...repairReceipt.pre_receipt_inventory.materials].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) {
    const bytes = inspectFile(resolve(repoRoot, repairRootRelative, material.path), material, "REPAIR_MATERIAL_DRIFT");
    repairTotal += bytes.length;
    repairRows.push(`${material.sha256}\t${material.size_bytes}\t${material.path}\n`);
  }
  requireCondition(repairRows.length === expected.repairInventory.file_count, "REPAIR_INVENTORY_COUNT_DRIFT");
  requireCondition(repairTotal === expected.repairInventory.total_size_bytes, "REPAIR_INVENTORY_SIZE_DRIFT");
  requireCondition(sha256(Buffer.from(repairRows.join(""), "utf8")) === expected.repairInventory.sha256, "REPAIR_INVENTORY_DIGEST_DRIFT");

  const decision = readJson(resolve(repoRoot, decisionRootRelative, "DECISION-RECORD.json"));
  requireCondition(decision.result === "pass" && decision.selected_option_id === "ACCEPT-ONE-TARGET-REPAIR", "DECISION_NOT_ACCEPTED");
  requireCondition(decision.source?.exact_response === "ACCEPT-ONE-TARGET-REPAIR", "DECISION_RESPONSE_DRIFT");
  requireCondition(decision.accepted_repair?.receipt_sha256 === expected.repairReceipt.sha256, "DECISION_RECEIPT_DRIFT");
  requireCondition(decision.accepted_repair?.pre_receipt_inventory_sha256 === expected.repairInventory.sha256, "DECISION_INVENTORY_DRIFT");
  requireCondition(decision.accepted_repair?.target_inventory_sha256 === expected.targetInventorySha256, "DECISION_TARGET_INVENTORY_DRIFT");
  requireCondition(decision.authorized_action?.postimage_sha256 === expected.target.sha256 && decision.authorized_action?.postimage_size_bytes === expected.target.size_bytes, "DECISION_POSTIMAGE_DRIFT");

  const targetBytes = inspectFile(resolve(repoRoot, targetRelative), expected.target, "TARGET_POSTIMAGE_DRIFT");
  const stagedBytes = inspectFile(resolve(repoRoot, stagedRelative), expected.target, "STAGED_POSTIMAGE_DRIFT");
  requireCondition(Buffer.compare(targetBytes, stagedBytes) === 0, "TARGET_NOT_BYTE_EXACT_STAGED_POSTIMAGE");
  for (const baseline of liveBaselines) inspectFile(resolve(repoRoot, baseline.path), baseline, "LIVE_BASELINE_DRIFT");

  const syntax = runNode(["--check", resolve(repoRoot, targetRelative)]);
  requireCondition(syntax.status === 0, "TARGET_SYNTAX_FAILED", (syntax.stderr || syntax.stdout).toString("utf8").trim());
  const liveStored = inspectFile(resolve(evidenceRoot, "live-replay.stdout.json"), expected.liveStdout, "LIVE_STORED_DRIFT");
  const liveRun = runNode([resolve(repoRoot, targetRelative), repoRoot, "live", "--v2-only"]);
  requireCondition(liveRun.status === 0, "LIVE_REPLAY_FAILED", (liveRun.stderr || liveRun.stdout).toString("utf8").trim());
  requireCondition(Buffer.compare(liveRun.stdout, liveStored) === 0, "LIVE_REPLAY_OUTPUT_NOT_DETERMINISTIC");
  const live = parseJsonBytes(liveStored, "live-replay.stdout.json");
  const wrongGeneration = live.hostile_results?.find((row) => row.hostile_id === "promotion-wrong-generation-preimage");
  const staleReference = live.hostile_results?.find((row) => row.hostile_id === "stale-promotion-rollback-ref");
  requireCondition(live.result === "pass" && live.target_mode === "live" && live.validations?.hostile_controls === "37/37" && live.errors?.length === 0, "LIVE_REPLAY_RESULT_INVALID");
  requireCondition(wrongGeneration?.status === "killed" && wrongGeneration.finding_code === "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH", "WRONG_GENERATION_DIAGNOSTIC_INVALID");
  requireCondition(staleReference?.status === "killed" && staleReference.finding_code === "V2_PROMOTION_ROLLBACK_REF_STALE", "STALE_REFERENCE_DIAGNOSTIC_INVALID");

  const ordinaryStored = inspectFile(resolve(evidenceRoot, "ordinary-live-validator.stdout.json"), expected.ordinaryStdout, "ORDINARY_STORED_DRIFT");
  const ordinaryRun = runNode([resolve(repoRoot, ordinaryRelative)]);
  requireCondition(ordinaryRun.status === 0, "ORDINARY_VALIDATOR_FAILED", (ordinaryRun.stderr || ordinaryRun.stdout).toString("utf8").trim());
  requireCondition(Buffer.compare(ordinaryRun.stdout, ordinaryStored) === 0, "ORDINARY_OUTPUT_NOT_DETERMINISTIC");
  const ordinary = parseJsonBytes(ordinaryStored, "ordinary-live-validator.stdout.json");
  requireCondition(ordinary.verdict === "pass" && ordinary.v2_validation?.result === "pass" && ordinary.checks?.length === 24 && ordinary.errors?.length === 0, "ORDINARY_RESULT_INVALID");

  const preApply = readJson(resolve(evidenceRoot, "PRE-APPLY-VALIDATION.json"));
  const postApply = readJson(resolve(evidenceRoot, "POST-APPLY-VALIDATION.json"));
  const refresh = readJson(resolve(evidenceRoot, "refresh-report.json"));
  requireCondition(preApply.result === "pass" && preApply.write_status?.canonical_target_mutated === false, "PRE_APPLY_EVIDENCE_INVALID");
  requireCondition(postApply.result === "pass" && postApply.target?.postimage_sha256 === expected.target.sha256 && postApply.protected_baselines?.five_live_targets === "5/5 unchanged", "POST_APPLY_EVIDENCE_INVALID");
  requireCondition(refresh.phaseStatus === "pass" && refresh.mutationMode === "apply-approved" && refresh.appliedChanges?.length === 1, "REFRESH_REPORT_INVALID");
  requireCondition(refresh.authority_effect === "none", "REFRESH_AUTHORITY_EFFECT_INVALID");

  const output = {
    schema_version: "domainspec-ontology-v2-validator-repair-live-apply-evidence-validation/v1",
    run_id: "WP-RMT-001-ONTOLOGY-V2-VALIDATOR-REPAIR-LIVE-APPLY-20260816T110235Z",
    result: "pass",
    validations: {
      decision_and_exact_owner_acceptance: "pass",
      accepted_repair_receipt_and_19_file_inventory: "pass",
      exact_one_target_postimage: "pass",
      target_syntax: "pass",
      live_replay: "pass 37/37",
      wrong_generation_code: "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH",
      stale_reference_code: "V2_PROMOTION_ROLLBACK_REF_STALE",
      ordinary_live_validator: "pass 24/24",
      deterministic_stored_outputs: "byte-exact",
      five_live_target_baselines: "5/5 unchanged",
      evidence_scope_and_hygiene: "pass",
      terminal_receipt_binding: "checked-if-present"
    },
    command_exits: {
      target_syntax: 0,
      live_replay: 0,
      ordinary_live_validator: 0
    },
    target: {
      path: targetRelative,
      sha256: expected.target.sha256,
      size_bytes: expected.target.size_bytes
    },
    authority_effect: "none",
    errors: [],
    claim_ceiling: "Exact one-target validator repair apply and post-apply validation only; no candidate migration, ontology admission, PromotionRecord creation, promotion, publication, release, deployment, production readiness, Git, network, or WP-RMT-002 SWU execution."
  };

  const validationResultPath = resolve(evidenceRoot, "VALIDATION-RESULT.json");
  const expectedOutputBytes = Buffer.from(`${JSON.stringify(output, null, 2)}\n`, "utf8");
  if (existsSync(validationResultPath)) requireCondition(Buffer.compare(readFileSync(validationResultPath), expectedOutputBytes) === 0, "VALIDATION_RESULT_NOT_DETERMINISTIC");

  const terminalReceiptPath = resolve(evidenceRoot, "LIVE-APPLY-RECEIPT.json");
  if (existsSync(terminalReceiptPath)) {
    const receipt = readJson(terminalReceiptPath);
    requireCondition(receipt.result === "pass" && receipt.status === "pass", "TERMINAL_RECEIPT_NOT_PASS");
    requireCondition(receipt.accepted_repair?.receipt_sha256 === expected.repairReceipt.sha256, "TERMINAL_RECEIPT_SOURCE_DRIFT");
    requireCondition(receipt.target?.postimage?.sha256 === expected.target.sha256 && receipt.target?.postimage?.size_bytes === expected.target.size_bytes, "TERMINAL_RECEIPT_TARGET_DRIFT");
    const inventoryFiles = stableSort(actualFiles.filter((path) => path !== "LIVE-APPLY-RECEIPT.json"));
    const inventoryMaterials = inventoryFiles.map((path) => {
      const bytes = readFileSync(resolve(evidenceRoot, path));
      return { path, sha256: sha256(bytes), size_bytes: bytes.length };
    });
    const inventoryRows = inventoryMaterials.map((row) => `${row.sha256}\t${row.size_bytes}\t${row.path}\n`);
    const inventoryDigest = sha256(Buffer.from(inventoryRows.join(""), "utf8"));
    const inventoryTotal = inventoryMaterials.reduce((sum, row) => sum + row.size_bytes, 0);
    requireCondition(receipt.pre_receipt_inventory?.sha256 === inventoryDigest, "TERMINAL_RECEIPT_INVENTORY_DIGEST_DRIFT");
    requireCondition(receipt.pre_receipt_inventory?.file_count === inventoryMaterials.length && receipt.pre_receipt_inventory?.total_size_bytes === inventoryTotal, "TERMINAL_RECEIPT_INVENTORY_TOTAL_DRIFT");
    requireCondition(JSON.stringify(receipt.pre_receipt_inventory?.materials) === JSON.stringify(inventoryMaterials), "TERMINAL_RECEIPT_INVENTORY_ROWS_DRIFT");
    requireCondition(receipt.authority_effect === "none" && receipt.next_route === "parent-independent-audit-then-invoke-refresh-execution-entry", "TERMINAL_RECEIPT_BOUNDARY_DRIFT");
  }

  return output;
};

let output;
let exitCode = 0;
try {
  output = validate();
} catch (error) {
  exitCode = 1;
  output = {
    schema_version: "domainspec-ontology-v2-validator-repair-live-apply-evidence-validation/v1",
    run_id: "WP-RMT-001-ONTOLOGY-V2-VALIDATOR-REPAIR-LIVE-APPLY-20260816T110235Z",
    result: "fail",
    errors: [error.message],
    authority_effect: "none"
  };
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
process.exitCode = exitCode;
