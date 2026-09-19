#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const refreshId = "20260821T044424Z-wp-ape-operation-profile-closeout";
const capturedAt = "2026-08-21T04:44:24Z";
const runRel = "projects/domainspec-v2/development/refinement-runs/20260820T193401Z-ape-operation-workflow-realization-work-packs";
const candidateRel = `${runRel}/candidates`;
const productRel = "projects/domainspec-v2/development/architecture-pattern-enforcement";
const evidenceRel = `${productRel}/evidence/WP-APE-OP-PROFILE-001`;
const refreshRel = `${productRel}/refreshes/${refreshId}`;
const refreshRoot = path.join(repoRoot, refreshRel);
const stagedRoot = path.join(refreshRoot, "staged");
const prototypeRel = ".task-session/runs/20260821T041210Z-wp-ape-operation-profile-fast-lane/PROTOTYPE-VALIDATION.json";
const invocationRel = ".task-session/runs/20260821T041210Z-wp-ape-operation-profile-fast-lane/INVOCATION-ENVELOPE.json";
const handoffJsonRel = ".arcanum/handoff-notices/notices/HN-4827AD3FD7AF.json";
const handoffMarkdownRel = ".arcanum/handoff-notices/notices/HN-4827AD3FD7AF.md";
const rmtCandidateRel = "projects/domainspec-v2/development/remaining-meta-types/candidates/operation.json";
const rmtReceiptRel = "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-010.json";
const prevalidationRel = `${refreshRel}/PRE-CLOSEOUT-VALIDATION.json`;
const baselineRel = `${refreshRel}/PRE-APPLY-BASELINE.json`;
const approvalRel = `${refreshRel}/APPROVAL-EVIDENCE.json`;
const verificationRel = `${evidenceRel}/WORK-PACK-VERIFICATION.json`;
const validatorRel = `${refreshRel}/validation/validate-closeout-refresh.mjs`;
const swuIds = Array.from({ length: 10 }, (_, index) => `SWU-AOP-${String(index + 1).padStart(3, "0")}`);

const planTargets = [
  `${candidateRel}/README.md`,
  `${candidateRel}/EXECUTION-PACK.md`,
  `${candidateRel}/IMPLEMENTATION-LAYERING.md`,
  `${candidateRel}/PLAN-TRANSPORT-REPORT.json`,
  `${candidateRel}/PLAN-VALIDATION-RECEIPT.json`,
  `${candidateRel}/SWU-MANIFEST.json`,
  `${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`,
  `${candidateRel}/WORK-PACK-A-OPERATION-PROFILE-EXTENSION.md`,
  `${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`,
  `${candidateRel}/WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md`,
  `${candidateRel}/validate-plan-consistency.mjs`,
  `${candidateRel}/work-pack-a-operation/WAVES.md`,
  `${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-FIXTURES-CLOSE.md`,
  `${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-INTEGRATION.md`,
  `${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-OBSERVATION.md`,
  `${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-PACKET-PROFILE.md`,
  `${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-VERIFY.md`,
];
const terminalTargets = swuIds.map((swuId) => `${evidenceRel}/${swuId}-terminal-source.json`);
const closeoutTargets = swuIds.map((swuId) => `${evidenceRel}/${swuId}-closeout.json`);
const targets = [...planTargets, ...terminalTargets, ...closeoutTargets, verificationRel];

function absolute(relativePath, root = repoRoot) {
  const resolved = path.resolve(root, relativePath);
  const resolvedRoot = path.resolve(root);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`path escape: ${relativePath}`);
  }
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

function readText(relativePath, root = repoRoot) {
  return readBytes(relativePath, root).toString("utf8");
}

function readJson(relativePath, root = repoRoot) {
  return JSON.parse(readText(relativePath, root));
}

function writeBytes(relativePath, bytes, root = repoRoot) {
  const file = absolute(relativePath, root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
}

function writeText(relativePath, text, root = repoRoot) {
  if (!text.endsWith("\n")) throw new Error(`text output lacks final newline: ${relativePath}`);
  writeBytes(relativePath, Buffer.from(text, "utf8"), root);
}

function writeJson(relativePath, value, root = repoRoot) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`, root);
}

function exactRef(relativePath, root = repoRoot) {
  const bytes = readBytes(relativePath, root);
  return { path: relativePath, sha256: shaBytes(bytes), size_bytes: bytes.length };
}

function stageText(relativePath, text) {
  writeText(relativePath, text, stagedRoot);
}

function stageJson(relativePath, value) {
  writeJson(relativePath, value, stagedRoot);
}

function stagedRef(relativePath) {
  return exactRef(relativePath, stagedRoot);
}

function receiptWithDigest(body) {
  return { ...body, receipt_digest: shaBytes(Buffer.from(canonicalJson(body), "utf8")) };
}

function replaceOnce(text, before, after, label) {
  const first = text.indexOf(before);
  if (first === -1) throw new Error(`${label}: expected text missing`);
  if (text.indexOf(before, first + before.length) !== -1) throw new Error(`${label}: expected text is not unique`);
  return `${text.slice(0, first)}${after}${text.slice(first + before.length)}`;
}

function replaceSection(text, heading, nextHeading, body, label) {
  const start = text.indexOf(`${heading}\n`);
  if (start === -1) throw new Error(`${label}: missing ${heading}`);
  const end = text.indexOf(`${nextHeading}\n`, start + heading.length + 1);
  if (end === -1) throw new Error(`${label}: missing ${nextHeading}`);
  return `${text.slice(0, start)}${heading}\n\n${body.trim()}\n\n${text.slice(end)}`;
}

function run(argv, cwd) {
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    argv,
    cwd: path.relative(repoRoot, cwd) || ".",
    exit_status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function assertPass(result, label) {
  if (result.exit_status !== 0) {
    throw new Error(`${label} failed (${result.exit_status}): ${result.stderr || result.stdout}`);
  }
}

function commandRecord(result, extra = {}) {
  return {
    argv: result.argv,
    cwd: result.cwd,
    exit_status: result.exit_status,
    stdout_sha256: shaBytes(Buffer.from(result.stdout, "utf8")),
    stderr_sha256: shaBytes(Buffer.from(result.stderr, "utf8")),
    ...extra,
  };
}

function inventoryDigest(refs) {
  const lines = refs.map((ref) => `${ref.sha256}\t${ref.size_bytes}\t${ref.path}\n`).sort().join("");
  return shaBytes(Buffer.from(lines, "utf8"));
}

function copyMissingSupportTree(sourceDirectory, targetDirectory) {
  const copiedFiles = [];
  const createdDirectories = [];
  function visit(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target);
      createdDirectories.push(target);
    }
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`staged support symlink rejected: ${sourcePath}`);
      if (entry.isDirectory()) {
        visit(sourcePath, targetPath);
      } else if (entry.isFile() && !fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
        copiedFiles.push(targetPath);
      }
    }
  }
  visit(sourceDirectory, targetDirectory);
  return { copiedFiles, createdDirectories };
}

function removeCopiedSupport({ copiedFiles, createdDirectories }) {
  for (const file of copiedFiles) fs.unlinkSync(file);
  for (const directory of [...createdDirectories].sort((a, b) => b.length - a.length)) {
    if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
  }
}

fs.mkdirSync(stagedRoot, { recursive: true });

const prototype = readJson(prototypeRel);
const invocation = readJson(invocationRel);
const handoff = readJson(handoffJsonRel);
const manifestPreimage = readJson(`${candidateRel}/SWU-MANIFEST.json`);
const operationPackPreimage = manifestPreimage.work_packs.find((workPack) => workPack.work_pack_id === "WP-APE-OP-PROFILE-001");
const workflowPackPreimage = manifestPreimage.work_packs.find((workPack) => workPack.work_pack_id === "WP-APE-WF-PROFILE-001");
if (!operationPackPreimage || !workflowPackPreimage) throw new Error("missing Work Pack in manifest");
if (operationPackPreimage.swus.length !== 10 || workflowPackPreimage.swus.length !== 11) throw new Error("unexpected SWU count");
if (prototype.work_pack?.result !== "prototype-pass-through-swu-aop-010") throw new Error("prototype Work Pack result mismatch");
if (prototype.validation?.result !== "pass" || prototype.independent_audit?.result !== "pass") throw new Error("prototype validation/audit is not pass");
if (prototype.prototype_result?.observed_completion_receipt?.result !== "fail") throw new Error("selected subject fail was not preserved");
if (prototype.prototype_result?.observed_completion_receipt?.primary_failure !== "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT") throw new Error("selected subject primary finding mismatch");
if (handoff.notice_code !== "HN-4827AD3FD7AF" || handoff.payload?.status !== "open") throw new Error("handoff notice mismatch");

const reportByPath = new Map((prototype.product_inventory?.files ?? []).map((entry) => [`${prototype.product_inventory.root}/${entry.path}`, entry]));
const manifestSourcePaths = operationPackPreimage.swus.flatMap((swu) => swu.write_scope);
if (manifestSourcePaths.length !== 24 || new Set(manifestSourcePaths).size !== 24 || reportByPath.size !== 24) throw new Error("24-file denominator mismatch");
if (JSON.stringify([...new Set(manifestSourcePaths)].sort()) !== JSON.stringify([...reportByPath.keys()].sort())) throw new Error("manifest/report source set mismatch");
for (const [relativePath, reportEntry] of reportByPath) {
  const current = exactRef(relativePath);
  if (current.sha256 !== reportEntry.sha256 || current.size_bytes !== reportEntry.size_bytes) throw new Error(`product source drift: ${relativePath}`);
}
for (const target of [...terminalTargets, ...closeoutTargets, verificationRel]) {
  if (fs.existsSync(absolute(target))) throw new Error(`create target unexpectedly exists: ${target}`);
}
const rmtCandidateRef = exactRef(rmtCandidateRel);
const rmtReceiptRef = exactRef(rmtReceiptRel);
if (rmtCandidateRef.sha256 !== prototype.predecessor_locks?.operation_candidate?.sha256) throw new Error("RMT Operation candidate drift");
if (rmtReceiptRef.sha256 !== prototype.predecessor_locks?.rmt_op_010_receipt?.sha256) throw new Error("RMT-OP-010 receipt drift");

const testFiles = [
  "../development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.test.ts",
  "../development/architecture-pattern-enforcement/fixtures/operation-profile/fixture.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-dependency-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-boundary-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-cost-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-persistence-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-transaction-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-event-boundary-observer.test.ts",
  "../development/architecture-pattern-enforcement/evaluators/operation-profile-evaluator.test.ts",
];
const sourceFiles = [
  "../development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.ts",
  "../development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.test.ts",
  "../development/architecture-pattern-enforcement/fixtures/operation-profile/fixture.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-dependency-observer.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-dependency-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-boundary-observer.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-boundary-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-cost-observer.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-cost-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-persistence-observer.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-persistence-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-transaction-observer.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-transaction-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-event-boundary-observer.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-event-boundary-observer.test.ts",
  "../development/architecture-pattern-enforcement/evaluators/operation-profile-evaluator.ts",
  "../development/architecture-pattern-enforcement/evaluators/operation-profile-evaluator.test.ts",
];
const implRoot = path.join(repoRoot, "projects/domainspec-v2/impl");
const testArgv = ["./node_modules/.bin/tsx", "--test", ...testFiles];
const tscArgv = [
  "./node_modules/.bin/tsc", "--noEmit", "--strict", "--skipLibCheck", "--target", "ES2022",
  "--module", "NodeNext", "--moduleResolution", "NodeNext", "--types", "node", "--allowImportingTsExtensions",
  ...sourceFiles,
];
const testResult = run(testArgv, implRoot);
assertPass(testResult, "integrated product suite");
const testsPassed = Number(testResult.stdout.match(/# pass (\d+)/)?.[1] ?? 0);
const testsTotal = Number(testResult.stdout.match(/# tests (\d+)/)?.[1] ?? 0);
if (testsPassed !== 100 || testsTotal !== 100) throw new Error(`unexpected integrated test count: ${testsPassed}/${testsTotal}`);
const tscResult = run(tscArgv, implRoot);
assertPass(tscResult, "strict TypeScript");
const tsxVersionResult = run(["./node_modules/.bin/tsx", "--version"], implRoot);
const tscVersionResult = run(["./node_modules/.bin/tsc", "--version"], implRoot);
assertPass(tsxVersionResult, "tsx version");
assertPass(tscVersionResult, "tsc version");

const prevalidation = {
  schema_version: "ape.pre-closeout-validation/v1",
  refresh_id: refreshId,
  captured_at_utc: capturedAt,
  result: "pass",
  runtime: {
    node: process.version,
    tsx: tsxVersionResult.stdout.trim(),
    typescript: tscVersionResult.stdout.trim(),
  },
  integrated_suite: {
    ...commandRecord(testResult),
    test_files: testFiles,
    tests_total: testsTotal,
    tests_passed: testsPassed,
    tests_failed: 0,
  },
  strict_typescript: {
    ...commandRecord(tscResult),
    source_files: sourceFiles,
  },
  validation_attempts: [
    {
      attempt_id: "strict-typescript-initial-missing-import-suffix-flag",
      exit_status: 2,
      classification: "validation-harness-configuration",
      product_bytes_changed: false,
      missing_option: "--allowImportingTsExtensions",
      disposition: "preserved as failed and superseded only by the corrected exact command above",
    },
  ],
  failure_status_preservation: "The initial TypeScript invocation remains recorded as exit 2. It is not counted as acceptance; the corrected exact command is a distinct invocation and passed. No cleanup command masks either status.",
  prototype_inventory: {
    file_count: 24,
    total_size_bytes: prototype.product_inventory.total_size_bytes,
    ordered_aggregate_sha256: prototype.product_inventory.ordered_aggregate.sha256,
    sorted_repository_path_aggregate_sha256: prototype.product_inventory.sorted_repository_path_aggregate.sha256,
  },
  selected_subject_evaluation: {
    result: "fail",
    primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
    interpretation: "The implementation and evaluator validation pass; the selected Poker source retains one honest architecture finding.",
  },
  authority_effect: "none",
};
writeJson(prevalidationRel, prevalidation);

const baseline = {
  schema_version: "ape.refresh-pre-apply-baseline/v1",
  refresh_id: refreshId,
  captured_at_utc: capturedAt,
  targets: targets.map((target) => {
    const file = absolute(target);
    if (!fs.existsSync(file)) return { path: target, state: "absent", sha256: null, size_bytes: null };
    const ref = exactRef(target);
    return { path: target, state: "present", sha256: ref.sha256, size_bytes: ref.size_bytes };
  }),
  concurrent_write_policy: "reject-any-drift-before-apply",
  authority_effect: "none",
};
writeJson(baselineRel, baseline);

const approval = {
  schema_version: "ape.invoke-refresh-approval-evidence/v1",
  refresh_id: refreshId,
  activation_source: "direct-user",
  mutation_mode: "apply-approved",
  user_request: "refresh the work packs so we can close, and then search next implementastion",
  declared_scope_paths: targets,
  semantic_contract: {
    work_pack_a: "close only as candidate-local prototype with the selected Poker finding retained",
    work_pack_b: "refresh predecessor state but keep Workflow implementation blocked",
    synchronized_task_session_closeout: false,
    profile_admission: false,
    authority_effect: "none",
  },
  forbidden_effects: ["product-code-change", "registry", "ontology", "git", "publication", "release", "deployment", "production"],
};
writeJson(approvalRel, approval);

const prototypeRef = exactRef(prototypeRel);
const invocationRef = exactRef(invocationRel);
const handoffRef = exactRef(handoffJsonRel);
const prevalidationRef = exactRef(prevalidationRel);
const baselineRef = exactRef(baselineRel);
const workPackAPreimageRef = exactRef(`${candidateRel}/WORK-PACK-A-OPERATION-PROFILE-EXTENSION.md`);

for (const swu of operationPackPreimage.swus) {
  const terminalPath = `${evidenceRel}/${swu.swu_id}-terminal-source.json`;
  const terminal = receiptWithDigest({
    schema_version: "arcanum.task-session-terminal-source-receipt/v1",
    run_id: prototype.run_id,
    work_pack_id: "WP-APE-OP-PROFILE-001",
    swu_id: swu.swu_id,
    attempt_id: `${prototype.run_id}:${swu.swu_id}`,
    idempotency_key: `${prototype.run_id}:terminal:${swu.swu_id}`,
    capability_ref: "task-session-until-blocker",
    status: "pass",
    receipt_kind: "local-fallback",
    receipt_artifact: terminalPath,
    execution_lane: "candidate-local-prototype-fast-lane",
    derived_from_consolidated_evidence: true,
    source_evidence: {
      prototype_validation: prototypeRef,
      invocation_envelope: invocationRef,
      deferred_governance_handoff: handoffRef,
    },
    files_touched: swu.write_scope,
    source_targets: swu.write_scope.map((target) => exactRef(target)),
    validation: {
      result: "pass",
      contract_ref: prevalidationRef,
      command_ids: ["aop-integrated-suite", "aop-strict-typescript"],
    },
    blockers: [],
    residue: {
      selected_subject_result: "fail",
      selected_subject_primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
      synchronized_task_session_closeout: false,
      profile_admitted: false,
      canonical_closeout: false,
    },
    reroute: "invoke:refresh:apply-approved",
    handoff_note: "Derived from the exact consolidated fast-lane report because per-SWU Task Sessions were deliberately deferred; this is a candidate-local local-fallback terminal projection, not a synchronized Task Session receipt.",
    authority_effect: "none",
  });
  stageJson(terminalPath, terminal);
}

for (let index = 0; index < operationPackPreimage.swus.length; index += 1) {
  const swu = operationPackPreimage.swus[index];
  const terminalPath = `${evidenceRel}/${swu.swu_id}-terminal-source.json`;
  const closeoutPath = `${evidenceRel}/${swu.swu_id}-closeout.json`;
  const successorId = index + 1 < operationPackPreimage.swus.length ? operationPackPreimage.swus[index + 1].swu_id : null;
  const closeout = receiptWithDigest({
    schema_version: "ape.invoke-refresh-candidate-local-closeout/v1",
    receipt_id: `${refreshId}:${swu.swu_id}:closeout`,
    work_pack_id: "WP-APE-OP-PROFILE-001",
    swu_id: swu.swu_id,
    owner_identity: {
      capability: "invoke",
      mode: "refresh",
      mutation_mode: "apply-approved",
      activation_source: "direct-user",
      lifecycle_owner: "projects/domainspec-v2",
    },
    terminal_source_ref: stagedRef(terminalPath),
    baseline_ref: baselineRef,
    work_pack_preimage: {
      path: workPackAPreimageRef.path,
      sha256: workPackAPreimageRef.sha256,
      size_bytes: workPackAPreimageRef.size_bytes,
      state_at: "pre-apply",
    },
    lifecycle_result: {
      status: "closed-candidate-local",
      implementation_validation: "pass",
      synchronized_task_session_closeout: false,
      canonical_closeout: false,
      profile_admitted: false,
      authority_effect: "none",
    },
    validation_inventory: [
      { validation_id: "terminal-source", result: "pass", evidence_ref: stagedRef(terminalPath) },
      { validation_id: "consolidated-prototype", result: "pass", evidence_ref: prototypeRef },
      { validation_id: "exact-command-replay", result: "pass", evidence_ref: prevalidationRef },
    ],
    successor: {
      swu_id: successorId,
      status: successorId ? "already-executed-in-same-fast-lane" : "work-pack-verification-required",
      selected: false,
      authority_granted: false,
    },
    authority_effect: "none",
  });
  stageJson(closeoutPath, closeout);
}

const terminalRefs = terminalTargets.map(stagedRef);
const closeoutRefs = closeoutTargets.map(stagedRef);
const verification = receiptWithDigest({
  schema_version: "ape.operation-work-pack-verification/v1",
  verification_id: `${refreshId}:WORK-PACK-VERIFICATION`,
  run_id: prototype.run_id,
  work_pack_id: "WP-APE-OP-PROFILE-001",
  result: "pass",
  execution_lane: "candidate-local-prototype-fast-lane",
  prototype_validation_ref: prototypeRef,
  precloseout_validation_ref: prevalidationRef,
  terminal_receipts: terminalRefs,
  closeout_receipts: closeoutRefs,
  product_inventory: {
    root: prototype.product_inventory.root,
    file_count: prototype.product_inventory.file_count,
    total_size_bytes: prototype.product_inventory.total_size_bytes,
    ordered_aggregate_sha256: prototype.product_inventory.ordered_aggregate.sha256,
    sorted_repository_path_aggregate_sha256: prototype.product_inventory.sorted_repository_path_aggregate.sha256,
  },
  selected_subject_evaluation: {
    result: "fail",
    applicable_count: 10,
    not_applicable_count: 3,
    pass_count: 3,
    fail_count: 1,
    missing_count: 3,
    unsupported_count: 0,
    owner_blocked_count: 3,
    primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
    implementation_interpretation: "The evaluator implementation passes and correctly preserves the selected source finding.",
  },
  lifecycle_ceiling: {
    candidate_local_lifecycle_reconciled: true,
    synchronized_task_session_closeout: false,
    canonical_closeout: false,
    profile_admitted: false,
    promoted: false,
    published: false,
    released: false,
    deployed: false,
    production_ready: false,
  },
  next_route: "continuation-router:search-next-implementation",
  authority_effect: "none",
});
stageJson(verificationRel, verification);
const verificationRef = stagedRef(verificationRel);
const terminalAggregate = inventoryDigest(terminalRefs);
const closeoutAggregate = inventoryDigest(closeoutRefs);

const manifest = structuredClone(manifestPreimage);
manifest.status = "operation-prototype-closed-workflow-blocked";
manifest.generated_at = capturedAt;
manifest.first_candidate_swu = "SWU-AWF-001";
manifest.first_unit_narrowness = "pass-blocked-on-workflow-predecessor";
manifest.evidence_lane_admission.current_predecessor_availability.Operation = "candidate-local Work Pack A closed through AOP-010; RMT-OP-010 exact receipt remains locked";
manifest.evidence_lane_admission.current_predecessor_availability.Workflow = "absent; exact candidate-local Workflow RMT predecessor and declared prerequisites have not run";
manifest.validation_admission_contract = {
  applies_to: "work_packs[1].swus[*]",
  state: "blocked",
  blocker: "R-08",
  reason: "Workflow task-local executable, fixture, and exact-diagnostic contracts remain admission-time work; Work Pack A is covered by the exact retrospective validation contract below.",
  required_before_selection: manifestPreimage.validation_admission_contract.required_before_selection,
  completed_work_pack_exemption: {
    work_pack_id: "WP-APE-OP-PROFILE-001",
    validation_contract_ref: prevalidationRef,
    tests_passed: 100,
    strict_typescript: "pass",
  },
  claim_effect: "Work Pack A is candidate-local lifecycle-closed; no Workflow SWU is selectable.",
};
manifest.prototype_closeout = {
  work_pack_id: "WP-APE-OP-PROFILE-001",
  state: "closed-candidate-local-with-findings",
  prototype_validation_ref: prototypeRef,
  terminal_receipt_count: 10,
  terminal_receipt_aggregate_sha256: terminalAggregate,
  closeout_receipt_count: 10,
  closeout_receipt_aggregate_sha256: closeoutAggregate,
  verification_receipt: verificationRef,
  selected_subject_result: "fail",
  primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
  synchronized_task_session_closeout: false,
  canonical_closeout: false,
  profile_admitted: false,
  authority_effect: "none",
  residue: [
    "R-01 retained as reference-only Rule ordering without promotion",
    "R-02 and System Integration inputs remain candidate-local or owner-blocked",
    "R-07 transport and delivery remain owner-blocked",
    "R-09 dynamic resolution remains unsupported",
    "R-10 absent cost budget remains advisory/owner-blocked",
    "Selected Poker source retains AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
  ],
};
const operationPack = manifest.work_packs.find((workPack) => workPack.work_pack_id === "WP-APE-OP-PROFILE-001");
operationPack.frontier_state = "closed-candidate-local-with-findings";
for (const swu of operationPack.swus) {
  const terminalPath = `${evidenceRel}/${swu.swu_id}-terminal-source.json`;
  const closeoutPath = `${evidenceRel}/${swu.swu_id}-closeout.json`;
  swu.handoff_status = "closed-candidate-local";
  swu.blockers = [];
  swu.acceptance_evidence = [
    `candidate-local local-fallback terminal projection: ${terminalPath}`,
    "exact integrated fixture/validator result: 100/100 pass",
    "strict TypeScript and scoped content/hygiene pass",
    `lifecycle owner candidate-local closeout: ${closeoutPath}`,
  ];
  swu.validation_surface[0] = `execution-bound:${swu.swu_id}:exact Node v22.13.0 / tsx v4.23.12 / TypeScript 5.9.3 commands and failure-status propagation are bound by ${prevalidationRel}`;
  swu.closure_evidence = {
    result: "pass",
    terminal_source_receipt: stagedRef(terminalPath),
    closeout_receipt: stagedRef(closeoutPath),
    source_report: prototypeRef,
    synchronized_task_session_closeout: false,
    authority_effect: "none",
  };
}
const workflowPack = manifest.work_packs.find((workPack) => workPack.work_pack_id === "WP-APE-WF-PROFILE-001");
workflowPack.frontier_state = "blocked-before-workflow-rmt-predecessor";
const awf001 = workflowPack.swus.find((swu) => swu.swu_id === "SWU-AWF-001");
awf001.predecessor_evidence = {
  aop_packet_closeout: { ...stagedRef(`${evidenceRel}/SWU-AOP-001-closeout.json`), status: "available-candidate-local" },
  workflow_rmt_predecessor: { status: "absent", owner: "WP-RMT-002" },
  progression_selection: { status: "open", blocker: "R-12" },
};
stageJson(`${candidateRel}/SWU-MANIFEST.json`, manifest);

const operationEntry = readJson(`${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`);
operationEntry.pre_execution_owner_prerequisite = {
  lifecycle_state: "closed-candidate-local-with-findings",
  prototype_validation_ref: prototypeRef,
  terminal_source_receipts: { count: 10, aggregate_sha256: terminalAggregate },
  closeout_receipts: { count: 10, aggregate_sha256: closeoutAggregate },
  verification_receipt: verificationRef,
  synchronized_task_session_closeout: false,
  profile_admitted: false,
  reentry_requires_new_refresh: true,
};
operationEntry.continuation_rule = "The current candidate-local Work Pack A lane is terminally closed with one retained Poker architecture finding. Historical routes remain as plan provenance but cannot be reused; any reentry requires a new exact refresh and owner decision.";
stageJson(`${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`, operationEntry);

const workflowEntry = readJson(`${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`);
workflowEntry.pre_execution_owner_prerequisite = {
  packet_predecessor: { ...stagedRef(`${evidenceRel}/SWU-AOP-001-closeout.json`), status: "available-candidate-local" },
  workflow_rmt_predecessor: { status: "absent", owner: "WP-RMT-002", required_before: "SWU-AWF-001" },
  workflow_progression_selection: { status: "open", blocker: "R-12" },
  later_owner_gates: ["R-03", "R-04", "R-05", "R-06", "R-07", "R-08", "R-09", "R-10", "R-11"],
};
workflowEntry.continuation_rule = "Remain blocked. The AOP-001 packet prerequisite is now available candidate-local, but the exact Workflow RMT predecessor and Workflow-specific R-12 selection are absent; later mode/runtime/integration gates remain unchanged.";
stageJson(`${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`, workflowEntry);

const readme = `# Candidate Plan Bundle\n\nThe refreshed bundle now represents a mixed frontier:\n\n- [Operation Work Pack A](WORK-PACK-A-OPERATION-PROFILE-EXTENSION.md) is candidate-local prototype-closed through AOP-010 with ten local-fallback terminal projections, ten lifecycle closeouts, and one [Work-Pack verification receipt](../../../architecture-pattern-enforcement/evidence/WP-APE-OP-PROFILE-001/WORK-PACK-VERIFICATION.json).\n- The selected Poker evaluation honestly remains \`fail\` with \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`; this is a source architecture finding, not an evaluator implementation failure.\n- [Workflow Work Pack B](WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md) remains blocked. Its AOP-001 packet prerequisite is available candidate-local, but the exact Workflow RMT predecessor and Workflow-specific owner selection are absent.\n- [SWU manifest](SWU-MANIFEST.json), [execution pack](EXECUTION-PACK.md), [layering](IMPLEMENTATION-LAYERING.md), and both execution entries carry the same mixed-frontier state.\n\nCandidate-local lifecycle reconciliation does not mean synchronized Task Session closeout, profile admission, promotion, publication, release, deployment, or production readiness. Authority effect remains none.\n`;
stageText(`${candidateRel}/README.md`, readme);

let workPackA = readText(`${candidateRel}/WORK-PACK-A-OPERATION-PROFILE-EXTENSION.md`);
workPackA = replaceOnce(workPackA, "status: blocked-before-execution", "status: candidate-local-prototype-closed-with-findings", "Work Pack A frontmatter status");
workPackA = replaceOnce(workPackA, "updatedAt: 2026-08-20", "updatedAt: 2026-08-21", "Work Pack A updatedAt");
const originalOutcomeA = "This Work Pack plans a TypeScript application-architecture profile for already-realized RMT Operations. It makes dependency construction, responsibility/value-effect placement, dependency-specific forms, measured cost/loop evidence, and concern-specific infrastructure joins inspectable through existing APE concepts. It does not realize Operation, redefine business semantics, introduce a DI framework or generic Port, or authorize execution.";
const refreshedOutcomeA = "This Work Pack now records a completed candidate-local implementation of the TypeScript Operation application-architecture profile. The implementation makes dependency construction, responsibility/value-effect placement, measured cost/loop evidence, and concern-specific joins inspectable through existing APE concepts. It does not redefine Operation semantics, admit the profile, introduce a DI framework or generic Port, or authorize promotion.";
workPackA = replaceOnce(workPackA, originalOutcomeA, refreshedOutcomeA, "Work Pack A outcome");
workPackA = replaceOnce(workPackA, "## Control Fields", `## 2026-08-21 Candidate-Local Closure\n\nWork Pack A is **candidate-local prototype-closed with findings**. AOP-001 through AOP-010 have exact local-fallback terminal projections and lifecycle receipts derived from the consolidated fast-lane evidence, followed by an independent Work-Pack verification receipt. The executable replay passed 100/100 tests and strict TypeScript.\n\nThe selected Poker subject remains \`fail\` with \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`. That finding is preserved; it is not converted into an evaluator failure or a profile pass. Candidate-local lifecycle reconciliation is complete, while synchronized Task Session closeout remains false. Profile admission, canonical closeout, authority, promotion, publication, release, deployment, and production readiness remain false.\n\n- Prototype report: \`${prototypeRel}\`\n- Terminal receipt aggregate: \`${terminalAggregate}\` (10 receipts)\n- Closeout receipt aggregate: \`${closeoutAggregate}\` (10 receipts)\n- Verification receipt: \`${verificationRel}\` (SHA-256 \`${verificationRef.sha256}\`)\n\n## Control Fields`, "Work Pack A closure insertion");
const controlReplacementsA = [
  ["| `workPackGateStatus` | `block` | `R-08`, `R-12`, and other named owner gates prevent mutation-capable entry. |", "| `workPackGateStatus` | `candidate-local-closed` | The current fast-lane implementation is closed; reentry requires a new Refresh. |"],
  ["| `distillValidationStatus` | `pass` | Stage 9 repaired the terminal critic findings and replayed exact Plan validation; execution remains blocked. |", "| `distillValidationStatus` | `pass` | The authored design still recomposes; final-byte prototype validation and closeout validation also pass. |"],
  ["| `firstUnitNarrownessStatus` | `pass-unselected` | AOP-001 is the unique first candidate; no unit is selected. |", "| `firstUnitNarrownessStatus` | `historical-pass` | AOP-001 was the first fast-lane unit; the full ten-unit chain is now closed candidate-local. |"],
  ["| `closeoutSyncStatus` | `pass` | Every mutation-capable SWU has an exact target, baseline, delta, validation, receipt, and successor contract. |", "| `closeoutSyncStatus` | `candidate-local-reconciled` | Ten terminal projections and ten closeouts exist; synchronized Task Session closeout remains false. |"],
  ["| `swuValidationBindingStatus` | `block-pending-R-08` | Task algorithms and review surfaces exist, but no SWU may be selected until its exact executable/version, argv, cwd, fixture IDs, expected results/diagnostics, and failure propagation are frozen. |", "| `swuValidationBindingStatus` | `pass-for-closed-operation-scope` | Exact Node/tsx/TypeScript argv, cwd, fixtures, diagnostics, and failure-status propagation are bound in the pre-closeout validation receipt. |"],
  ["| `executionEntryState` | `blocked` | Machine projection validates but truthfully has no selected unit, route, or next owner. |", "| `executionEntryState` | `blocked-terminal` | The schema vocabulary remains `blocked`; the prerequisite object marks the lane terminal and requires a new Refresh for reentry. |"],
  ["| `activeLayerWindow` | `n/a` | L0 is planned but not admitted. |", "| `activeLayerWindow` | `closed L0-L2` | Operation layers are closed candidate-local; Workflow layers remain separate. |"],
];
for (const [before, after] of controlReplacementsA) workPackA = replaceOnce(workPackA, before, after, "Work Pack A control field");
workPackA = replaceSection(workPackA, "## Current Predecessor State", "## Source Contracts", `| Input | Current state | Consumed ceiling | Not implied |\n| --- | --- | --- | --- |\n| RMT Operation | exact candidate \`${rmtCandidateRef.sha256}\` and RMT-OP-010 receipt \`${rmtReceiptRef.sha256}\` validate | Operation realization evidence only | APE profile admission |\n| APE product bytes | 24 exact files / ${prototype.product_inventory.total_size_bytes} bytes / aggregate \`${prototype.product_inventory.ordered_aggregate.sha256}\` | candidate-local implementation | publication or production |\n| lifecycle evidence | 10 local-fallback terminals + 10 candidate-local closeouts + verification pass | candidate-local reconciliation | synchronized Task Session or canonical closeout |\n| selected Poker subject | \`fail\`: \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\` | exact source finding | evaluator implementation failure |\n| next-type selection | Work Pack A consumed its direct fast-lane selection; no Workflow selection inferred | current Work Pack only | Work Pack B execution`, "Work Pack A predecessor section");
for (const taskName of ["TASK-AOP-PACKET-PROFILE", "TASK-AOP-OBSERVATION", "TASK-AOP-INTEGRATION", "TASK-AOP-FIXTURES-CLOSE"]) {
  workPackA = workPackA.replace(new RegExp(`(\\| \\[${taskName}\\][^\\n]*\\|) not started \\|`), "$1 prototype complete |");
}
for (const swuId of swuIds) {
  workPackA = workPackA.replace(new RegExp("(\\\\| `" + swuId + "`[^\\\\n]*\\\\|) blocked \\\\|"), "$1 closed candidate-local |");
}
workPackA = replaceSection(workPackA, "## First Unit Narrowness", "## Dependency Graph", "AOP-001 was the narrowest first unit and the fast lane preserved the declared order through AOP-010. No unit is currently selected. The current entry is terminally locked; a new exact Refresh is required before any Operation reentry.", "Work Pack A narrowness section");
workPackA = replaceSection(workPackA, "## Task Session Closeout Sync Contract", "## Validation Strategy", `The authored topology is now materialized without pretending that the fast lane ran ten native Task Sessions:\n\n1. ten \`arcanum.task-session-terminal-source-receipt/v1\` **local-fallback projections** bind the exact per-SWU source subsets to the consolidated report and exact replay commands;\n2. ten \`ape.invoke-refresh-candidate-local-closeout/v1\` receipts close those units at the candidate-local ceiling;\n3. \`WORK-PACK-VERIFICATION.json\` proves the 24-file denominator, receipt continuity, exact subject finding, and authority ceiling.\n\nAll three layers retain \`synchronized_task_session_closeout: false\`, \`canonical_closeout: false\`, \`profile_admitted: false\`, and \`authority_effect: none\`.`, "Work Pack A closeout section");
workPackA = replaceSection(workPackA, "## Blocker and Gap Ledger", "## Work-Pack Execution Policy", `| Residue | Closure disposition | Future owner |\n| --- | --- | --- |\n| \`R-01\` | Rule ordering remains reference-only and unpromoted | definitions/RMT owner |\n| \`R-02\`, \`SYSTEM-INTEGRATION-REV2\` | joins accept only exact evidence and otherwise remain owner-blocked | System Integration owner |\n| \`R-07\` | transport and delivery schemas remain owner-blocked | System Integration Refine |\n| \`R-08\` | exact retrospective Operation commands/fixtures/diagnostics are now bound | closed for Work Pack A only |\n| \`R-09\` | dynamic resolution remains unsupported | profile/analyzer owner |\n| \`R-10\` | absent cost budget remains advisory/owner-blocked | semantic/cost owner |\n| \`R-12\` | direct fast-lane selection was consumed only for Work Pack A | remains open for Workflow |\n| Poker finding | \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\` retained | separate Poker remediation scope |`, "Work Pack A residue section");
workPackA = replaceSection(workPackA, "## Work-Pack Execution Policy", "## Dispatch Technique Trace", `The current candidate-local lane is terminal. Historical execute/closeout routes remain in the execution entry as provenance, but the entry is \`blocked\` with \`reentry_requires_new_refresh: true\`. No route is selected and no successor authority is granted.`, "Work Pack A execution policy");
workPackA = replaceSection(workPackA, "## Distill Validation", "## Current State and Next Owner", `The original Stage 9 Plan validation remains historical authoring evidence. The 2026-08-21 Refresh reran the actual 24 product bytes, produced the required receipt topology, and validates the mixed Operation-closed / Workflow-blocked frontier.`, "Work Pack A distill section");
workPackA = replaceSection(workPackA, "## Current State and Next Owner", "## Claim Ceiling", `- Work Pack state: candidate-local prototype-closed with findings.\n- Operation implementation: complete and independently validated through AOP-010.\n- Selected subject: fail with \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`.\n- Lifecycle: candidate-local reconciled; synchronized/canonical closeout false.\n- Next owner: Continuation Router for a read-only next-implementation search.`, "Work Pack A current section");
// replaceSection cannot target EOF; restore the final claim ceiling directly.
const claimStartA = workPackA.lastIndexOf("## Claim Ceiling\n");
if (claimStartA === -1) throw new Error("Work Pack A claim ceiling missing");
workPackA = `${workPackA.slice(0, claimStartA)}## Claim Ceiling\n\nThis Work Pack proves candidate-local implementation and lifecycle reconciliation for the exact 24 files and 20 receipts. It does not prove the selected Poker subject passes, synchronized Task Session closeout, canonical closeout, profile admission, semantic or infrastructure promotion, publication, release, deployment, or production readiness. Authority effect remains none.\n`;
stageText(`${candidateRel}/WORK-PACK-A-OPERATION-PROFILE-EXTENSION.md`, workPackA);

let workPackB = readText(`${candidateRel}/WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md`);
workPackB = replaceOnce(workPackB, "updatedAt: 2026-08-20", "updatedAt: 2026-08-21", "Work Pack B updatedAt");
workPackB = replaceOnce(workPackB, "## Control Fields", `## 2026-08-21 Predecessor Refresh\n\nThe AOP-001 packet prerequisite is now available as a candidate-local closeout at \`${evidenceRel}/SWU-AOP-001-closeout.json\`. The Workflow RMT predecessor remains absent, and Workflow-specific \`R-12\` selection has not occurred. Work Pack B therefore remains blocked; no AWF unit is selected or implemented.\n\n## Control Fields`, "Work Pack B refresh insertion");
workPackB = replaceSection(workPackB, "## Current Predecessor State", "## Source Contracts", `| Input | Current state | Effect |\n| --- | --- | --- |\n| shared packet implementation | AOP-001 schema/validator implemented and validated candidate-local | packet contract is available |\n| AOP-001 frozen packet closeout | \`${evidenceRel}/SWU-AOP-001-closeout.json\`, candidate-local | satisfies only the packet prerequisite ceiling |\n| \`RMT-WF-001..010\` | no applicable Workflow candidate-local pass found in this refresh | every Workflow mutation unit remains blocked |\n| \`R-04\` mode discriminator | unresolved | AWF-005 and later mode-sensitive work remain blocked |\n| Workflow runtime/version/transport records | unadmitted or deferred | AWF-006..008 remain blocked |\n| APE progression \`R-12\` | unresolved for Workflow | whole Work Pack remains blocked`, "Work Pack B predecessor section");
workPackB = replaceSection(workPackB, "## Current State and Next Owner", "## Claim Ceiling", `- Work Pack state: candidate plan authored; Workflow execution blocked.\n- Packet prerequisite: available candidate-local through AOP-001 closeout.\n- Nearest missing predecessor: exact applicable Workflow RMT pass owned by \`WP-RMT-002\`.\n- Nearest future APE unit: AWF-001 only after that predecessor and Workflow-specific \`R-12\` selection.\n- No owner route is auto-dispatched by this Refresh.`, "Work Pack B current section");
stageText(`${candidateRel}/WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md`, workPackB);

let executionPack = readText(`${candidateRel}/EXECUTION-PACK.md`);
executionPack = replaceOnce(executionPack, "Coordinate two high-complexity candidate Work Packs without executing them, coupling their subject receipts, or hiding owner gates. This pack schedules only future Task Session entry and lifecycle closeout for one selected SWU at a time.", "Record the candidate-local closure of Operation Work Pack A while preserving Workflow Work Pack B as a separate blocked frontier. Historical route declarations remain provenance; this pack grants no reentry, Workflow selection, admission, or promotion.", "Execution Pack purpose");
executionPack = replaceSection(executionPack, "## Global Admission Rule", "## Cross-Work-Pack Dependency", "Operation Work Pack A is terminally locked at the candidate-local ceiling. Workflow Work Pack B remains blocked with no selected SWU. The AOP-001 packet closeout is available to a future Workflow predecessor gate, but the exact Workflow RMT pass and Workflow-specific `R-12` selection are absent.", "Execution Pack admission");
executionPack = replaceSection(executionPack, "## Global Wave Board", "## Unit Scheduling", `| Wave | Layer | Work Pack / tasks | Current state | Evidence / next gate |\n| --- | --- | --- | --- | --- |\n| \`W0-OWNER-LOCKS\` | pre-L0 | both Work Packs | resolved for A; open for B | Work Pack A direct fast-lane selection consumed; Workflow \`R-12\` open |\n| \`W1-PACKET\` | L0 | A / AOP-001 | closed candidate-local | exact terminal + closeout receipt |\n| \`W2-OP-PROFILE\` | L0 | A / AOP-002 | closed candidate-local | exact denominator/applicability evidence |\n| \`W3-OP-OBSERVE\` | L1 | A / AOP-003..005 | closed candidate-local | observer tests and receipts |\n| \`W4-OP-JOIN-CLOSE\` | L2 | A / AOP-006..010 + VERIFY | closed candidate-local with finding | verification receipt; Poker finding retained |\n| \`W5-WF-PREDECESSOR\` | L3A | B / AWF-001..002 | blocked | exact Workflow RMT pass + Workflow \`R-12\` |\n| \`W6-WF-SYNC\` | L3A | B / AWF-003,004,009 | blocked | AWF-002 |\n| \`W7-WF-DURABLE\` | L3B | B / AWF-005..008 | blocked | mode/runtime/integration owner contracts |\n| \`W8-WF-CLOSE\` | L3B | B / AWF-010..011 | blocked | prior Workflow evidence |`, "Execution Pack wave board");
executionPack = replaceSection(executionPack, "## Distill and Readiness State", "## Claim Ceiling", `- SWU atomicity: preserved.\n- Operation frontier: 10/10 closed candidate-local; current entry terminally locked.\n- Workflow frontier: 0/11 executed; entry blocked on Workflow RMT predecessor and Workflow \`R-12\`.\n- Mutation readiness: false.\n- Next route: read-only Continuation Router search, led by the Workflow RMT predecessor.`, "Execution Pack readiness");
const claimStartExecution = executionPack.lastIndexOf("## Claim Ceiling\n");
if (claimStartExecution === -1) throw new Error("Execution Pack claim ceiling missing");
executionPack = `${executionPack.slice(0, claimStartExecution)}## Claim Ceiling\n\nThis Execution Pack records candidate-local Operation closure and a blocked Workflow frontier. It does not prove the Poker subject passes, select Workflow work, synchronize native Task Sessions, admit either profile, or grant authority, promotion, publication, release, deployment, or production readiness.\n`;
stageText(`${candidateRel}/EXECUTION-PACK.md`, executionPack);

let layering = readText(`${candidateRel}/IMPLEMENTATION-LAYERING.md`);
layering = replaceOnce(layering, "status: blocked-before-execution", "status: operation-prototype-closed-workflow-blocked", "Layering frontmatter status");
layering = replaceOnce(layering, "updatedAt: 2026-08-20", "updatedAt: 2026-08-21", "Layering updatedAt");
layering = replaceOnce(layering, "- Current state: designed and planned; no profile schema, observer, fixture, evaluator, or completion receipt is implemented by this run.", "- Current state: Operation L0-L2 is implemented and candidate-local lifecycle-closed with one retained Poker finding; Workflow L3A/L3B remains unimplemented and blocked.", "Layering current state");
layering = replaceOnce(layering, "## Global Boundary Rule", `## 2026-08-21 Layer Refresh\n\nL0-L2 closed under exact candidate-local evidence: 24 product files, 100/100 tests, strict TypeScript, 10 terminal projections, 10 closeouts, and Work-Pack verification. L3A/L3B remains the next separate subject track and cannot begin without the Workflow RMT predecessor and Workflow-specific owner selection.\n\n## Global Boundary Rule`, "Layering refresh insertion");
layering = replaceOnce(layering, "Operation may consume candidate-local `RMT-OP-001..004` passes only where the individual SWU declares that lane. `RMT-OP-005` is merely candidate-local-ready in the planning snapshot and cannot be treated as passed. Every execution-time context pack must refresh the active RMT frontier.", `Operation consumed the exact current RMT Operation candidate and RMT-OP-010 receipt within their declared ceilings. The candidate-local APE closure does not convert those inputs into profile admission or broader RMT authority.`, "Layering Operation track state");
const gateUpdates = [
  ["| `G-L0-ENTRY` | plan -> L0 | `R-12` next-type selection; exact target inventory; current RMT lock | blocked | APE progression owner |", "| `G-L0-ENTRY` | plan -> L0 | direct Work Pack A selection and exact locks | closed candidate-local | APE progression owner |"],
  ["| `G-L0-PACKET` | AOP-001 -> AOP-002 | packet schema validator; stale/lane/subject hostiles; closeout receipt | planned | APE profile owner |", "| `G-L0-PACKET` | AOP-001 -> AOP-002 | packet validator, trust hostiles, receipt | closed candidate-local | APE profile owner |"],
  ["| `G-L0-L1` | L0 -> L1 | full Operation denominator and applicability accounting pass | planned | Operation profile owner |", "| `G-L0-L1` | L0 -> L1 | full Operation denominator and applicability accounting | closed candidate-local | Operation profile owner |"],
  ["| `G-L1-L2` | L1 -> L2 | three observers pass exact-cause hostiles; no RMT semantic finding | planned | TypeScript profile owner |", "| `G-L1-L2` | L1 -> L2 | three observers and exact-cause hostiles | closed candidate-local | TypeScript profile owner |"],
  ["| `G-SI-PERSIST` | AOP-005 -> AOP-006 | admitted persistence schema and `R-02` decision | blocked | System Integration owner |", "| `G-SI-PERSIST` | AOP-005 -> AOP-006 | conservative exact-record gate; unadmitted remains owner-blocked | closed candidate-local only | System Integration owner |"],
  ["| `G-SI-TX-FAIL` | AOP-006 -> AOP-007 | exact transaction/failure records and participant rules | blocked pending current contract validation | System Integration owners |", "| `G-SI-TX-FAIL` | AOP-006 -> AOP-007 | exact transaction/failure records and participant rules | closed candidate-local only | System Integration owners |"],
  ["| `G-OP-CLOSE` | AOP-009 -> AOP-010 | complete Operation fixtures; no unaccounted row; all owner blocks explicit | planned | APE/Operation owners |", "| `G-OP-CLOSE` | AOP-009 -> AOP-010 | complete fixtures, accounting, receipt topology | closed candidate-local with finding | APE/Operation owners |"],
];
for (const [before, after] of gateUpdates) layering = replaceOnce(layering, before, after, "Layering gate");
layering = replaceSection(layering, "## First Unit Narrowness", "## Frame Expiry", "AOP-001 was the narrowest first unit and L0-L2 preserved the declared sequence through AOP-010. The next potential mutation is not another Operation unit: it is the separate Workflow RMT predecessor stream, followed by AWF-001 only after its own gates.", "Layering first unit");
layering = replaceSection(layering, "## Recommended Next Layer", "## Claim Ceiling", "- Next layer candidate: prepare the exact Workflow RMT predecessor required by `G-WF-RMT`.\n- After that predecessor: AWF-001, only with Workflow-specific `R-12` selection.\n- Separate optional remediation: Poker instrumentation placement, outside Work Pack A closure.", "Layering next layer");
const claimStartLayering = layering.lastIndexOf("## Claim Ceiling\n");
if (claimStartLayering === -1) throw new Error("Layering claim ceiling missing");
layering = `${layering.slice(0, claimStartLayering)}## Claim Ceiling\n\nThis refreshed layering proves only candidate-local Operation L0-L2 implementation and lifecycle reconciliation. Workflow layers remain planned and blocked. No profile admission, canonical synchronization, authority, publication, release, deployment, or production claim is made.\n`;
stageText(`${candidateRel}/IMPLEMENTATION-LAYERING.md`, layering);

let waves = readText(`${candidateRel}/work-pack-a-operation/WAVES.md`);
waves = replaceOnce(waves, "- Current state: all waves blocked before execution; no SWU selected", "- Current state: A-W0 through A-W4 closed candidate-local; no SWU selected", "A waves state");
waves = replaceOnce(waves, "- Global gate: `R-12` plus execution-time input refresh", "- Global gate: consumed for the closed Work Pack A lane; new Refresh required for reentry", "A waves gate");
waves = replaceOnce(waves, "## Wave Table", `## Closeout Result\n\nAll five waves recompose on the exact 24-file product inventory. The selected Poker result remains fail with \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`; lifecycle reconciliation does not admit the profile or select Workflow work.\n\n## Wave Table`, "A waves closeout insertion");
stageText(`${candidateRel}/work-pack-a-operation/WAVES.md`, waves);

for (const taskName of ["TASK-AOP-PACKET-PROFILE.md", "TASK-AOP-OBSERVATION.md", "TASK-AOP-INTEGRATION.md", "TASK-AOP-FIXTURES-CLOSE.md"]) {
  const relativePath = `${candidateRel}/work-pack-a-operation/tasks/${taskName}`;
  let task = readText(relativePath);
  task = replaceOnce(task, "- Status: blocked; no SWU selected.", `- Status: candidate-local prototype complete; reconciled by \`${verificationRel}\`.`, `${taskName} status`);
  if (taskName === "TASK-AOP-PACKET-PROFILE.md") {
    task = replaceOnce(task, "- Dependencies: `R-12` owner selection and an execution-time Context Builder refresh; AOP-002 additionally depends on AOP-001 closeout.", "- Execution dependency result: the direct Work Pack A fast-lane selection and exact input refresh were consumed; AOP-002 followed the AOP-001 candidate-local closeout.", "AOP packet dependencies");
    task = task.replace("Execution owner: Task Session; blocked by AOP-001, `R-01`, and `R-12`.", "Execution owner: Task Session fast-lane local fallback; the unit closed without promoting the unresolved Rule status or granting broader R-12 authority.");
  }
  stageText(relativePath, task);
}

let verifyTask = readText(`${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-VERIFY.md`);
verifyTask = replaceOnce(verifyTask, "## Smallest Working Unit Exemption", `## Closure Result\n\nResult: **pass at the candidate-local lifecycle ceiling**. The exact 24 product files, ten local-fallback terminal projections, ten lifecycle closeouts, and final Work-Pack verification recompose. The selected Poker evaluation remains fail with \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`; synchronized Task Session closeout and profile admission remain false.\n\nReceipt: \`${verificationRel}\`.\n\n## Smallest Working Unit Exemption`, "AOP verify closure");
verifyTask = replaceOnce(verifyTask, `Expected future receipt: \`${verificationRel}\`.\n\nNo write is authorized by this candidate Plan.`, `Materialized receipt: \`${verificationRel}\`.\n\nThe direct-user Refresh authorized only this candidate-local lifecycle evidence write; it grants no product mutation, admission, promotion, or successor execution.`, "AOP verify output");
stageText(`${candidateRel}/work-pack-a-operation/tasks/TASK-AOP-VERIFY.md`, verifyTask);

let planValidator = readText(`${candidateRel}/validate-plan-consistency.mjs`);
const oldStateChecks = `requireCondition(manifest.status === "candidate-blocked-before-execution", "manifest status must remain candidate-blocked-before-execution");\nrequireCondition(manifest.selected_swu === null, "selected_swu must remain null");\nrequireCondition(manifest.validation_admission_contract?.state === "blocked", "global SWU validation admission must remain blocked");\nrequireCondition(manifest.validation_admission_contract?.blocker === "R-08", "R-08 must remain the exact validation-admission blocker");\nrequireCondition(swus.length === 21 && byId.size === 21, \`expected 21 unique SWUs; observed \${swus.length}/\${byId.size}\`);\nrequireCondition(swus.every((swu) => swu.required_evidence_lane === "candidate-local-prototype"), "every current SWU route must select exactly candidate-local-prototype");\nrequireCondition(swus.every((swu) => swu.handoff_status === "blocked"), "every SWU handoff must remain blocked");\nrequireCondition(swus.every((swu) => swu.split_analysis?.verdict === "pass"), "every repaired split analysis must pass");\nrequireCondition(swus.every((swu) => swu.validation_surface?.[0]?.startsWith(\`admission-block:\${swu.swu_id}:R-08\`)), "every SWU validation surface must expose the R-08 admission block");`;
const newStateChecks = `const operationSwus = manifest.work_packs[0].swus;\nconst workflowSwus = manifest.work_packs[1].swus;\nrequireCondition(manifest.status === "operation-prototype-closed-workflow-blocked", "manifest mixed-frontier status mismatch");\nrequireCondition(manifest.selected_swu === null, "selected_swu must remain null");\nrequireCondition(manifest.validation_admission_contract?.state === "blocked", "remaining Workflow validation admission must remain blocked");\nrequireCondition(manifest.validation_admission_contract?.blocker === "R-08", "R-08 must remain the exact remaining Workflow validation-admission blocker");\nrequireCondition(manifest.validation_admission_contract?.applies_to === "work_packs[1].swus[*]", "validation admission scope must be Workflow only");\nrequireCondition(swus.length === 21 && byId.size === 21, \`expected 21 unique SWUs; observed \${swus.length}/\${byId.size}\`);\nrequireCondition(swus.every((swu) => swu.required_evidence_lane === "candidate-local-prototype"), "every current SWU route must select exactly candidate-local-prototype");\nrequireCondition(operationSwus.length === 10 && operationSwus.every((swu) => swu.handoff_status === "closed-candidate-local"), "all ten Operation SWUs must be closed candidate-local");\nrequireCondition(operationSwus.every((swu) => swu.blockers.length === 0 && swu.closure_evidence?.authority_effect === "none"), "closed Operation SWUs must have exact authority-none closure evidence");\nrequireCondition(workflowSwus.length === 11 && workflowSwus.every((swu) => swu.handoff_status === "blocked"), "all eleven Workflow SWUs must remain blocked");\nrequireCondition(workflowSwus.every((swu) => swu.validation_surface?.[0]?.startsWith(\`admission-block:\${swu.swu_id}:R-08\`)), "every Workflow validation surface must expose the R-08 admission block");\nrequireCondition(swus.every((swu) => swu.split_analysis?.verdict === "pass"), "every repaired split analysis must pass");\nrequireCondition(manifest.prototype_closeout?.selected_subject_result === "fail", "selected Poker result must remain fail");\nrequireCondition(manifest.prototype_closeout?.primary_finding === "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT", "selected Poker finding mismatch");\nrequireCondition(manifest.prototype_closeout?.synchronized_task_session_closeout === false && manifest.prototype_closeout?.profile_admitted === false, "prototype closeout ceiling overclaim");`;
planValidator = replaceOnce(planValidator, oldStateChecks, newStateChecks, "plan validator state block");
const entryChecksNeedle = `const awf002 = byId.get("SWU-AWF-002");`;
const entryChecksInsertion = `requireCondition(entries.get("WP-APE-OP-PROFILE-001").pre_execution_owner_prerequisite?.lifecycle_state === "closed-candidate-local-with-findings", "Operation execution entry closure state mismatch");\nrequireCondition(entries.get("WP-APE-OP-PROFILE-001").pre_execution_owner_prerequisite?.reentry_requires_new_refresh === true, "Operation execution entry must require a new refresh");\nrequireCondition(entries.get("WP-APE-WF-PROFILE-001").pre_execution_owner_prerequisite?.packet_predecessor?.status === "available-candidate-local", "Workflow packet predecessor must be available candidate-local");\nrequireCondition(entries.get("WP-APE-WF-PROFILE-001").pre_execution_owner_prerequisite?.workflow_rmt_predecessor?.status === "absent", "Workflow RMT predecessor must remain absent");\n\n${entryChecksNeedle}`;
planValidator = replaceOnce(planValidator, entryChecksNeedle, entryChecksInsertion, "plan validator entry checks");
planValidator = replaceOnce(planValidator, `    blocked_swus: swus.filter((swu) => swu.handoff_status === "blocked").length,`, `    closed_operation_swus: operationSwus.filter((swu) => swu.handoff_status === "closed-candidate-local").length,\n    blocked_workflow_swus: workflowSwus.filter((swu) => swu.handoff_status === "blocked").length,`, "plan validator result counts");
stageText(`${candidateRel}/validate-plan-consistency.mjs`, planValidator);

const transport = readJson(`${candidateRel}/PLAN-TRANSPORT-REPORT.json`);
transport.transport_status = "repository-local-candidate-closeout-staged-for-apply";
transport.work_pack_gate_status = "mixed-frontier";
transport.swu_validation_binding = {
  status: "partial",
  completed_scope: "WP-APE-OP-PROFILE-001 exact retrospective command contract",
  blocked_scope: "WP-APE-WF-PROFILE-001 remains R-08 and predecessor blocked",
  evidence: prevalidationRel,
};
transport.execution_entries = { work_pack_a: "blocked-terminal-candidate-local", work_pack_b: "blocked" };
transport.lifecycle_reconciliation = {
  work_pack_a: "closed-candidate-local-with-findings",
  terminal_receipts: 10,
  closeout_receipts: 10,
  verification_receipt: verificationRel,
  synchronized_task_session_closeout: false,
  profile_admitted: false,
};
transport.selected_swu = null;
transport.mutation_runtime_ready = false;
transport.claim_ceiling = "Work Pack A candidate-local implementation and lifecycle reconciliation; Work Pack B remains blocked; no profile admission or authority effect.";
stageJson(`${candidateRel}/PLAN-TRANSPORT-REPORT.json`, transport);

const stagedPlanCommand = ["/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node", `${candidateRel}/validate-plan-consistency.mjs`];
const stagedSupport = copyMissingSupportTree(path.join(repoRoot, candidateRel), path.join(stagedRoot, candidateRel));
let planResult;
try {
  planResult = run(stagedPlanCommand, stagedRoot);
} finally {
  removeCopiedSupport(stagedSupport);
}
assertPass(planResult, "staged plan consistency");
const planOutput = JSON.parse(planResult.stdout);
const aProjection = path.join(stagedRoot, `${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`);
const bProjection = path.join(stagedRoot, `${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`);
const entryValidator = path.join(repoRoot, ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py");
const aEntryResult = run(["/usr/bin/python3", entryValidator, "--projection", aProjection], repoRoot);
const bEntryResult = run(["/usr/bin/python3", entryValidator, "--projection", bProjection], repoRoot);
assertPass(aEntryResult, "staged Operation execution entry");
assertPass(bEntryResult, "staged Workflow execution entry");
const closeoutResult = run([process.execPath, path.join(repoRoot, validatorRel), "--artifact-root", stagedRoot, "--source-root", repoRoot], repoRoot);
assertPass(closeoutResult, "staged closeout refresh");
const closeoutOutput = JSON.parse(closeoutResult.stdout);

function walkFiles(directory, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort();
}

const candidateFiles = walkFiles(path.join(stagedRoot, candidateRel));
const candidateInputHashes = Object.fromEntries(candidateFiles.filter((file) => file !== "PLAN-VALIDATION-RECEIPT.json").map((file) => [file, stagedRef(`${candidateRel}/${file}`).sha256]));
const planValidationReceipt = {
  schema: "invoke.plan-validation-receipt/v1",
  run_id: "20260820T193401Z-ape-operation-workflow-realization-work-packs",
  refresh_id: refreshId,
  validated_at_utc: capturedAt,
  status: "pass",
  invocations: [
    { id: "plan-consistency", ...commandRecord(planResult), validator: stagedRef(`${candidateRel}/validate-plan-consistency.mjs`), inputs: candidateInputHashes, output: planOutput },
    { id: "operation-execution-entry", ...commandRecord(aEntryResult), input: stagedRef(`${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`) },
    { id: "workflow-execution-entry", ...commandRecord(bEntryResult), input: stagedRef(`${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`) },
    { id: "candidate-local-closeout-topology", ...commandRecord(closeoutResult), validator: exactRef(validatorRel), output: closeoutOutput },
    { id: "operation-integrated-suite", ...commandRecord(testResult), output: { tests_total: 100, tests_passed: 100, tests_failed: 0 } },
    { id: "operation-strict-typescript", ...commandRecord(tscResult), output: { result: "pass" } },
  ],
  failed_validation_attempts: prevalidation.validation_attempts,
  failure_status_preservation: prevalidation.failure_status_preservation,
  swu_validation_binding: {
    work_pack_a: "pass-exact-retrospective-contract",
    work_pack_b: "blocked-R-08-and-predecessor",
  },
  lifecycle_state: {
    work_pack_a: "closed-candidate-local-with-findings",
    work_pack_b: "blocked-before-execution",
    synchronized_task_session_closeout: false,
    profile_admitted: false,
  },
  authority_effect: "none",
  claim_ceiling: "Exact current-byte Plan consistency, candidate-local AOP terminal/closeout topology, 100-test replay, and strict TypeScript only; selected Poker subject remains fail and Workflow remains blocked.",
};
stageJson(`${candidateRel}/PLAN-VALIDATION-RECEIPT.json`, planValidationReceipt);

const stagedFiles = walkFiles(stagedRoot);
const expectedStaged = [...targets].sort();
if (JSON.stringify(stagedFiles) !== JSON.stringify(expectedStaged)) {
  throw new Error(`staged target inventory mismatch\nexpected=${JSON.stringify(expectedStaged)}\nactual=${JSON.stringify(stagedFiles)}`);
}

const targetInventory = targets.map((target) => {
  const baselineEntry = baseline.targets.find((entry) => entry.path === target);
  const postimage = stagedRef(target);
  return { target_path: target, operation: baselineEntry.state === "absent" ? "create" : "update", baseline: baselineEntry, postimage };
});
writeJson(`${refreshRel}/TARGET-INVENTORY.json`, {
  schema_version: "ape.refresh-target-inventory/v1",
  refresh_id: refreshId,
  target_count: targetInventory.length,
  targets: targetInventory,
  postimage_aggregate_sha256: inventoryDigest(targetInventory.map((entry) => entry.postimage)),
});

const sourceRefs = [
  prototypeRef,
  invocationRef,
  handoffRef,
  exactRef(handoffMarkdownRel),
  prevalidationRef,
  baselineRef,
  exactRef(approvalRel),
  rmtCandidateRef,
  rmtReceiptRef,
  ...[...reportByPath.keys()].map((relativePath) => exactRef(relativePath)),
];
const postApplyValidationCommands = [
  `/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node ${candidateRel}/validate-plan-consistency.mjs`,
  `/usr/bin/python3 .agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py --projection ${candidateRel}/WORK-PACK-A-EXECUTION-ENTRY.json`,
  `/usr/bin/python3 .agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py --projection ${candidateRel}/WORK-PACK-B-EXECUTION-ENTRY.json`,
  `${process.execPath} ${validatorRel} --artifact-root . --source-root .`,
  `cd projects/domainspec-v2/impl && ${testArgv.join(" ")}`,
  `cd projects/domainspec-v2/impl && ${tscArgv.join(" ")}`,
];
const packageDocument = {
  schema_version: "1.0.0",
  package_id: `dsv2-ape-operation-profile-closeout-${refreshId}`,
  mutation_mode: "apply-approved",
  mutation_state: "materialized",
  lifecycle_owner: "projects/domainspec-v2",
  authority_class: "private",
  publication_class: "internal",
  source_artifacts: sourceRefs.map((ref) => ({ ...ref, authority_class: "private" })),
  changes: targetInventory.map((entry) => ({
    target_path: entry.target_path,
    operation: entry.operation,
    output_ref: {
      path: `${refreshRel}/staged/${entry.target_path}`,
      sha256: entry.postimage.sha256,
      size_bytes: entry.postimage.size_bytes,
    },
  })),
  target_inventory: targetInventory.map((entry) => ({
    target_path: entry.target_path,
    lifecycle_owner: "projects/domainspec-v2",
    authority_class: "private",
    publication_class: "internal",
    dependency_ids: ["prototype-validation", "precloseout-validation", "fast-lane-handoff"],
  })),
  dependencies: [
    { dependency_id: "prototype-validation", artifact_ref: prototypeRef },
    { dependency_id: "precloseout-validation", artifact_ref: prevalidationRef },
    { dependency_id: "fast-lane-handoff", artifact_ref: handoffRef },
  ],
  mirror_groups: [],
  approval: {
    class: "explicit-apply",
    owner: "projects/domainspec-v2",
    scope_paths: targets,
    authority_classes: ["private"],
    publication_classes: ["internal"],
  },
  validation_commands: postApplyValidationCommands,
};
writeJson(`${refreshRel}/MATERIAL-PACKAGE.json`, packageDocument);
const packageDigest = shaBytes(Buffer.from(canonicalJson(packageDocument), "utf8"));

const materialValidator = path.join(repoRoot, ".agents/skills/invoke/scripts/material_package_validator.py");
const schemaDir = path.join(repoRoot, ".agents/skills/invoke/schemas");
const materialReceiptPath = path.join(refreshRoot, "MATERIAL-RECEIPT.json");
const materialResult = run(["/usr/bin/python3", materialValidator, path.join(refreshRoot, "MATERIAL-PACKAGE.json"), "--root", repoRoot, "--schema-dir", schemaDir, "--output", materialReceiptPath], repoRoot);
assertPass(materialResult, "material package validator");
const materialReceipt = readJson(`${refreshRel}/MATERIAL-RECEIPT.json`);
if (materialReceipt.patchVerdict !== "pass" || materialReceipt.packageDigest !== packageDigest) throw new Error("material receipt mismatch");

const handoffRequest = {
  activationSource: "direct-user",
  mutationMode: "apply-approved",
  authoredPhaseStatus: "pass",
  requestedHandoff: "ready",
  expectedPackageId: packageDocument.package_id,
  expectedPackageDigest: packageDigest,
  expectedMaterialReceiptSha256: exactRef(`${refreshRel}/MATERIAL-RECEIPT.json`).sha256,
  materialReceipt,
};
writeJson(`${refreshRel}/APPLY-HANDOFF-REQUEST.json`, handoffRequest);
const handoffResolver = path.join(repoRoot, ".agents/skills/invoke/scripts/refresh_material_handoff.py");
const handoffOutputPath = path.join(refreshRoot, "APPLY-HANDOFF-RESULT.json");
const handoffResult = run([
  "/usr/bin/python3", handoffResolver, path.join(refreshRoot, "APPLY-HANDOFF-REQUEST.json"),
  "--receipt-schema", path.join(schemaDir, "material-package-receipt.schema.json"),
  "--material-package", path.join(refreshRoot, "MATERIAL-PACKAGE.json"),
  "--package-root", repoRoot,
  "--package-schema", path.join(schemaDir, "material-package.schema.json"),
  "--material-receipt", materialReceiptPath,
  "--output", handoffOutputPath,
], repoRoot);
assertPass(handoffResult, "file-bound Refresh handoff");
const handoffOutput = readJson(`${refreshRel}/APPLY-HANDOFF-RESULT.json`);
if (!handoffOutput.mutationReady || handoffOutput.handoffStatus !== "ready") throw new Error("Refresh handoff is not mutation-ready");

const signals = [
  { signal_id: "APE-REFRESH-S1", type: "evidence_added", source: `${prototypeRel}#/work_pack`, claim: "AOP-001..010 implementation validation passed on 24 exact files", confidence: "high", mutation_safety: "safe" },
  { signal_id: "APE-REFRESH-S2", type: "status_changed", source: `${prototypeRel}#/validation`, claim: "Work Pack A can close at candidate-local lifecycle ceiling after contract-preserving receipt projection", confidence: "high", mutation_safety: "safe" },
  { signal_id: "APE-REFRESH-S3", type: "blocker_opened", source: `${prototypeRel}#/prototype_result/observed_completion_receipt`, claim: "Selected Poker subject retains AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT", confidence: "high", mutation_safety: "safe" },
  { signal_id: "APE-REFRESH-S4", type: "route_changed", source: `${candidateRel}/WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md`, claim: "AOP-001 packet prerequisite is available but Workflow RMT predecessor remains absent", confidence: "high", mutation_safety: "safe" },
];
const machineReport = {
  schema_version: "invoke.refresh-report/v1",
  refresh_id: refreshId,
  evidence_date: "2026-08-21",
  activation_source: "direct-user",
  mutation_mode: "apply-approved",
  mutation_mode_source: "default-direct-user",
  refresh_scope: "WP-APE-OP-PROFILE-001 candidate-local lifecycle closure and WP-APE-WF-PROFILE-001 predecessor refresh",
  phase_status: "pass",
  handoff_status: "ready",
  mutation_ready: true,
  apply_status: "staged-not-yet-applied",
  source_signals: signals,
  target_count: targets.length,
  material_package: { package_id: packageDocument.package_id, canonical_sha256: packageDigest, receipt: exactRef(`${refreshRel}/MATERIAL-RECEIPT.json`) },
  closure: {
    work_pack_a: "candidate-local-prototype-closed-with-findings",
    terminal_receipts: 10,
    closeout_receipts: 10,
    verification_receipt: verificationRef,
    selected_subject_result: "fail",
    primary_finding: "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT",
    synchronized_task_session_closeout: false,
    profile_admitted: false,
  },
  remaining_frontier: {
    work_pack_b: "blocked",
    nearest_missing_predecessor: "WP-RMT-002 Workflow realization",
    nearest_ape_unit_after_predecessor: "SWU-AWF-001",
  },
  blockers: [],
  authority_effect: "none",
  external_effects: { network: false, git: false, registry: false, ontology: false, publication: false, deployment: false },
};
writeJson(`${refreshRel}/refresh-report.json`, machineReport);

writeText(`${refreshRel}/REFRESH-PATCH-PROPOSAL.md`, `# Refresh Patch Proposal\n\n- Refresh: \`${refreshId}\`\n- Mode: \`apply-approved\` from direct-user activation\n- Exact target count: ${targets.length}\n- Material package digest: \`${packageDigest}\`\n\nThe patch closes Work Pack A only at the candidate-local lifecycle ceiling, preserves the selected Poker \`fail\` and \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`, derives ten local-fallback terminal projections, emits ten candidate-local closeouts and one Work-Pack verification receipt, and refreshes Work Pack B only to record that the AOP-001 packet prerequisite is available. Workflow remains blocked on its RMT predecessor and owner selection.\n\nNo product code, registry, ontology, Git, publication, release, deployment, production, profile admission, canonical closeout, or authority mutation is proposed.\n`);
writeText(`${refreshRel}/DISPATCH-TECHNIQUE-TRACE.md`, `# Dispatch Technique Trace\n\nNo governed multi-agent dispatch was used. One bounded read-only helper audited the closeout topology and returned before mutation.\n\n| Technique | Application | Result |\n| --- | --- | --- |\n| sequence | terminal projections -> closeouts -> Work-Pack verification -> plan projections | pass |\n| scu_swu_reduction | ten exact manifest write-scope subsets | pass |\n| recomposition_proof | 24 product files equal the union of ten SWU scopes | pass |\n| validation_loop | 100 tests, strict TypeScript, plan, entry, closeout validators | pass |\n| owner_boundary_check | candidate-local only; authority none | pass |\n| handle_handoff | material package + file-bound Refresh handoff | ready |\n| residue_ledger | Poker finding and Workflow gates remain visible | pass |\n| execution_receipt_handoff | 10 terminal + 10 closeout + verification topology | pass |\n`);
writeText(`${refreshRel}/REFRESH-REPORT.md`, `# Refresh Report: APE Operation Profile Candidate-Local Closeout\n\n## Identity\n\n- Source session: \`${prototype.run_id}\`\n- Evidence date: \`2026-08-21\`\n- Activation: direct user\n- Mutation mode: \`apply-approved\`\n- Target owner: \`projects/domainspec-v2\`\n\n## Phase And Handoff Status\n\n- Phase status: \`pass\`\n- Handoff: \`ready\`\n- Mutation ready: \`true\`\n- Apply status: staged; live apply pending\n\n## Outcome\n\nWork Pack A is staged to close as **candidate-local prototype-closed with findings**. The exact product suite passed 100/100 and strict TypeScript. Ten local-fallback terminal projections, ten candidate-local lifecycle closeouts, and one Work-Pack verification receipt preserve the existing receipt topology.\n\nThe selected Poker evaluation remains \`fail\` with \`AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT\`. Synchronized Task Session closeout, canonical closeout, and profile admission remain false. Work Pack B remains blocked, but its AOP-001 packet prerequisite becomes available candidate-local.\n\n## Material Package\n\n- Package: \`${packageDocument.package_id}\`\n- Canonical digest: \`${packageDigest}\`\n- Exact targets: ${targets.length}\n- Material validator: pass\n- File-bound handoff: ready\n\n## Validation\n\n- Integrated AOP suite: 100/100 pass.\n- Strict TypeScript: pass with \`allowImportingTsExtensions\`.\n- Initial strict-TypeScript harness attempt: exit 2 and preserved; it omitted that required option and changed no product byte.\n- Staged plan consistency: pass.\n- Both execution-entry schemas: pass.\n- Candidate-local closeout topology: pass.\n\n## Next Route\n\nAfter live apply and post-apply validation, route read-only to Continuation Router. The leading implementation candidate is the missing Workflow RMT predecessor; AWF-001 follows only after that predecessor and Workflow-specific owner selection.\n\n## Gate Result\n\nPass for Refresh authoring and apply handoff. No semantic, authority, publication, or external-effect blocker is hidden.\n`);

console.log(JSON.stringify({
  result: "pass",
  refresh_id: refreshId,
  staged_target_count: targets.length,
  material_package_id: packageDocument.package_id,
  material_package_digest: packageDigest,
  material_receipt_sha256: exactRef(`${refreshRel}/MATERIAL-RECEIPT.json`).sha256,
  handoff_status: handoffOutput.handoffStatus,
  mutation_ready: handoffOutput.mutationReady,
  product_tests: `${testsPassed}/${testsTotal}`,
  strict_typescript: tscResult.exit_status === 0 ? "pass" : "block",
}, null, 2));
