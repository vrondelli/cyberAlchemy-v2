#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../../../../../../..");
const RUN = "cyberAlchemy-v2/implementation/ontology-evidence-workbench/development/refinement-runs/20260805T153357Z-uova-reference-model-and-downstream-refinement";
const STAGE = `${RUN}/stages/12-invoke-refresh-admission`;
const OUTPUT = `${STAGE}/readiness/audit-output`;

const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function artifact(path) {
  const target = resolve(ROOT, path);
  const bytes = await readFile(target);
  const info = await lstat(target);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`regular file required: ${path}`);
  return { path, sha256: sha256(bytes), size_bytes: bytes.length };
}

async function json(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
}

async function writeNew(path, value) {
  const target = resolve(ROOT, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, typeof value === "string" ? value : canonical(value), { encoding: "utf8", flag: "wx" });
}

const reportPath = `${OUTPUT}/work-pack-readiness-report-v2.json`;
const manifestPath = `${OUTPUT}/plan-semantic-manifest.json`;
const handoffPath = `${OUTPUT}/selection-handoff.json`;
const report = await json(reportPath);
const manifest = await json(manifestPath);
const handoff = await json(handoffPath);
if (
  report.verdict !== "pass" ||
  report.terminal_code !== "PLAN_SEMANTIC_READY" ||
  report.runtime_admission_status !== "pending-selection" ||
  report.selected_unit !== null ||
  report.mutation_ready !== false ||
  report.configured_commands_executed !== false ||
  manifest.ready_frontier.length !== 9 ||
  handoff.next_owner !== "task-session:selection"
) {
  throw new Error("readiness audit did not produce the required selected-unit profile");
}

const sourceSignals = {
  schema_version: "uovarr.invoke-refresh-signals.v1",
  refresh_id: "UOVA-RR-20260805-selection-readiness",
  signals: [
    {
      id: "SIG-UOVARR-ADMISSION-001",
      source: "direct-user",
      claim: "Prepare the complete work pack for implementation selection without implementing product bytes.",
      disposition: "applied",
      target: `${STAGE}/WORK-PACK.md`,
    },
    {
      id: "SIG-UOVARR-ADMISSION-002",
      source: `${RUN}/stages/09-invoke-plan/WORK-PACK.md`,
      claim: "Bind exact targets, loader/runtime, validations, closeout, denominator, and plan-semantic selection artifacts.",
      disposition: "applied-in-successor-refresh",
      target: `${STAGE}/ADMISSION-CONTRACT.json`,
    },
    {
      id: "SIG-UOVARR-ADMISSION-003",
      source: `${RUN}/stages/11-invoke-refresh/PLAN-DELTA.md`,
      claim: "Add the OEW-owned 58-contract UI description outputs without a DomainSpec runtime dependency.",
      disposition: "bound-to-UOVARR-005-through-009",
      target: `${STAGE}/ADMISSION-CONTRACT.json`,
    },
    {
      id: "SIG-UOVARR-ADMISSION-004",
      source: "bounded-background-target-audit",
      claim: "Close unnamed migration, static serializer, frontend integration, Body War generator, browser verifier, and reuse-fixture seams.",
      disposition: "applied",
      target: `${STAGE}/TARGET-BASELINES.json`,
    },
    {
      id: "SIG-UOVARR-ADMISSION-005",
      source: "projects/body-war/ontology/whole-system/receipts/validation-receipt.json",
      claim: "The full Body War execution denominator is 276 nodes and 301 relations; the 237/231 business graph is a compatibility subset.",
      disposition: "selected-as-276-301-577",
      target: `${STAGE}/BODY-WAR-DENOMINATOR-DECISION.json`,
    },
    {
      id: "SIG-UOVARR-ADMISSION-006",
      source: "live-runtime-discovery",
      claim: "Node/npm are available, cached Chromium exists, and active global Playwright is absent.",
      disposition: "UOVARR-009-selection-gate",
      target: `${STAGE}/BROWSER-RUNTIME-BINDING.json`,
    },
  ],
  authority_effect: "none",
};
await writeNew(`${STAGE}/SOURCE-SIGNALS.json`, sourceSignals);

const targetInventory = {
  schema_version: "uovarr.invoke-refresh-target-inventory.v1",
  refresh_id: "UOVA-RR-20260805-selection-readiness",
  planning_writes: [
    `${STAGE}/WORK-PACK.md`,
    `${STAGE}/authoring/build-admission.mjs`,
    `${STAGE}/authoring/finalize-refresh.mjs`,
    `${STAGE}/BODY-WAR-DENOMINATOR-DECISION.json`,
    `${STAGE}/BROWSER-RUNTIME-BINDING.json`,
    `${STAGE}/TARGET-BASELINES.json`,
    `${STAGE}/ADMISSION-CONTRACT.json`,
    `${STAGE}/readiness/audit-config.json`,
    reportPath,
    manifestPath,
    handoffPath,
    `${STAGE}/SOURCE-SIGNALS.json`,
    `${STAGE}/TARGET-INVENTORY.json`,
    `${STAGE}/TECHNIQUE-TRACE.json`,
    `${STAGE}/REFRESH-REPORT.md`,
    `${STAGE}/RECEIPT.json`,
  ],
  product_writes: [],
  excluded_scopes: [
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/**",
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/**",
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/**",
    "projects/body-war/ontology/**",
    "projects/domainspec-v2/**",
    "arcanum/**",
    "Git index, commit, push, deployment, release, promotion, and production",
  ],
  exact_planned_material_rows: 53,
  authority_effect: "none",
};
await writeNew(`${STAGE}/TARGET-INVENTORY.json`, targetInventory);

const techniqueTrace = {
  schema_version: "uovarr.invoke-refresh-technique-trace.v1",
  refresh_id: "UOVA-RR-20260805-selection-readiness",
  techniques: [
    { id: "inventory", result: "pass", evidence: ".arcanum/inventory/index.json lookup_readiness=ready", authority: "discovery-only" },
    { id: "context-builder-strict", result: "pass", evidence: "R06, R09, R11, exact task contracts, product targets, and owner denominator receipts", authority: "context-only" },
    { id: "bounded-background-target-audit", result: "pass-with-repairs-applied", evidence: "53 target rows and explicit ownership repairs", authority: "advisory" },
    { id: "distill", result: "skipped", evidence: "No behavior boundary, SWU count, dependency law, or implementation layer changed; the refresh closes names and deterministic continuation only." },
    { id: "work-pack-readiness-audit-v2", result: "pass", evidence: reportPath, terminal_code: report.terminal_code, configured_commands_executed: false },
    { id: "invoke-refresh-apply-approved", result: "pass", evidence: `${STAGE}/RECEIPT.json`, authority: "planning-only" },
  ],
  plan_epoch_id: manifest.plan_epoch_id,
  canonical_semantic_digest: manifest.canonical_semantic_digest,
  authority_effect: "none",
};
await writeNew(`${STAGE}/TECHNIQUE-TRACE.json`, techniqueTrace);

const refreshReport = `# Invoke Refresh — UOVARR Implementation-Selection Readiness\n\n` +
  `Result: **pass**  \n` +
  `Terminal code: \`${report.terminal_code}\`  \n` +
  `Plan epoch: \`${manifest.plan_epoch_id}\`  \n` +
  `Canonical semantic digest: \`${manifest.canonical_semantic_digest}\`\n\n` +
  `## What is ready\n\n` +
  `The complete nine-unit UOVARR work pack now has an unambiguous canonical order, 53 exact material target rows, current present/absent provenance baselines, structured validation commands, attempt-scoped execution outputs, owner closeout bindings, a selected Body War whole-system denominator, and a deterministic Plan Semantic Manifest.\n\n` +
  `The denominator decision is 276 nodes, 301 relations, and 577 Full Index rows. The earlier 237/231 graph remains a business-only compatibility subset.\n\n` +
  `## What is not claimed\n\n` +
  `The readiness audit executed no configured product command. No SWU is selected, no material package exists, no mutation-admission receipt exists, and no product implementation or browser behavior is proven. The current runtime status is \`pending-selection\`, \`selected_unit: null\`, and \`mutation_ready: false\`.\n\n` +
  `## First implementation route\n\n` +
  `Task Session may now select exactly \`UOVARR-001\` from \`${STAGE}/WORK-PACK.md\`. It must rehash the five UOVARR-001 targets, instantiate one immutable attempt ID, produce and validate the selected-unit material package and producer receipt, and only then mutate.\n\n` +
  `UOVARR-009 retains one transparent environment gate: active global Playwright is absent in this authoring environment. Cached Chromium bytes are not enough. Task Session must bind and smoke-test an exact global Playwright/Chromium runtime before that unit executes, without adding a repository package root solely for Playwright.\n`;
await writeNew(`${STAGE}/REFRESH-REPORT.md`, refreshReport);

const receipt = {
  schema_version: "uovarr.invoke-refresh-receipt.v1",
  refresh_id: "UOVA-RR-20260805-selection-readiness",
  result: "pass",
  terminal_code: report.terminal_code,
  plan_epoch_id: manifest.plan_epoch_id,
  canonical_semantic_digest: manifest.canonical_semantic_digest,
  frontier: manifest.ready_frontier,
  first_cursor: "UOVARR-001",
  exact_target_rows: 53,
  body_war_denominator: { nodes: 276, relations: 301, full_index_rows: 577 },
  readiness: {
    runtime_admission_status: report.runtime_admission_status,
    selected_unit: report.selected_unit,
    mutation_ready: report.mutation_ready,
    configured_commands_executed: report.configured_commands_executed,
    finding_count: report.blockers.length,
  },
  artifacts: {
    work_pack: await artifact(`${STAGE}/WORK-PACK.md`),
    admission_contract: await artifact(`${STAGE}/ADMISSION-CONTRACT.json`),
    target_baselines: await artifact(`${STAGE}/TARGET-BASELINES.json`),
    denominator_decision: await artifact(`${STAGE}/BODY-WAR-DENOMINATOR-DECISION.json`),
    browser_runtime: await artifact(`${STAGE}/BROWSER-RUNTIME-BINDING.json`),
    audit_config: await artifact(`${STAGE}/readiness/audit-config.json`),
    audit_report: await artifact(reportPath),
    plan_semantic_manifest: await artifact(manifestPath),
    selection_handoff: await artifact(handoffPath),
    source_signals: await artifact(`${STAGE}/SOURCE-SIGNALS.json`),
    target_inventory: await artifact(`${STAGE}/TARGET-INVENTORY.json`),
    technique_trace: await artifact(`${STAGE}/TECHNIQUE-TRACE.json`),
    refresh_report: await artifact(`${STAGE}/REFRESH-REPORT.md`),
  },
  open_environment_gates: [
    {
      gate: "UOVARR-009-active-global-playwright",
      scope: "UOVARR-009 selection only",
      current_state: "absent",
      effect_on_first_cursor: "none",
    },
  ],
  next_owner: "task-session:selection",
  next_unit: "UOVARR-001",
  claim_ceiling: "work-pack-plan-semantic-ready-for-selected-unit-admission; no implementation, validation, browser, deployment, release, promotion, or production proof",
  authority_effect: "none",
  mutation_ready: false,
};
await writeNew(`${STAGE}/RECEIPT.json`, receipt);

process.stdout.write(`${JSON.stringify({
  result: receipt.result,
  terminal_code: receipt.terminal_code,
  plan_epoch_id: receipt.plan_epoch_id,
  next_owner: receipt.next_owner,
  receipt: await artifact(`${STAGE}/RECEIPT.json`),
}, null, 2)}\n`);
