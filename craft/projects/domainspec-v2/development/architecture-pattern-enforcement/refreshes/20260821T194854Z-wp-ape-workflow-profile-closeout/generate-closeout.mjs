#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const runId = "20260821T190943Z-wp-ape-workflow-profile-fast-lane";
const refreshId = "20260821T194854Z-wp-ape-workflow-profile-closeout";
const capturedAt = "2026-08-21T19:48:54Z";
const productRel = "projects/domainspec-v2/development/architecture-pattern-enforcement";
const evidenceRel = `${productRel}/evidence/WP-APE-WF-PROFILE-001`;
const refreshRel = `${productRel}/refreshes/${refreshId}`;
const runRel = `.task-session/runs/${runId}`;
const planRel = "projects/domainspec-v2/development/refinement-runs/20260820T193401Z-ape-operation-workflow-realization-work-packs/candidates";
const manifestRel = `${planRel}/SWU-MANIFEST.json`;
const workPackRel = `${planRel}/WORK-PACK-B-WORKFLOW-PROFILE-EXTENSION.md`;
const invocationRel = `${runRel}/INVOCATION-ENVELOPE.json`;
const prototypeRel = `${runRel}/PROTOTYPE-VALIDATION.json`;
const prevalidationRel = `${refreshRel}/PRE-CLOSEOUT-VALIDATION.json`;
const baselineRel = `${refreshRel}/PRE-CLOSEOUT-BASELINE.json`;
const approvalRel = `${refreshRel}/APPROVAL-EVIDENCE.json`;
const reportRel = `${refreshRel}/refresh-report.json`;
const reportMarkdownRel = `${refreshRel}/REFRESH-REPORT.md`;
const verificationRel = `${evidenceRel}/WORK-PACK-VERIFICATION.json`;
const handoffRel = ".arcanum/handoff-notices/notices/HN-841138AF4CBC.json";
const handoffMarkdownRel = ".arcanum/handoff-notices/notices/HN-841138AF4CBC.md";
const workflowCandidateRel = "projects/domainspec-v2/development/remaining-meta-types/candidates/workflow.json";
const workflowReceiptRel = "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-010.json";
const implRoot = path.join(repoRoot, "projects/domainspec-v2/impl");

function absolute(relativePath) {
  const root = path.resolve(repoRoot);
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
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

function readBytes(relativePath) {
  const file = absolute(relativePath);
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`not a regular non-symlink file: ${relativePath}`);
  return fs.readFileSync(file);
}

function readJson(relativePath) {
  return JSON.parse(readBytes(relativePath).toString("utf8"));
}

function writeJson(relativePath, value) {
  const target = absolute(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(relativePath, value) {
  if (!value.endsWith("\n")) throw new Error(`missing final newline: ${relativePath}`);
  const target = absolute(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, "utf8");
}

function exactRef(relativePath) {
  const bytes = readBytes(relativePath);
  return { path: relativePath, sha256: shaBytes(bytes), size_bytes: bytes.length };
}

function receipt(body) {
  return { ...body, receipt_digest: shaBytes(Buffer.from(canonicalJson(body), "utf8")) };
}

function run(argv, cwd = repoRoot) {
  const completed = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const result = {
    argv,
    cwd: path.relative(repoRoot, cwd) || ".",
    exit_status: completed.status ?? 1,
    stdout: completed.stdout ?? "",
    stderr: completed.stderr ?? "",
  };
  if (result.exit_status !== 0) {
    throw new Error(`command failed (${result.exit_status}): ${argv.join(" ")}\n${result.stderr || result.stdout}`);
  }
  return result;
}

function commandRecord(result, summary = {}) {
  return {
    argv: result.argv,
    cwd: result.cwd,
    exit_status: result.exit_status,
    stdout_sha256: shaBytes(Buffer.from(result.stdout, "utf8")),
    stderr_sha256: shaBytes(Buffer.from(result.stderr, "utf8")),
    ...summary,
  };
}

function tapSummary(output) {
  const take = (label) => Number(output.match(new RegExp(`# ${label} (\\d+)`))?.[1] ?? -1);
  return { tests: take("tests"), passed: take("pass"), failed: take("fail") };
}

function inventoryAggregate(refs, pathMode = "repository") {
  const rows = refs.map((entry) => {
    const selectedPath = pathMode === "product-relative"
      ? path.relative(productRel, entry.path)
      : entry.path;
    return `${entry.sha256}\t${entry.size_bytes}\t${selectedPath}\n`;
  });
  return {
    assignment_order_sha256: shaBytes(Buffer.from(rows.join(""), "utf8")),
    sorted_sha256: shaBytes(Buffer.from([...rows].sort().join(""), "utf8")),
  };
}

const manifest = readJson(manifestRel);
const workPack = manifest.work_packs.find((candidate) => candidate.work_pack_id === "WP-APE-WF-PROFILE-001");
if (!workPack || workPack.swus.length !== 11) throw new Error("Workflow Work Pack manifest mismatch");
const swuIds = workPack.swus.map((swu) => swu.swu_id);
const expectedOrder = ["SWU-AWF-001", "SWU-AWF-002", "SWU-AWF-003", "SWU-AWF-004", "SWU-AWF-009", "SWU-AWF-005", "SWU-AWF-006", "SWU-AWF-007", "SWU-AWF-008", "SWU-AWF-010", "SWU-AWF-011"];
if (JSON.stringify(swuIds) !== JSON.stringify(expectedOrder)) throw new Error("Workflow SWU order mismatch");
const productPaths = workPack.swus.flatMap((swu) => swu.write_scope);
if (productPaths.length !== 25 || new Set(productPaths).size !== 25) throw new Error("Workflow product denominator mismatch");

const terminalPaths = swuIds.map((id) => `${evidenceRel}/${id}-terminal-source.json`);
const closeoutPaths = swuIds.map((id) => `${evidenceRel}/${id}-closeout.json`);
for (const target of [invocationRel, prototypeRel, prevalidationRel, baselineRel, approvalRel, reportRel, reportMarkdownRel, verificationRel, ...terminalPaths, ...closeoutPaths]) {
  if (fs.existsSync(absolute(target))) throw new Error(`create target already exists: ${target}`);
}

const productRefs = productPaths.map(exactRef);
const totalSize = productRefs.reduce((sum, item) => sum + item.size_bytes, 0);
const decoder = new TextDecoder("utf-8", { fatal: true });
for (const item of productRefs) {
  const text = decoder.decode(readBytes(item.path));
  if (!text.endsWith("\n") || /[ \t]+$/m.test(text) || /^(<<<<<<<|=======|>>>>>>>) /m.test(text)) {
    throw new Error(`product hygiene failed: ${item.path}`);
  }
  if (item.path.endsWith(".json")) JSON.parse(text);
}

const workflowTests = [
  "../development/architecture-pattern-enforcement/validators/rmt-workflow-predecessor.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-child-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-continuation-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-compensation-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-mode-discriminator.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-runtime-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-version-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/workflow-message-observer.test.ts",
  "../development/architecture-pattern-enforcement/fixtures/workflow-profile/fixture.test.ts",
  "../development/architecture-pattern-enforcement/evaluators/workflow-profile-evaluator.test.ts",
];
const operationTests = [
  "../development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-dependency-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-boundary-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-cost-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-persistence-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-transaction-observer.test.ts",
  "../development/architecture-pattern-enforcement/adapters/typescript/operation-event-boundary-observer.test.ts",
  "../development/architecture-pattern-enforcement/fixtures/operation-profile/fixture.test.ts",
  "../development/architecture-pattern-enforcement/evaluators/operation-profile-evaluator.test.ts",
];
const workflowTestRun = run(["node", "--import", "tsx", "--test", ...workflowTests], implRoot);
const combinedTestRun = run(["node", "--import", "tsx", "--test", ...operationTests, ...workflowTests], implRoot);
const workflowSummary = tapSummary(workflowTestRun.stdout);
const combinedSummary = tapSummary(combinedTestRun.stdout);
if (JSON.stringify(workflowSummary) !== JSON.stringify({ tests: 40, passed: 40, failed: 0 })) throw new Error("Workflow TAP denominator mismatch");
if (JSON.stringify(combinedSummary) !== JSON.stringify({ tests: 140, passed: 140, failed: 0 })) throw new Error("combined TAP denominator mismatch");

const typeScriptPaths = manifest.work_packs
  .filter((candidate) => ["WP-APE-OP-PROFILE-001", "WP-APE-WF-PROFILE-001"].includes(candidate.work_pack_id))
  .flatMap((candidate) => candidate.swus)
  .flatMap((swu) => swu.write_scope)
  .filter((target) => target.endsWith(".ts"))
  .map(absolute);
const typecheckRun = run([
  "./node_modules/.bin/tsc", "--noEmit", "--strict", "--target", "ES2022",
  "--module", "NodeNext", "--moduleResolution", "NodeNext", "--allowImportingTsExtensions",
  "--types", "node", "--typeRoots", "./node_modules/@types", "--skipLibCheck", ...typeScriptPaths,
], implRoot);
const admissionRun = run(["node", "projects/domainspec-v2/development/remaining-meta-types/active-types/workflow/admission/validate-admission.mjs"]);
const candidateRun = run(["node", "projects/domainspec-v2/development/remaining-meta-types/active-types/workflow/admission/validate-candidate.mjs", workflowCandidateRel]);

const evaluationScript = `
import {readFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
const imported=await import("../development/architecture-pattern-enforcement/evaluators/workflow-profile-evaluator.ts");
const {evaluateWorkflowProfile,recomputeWorkflowPropertyClaims,REQUIRED_WORKFLOW_MATERIAL_PATHS}=imported.default;
const root=resolve("../../..");
const json=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const material=role=>{const p=REQUIRED_WORKFLOW_MATERIAL_PATHS[role],b=readFileSync(resolve(root,p));return {role,path:p,sha256:createHash("sha256").update(b).digest("hex"),size_bytes:statSync(resolve(root,p)).size};};
const fixture=json(REQUIRED_WORKFLOW_MATERIAL_PATHS.fixture);
const input={repo_root:root,evidence_lane:"candidate-local-prototype",profile:json(REQUIRED_WORKFLOW_MATERIAL_PATHS.profile),applicability_scaffold:json(REQUIRED_WORKFLOW_MATERIAL_PATHS.applicability),fixture,hostile_catalogue:json(REQUIRED_WORKFLOW_MATERIAL_PATHS.hostiles),claimed_results:recomputeWorkflowPropertyClaims(fixture,root),material_inventory:Object.keys(REQUIRED_WORKFLOW_MATERIAL_PATHS).map(material),synchronized_task_session_closeout:false,authority_effect:"none"};
console.log(JSON.stringify(evaluateWorkflowProfile(input)));
`;
const evaluationRun = run(["node", "--import", "tsx", "--input-type=module", "-e", evaluationScript], implRoot);
const evaluation = JSON.parse(evaluationRun.stdout.trim());
if (evaluation.result !== "incomplete" || evaluation.receipt_sha256 !== "472edbde318c0df2e68b62a5c297604c8a9043f457c0dfba5f4bbe654d8bd4ec") throw new Error("standalone evaluator result mismatch");
if (evaluation.accounting?.denominator_count !== 9 || evaluation.accounting?.pass_count !== 6 || evaluation.accounting?.missing_count !== 1 || evaluation.accounting?.not_applicable_count !== 2) throw new Error("standalone evaluator accounting mismatch");
const missingFinding = evaluation.findings.find((finding) => finding.diagnostic === "AOP_WF_COMPENSATION_CALLABLE_MISSING");
if (!missingFinding) throw new Error("honest compensation finding missing");

const validationCommands = {
  workflow_suite: commandRecord(workflowTestRun, workflowSummary),
  operation_workflow_recomposition: commandRecord(combinedTestRun, combinedSummary),
  strict_typescript: commandRecord(typecheckRun, { source_file_count: typeScriptPaths.length }),
  workflow_admission: commandRecord(admissionRun, { result: "pass", swu_id: "RMT-WF-001" }),
  workflow_candidate: commandRecord(candidateRun, { result: "pass", swu_id: "RMT-WF-010" }),
  standalone_evaluator: commandRecord(evaluationRun, { result: evaluation.result, receipt_sha256: evaluation.receipt_sha256 }),
};
writeJson(prevalidationRel, {
  schema_version: "ape.workflow-pre-closeout-validation/v1",
  refresh_id: refreshId,
  captured_at: capturedAt,
  result: "pass",
  commands: validationCommands,
  product_inventory: {
    file_count: productRefs.length,
    total_size_bytes: totalSize,
    ...inventoryAggregate(productRefs, "product-relative"),
    files: productRefs,
  },
  evaluator_result: evaluation,
  operator_note: "One earlier parent-side Workflow admission-validator invocation used the impl cwd and exited nonzero because the validator resolves repository-relative paths from cwd. It was not counted. The exact root-cwd invocation recorded here passed.",
  blockers: [],
  authority_effect: "none",
});

writeJson(baselineRel, {
  schema_version: "ape.workflow-closeout-baseline/v1",
  refresh_id: refreshId,
  captured_at: capturedAt,
  work_pack: exactRef(workPackRel),
  product_inventory: productRefs,
  create_targets: [...terminalPaths, ...closeoutPaths, verificationRel].map((target) => ({ path: target, state: "absent" })),
  authority_effect: "none",
});
writeJson(approvalRel, {
  schema_version: "ape.direct-user-fast-lane-approval/v1",
  refresh_id: refreshId,
  activation_source: "direct-user",
  user_intent: ["continue implement in fast lane mode", "refresh the work packs so we can close, and then search next implementation", "do all next steps"],
  bounded_scope: "WP-APE-WF-PROFILE-001 candidate-local product implementation and closeout",
  forbidden_effects: ["profile-admission", "authority-growth", "promotion", "publication", "release", "deployment", "production-change", "git-mutation", "external-network"],
  authority_effect: "none",
});
writeJson(invocationRel, {
  schema_version: "ape.candidate-local-fast-lane-invocation/v1",
  run_id: runId,
  captured_at: capturedAt,
  work_pack_id: "WP-APE-WF-PROFILE-001",
  ordered_units: swuIds,
  declared_product_paths: productPaths,
  activation_source: "direct-user-do-all-next-steps-2026-08-21",
  deferred_governance_handoff: exactRef(handoffRel),
  validation_contract: { cwd: "projects/domainspec-v2/impl", node: "v22.13.0", tsx: "4.23.12", typescript: "5.9.3", failure_status_propagation: true },
  execution_lane: "candidate-local-prototype-fast-lane",
  authority_effect: "none",
});

const invocationRef = exactRef(invocationRel);
const prevalidationRef = exactRef(prevalidationRel);
const handoffRef = exactRef(handoffRel);
const productInventory = {
  root: productRel,
  file_count: productRefs.length,
  total_size_bytes: totalSize,
  assignment_order: { formula: "sha256(assignment-order sha256<TAB>size_bytes<TAB>path-relative-to-inventory-root<LF>)", sha256: inventoryAggregate(productRefs, "product-relative").assignment_order_sha256 },
  sorted_repository_path: { formula: "sha256(sorted sha256<TAB>size_bytes<TAB>repository_path<LF>)", sha256: inventoryAggregate(productRefs, "repository").sorted_sha256 },
  files: productRefs.map((entry) => ({ path: path.relative(productRel, entry.path), size_bytes: entry.size_bytes, sha256: entry.sha256 })),
};
writeJson(prototypeRel, {
  schema_version: "ape.candidate-local-prototype-validation/v1",
  run_id: runId,
  work_pack: {
    work_pack_id: "WP-APE-WF-PROFILE-001",
    source: workPackRel,
    execution_lane: "candidate-local-prototype-fast-lane",
    result: "prototype-pass-through-swu-awf-011-with-honest-incomplete-subject",
    executed_units: swuIds,
    continuation: "prototype-complete-closeout-ready",
  },
  validation: {
    result: "pass",
    commands: validationCommands,
    json_files_parsed: productRefs.filter((entry) => entry.path.endsWith(".json")).length,
    all_regular_non_symlink_files: true,
    all_utf8: true,
    all_final_newline: true,
    trailing_whitespace_files: [],
    conflict_marker_files: [],
    strict_surplus_probes: { top_level: "reject", claimed_result: "reject", material_row: "reject" },
  },
  product_inventory: productInventory,
  predecessor_locks: {
    result: "pass",
    workflow_candidate: exactRef(workflowCandidateRel),
    rmt_wf_010_receipt: exactRef(workflowReceiptRel),
    packet_closeout: exactRef("projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-OP-PROFILE-001/SWU-AOP-001-closeout.json"),
  },
  prototype_result: {
    implementation_validation: "pass",
    profile_id: evaluation.profile.profile_id,
    profile_sha256: evaluation.profile.profile_sha256,
    denominator_count: evaluation.accounting.denominator_count,
    denominator_sha256: evaluation.profile.denominator_sha256,
    selected_fixture: evaluation.fixture.fixture_id,
    observed_completion_receipt: evaluation,
    interpretation: "The evaluator implementation passes and correctly retains the live Workflow's missing separately named compensation callable as an incomplete source observation.",
  },
  deferred_governance_handoff: handoffRef,
  blockers: [],
  claim_ceiling: "Exact candidate-local implementation and evidence-integrity behavior for SWU-AWF-001 through SWU-AWF-011. The selected Workflow receipt remains incomplete because the live source lacks a separately named compensation callable. No synchronized Task Session closeout, admission, registration, authority, promotion, publication, release, deployment, or production readiness is proved.",
});

const prototypeRef = exactRef(prototypeRel);
const baselineRef = exactRef(baselineRel);
const terminalRefs = [];
for (const swu of workPack.swus) {
  const target = `${evidenceRel}/${swu.swu_id}-terminal-source.json`;
  const terminal = receipt({
    schema_version: "arcanum.task-session-terminal-source-receipt/v1",
    run_id: runId,
    work_pack_id: "WP-APE-WF-PROFILE-001",
    swu_id: swu.swu_id,
    attempt_id: `${runId}:${swu.swu_id}`,
    idempotency_key: `${runId}:terminal:${swu.swu_id}`,
    capability_ref: "task-session-until-blocker",
    status: "pass",
    receipt_kind: "local-fallback",
    receipt_artifact: target,
    execution_lane: "candidate-local-prototype-fast-lane",
    derived_from_consolidated_evidence: true,
    source_evidence: { prototype_validation: prototypeRef, invocation_envelope: invocationRef, deferred_governance_handoff: handoffRef },
    files_touched: swu.write_scope,
    source_targets: swu.write_scope.map(exactRef),
    validation: { result: "pass", contract_ref: prevalidationRef, command_ids: ["workflow-suite", "operation-workflow-recomposition", "strict-typescript", "workflow-admission", "workflow-candidate"] },
    blockers: [],
    residue: { selected_subject_result: evaluation.result, selected_subject_primary_finding: missingFinding.diagnostic, synchronized_task_session_closeout: false, profile_admitted: false, canonical_closeout: false },
    reroute: "invoke:refresh:apply-approved",
    handoff_note: "Derived from exact consolidated fast-lane validation because per-SWU Task Sessions were intentionally deferred. Candidate-local projection only.",
    authority_effect: "none",
  });
  writeJson(target, terminal);
  terminalRefs.push(exactRef(target));
}

const closeoutRefs = [];
for (let index = 0; index < workPack.swus.length; index += 1) {
  const swu = workPack.swus[index];
  const target = `${evidenceRel}/${swu.swu_id}-closeout.json`;
  const terminalRef = terminalRefs[index];
  const next = workPack.swus[index + 1]?.swu_id ?? null;
  const closeout = receipt({
    schema_version: "ape.invoke-refresh-candidate-local-closeout/v1",
    receipt_id: `${refreshId}:${swu.swu_id}:closeout`,
    work_pack_id: "WP-APE-WF-PROFILE-001",
    swu_id: swu.swu_id,
    owner_identity: { capability: "invoke", mode: "refresh", mutation_mode: "apply-approved", activation_source: "direct-user", lifecycle_owner: "projects/domainspec-v2" },
    terminal_source_ref: terminalRef,
    baseline_ref: baselineRef,
    work_pack_preimage: { ...exactRef(workPackRel), state_at: "pre-closeout-refresh" },
    lifecycle_result: { status: "closed-candidate-local", implementation_validation: "pass", synchronized_task_session_closeout: false, canonical_closeout: false, profile_admitted: false, authority_effect: "none" },
    validation_inventory: [
      { validation_id: "terminal-source", result: "pass", evidence_ref: terminalRef },
      { validation_id: "consolidated-prototype", result: "pass", evidence_ref: prototypeRef },
      { validation_id: "exact-command-replay", result: "pass", evidence_ref: prevalidationRef },
    ],
    successor: next === null
      ? { swu_id: null, status: "work-pack-verification-next", selected: false, authority_granted: false }
      : { swu_id: next, status: "already-executed-in-same-fast-lane", selected: false, authority_granted: false },
    authority_effect: "none",
  });
  writeJson(target, closeout);
  closeoutRefs.push(exactRef(target));
}

const verification = receipt({
  schema_version: "ape.workflow-work-pack-verification/v1",
  verification_id: `${refreshId}:WORK-PACK-VERIFICATION`,
  run_id: runId,
  work_pack_id: "WP-APE-WF-PROFILE-001",
  result: "pass",
  execution_lane: "candidate-local-prototype-fast-lane",
  prototype_validation_ref: prototypeRef,
  precloseout_validation_ref: prevalidationRef,
  terminal_receipts: terminalRefs,
  closeout_receipts: closeoutRefs,
  product_inventory: productInventory,
  selected_subject_evaluation: {
    result: evaluation.result,
    ...evaluation.accounting,
    primary_finding: missingFinding.diagnostic,
    implementation_interpretation: "The evaluator implementation passes and correctly preserves the selected Workflow source finding.",
  },
  lifecycle_ceiling: { candidate_local_lifecycle_reconciled: true, synchronized_task_session_closeout: false, canonical_closeout: false, profile_admitted: false, registered: false, promoted: false, published: false, released: false, deployed: false, production_ready: false },
  next_route: "continuation-router:search-next-implementation",
  deferred_governance_handoff: handoffRef,
  authority_effect: "none",
});
writeJson(verificationRel, verification);
const verificationRef = exactRef(verificationRel);

const report = receipt({
  schema_version: "ape.workflow-closeout-refresh-report/v1",
  refresh_id: refreshId,
  captured_at: capturedAt,
  result: "pass",
  work_pack_id: "WP-APE-WF-PROFILE-001",
  implementation_result: "pass",
  selected_subject_result: evaluation.result,
  selected_subject_primary_finding: missingFinding.diagnostic,
  product_inventory: productInventory,
  prototype_validation_ref: prototypeRef,
  work_pack_verification_ref: verificationRef,
  terminal_receipt_count: terminalRefs.length,
  closeout_receipt_count: closeoutRefs.length,
  handoff_notice: handoffRef,
  next_route: "continuation-router:search-next-implementation",
  governance_state: "candidate-local-lifecycle-reconciled; canonical synchronization deferred",
  authority_effect: "none",
  claim_ceiling: "Candidate-local Workflow profile implementation and closeout only; the selected source remains incomplete for a named compensation callable. No admission, registration, promotion, publication, release, deployment, or production claim.",
});
writeJson(reportRel, report);
writeText(reportMarkdownRel, `# Workflow Profile Fast-Lane Closeout\n\n- Result: pass\n- Work Pack: \`WP-APE-WF-PROFILE-001\`\n- Product targets: 25/25\n- Workflow tests: 40/40 pass\n- Operation + Workflow recomposition: 140/140 pass\n- Strict TypeScript: pass\n- Terminal projections: 11/11\n- Candidate-local closeouts: 11/11\n- Selected Workflow evaluation: \`incomplete\`\n- Retained finding: \`AOP_WF_COMPENSATION_CALLABLE_MISSING\`\n- Handoff Notice: \`HN-841138AF4CBC\`\n- Next route: \`continuation-router:search-next-implementation\`\n\nThe missing compensation callable is a live source observation, not an evaluator failure. This closeout grants no admission, registration, authority, promotion, publication, release, deployment, or production claim.\n`);

console.log(JSON.stringify({ result: "pass", refresh_id: refreshId, product_file_count: productRefs.length, product_total_size_bytes: totalSize, workflow_tests: workflowSummary, combined_tests: combinedSummary, terminal_receipts: terminalRefs.length, closeout_receipts: closeoutRefs.length, work_pack_verification: verificationRef, report: exactRef(reportRel), authority_effect: "none" }));
