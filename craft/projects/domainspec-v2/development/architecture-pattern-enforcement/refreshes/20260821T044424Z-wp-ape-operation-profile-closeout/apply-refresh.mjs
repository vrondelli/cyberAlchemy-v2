#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const refreshId = "20260821T044424Z-wp-ape-operation-profile-closeout";
const refreshRel = `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/${refreshId}`;
const refreshRoot = path.join(repoRoot, refreshRel);
const stagedRoot = path.join(refreshRoot, "staged");
const candidateRel = "projects/domainspec-v2/development/refinement-runs/20260820T193401Z-ape-operation-workflow-realization-work-packs/candidates";
const validatorRel = `${refreshRel}/validation/validate-closeout-refresh.mjs`;
const rollbackRoot = path.join(refreshRoot, "rollback/preimages");
const journalRel = `${refreshRel}/APPLY-JOURNAL.json`;
const postValidationRel = `${refreshRel}/POST-APPLY-VALIDATION.json`;
const applyReceiptRel = `${refreshRel}/APPLY-RECEIPT.json`;

function absolute(relativePath, root = repoRoot) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, relativePath);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error(`path escape: ${relativePath}`);
  return resolved;
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

function readBytes(relativePath, root = repoRoot) {
  const file = absolute(relativePath, root);
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`not a regular non-symlink file: ${relativePath}`);
  return fs.readFileSync(file);
}

function readJson(relativePath, root = repoRoot) {
  return JSON.parse(readBytes(relativePath, root).toString("utf8"));
}

function exactRef(relativePath, root = repoRoot) {
  const bytes = readBytes(relativePath, root);
  return { path: relativePath, sha256: shaBytes(bytes), size_bytes: bytes.length };
}

function writeBytes(relativePath, bytes, root = repoRoot) {
  const target = absolute(relativePath, root);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${refreshId}.${process.pid}.tmp`);
  if (fs.existsSync(temporary)) throw new Error(`temporary collision: ${temporary}`);
  fs.writeFileSync(temporary, bytes, { flag: "wx" });
  fs.renameSync(temporary, target);
}

function writeJson(relativePath, value, root = repoRoot) {
  writeBytes(relativePath, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"), root);
}

function writeText(relativePath, value, root = repoRoot) {
  if (!value.endsWith("\n")) throw new Error(`text lacks final newline: ${relativePath}`);
  writeBytes(relativePath, Buffer.from(value, "utf8"), root);
}

function run(id, argv, cwd) {
  const result = spawnSync(argv[0], argv.slice(1), { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return {
    id,
    argv,
    cwd: path.relative(repoRoot, cwd) || ".",
    exit_status: result.status ?? 1,
    stdout_sha256: shaBytes(Buffer.from(result.stdout ?? "", "utf8")),
    stderr_sha256: shaBytes(Buffer.from(result.stderr ?? "", "utf8")),
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function compactCommand(result) {
  return {
    id: result.id,
    argv: result.argv,
    cwd: result.cwd,
    exit_status: result.exit_status,
    stdout_sha256: result.stdout_sha256,
    stderr_sha256: result.stderr_sha256,
  };
}

function stateOf(relativePath) {
  const file = absolute(relativePath);
  if (!fs.existsSync(file)) return { path: relativePath, state: "absent", sha256: null, size_bytes: null };
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`live target is not a regular non-symlink file: ${relativePath}`);
  const bytes = fs.readFileSync(file);
  return { path: relativePath, state: "present", sha256: shaBytes(bytes), size_bytes: bytes.length };
}

function assertSameState(actual, expected, label) {
  if (actual.state !== expected.state || actual.sha256 !== expected.sha256 || actual.size_bytes !== expected.size_bytes) {
    throw new Error(`${label} drift: ${expected.path}`);
  }
}

function inventoryDigest(refs) {
  const body = refs.map((ref) => `${ref.sha256}\t${ref.size_bytes}\t${ref.path}\n`).sort().join("");
  return shaBytes(Buffer.from(body, "utf8"));
}

function withDigest(body) {
  return { ...body, receipt_sha256: shaBytes(Buffer.from(canonicalJson(body), "utf8")) };
}

const targetInventory = readJson(`${refreshRel}/TARGET-INVENTORY.json`);
const baseline = readJson(`${refreshRel}/PRE-APPLY-BASELINE.json`);
const materialPackage = readJson(`${refreshRel}/MATERIAL-PACKAGE.json`);
const materialReceipt = readJson(`${refreshRel}/MATERIAL-RECEIPT.json`);
const handoffRequest = readJson(`${refreshRel}/APPLY-HANDOFF-REQUEST.json`);
const handoff = readJson(`${refreshRel}/APPLY-HANDOFF-RESULT.json`);
const prevalidation = readJson(`${refreshRel}/PRE-CLOSEOUT-VALIDATION.json`);
const targetRows = targetInventory.targets;
const targetPaths = targetRows.map((row) => row.target_path);

if (targetInventory.refresh_id !== refreshId || targetRows.length !== 38 || new Set(targetPaths).size !== 38) throw new Error("target inventory identity/cardinality mismatch");
if (baseline.refresh_id !== refreshId || baseline.targets.length !== 38) throw new Error("baseline identity/cardinality mismatch");
if (handoff.handoffStatus !== "ready" || handoff.mutationReady !== true || handoff.mutationMode !== "apply-approved") throw new Error("file-bound handoff is not mutation-ready");
if (handoffRequest.expectedMaterialReceiptSha256 !== exactRef(`${refreshRel}/MATERIAL-RECEIPT.json`).sha256) throw new Error("material receipt binding drift");
const packageDigest = shaBytes(Buffer.from(canonicalJson(materialPackage), "utf8"));
if (packageDigest !== materialReceipt.packageDigest || packageDigest !== handoffRequest.expectedPackageDigest) throw new Error("material package digest mismatch");

const sortedTargets = [...targetPaths].sort();
const packageTargets = materialPackage.changes.map((change) => change.target_path).sort();
const receiptTargets = [...handoff.materialPackage.validatedPaths].sort();
if (JSON.stringify(sortedTargets) !== JSON.stringify(packageTargets) || JSON.stringify(sortedTargets) !== JSON.stringify(receiptTargets)) {
  throw new Error("inventory/package/handoff target-set mismatch");
}

for (const source of materialPackage.source_artifacts) {
  const current = exactRef(source.path);
  if (current.sha256 !== source.sha256 || current.size_bytes !== source.size_bytes) throw new Error(`material source drift: ${source.path}`);
}
for (const row of targetRows) {
  const baselineRow = baseline.targets.find((entry) => entry.path === row.target_path);
  if (!baselineRow || JSON.stringify(baselineRow) !== JSON.stringify(row.baseline)) throw new Error(`baseline row mismatch: ${row.target_path}`);
  assertSameState(stateOf(row.target_path), row.baseline, "pre-apply baseline");
  const staged = exactRef(row.target_path, stagedRoot);
  if (staged.sha256 !== row.postimage.sha256 || staged.size_bytes !== row.postimage.size_bytes) throw new Error(`staged postimage drift: ${row.target_path}`);
  const packageChange = materialPackage.changes.find((change) => change.target_path === row.target_path);
  if (!packageChange || packageChange.output_ref.sha256 !== staged.sha256 || packageChange.output_ref.size_bytes !== staged.size_bytes) {
    throw new Error(`material output binding mismatch: ${row.target_path}`);
  }
}
if (inventoryDigest(targetRows.map((row) => row.postimage)) !== targetInventory.postimage_aggregate_sha256) throw new Error("postimage aggregate mismatch");

const rollbackRows = [];
for (const row of targetRows) {
  if (row.baseline.state === "present") {
    const bytes = readBytes(row.target_path);
    const rollbackPath = `rollback/preimages/${row.target_path}`;
    writeBytes(rollbackPath, bytes, refreshRoot);
    rollbackRows.push({ target_path: row.target_path, rollback_path: `${refreshRel}/${rollbackPath}`, ...row.baseline });
  } else {
    rollbackRows.push({ target_path: row.target_path, rollback_path: null, ...row.baseline });
  }
}
writeJson(`${refreshRel}/ROLLBACK-MANIFEST.json`, {
  schema_version: "ape.refresh-rollback-manifest/v1",
  refresh_id: refreshId,
  target_count: rollbackRows.length,
  targets: rollbackRows,
});

const orderedRows = [
  ...targetRows.filter((row) => row.target_path.endsWith("-terminal-source.json")),
  ...targetRows.filter((row) => row.target_path.endsWith("-closeout.json")),
  ...targetRows.filter((row) => row.target_path.endsWith("/WORK-PACK-VERIFICATION.json")),
  ...targetRows.filter((row) => !row.target_path.includes("/evidence/WP-APE-OP-PROFILE-001/")),
];
if (orderedRows.length !== 38 || new Set(orderedRows.map((row) => row.target_path)).size !== 38) throw new Error("apply ordering is not an exact target permutation");

const applied = [];
let rolledBack = false;
function writeJournal(status, extra = {}) {
  writeJson(journalRel, {
    schema_version: "ape.refresh-apply-journal/v1",
    refresh_id: refreshId,
    status,
    exact_target_count: 38,
    applied_count: applied.length,
    applied_targets: [...applied],
    ...extra,
  });
}

function rollback(reason) {
  const restored = [];
  for (const row of [...orderedRows].reverse()) {
    if (!applied.includes(row.target_path)) continue;
    const live = absolute(row.target_path);
    if (row.baseline.state === "absent") {
      if (fs.existsSync(live)) {
        const stat = fs.lstatSync(live);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`cannot roll back non-regular create target: ${row.target_path}`);
        fs.unlinkSync(live);
      }
    } else {
      const rollbackRelative = `rollback/preimages/${row.target_path}`;
      writeBytes(row.target_path, readBytes(rollbackRelative, refreshRoot));
    }
    assertSameState(stateOf(row.target_path), row.baseline, "rollback");
    restored.push(row.target_path);
  }
  rolledBack = true;
  writeJournal("rolled-back", { reason, restored_count: restored.length, restored_targets: restored });
}

writeJournal("preflight-pass");
try {
  for (const row of orderedRows) {
    assertSameState(stateOf(row.target_path), row.baseline, "concurrent-write check");
    writeBytes(row.target_path, readBytes(row.target_path, stagedRoot));
    const live = exactRef(row.target_path);
    if (live.sha256 !== row.postimage.sha256 || live.size_bytes !== row.postimage.size_bytes) throw new Error(`post-write mismatch: ${row.target_path}`);
    applied.push(row.target_path);
    writeJournal("applying", { last_applied: row.target_path });
  }

  const entryValidator = path.join(repoRoot, ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py");
  const schemaDir = path.join(repoRoot, ".agents/skills/invoke/schemas");
  const validations = [
    run("plan-consistency", ["/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node", `${candidateRel}/validate-plan-consistency.mjs`], repoRoot),
    run("operation-execution-entry", ["/usr/bin/python3", entryValidator, "--projection", path.join(repoRoot, `${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`)], repoRoot),
    run("workflow-execution-entry", ["/usr/bin/python3", entryValidator, "--projection", path.join(repoRoot, `${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`)], repoRoot),
    run("candidate-local-closeout-topology", [process.execPath, path.join(repoRoot, validatorRel), "--artifact-root", repoRoot, "--source-root", repoRoot], repoRoot),
    run("operation-integrated-suite", prevalidation.integrated_suite.argv, path.join(repoRoot, prevalidation.integrated_suite.cwd)),
    run("operation-strict-typescript", prevalidation.strict_typescript.argv, path.join(repoRoot, prevalidation.strict_typescript.cwd)),
  ];

  const postMaterialReceipt = path.join(refreshRoot, "POST-APPLY-MATERIAL-RECEIPT.json");
  validations.push(run("material-package-revalidation", [
    "/usr/bin/python3",
    path.join(repoRoot, ".agents/skills/invoke/scripts/material_package_validator.py"),
    path.join(refreshRoot, "MATERIAL-PACKAGE.json"),
    "--root", repoRoot,
    "--schema-dir", schemaDir,
    "--output", postMaterialReceipt,
  ], repoRoot));
  validations.push(run("file-bound-handoff-revalidation", [
    "/usr/bin/python3",
    path.join(repoRoot, ".agents/skills/invoke/scripts/refresh_material_handoff.py"),
    path.join(refreshRoot, "APPLY-HANDOFF-REQUEST.json"),
    "--receipt-schema", path.join(schemaDir, "material-package-receipt.schema.json"),
    "--material-package", path.join(refreshRoot, "MATERIAL-PACKAGE.json"),
    "--package-root", repoRoot,
    "--package-schema", path.join(schemaDir, "material-package.schema.json"),
    "--material-receipt", path.join(refreshRoot, "MATERIAL-RECEIPT.json"),
    "--output", path.join(refreshRoot, "POST-APPLY-HANDOFF-RESULT.json"),
  ], repoRoot));

  const failed = validations.filter((result) => result.exit_status !== 0);
  const planOutput = validations[0].exit_status === 0 ? JSON.parse(validations[0].stdout) : null;
  const closeoutOutput = validations[3].exit_status === 0 ? JSON.parse(validations[3].stdout) : null;
  if (planOutput?.status !== "pass") failed.push({ id: "plan-consistency-semantic-status", exit_status: 1 });
  if (closeoutOutput?.result !== "pass") failed.push({ id: "closeout-semantic-status", exit_status: 1 });
  if (!/# tests 100\b/.test(validations[4].stdout) || !/# pass 100\b/.test(validations[4].stdout) || !/# fail 0\b/.test(validations[4].stdout)) {
    failed.push({ id: "operation-test-count", exit_status: 1 });
  }
  if (validations[6].exit_status === 0) {
    const postMaterial = readJson(`${refreshRel}/POST-APPLY-MATERIAL-RECEIPT.json`);
    if (postMaterial.packageDigest !== packageDigest || postMaterial.patchVerdict !== "pass") failed.push({ id: "post-material-semantic-status", exit_status: 1 });
  }
  if (validations[7].exit_status === 0) {
    const postHandoff = readJson(`${refreshRel}/POST-APPLY-HANDOFF-RESULT.json`);
    if (postHandoff.handoffStatus !== "ready" || postHandoff.mutationReady !== true) failed.push({ id: "post-handoff-semantic-status", exit_status: 1 });
  }

  const liveRefs = targetRows.map((row) => exactRef(row.target_path));
  for (const row of targetRows) {
    const live = liveRefs.find((ref) => ref.path === row.target_path);
    if (live.sha256 !== row.postimage.sha256 || live.size_bytes !== row.postimage.size_bytes) failed.push({ id: `live-postimage:${row.target_path}`, exit_status: 1 });
  }
  const liveAggregate = inventoryDigest(liveRefs);
  if (liveAggregate !== targetInventory.postimage_aggregate_sha256) failed.push({ id: "live-postimage-aggregate", exit_status: 1 });

  const postValidation = {
    schema_version: "ape.refresh-post-apply-validation/v1",
    refresh_id: refreshId,
    validated_at_utc: new Date().toISOString(),
    result: failed.length === 0 ? "pass" : "block",
    commands: validations.map(compactCommand),
    semantic_results: {
      plan: planOutput,
      closeout: closeoutOutput,
      product_tests: { expected: 100, pass: failed.every((entry) => entry.id !== "operation-test-count") },
      strict_typescript: { pass: validations[5].exit_status === 0 },
      material_package: { pass: validations[6].exit_status === 0 },
      file_bound_handoff: { pass: validations[7].exit_status === 0 },
    },
    live_target_count: liveRefs.length,
    live_postimage_aggregate_sha256: liveAggregate,
    failed_checks: failed.map((entry) => entry.id),
    selected_subject: { result: "fail", primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT" },
    lifecycle_ceiling: {
      synchronized_task_session_closeout: false,
      canonical_closeout: false,
      profile_admitted: false,
      authority_effect: "none",
    },
  };
  writeJson(postValidationRel, postValidation);
  if (failed.length) throw new Error(`post-apply validation failed: ${failed.map((entry) => entry.id).join(", ")}`);

  writeJournal("applied-and-validated", { live_postimage_aggregate_sha256: liveAggregate });
  const report = readJson(`${refreshRel}/refresh-report.json`);
  report.handoff_status = "consumed";
  report.mutation_ready = false;
  report.apply_status = "applied-and-postvalidated";
  report.current_target_state = "live-postimages-exact";
  report.post_apply_validation = exactRef(postValidationRel);
  report.live_postimage_aggregate_sha256 = liveAggregate;
  writeJson(`${refreshRel}/refresh-report.json`, report);

  let markdown = readBytes(`${refreshRel}/REFRESH-REPORT.md`).toString("utf8");
  markdown = markdown.replace("- Handoff: `ready`\n- Mutation ready: `true`\n- Apply status: staged; live apply pending", "- Handoff: `consumed`\n- Mutation ready: `false` (the approved mutation has been consumed)\n- Apply status: `applied-and-postvalidated`");
  markdown = markdown.replace("Work Pack A is staged to close", "Work Pack A is closed");
  markdown = markdown.replace("After live apply and post-apply validation, route read-only to Continuation Router.", "Live apply and post-apply validation passed. Route read-only to Continuation Router.");
  markdown += `\n## Apply Receipt\n\n- Exact live targets: 38/38\n- Live postimage aggregate: \`${liveAggregate}\`\n- Post-apply validation: \`${postValidationRel}\`\n- Rollback manifest retained at \`${refreshRel}/ROLLBACK-MANIFEST.json\`.\n`;
  writeText(`${refreshRel}/REFRESH-REPORT.md`, markdown);

  const receiptBody = {
    schema_version: "ape.invoke-refresh-apply-receipt/v1",
    refresh_id: refreshId,
    applied_at_utc: new Date().toISOString(),
    result: "pass",
    apply_status: "applied-and-postvalidated",
    mutation_mode: "apply-approved",
    exact_target_count: 38,
    material_package_id: materialPackage.package_id,
    material_package_digest: packageDigest,
    material_receipt: exactRef(`${refreshRel}/MATERIAL-RECEIPT.json`),
    original_handoff: exactRef(`${refreshRel}/APPLY-HANDOFF-RESULT.json`),
    post_apply_validation: exactRef(postValidationRel),
    rollback_manifest: exactRef(`${refreshRel}/ROLLBACK-MANIFEST.json`),
    live_postimage_aggregate_sha256: liveAggregate,
    closure: {
      work_pack_a: "candidate-local-prototype-closed-with-findings",
      terminal_receipts: 10,
      closeout_receipts: 10,
      work_pack_verification: "pass",
      selected_subject_result: "fail",
      primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
    },
    remaining_frontier: {
      work_pack_b: "blocked",
      nearest_missing_predecessor: "WP-RMT-002 Workflow realization",
      nearest_ape_unit_after_predecessor: "SWU-AWF-001",
    },
    lifecycle_ceiling: {
      synchronized_task_session_closeout: false,
      canonical_closeout: false,
      profile_admitted: false,
      authority_effect: "none",
    },
    external_effects: { network: false, git: false, registry: false, ontology: false, publication: false, deployment: false },
  };
  writeJson(applyReceiptRel, withDigest(receiptBody));
  console.log(JSON.stringify({
    result: "pass",
    refresh_id: refreshId,
    live_target_count: 38,
    live_postimage_aggregate_sha256: liveAggregate,
    product_tests: "100/100",
    strict_typescript: "pass",
    work_pack_a: "candidate-local-prototype-closed-with-findings",
    work_pack_b: "blocked",
    apply_receipt_sha256: exactRef(applyReceiptRel).sha256,
  }, null, 2));
} catch (error) {
  if (applied.length > 0 && !rolledBack) rollback(error instanceof Error ? error.message : String(error));
  writeJson(`${refreshRel}/APPLY-FAILURE.json`, {
    schema_version: "ape.invoke-refresh-apply-failure/v1",
    refresh_id: refreshId,
    failed_at_utc: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    applied_before_failure: applied,
    rolled_back: rolledBack,
  });
  throw error;
}
