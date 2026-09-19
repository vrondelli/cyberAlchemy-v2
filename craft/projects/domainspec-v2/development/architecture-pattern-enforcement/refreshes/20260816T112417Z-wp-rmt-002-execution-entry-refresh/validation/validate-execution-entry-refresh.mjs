#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
const planRelative = "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan";
const refreshRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T112417Z-wp-rmt-002-execution-entry-refresh";
const planRoot = path.join(repoRoot, planRelative);
const refreshRoot = path.join(repoRoot, refreshRelative);

const expectedPlanInventory = {
  algorithm: "sha256 of raw-UTF8 path-sorted rows sha256<TAB>size_bytes<TAB>plan-relative-path<LF>",
  file_count: 7,
  total_size_bytes: 111733,
  sha256: "2af566b176b6e021551a9a5b9175c489b4dbbf2f79f06945b502f094c69d56f9",
  materials: [
    { path: "EXECUTION-ENTRY-VALIDATION.json", sha256: "385567a7a2ea83dfd5e832ac4c9c88640574078b21fed0b3b024a28080e0b747", size_bytes: 267 },
    { path: "EXECUTION-ENTRY.json", sha256: "6de95b4cae05865bc1f65c8d0660bac2611c143b0f0405834ca8bb7d012e65e7", size_bytes: 9277 },
    { path: "EXECUTION-PACK.md", sha256: "b099f325092d65c3230fb2bdc6e524b8275bf118a9aa7113e0faab76f7d53577", size_bytes: 2482 },
    { path: "SWU-MANIFEST.json", sha256: "57941fb6929bc907a06f1ab33b3cb6b57dc8be987f415f6ec5b39960ad3d0b3c", size_bytes: 55713 },
    { path: "VALIDATION-RESULT.json", sha256: "b15c6a5944706cce1437d5cfaeae5baa7c0177727cc04b910269d26bd7dbde38", size_bytes: 3490 },
    { path: "WORK-PACK.md", sha256: "e96b5d414279fdd7ad1689bcac70e9292adbbae588a8705e1bb73b2174f7ef37", size_bytes: 6587 },
    { path: "validate-work-pack.mjs", sha256: "0921a355c0a4574b2cd0f71e0a7de0f5ee8720b3b5c4b926b03d0990775ff5b7", size_bytes: 33917 }
  ]
};

const preTargetInventory = {
  file_count: 7,
  total_size_bytes: 94650,
  sha256: "490a25a1f63502640234b0d14c97a61c016af7b10ca14930e8faa5be484a8f21"
};

const exactFiles = [
  {
    label: "owner decision",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260815T221417Z-wp-rmt-002-validator-repair-acceptance-decision/DECISION-RECORD.json",
    sha256: "7b793737bc55642eb09469f16812f36713ec32363d38a5c4910378e84ada4969",
    size_bytes: 2487
  },
  {
    label: "repair package receipt",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260815T214711Z-wp-rmt-001-ontology-v2-validator-repair-package/REPAIR-PACKAGE-RECEIPT.json",
    sha256: "dda3c156f86f3813311892bc8f04e969f669b65171f7a16d79da41cf1a2beb18",
    size_bytes: 11886
  },
  {
    label: "repaired canonical validator",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/validation/validate-apply-package.mjs",
    sha256: "985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c",
    size_bytes: 149370
  },
  {
    label: "passing live-apply receipt",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T110235Z-wp-rmt-001-ontology-v2-validator-repair-live-apply/LIVE-APPLY-RECEIPT.json",
    sha256: "846ddd35a91093e0d0e4292309783c31312f43b4b9ba863dec65f7ccba509e92",
    size_bytes: 9424
  },
  {
    label: "historical plan receipt",
    path: `${planRelative}/PLAN-RECEIPT.json`,
    sha256: "d4a2fe31e1c39557f0c7012f760f67ae695634f6ddaf3757c426576e78794e40",
    size_bytes: 7433
  },
  {
    label: "historical Distill validation",
    path: `${planRelative}/DISTILL-PLAN-VALIDATION.md`,
    sha256: "bde8d52c52818ecf576769fd3f5bc4446ea1470c05f1b6fa1df8dd5179b245ee",
    size_bytes: 2361
  }
];

const evidenceFiles = new Set([
  "EXECUTION-ENTRY-REFRESH-RECEIPT.json",
  "POST-REFRESH-VALIDATION.json",
  "PRE-REFRESH-VALIDATION.json",
  "REFRESH-REPORT.md",
  "VALIDATION-RESULT.json",
  "refresh-report.json",
  "validation/validate-execution-entry-refresh.mjs"
]);
const requiredPreReceiptEvidence = [...evidenceFiles].filter((item) => item !== "EXECUTION-ENTRY-REFRESH-RECEIPT.json");

function fail(message) {
  throw new Error(message);
}

function requireValue(condition, message) {
  if (!condition) fail(message);
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function inspect(relativePath) {
  const absolute = path.join(repoRoot, relativePath);
  const stat = fs.lstatSync(absolute);
  requireValue(stat.isFile() && !stat.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const bytes = fs.readFileSync(absolute);
  return { path: relativePath, sha256: sha256(bytes), size_bytes: bytes.length, bytes };
}

function parseJson(relativePath) {
  return JSON.parse(inspect(relativePath).bytes.toString("utf8"));
}

function rawPathSort(left, right) {
  return Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"));
}

function inventory(root, relativePaths, algorithm) {
  const materials = relativePaths.map((relativePath) => {
    const absolute = path.join(root, relativePath);
    const stat = fs.lstatSync(absolute);
    requireValue(stat.isFile() && !stat.isSymbolicLink(), `${relativePath} must be a regular non-symlink inventory member`);
    const bytes = fs.readFileSync(absolute);
    return { path: relativePath, sha256: sha256(bytes), size_bytes: bytes.length };
  }).sort(rawPathSort);
  const rows = materials.map((item) => `${item.sha256}\t${item.size_bytes}\t${item.path}\n`).join("");
  return {
    algorithm,
    file_count: materials.length,
    total_size_bytes: materials.reduce((sum, item) => sum + item.size_bytes, 0),
    sha256: sha256(Buffer.from(rows, "utf8")),
    materials
  };
}

function assertInventory(actual, expected, label) {
  requireValue(actual.file_count === expected.file_count, `${label} file count drift`);
  requireValue(actual.total_size_bytes === expected.total_size_bytes, `${label} total size drift`);
  requireValue(actual.sha256 === expected.sha256, `${label} digest drift`);
  if (expected.materials) {
    requireValue(JSON.stringify(actual.materials) === JSON.stringify(expected.materials), `${label} material drift`);
  }
}

function listRelativeFiles(root) {
  const output = [];
  function visit(current, prefix) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(current, entry.name);
      const stat = fs.lstatSync(absolute);
      requireValue(!stat.isSymbolicLink(), `evidence symlink forbidden: ${relative}`);
      if (stat.isDirectory()) visit(absolute, relative);
      else {
        requireValue(stat.isFile(), `non-regular evidence entry forbidden: ${relative}`);
        output.push(relative);
      }
    }
  }
  visit(root, "");
  return output.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
}

function run(command, args, label) {
  const execution = spawnSync(command, args, { cwd: repoRoot, encoding: null, maxBuffer: 4 * 1024 * 1024 });
  if (execution.error) fail(`${label} failed to launch: ${execution.error.message}`);
  requireValue(execution.status === 0, `${label} exited ${execution.status}: ${(execution.stderr ?? Buffer.alloc(0)).toString("utf8")}`);
  return execution.stdout ?? Buffer.alloc(0);
}

for (const expected of exactFiles) {
  const actual = inspect(expected.path);
  requireValue(actual.sha256 === expected.sha256, `${expected.label} SHA-256 drift`);
  requireValue(actual.size_bytes === expected.size_bytes, `${expected.label} size drift`);
}

const actualPlanInventory = inventory(planRoot, expectedPlanInventory.materials.map((item) => item.path), expectedPlanInventory.algorithm);
assertInventory(actualPlanInventory, expectedPlanInventory, "post-refresh plan target inventory");

const manifest = parseJson(`${planRelative}/SWU-MANIFEST.json`);
const entry = parseJson(`${planRelative}/EXECUTION-ENTRY.json`);
const storedWorkPackValidation = inspect(`${planRelative}/VALIDATION-RESULT.json`).bytes;
const storedEntryValidation = inspect(`${planRelative}/EXECUTION-ENTRY-VALIDATION.json`).bytes;
const ownerDecision = parseJson(exactFiles[0].path);
const repairReceipt = parseJson(exactFiles[1].path);
const liveReceipt = parseJson(exactFiles[3].path);

requireValue(ownerDecision.result === "pass" && ownerDecision.selected_option_id === "ACCEPT-ONE-TARGET-REPAIR", "owner decision is not the exact accepted repair decision");
requireValue(repairReceipt.result === "pass" && repairReceipt.status === "pass", "repair receipt is not pass");
requireValue(liveReceipt.result === "pass" && liveReceipt.status === "pass", "live-apply receipt is not pass");
requireValue(liveReceipt.pre_receipt_inventory?.sha256 === "b8c0e4a8c083b78bbd656367edeca8bce624897573956ea1edd8b1c3816634cd", "live-apply evidence inventory binding drift");
requireValue(liveReceipt.post_apply_validation?.hostile_controls === "37/37", "live-apply hostile replay is not 37/37");
requireValue(liveReceipt.post_apply_validation?.ordinary_live_validator_check_count === 24, "ordinary live validator is not 24/24");
requireValue(liveReceipt.post_apply_validation?.five_live_target_baselines === "5/5 unchanged", "five ontology-v2 targets are not recorded unchanged");
requireValue(liveReceipt.authority_effect === "none", "live-apply receipt exceeds authority ceiling");

const liveReceiptRoot = path.dirname(path.join(repoRoot, exactFiles[3].path));
const liveEvidence = inventory(
  liveReceiptRoot,
  liveReceipt.pre_receipt_inventory.materials.map((item) => item.path),
  liveReceipt.pre_receipt_inventory.algorithm
);
assertInventory(liveEvidence, liveReceipt.pre_receipt_inventory, "live-apply evidence inventory");

requireValue(manifest.work_pack_id === "WP-RMT-002", "manifest work-pack ID drift");
requireValue(manifest.status === "planned-selection-ready", "manifest is not selection-ready");
requireValue(Array.isArray(manifest.swus) && manifest.swus.length === 70, "manifest SWU denominator drift");
requireValue(manifest.swus.every((swu) => swu.status === "planned"), "an SWU is no longer planned");
requireValue(manifest.swus.reduce((sum, swu) => sum + swu.depends_on.length, 0) === 74, "dependency edge denominator drift");
requireValue(Array.isArray(manifest.types) && manifest.types.length === 7, "type denominator drift");
requireValue(Array.isArray(manifest.source_bindings) && manifest.source_bindings.length === 28, "source binding denominator drift");
requireValue(new Set(manifest.source_bindings.map((binding) => binding.role)).size === 28, "source binding roles are not unique");
requireValue(manifest.prerequisite_history?.prior_blocker?.lifecycle_status === "historical-resolved", "prior blocker is not preserved as historical-resolved");
requireValue(manifest.prerequisite_history?.satisfied_by?.receipt_sha256 === exactFiles[3].sha256, "manifest satisfied-by receipt drift");
requireValue(manifest.prerequisite_history?.satisfied_by?.independent_parent_replay === "pass", "independent parent replay is not bound as pass");

const route = entry.execution_policy?.allowed_routes?.[0];
requireValue(entry.work_pack_id === "WP-RMT-002", "execution-entry work-pack ID drift");
requireValue(entry.execution_entry?.state === "selection-ready", "execution entry is not selection-ready");
requireValue(entry.execution_entry?.selected_unit === null, "an SWU has been selected");
requireValue(entry.execution_entry?.route_id === null, "a route has been selected");
requireValue(entry.execution_entry?.next_owner === "implementation-readiness:execute", "next owner drift");
requireValue(entry.execution_policy?.allowed_routes_digest === "e30a5a581eceb99ae8c846365dacaee26aec40dfdfe39353398705eba625b10f", "allowed-routes digest drift");
requireValue(route?.frontier_swu === "RMT-OP-001", "frontier route drift");
requireValue(Array.isArray(route.required_inputs) && route.required_inputs.length === 27, "route input denominator drift");
requireValue(new Set(route.required_inputs).size === 27, "route inputs are not unique");
requireValue(entry.pre_execution_owner_prerequisite?.status === "satisfied", "pre-execution prerequisite is not satisfied");
requireValue(entry.pre_execution_owner_prerequisite?.current_receipt_sha256 === exactFiles[3].sha256, "execution-entry current receipt drift");
requireValue(entry.authority_effect === "none", "execution entry exceeds authority ceiling");

const workPackStdout = run(process.execPath, [path.join(planRoot, "validate-work-pack.mjs"), repoRoot], "work-pack validator");
requireValue(Buffer.compare(workPackStdout, storedWorkPackValidation) === 0, "stored work-pack validation is not byte-exact");
const workPackResult = JSON.parse(workPackStdout.toString("utf8"));
requireValue(workPackResult.result === "pass", "work-pack validator did not pass");
requireValue(workPackResult.graph?.swus === "70/70", "work-pack validator SWU proof drift");
requireValue(workPackResult.graph?.disjoint_declared_write_scopes === "189/189", "write-scope proof drift");
requireValue(workPackResult.task_contracts?.atomic_acceptance_verification_closeout === "70/70", "SWU contract proof drift");
requireValue(workPackResult.hostile_catalogue?.executable_planned_controls === "98/98", "hostile-control proof drift");
requireValue(workPackResult.relation_contracts?.translation_contracts === "18/18", "relation-translation proof drift");
requireValue(workPackResult.sources?.exact === "28/28", "source proof drift");
requireValue(workPackResult.execution_entry?.self_contained_route_inputs === "27/27", "route-input proof drift");
requireValue(workPackResult.boundaries?.implementation_swu_selected === false && workPackResult.boundaries?.implementation_swu_executed === false, "work-pack validator reports SWU selection or execution");

const entryValidator = path.join(repoRoot, ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py");
const entryStdout = run("python3", [entryValidator, "--projection", path.join(planRoot, "EXECUTION-ENTRY.json")], "installed execution-entry validator");
requireValue(Buffer.compare(entryStdout, storedEntryValidation) === 0, "stored execution-entry validation is not byte-exact");
const entryResult = JSON.parse(entryStdout.toString("utf8"));
requireValue(entryResult.status === "pass" && entryResult.allowed_routes_digest === entry.execution_policy.allowed_routes_digest, "installed execution-entry validator did not pass exactly");

const observedEvidence = listRelativeFiles(refreshRoot);
for (const relative of observedEvidence) requireValue(evidenceFiles.has(relative), `unexpected refresh evidence file: ${relative}`);
for (const relative of requiredPreReceiptEvidence.filter((item) => item !== "VALIDATION-RESULT.json")) {
  requireValue(observedEvidence.includes(relative), `required refresh evidence file missing: ${relative}`);
}

const result = {
  schema_version: "domainspec.wp-rmt-002-execution-entry-refresh-validation/v1",
  result: "pass",
  run_id: "WP-RMT-002-EXECUTION-ENTRY-REFRESH-20260816T112417Z",
  target_inventory: {
    file_count: actualPlanInventory.file_count,
    total_size_bytes: actualPlanInventory.total_size_bytes,
    sha256: actualPlanInventory.sha256
  },
  plan: {
    types: "7/7",
    swus: "70/70 planned",
    dependency_edges: "74/74",
    absent_write_scopes: "189/189",
    swu_contracts: "70/70",
    hostile_controls: "98/98",
    relation_translations: "18/18",
    source_bindings: "28/28",
    route_inputs: "27/27"
  },
  execution_entry: {
    manifest_status: "planned-selection-ready",
    state: "selection-ready",
    frontier: "RMT-OP-001",
    selected_unit: null,
    route_id: null,
    next_owner: "implementation-readiness:execute",
    allowed_routes_digest: entry.execution_policy.allowed_routes_digest
  },
  prerequisite: {
    current_receipt_result: "pass",
    current_receipt_sha256: exactFiles[3].sha256,
    current_evidence_inventory_sha256: liveReceipt.pre_receipt_inventory.sha256,
    hostile_replay: "37/37",
    ordinary_live_validator: "24/24",
    five_live_targets: "5/5 unchanged",
    prior_blocker: "historical-resolved"
  },
  validation: {
    work_pack_validator_exit_code: 0,
    work_pack_validator_result: "pass",
    work_pack_stored_stdout: "byte-exact",
    execution_entry_validator_exit_code: 0,
    execution_entry_validator_status: "pass",
    execution_entry_stored_stdout: "byte-exact"
  },
  historical_evidence: {
    plan_receipt: "immutable-exact",
    distill_validation: "immutable-exact"
  },
  scope_hygiene: {
    plan_target_count: 7,
    evidence_pre_receipt_file_count: 6,
    unexpected_files: 0,
    terminal_receipt_policy: "optional-during-validation-and-written-last"
  },
  pre_target_inventory: preTargetInventory,
  boundaries: {
    implementation_swu_selected: false,
    implementation_swu_executed: false,
    ontology_targets_changed: false,
    registry_admission: false,
    promotion_record_created: false,
    promotion: false,
    publication: false,
    release: false,
    deployment: false,
    production_readiness: false,
    git: false,
    network: false
  },
  authority_effect: "none"
};

const expectedStdout = Buffer.from(`${JSON.stringify(result, null, 2)}\n`, "utf8");
const storedEvidencePath = path.join(refreshRoot, "VALIDATION-RESULT.json");
if (fs.existsSync(storedEvidencePath)) {
  requireValue(Buffer.compare(fs.readFileSync(storedEvidencePath), expectedStdout) === 0, "stored refresh validation is not byte-exact");
}

const terminalPath = path.join(refreshRoot, "EXECUTION-ENTRY-REFRESH-RECEIPT.json");
if (fs.existsSync(terminalPath)) {
  const receipt = JSON.parse(fs.readFileSync(terminalPath, "utf8"));
  requireValue(receipt.result === "pass" && receipt.status === "pass", "terminal refresh receipt is not pass");
  requireValue(receipt.target_postimage_inventory?.sha256 === expectedPlanInventory.sha256, "terminal receipt target postimage binding drift");
  requireValue(receipt.target_preimage_inventory?.sha256 === preTargetInventory.sha256, "terminal receipt target preimage binding drift");
  requireValue(receipt.execution_entry?.state === "selection-ready", "terminal receipt execution-entry state drift");
  requireValue(receipt.execution_entry?.selected_unit === null && receipt.execution_entry?.route_id === null, "terminal receipt selects a unit or route");
  requireValue(receipt.effects?.implementation_swu_executed === false && receipt.effects?.authority_effect === "none", "terminal receipt exceeds effect ceiling");
  requireValue(receipt.terminal_receipt_written_last === true, "terminal receipt does not declare last-write status");
  const preReceiptPaths = observedEvidence.filter((item) => item !== "EXECUTION-ENTRY-REFRESH-RECEIPT.json");
  const actualEvidenceInventory = inventory(
    refreshRoot,
    preReceiptPaths,
    "sha256 of raw-UTF8 path-sorted rows sha256<TAB>size_bytes<TAB>relative_path<LF>"
  );
  assertInventory(actualEvidenceInventory, receipt.evidence_pre_receipt_inventory, "terminal receipt evidence inventory");
  const receiptMtime = fs.lstatSync(terminalPath).mtimeMs;
  for (const relative of preReceiptPaths) {
    requireValue(receiptMtime >= fs.lstatSync(path.join(refreshRoot, relative)).mtimeMs, `terminal receipt is not last by mtime: ${relative}`);
  }
}

process.stdout.write(expectedStdout);
