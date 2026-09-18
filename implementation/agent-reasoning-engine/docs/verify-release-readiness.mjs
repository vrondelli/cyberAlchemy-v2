#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const repositoryRoot = resolve(productRoot, "../..");
const ledgerPath = resolve(docsRoot, "release-readiness.json");
const receiptPath = resolve(docsRoot, "release-readiness-receipt.json");
const planPath = resolve(repositoryRoot, "development/agent-reasoning-engine/planning/documentation-readiness/PLAN.md");
const candidatePath = resolve(productRoot, "evidence/product-candidate.018.json");
const allowedStatuses = new Set(["COMPLETE", "PARTIAL", "AWAITING_OWNER", "BLOCKED_PREREQUISITE", "NOT_APPLICABLE"]);
const sha256 = value => createHash("sha256").update(value).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

function planTaskIds(source) {
  return [...source.matchAll(/^\| (DR-\d+) \|/gmu)].map(match => match[1]);
}

export function validateReadinessLedger(ledger, options = {}) {
  const planSource = options.planSource ?? readFileSync(planPath, "utf8");
  const candidate = options.candidate ?? JSON.parse(readFileSync(candidatePath, "utf8"));
  const pathExists = options.pathExists ?? (ref => {
    const path = resolve(repositoryRoot, ref);
    return path.startsWith(`${repositoryRoot}/`) && existsSync(path);
  });
  need(ledger?.schema_version === "are.documentation-readiness-ledger/v1", "readiness.schema-version-invalid");
  need(ledger.lifecycle_status === "candidate-internal", "readiness.lifecycle-invalid");
  need(ledger.authority_effect === "none", "readiness.authority-effect-invalid");
  need(typeof ledger.claim_limit === "string" && ledger.claim_limit.length > 0, "readiness.claim-limit-missing");
  need(ledger.applies_to?.candidate_id === candidate.candidate_id, "readiness.candidate-id-drift");
  need(ledger.applies_to?.candidate_digest === candidate.candidate_digest, "readiness.candidate-digest-drift");
  need(ledger.applies_to?.product_version === candidate.product.version, "readiness.product-version-drift");
  need(ledger.applies_to?.source_closure_digest === candidate.source_closure.closure_digest, "readiness.closure-digest-drift");

  for (const field of ["initial_objective", "plan_ref", "research_method_ref", "lighthouse_ref"]) {
    need(typeof ledger.objective_binding?.[field] === "string" && ledger.objective_binding[field].length > 0, `readiness.objective-binding-missing:${field}`);
  }
  for (const field of ["plan_ref", "research_method_ref", "lighthouse_ref"]) {
    need(pathExists(ledger.objective_binding[field]), `readiness.objective-evidence-missing:${field}`);
  }
  need(typeof ledger.construction?.current_product_frontier === "string" && ledger.construction.current_product_frontier.length > 0, "readiness.frontier-missing");
  for (const field of ["runnable_now", "owner_decision_frontier", "operational_residue"]) {
    need(Array.isArray(ledger.construction?.[field]), `readiness.construction-field-invalid:${field}`);
  }

  const planned = planTaskIds(planSource);
  const tasks = Array.isArray(ledger.tasks) ? ledger.tasks : [];
  const observed = tasks.map(task => task.task_id);
  need(new Set(planned).size === planned.length, "readiness.plan-task-duplicate");
  need(new Set(observed).size === observed.length, "readiness.ledger-task-duplicate");
  need(JSON.stringify([...observed].sort()) === JSON.stringify([...planned].sort()), "readiness.task-coverage-mismatch");

  for (const task of tasks) {
    need(allowedStatuses.has(task.status), `readiness.status-invalid:${task.task_id}`);
    need(typeof task.lane === "string" && task.lane.length > 0, `readiness.lane-missing:${task.task_id}`);
    need(typeof task.owner_role === "string" && task.owner_role.length > 0, `readiness.owner-missing:${task.task_id}`);
    need(Array.isArray(task.evidence_refs) && task.evidence_refs.length > 0, `readiness.evidence-empty:${task.task_id}`);
    for (const ref of task.evidence_refs) need(pathExists(ref), `readiness.evidence-missing:${task.task_id}:${ref}`);
    need(Array.isArray(task.blockers), `readiness.blockers-invalid:${task.task_id}`);
    if (task.status === "COMPLETE") need(task.blockers.length === 0, `readiness.complete-has-blocker:${task.task_id}`);
    else need(task.blockers.length > 0, `readiness.incomplete-without-blocker:${task.task_id}`);
    for (const blocker of task.blockers) {
      for (const field of ["code", "owner_role", "next_gate", "affected_stage"]) {
        need(typeof blocker[field] === "string" && blocker[field].length > 0, `readiness.blocker-field-missing:${task.task_id}:${field}`);
      }
    }
  }
  for (const id of ledger.construction.owner_decision_frontier) {
    const task = tasks.find(item => item.task_id === id);
    need(task?.status === "AWAITING_OWNER", `readiness.owner-frontier-status-invalid:${id}`);
  }

  const status_counts = Object.fromEntries([...allowedStatuses].sort().map(status => [status, tasks.filter(task => task.status === status).length]));
  return Object.freeze({task_count: tasks.length, status_counts, plan_task_digest: sha256(`${planned.join("\n")}\n`)});
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildReceipt(ledgerBytes, validation) {
  return {
    schema_version: "are.documentation-readiness-receipt/v1",
    ledger_id: "ARE-DOCUMENTATION-READINESS-002",
    status: "PASS",
    ledger_sha256: sha256(ledgerBytes),
    candidate_id: "ARE-PRODUCT-CANDIDATE-018",
    task_count: validation.task_count,
    status_counts: validation.status_counts,
    plan_task_digest: validation.plan_task_digest,
    claim_limit: "PASS proves complete DR-task accounting, candidate binding, evidence-path presence, and explicit incomplete-task gates. It does not prove gated owner decisions or operational outcomes.",
    authority_effect: "none",
  };
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:verify-release-readiness [--check|--write]");
  const ledgerBytes = readFileSync(ledgerPath);
  const ledger = JSON.parse(ledgerBytes);
  const validation = validateReadinessLedger(ledger);
  const receipt = buildReceipt(ledgerBytes, validation);
  const receiptBytes = stableJson(receipt);
  if (mode === "--write") writeFileSync(receiptPath, receiptBytes);
  else {
    need(existsSync(receiptPath), "readiness.receipt-missing");
    need(readFileSync(receiptPath, "utf8") === receiptBytes, "readiness.receipt-drift");
  }
  process.stdout.write(`${JSON.stringify({...receipt, mode}, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
