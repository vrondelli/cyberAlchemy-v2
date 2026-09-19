#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const validatorPath = fileURLToPath(import.meta.url);
const planRoot = resolve(dirname(validatorPath), "..");
let repoRoot = planRoot;
while (!existsSync(join(repoRoot, "AGENTS.md"))) {
  const parent = dirname(repoRoot);
  if (parent === repoRoot) throw new Error("repository root not found");
  repoRoot = parent;
}

const routeDigest = "e15c671ce59e3fd5c4d1e4434e6d967db583c51bedd7667588d49f37739d245c";
const defectReceiptDigest = "577e910a4a8f07d2860a604291f56cdfb515900adc31040bb059209252178eec";
const repairApplyReceiptDigest = "c5270f3ef1018cbe496ed6f4c0c449432509de4e51ad3db6c5a481267948ee70";
const repairReviewReceiptDigest = "b638de7060a7e0dfea90646f74811b98865b8cd8c4e84b320cd7c0831402067b";
const rehearsalReceiptDigest = "c1bf0680564e8bf37b9613d422554d020fb0ba3387cd42ab47cfec4e48af957f";
const unitIds = ["SWU-CCE-002", "SWU-CCE-003", "SWU-CCE-004", "SWU-CCE-005"];
const targetPaths = [
  "projects/domainspec-v2/development/evolvable-validation-framework/contracts/emits-incoming-closure-evidence-envelope.v1.schema.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/valid-minimal-envelope.v1.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/contracts/emits-target-max-evaluation-receipt.v1.schema.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/pass-evaluation-receipt.v1.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/invalid-evaluation-receipt.v1.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/incomplete-evaluation-receipt.v1.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/error-evaluation-receipt.v1.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/contracts/closure-evidence-contract-manifest.v1.json",
  "projects/domainspec-v2/development/evolvable-validation-framework/tools/validate-emits-closure-evidence-contracts.mjs"
];
const protectedHashes = {
  "projects/domainspec-v2/definitions/relationships/relationships.yml": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json": "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json": "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs": "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N43-EMITS-CLOSURE-ENVELOPE-SCHEMA-PROPOSAL/schemas/emits-incoming-closure-evidence-envelope.candidate-v1.schema.json": "410c2f6f62355d532c98d920f70adc240d760d08484d89d2c49186ca8dacdec9",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N44-EMITS-TARGET-MAX-EVALUATION-RECEIPT-SCHEMA-PROPOSAL/schemas/emits-target-max-evaluation-receipt.candidate-v1.schema.json": "9e200fe8ce4f7ad4d9c440fe700648c85b782380ba8789005b1d2ff1b91b2430"
};
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function digestValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function validateTransport(doc) {
  assert(doc.status === "execution-candidate", "transport status drift");
  assert(doc.authority_effect === "none", "transport authority inflation");
  assert(doc.placement_decision.selected_option_id === "BMC-REL-PLAN-01-A-EVF-EVIDENCE-CONTRACT-FAMILY", "placement selection drift");
  assert(doc.placement_decision.owner_receipt_sha256 === "b66aaca1a3ff33be937e8d509c7df77be5c1476aeafb660c2aa421063618e53b", "placement receipt drift");
  assert(doc.execution_entry.state === "selection-ready", "execution entry state drift");
  assert(doc.execution_entry.selected_unit === null && doc.execution_entry.route_id === null, "premature route selection");
  assert(doc.execution_entry.next_owner === "invoke:preacceptance-candidate-authoring", "next owner drift");
  assert(doc.execution_entry.allowed_routes_count === 8 && doc.execution_entry.allowed_routes_digest === routeDigest, "route binding drift");
  assert(doc.gate.work_pack === "pass" && doc.gate.distill === "pass" && doc.gate.closeout_sync === "pass" && doc.gate.implementation_readiness === "pass", "Plan/readiness gate regression");
  assert(doc.gate.preacceptance_closure === "block", "preacceptance block hidden");
  assert(doc.gate.exact_acceptance === "unapproved", "exact acceptance fabricated");
  assert(JSON.stringify(doc.open_blocker_ids) === JSON.stringify(["PLAN-BLOCK-008", "PLAN-BLOCK-006"]), "open blocker set drift");
  assert(JSON.stringify(doc.resolved_blocker_ids) === JSON.stringify(["PLAN-BLOCK-001", "PLAN-BLOCK-002", "PLAN-BLOCK-003", "PLAN-BLOCK-004", "PLAN-BLOCK-005", "PLAN-BLOCK-007"]), "resolved blocker set drift");
  assert(JSON.stringify(doc.swus) === JSON.stringify(unitIds), "transport frontier drift");
  assert(doc.next_route.kind === "invoke-preacceptance-candidate-authoring" && doc.next_route.owner === "Invoke preacceptance owner", "preacceptance route drift");
  assert(doc.next_route.selection === null && doc.next_route.automatic_execution === false, "selection or execution inferred");
  assert(doc.next_route.repair_apply_receipt_sha256 === repairApplyReceiptDigest, "repair apply receipt transport drift");
  assert(doc.next_route.repair_review_receipt_sha256 === repairReviewReceiptDigest, "repair review receipt transport drift");
  assert(doc.next_route.rehearsal_receipt_sha256 === rehearsalReceiptDigest, "rehearsal receipt transport drift");
  assert(Object.values(doc.non_effects).every((value) => value === false), "forbidden effect admitted");
}

function validateManifest(doc) {
  assert(doc.status === "execution-candidate" && doc.selected_unit === null, "manifest phase drift");
  assert(JSON.stringify(doc.units.map((unit) => unit.id)) === JSON.stringify(unitIds), "manifest order drift");
  const scopes = doc.units.flatMap((unit) => unit.write_scope);
  assert(scopes.length === 9 && new Set(scopes).size === 9, "material scope must contain nine disjoint targets");
  assert(JSON.stringify(scopes) === JSON.stringify(targetPaths), "exact target inventory drift");
  doc.units.forEach((unit, index) => {
    assert(unit.primary_behavior.length > 0, `${unit.id} missing primary behavior`);
    assert(JSON.stringify(unit.dependencies) === JSON.stringify(index === 0 ? [] : [unitIds[index - 1]]), `${unit.id} dependency drift`);
    assert(unit.execution_owner === "task-session", `${unit.id} owner drift`);
    assert(unit.done_criteria.length >= 2 && unit.validation_surface.length >= 2, `${unit.id} incomplete contract`);
  });
}

function validateMachine(entry, config, evidence, closureSource) {
  assert(entry.schema_version === "arcanum.work-pack-execution-entry/v1", "execution-entry schema drift");
  assert(JSON.stringify(entry.frontier) === JSON.stringify(unitIds), "execution-entry frontier drift");
  assert(entry.execution_entry.state === "selection-ready" && entry.execution_entry.selected_unit === null && entry.execution_entry.route_id === null, "execution-entry selection drift");
  assert(entry.pre_execution_owner_prerequisite === null && entry.authority_effect === "none", "execution-entry authority drift");
  assert(entry.execution_policy.allowed_routes.length === 8, "execution-entry route count drift");
  assert(digestValue(entry.execution_policy.allowed_routes) === routeDigest && entry.execution_policy.allowed_routes_digest === routeDigest, "execution-entry route digest drift");
  unitIds.forEach((unit) => {
    assert(entry.execution_policy.allowed_routes.filter((route) => route.frontier_swu === unit && route.capability === "task-session").length === 1, `${unit} Task Session route drift`);
    assert(entry.execution_policy.allowed_routes.filter((route) => route.frontier_swu === unit && route.capability === "invoke").length === 1, `${unit} closeout route drift`);
  });
  assert(config.schema_version === "2.0.0" && config.admission_timing === "selected-unit-at-task-session", "audit config profile drift");
  assert(config.execution_bindings.length === 4 && config.closeout_bindings.length === 4 && config.task_session_closeout_contracts.length === 4, "audit unit binding count drift");
  assert(config.execution_entry_closure?.rehearsal_effect === "deterministic-no-effect", "execution-entry closure binding missing");
  assert(config.execution_entry_closure.closure_ref.selector === "/execution_entry_closure" && config.execution_entry_closure.units_ref.selector === "/units", "execution-entry closure selectors drift");
  assert(config.execution_entry_closure.closure_ref.artifact_ref.path.endsWith("/machine/EXECUTION-ENTRY-CLOSURE.json"), "execution-entry closure source drift");
  assert(config.execution_entry_closure.closure_ref.artifact_ref.sha256 === sha256(join(planRoot, "machine/EXECUTION-ENTRY-CLOSURE.json")), "execution-entry closure digest drift");
  assert(closureSource.execution_entry_closure.schema_version === "execution-entry-closure.v1" && closureSource.execution_entry_closure.consumer_rehearsal.required_runs === 2, "closure source profile drift");
  assert(closureSource.units.length === 4 && closureSource.units.every((unit) => unit.lifecycle_owner === "invoke" && unit.owner_receipt_schema_identity === "invoke.precloseout-refresh-closeout-receipt.v1"), "single-owner typed frontier drift");
  assert(closureSource.units.every((unit) => new Set(unit.route_write_scope).size === unit.route_write_scope.length && unit.route_scope_partition.exact_union_scope.length === unit.route_write_scope.length), "closure route partition drift");
  assert(config.runtime_binding.task_session_admission_receipt_ref === null, "Task Session admission fabricated");
  assert(config.approval_policy.run_budget.max_task_session_requests === 4, "run budget drift");
  assert(config.continuity_projection.cursor === "SWU-CCE-002" && config.continuity_projection.completed_unit_receipt_refs.length === 0 && config.continuity_projection.joined_closeout_receipt_refs.length === 0, "continuity prefix drift");
  assert(evidence.owner === "EVF evidence-chain lifecycle owner" && evidence.semantic_owner === "relationship-validation contract owner", "owner boundary drift");
  assert(evidence.approval.status === "unapproved" && evidence.status.execution === "not-started", "evidence lifecycle inflation");
  assert(evidence.material.target_baselines.length === 9 && evidence.material.target_baselines.every((item) => item.state === "absent"), "target baseline drift");
  assert(evidence.units.length === 4 && evidence.units.every((unit) => unit.byte_baselines.length === 0), "create-only baseline drift");
  assert(evidence.units[0].validation_contracts.length === 2 && evidence.units[1].validation_contracts.length === 2, "schema units lack self-contained semantic validation");
}

function liveValidation() {
  const decisionDir = join(planRoot, "decisions/BMC-REL-PLAN-01-CLOSURE-EVIDENCE-CONTRACT-PLACEMENT-AND-LIFECYCLE");
  const selectionPath = join(decisionDir, "OWNER-SELECTION-RECEIPT.json");
  assert(sha256(selectionPath) === "b66aaca1a3ff33be937e8d509c7df77be5c1476aeafb660c2aa421063618e53b", "owner selection receipt drift");
  const selection = json(selectionPath);
  assert(selection.selection.response === "A" && selection.selection.selected_by === "user", "owner selection source drift");
  assert(selection.admissibility_binding.selected_option_admitted === true && selection.admissibility_binding.selected_option_presented === true, "unadmitted selection");
  assert(selection.authorization_boundary.implementation_authorized === false && selection.authorization_boundary.d06_reopened === false, "selection authority inflation");

  for (const [file, digest] of Object.entries(protectedHashes)) {
    const path = join(repoRoot, file);
    assert(existsSync(path) && sha256(path) === digest, `protected source drift: ${file}`);
  }
  targetPaths.forEach((file) => assert(!existsSync(join(repoRoot, file)), `implementation target already exists: ${file}`));

  const transport = json(join(planRoot, "PLAN-TRANSPORT.json"));
  const manifest = json(join(planRoot, "work-pack/shared/SWU-MANIFEST.json"));
  const entry = json(join(planRoot, "machine/EXECUTION-ENTRY.json"));
  const entryValidation = json(join(planRoot, "machine/EXECUTION-ENTRY-VALIDATION.json"));
  const config = json(join(planRoot, "machine/AUDIT-CONFIG.json"));
  const evidence = json(join(planRoot, "machine/PLAN-EVIDENCE.json"));
  const closureSource = json(join(planRoot, "machine/EXECUTION-ENTRY-CLOSURE.json"));
  validateTransport(transport);
  validateManifest(manifest);
  validateMachine(entry, config, evidence, closureSource);
  assert(entryValidation.status === "pass" && entryValidation.route_count === 8 && entryValidation.allowed_routes_digest === routeDigest, "execution-entry validation drift");

  const readiness = json(join(planRoot, "IMPLEMENTATION-READINESS-PREFLIGHT.json"));
  assert(readiness.status === "pass" && readiness.code === "PLAN_IMPLEMENTATION_READY", "implementation readiness drift");
  assert(readiness.mutation_ready === false && readiness.reusable_for_execution === false && readiness.authority_effect === "none", "readiness authority inflation");
  assert(JSON.stringify(readiness.frontier) === JSON.stringify(unitIds) && readiness.route_coverage.length === 4, "readiness frontier drift");
  const auditPath = join(planRoot, "readiness-audit-20260826T1800-repaired/work-pack-readiness-report-v2.json");
  const audit = json(auditPath);
  assert(digestValue(audit) === readiness.audit_report_digest, "audit report binding drift");
  assert(audit.verdict === "pass" && audit.terminal_code === "PLAN_SEMANTIC_READY", "WPRA verdict drift");
  assert(audit.blockers.length === 0 && audit.flags.length === 0 && audit.configured_commands_executed === false, "WPRA evidence inflation");

  const defectPath = join(planRoot, "governance-defects/execution-entry-closure-single-owner-r1/RECEIPT.json");
  assert(sha256(defectPath) === defectReceiptDigest, "governance defect receipt drift");
  const defect = json(defectPath);
  assert(defect.status === "block" && defect.classification === "mechanical_evidence_only", "governance defect classification drift");
  assert(defect.resumption.auto_resume_eligible === false && defect.renewed_owner_acceptance.option_a_selection === "not_required", "defect resumption or Option A drift");
  const repairApplyPath = join(planRoot, "governance-defects/execution-entry-closure-single-owner-r1/REPAIR-APPLY-RECEIPT.json");
  const repairReviewPath = join(planRoot, "governance-defects/execution-entry-closure-single-owner-r1/REPAIR-REVIEW-RECEIPT.json");
  assert(sha256(repairApplyPath) === repairApplyReceiptDigest && sha256(repairReviewPath) === repairReviewReceiptDigest, "repair receipt binding drift");
  const repairApply = json(repairApplyPath);
  const repairReview = json(repairReviewPath);
  assert(repairApply.status === "pass" && repairApply.accepted_invariant.fabricated_second_owner === false, "repair apply invariant drift");
  assert(repairReview.status === "pass" && repairReview.resumption.single_resume_token_eligible === true, "repair independent review drift");
  const rehearsalReceiptPath = join(planRoot, "PREACCEPTANCE-REHEARSAL-RECEIPT.json");
  assert(sha256(rehearsalReceiptPath) === rehearsalReceiptDigest, "rehearsal receipt binding drift");
  const rehearsalReceipt = json(rehearsalReceiptPath);
  assert(rehearsalReceipt.status === "pass-with-dependent-block" && rehearsalReceipt.repair.resume_token_consumed === true, "rehearsal lifecycle drift");
  assert(rehearsalReceipt.rehearsal_result.runs === 8 && rehearsalReceipt.rehearsal_result.pairwise_byte_identity === true, "rehearsal run count or identity drift");
  assert(rehearsalReceipt.rehearsal_result.repository_writes === 0 && rehearsalReceipt.rehearsal_result.external_effects === false && rehearsalReceipt.rehearsal_result.authority_effect === "none", "rehearsal claims an effect");
  assert(rehearsalReceipt.dependent_block.blocker_id === "PLAN-BLOCK-008" && rehearsalReceipt.dependent_block.request_eligibility_result === "block", "dependent preacceptance blocker drift");
  for (const item of rehearsalReceipt.rehearsals) {
    const run1 = join(planRoot, item.run_1);
    const run2 = join(planRoot, item.run_2);
    assert(sha256(run1) === item.sha256 && sha256(run2) === item.sha256, `${item.unit_id} rehearsal pair drift`);
    const receipt = json(run1);
    assert(receipt.unit_id === item.unit_id && receipt.closure_result === "pass" && receipt.request_eligibility_result === "block", `${item.unit_id} rehearsal verdict drift`);
    assert(receipt.stages.length === 9 && receipt.effects.repository_writes === 0 && receipt.effects.external_effects === false && receipt.effects.selection === false && receipt.effects.execution === false, `${item.unit_id} rehearsal effect drift`);
  }
  assert(!existsSync(join(planRoot, "IMPLEMENTATION-ACCEPTANCE-REQUEST.json")), "owner request emitted before preacceptance closure");

  const workPack = readFileSync(join(planRoot, "WORK-PACK.md"), "utf8");
  for (const token of ["`workPackGateStatus` | `pass`", "`implementationReadinessStatus` | `pass`", "`consumerRehearsalStatus` | `pass`", "`preacceptanceClosureStatus` | `block`", "`executionEntryState` | `selection-ready`", "`exactAcceptanceStatus` | `unapproved`"]) assert(workPack.includes(token), `Work Pack control missing: ${token}`);
  const gapLedger = readFileSync(join(planRoot, "GAP-LEDGER.md"), "utf8");
  assert(gapLedger.includes("PLAN-BLOCK-007 | resolved") && gapLedger.includes("PLAN-BLOCK-008 | open") && gapLedger.includes("PLAN-BLOCK-006 | blocked-dependent"), "gap ledger suppresses preacceptance dependency");
  const distill = readFileSync(join(planRoot, "DISTILL-VALIDATION.md"), "utf8");
  assert(distill.includes("Verdict: `pass` for Plan structure; execution remains unapproved."), "Distill phase drift");

  for (const path of walk(planRoot)) {
    if (path.endsWith("PLAN-VALIDATION.json")) continue;
    const body = readFileSync(path, "utf8");
    assert(!/[ \t]+$/m.test(body), `trailing whitespace: ${relative(planRoot, path)}`);
    assert(body.endsWith("\n"), `missing final newline: ${relative(planRoot, path)}`);
    if (path.endsWith(".json")) json(path);
  }
}

function hostileSelfTest() {
  const baseline = json(join(planRoot, "PLAN-TRANSPORT.json"));
  const manifestBaseline = json(join(planRoot, "work-pack/shared/SWU-MANIFEST.json"));
  const probes = [
    ["acceptance fabrication", () => { const d = structuredClone(baseline); d.gate.exact_acceptance = "approved"; validateTransport(d); }],
    ["unit selection", () => { const d = structuredClone(baseline); d.execution_entry.selected_unit = "SWU-CCE-002"; validateTransport(d); }],
    ["route activation", () => { const d = structuredClone(baseline); d.execution_entry.route_id = "task-session:SWU-CCE-002"; validateTransport(d); }],
    ["route digest drift", () => { const d = structuredClone(baseline); d.execution_entry.allowed_routes_digest = "0".repeat(64); validateTransport(d); }],
    ["implementation authority", () => { const d = structuredClone(baseline); d.non_effects.implementation_authorized = true; validateTransport(d); }],
    ["packet authority", () => { const d = structuredClone(baseline); d.non_effects.packet_changed = true; validateTransport(d); }],
    ["D06 reopen", () => { const d = structuredClone(baseline); d.non_effects.d06_reopened = true; validateTransport(d); }],
    ["blocker deletion", () => { const d = structuredClone(baseline); d.open_blocker_ids = []; validateTransport(d); }],
    ["preacceptance bypass", () => { const d = structuredClone(baseline); d.gate.preacceptance_closure = "pass"; validateTransport(d); }],
    ["SWU-001 reinsertion", () => { const d = structuredClone(baseline); d.swus.unshift("SWU-CCE-001"); validateTransport(d); }],
    ["target overlap", () => { const d = structuredClone(manifestBaseline); d.units[1].write_scope[0] = d.units[0].write_scope[0]; validateManifest(d); }],
    ["frontier reorder", () => { const d = structuredClone(manifestBaseline); d.units.reverse(); validateManifest(d); }],
    ["dependency skip", () => { const d = structuredClone(manifestBaseline); d.units[2].dependencies = []; validateManifest(d); }],
    ["owner drift", () => { const d = structuredClone(manifestBaseline); d.units[0].execution_owner = "manual"; validateManifest(d); }]
  ];
  let rejected = 0;
  for (const [name, run] of probes) {
    try { run(); } catch { rejected += 1; continue; }
    throw new Error(`hostile probe accepted: ${name}`);
  }
  assert(rejected === probes.length, "not all hostile probes rejected");
  return probes.length;
}

try {
  const outputIndex = process.argv.indexOf("--output");
  if (process.argv.includes("--self-test")) {
    const probes = hostileSelfTest();
    console.log(`PASS self-test: ${probes}/${probes} hostile probes rejected; ${checks} assertions`);
  } else {
    liveValidation();
    const receipt = { schema_version: "bmc-rel.closure-evidence-chain-plan-validation/v2", status: "pass", plan_status: "execution-candidate", readiness_status: "pass", preacceptance_status: "block", execution_route_selected: false, implementation_authorized: false, authority_effect: "none", checks };
    if (outputIndex >= 0) writeFileSync(resolve(process.argv[outputIndex + 1]), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    console.log(`PASS plan validation: ${checks} checks; readiness pass; preacceptance block; execution unselected`);
  }
} catch (error) {
  console.error(`FAIL: ${error.stack ?? error.message}`);
  process.exit(1);
}
