#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const repositoryRoot = path.resolve(packageRoot, "../../../../..");
const receiptPath = path.join(packageRoot, "VALIDATION-RECEIPT.json");
const checks = [];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalDigestWithout(document, field) {
  const copy = { ...document };
  delete copy[field];
  return sha256(Buffer.from(canonical(copy)));
}

function check(id, condition, evidence) {
  checks.push({ id, status: condition ? "pass" : "block", evidence });
}

async function json(relative) {
  return JSON.parse(await readFile(path.join(packageRoot, relative), "utf8"));
}

async function fileDigest(repositoryRelative) {
  return sha256(await readFile(path.join(repositoryRoot, repositoryRelative)));
}

async function markdownFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await markdownFiles(target));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(target);
  }
  return result;
}

async function checkLocalLinks() {
  const failures = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const file of await markdownFiles(packageRoot)) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(pattern)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith("#") || /^[a-z]+:\/\//i.test(raw)) continue;
      const targetPart = raw.split("#", 1)[0];
      if (!targetPart) continue;
      const resolved = path.resolve(path.dirname(file), targetPart);
      try {
        await stat(resolved);
      } catch {
        failures.push(`${path.relative(packageRoot, file)} -> ${raw}`);
      }
    }
  }
  return failures;
}

const manifest = await json("DESIGN-SCOPE-MANIFEST.json");
check("design-manifest-closed", manifest.unknowns.length === 0, "unknowns must be empty");
check(
  "design-manifest-digest",
  canonicalDigestWithout(manifest, "input_digest") === manifest.input_digest,
  manifest.input_digest,
);

const sourceBindings = [
  ...manifest.target_footprint.roots,
  ...manifest.target_footprint.inclusions,
  ...manifest.source_contracts,
];
const stale = [];
for (const binding of sourceBindings) {
  const actual = await fileDigest(binding.path);
  if (actual !== binding.digest) stale.push({ path: binding.path, expected: binding.digest, actual });
}
check("design-source-digests", stale.length === 0, stale.length ? stale : `${sourceBindings.length} exact paths current`);

const denominator = await json("DESIGN-DENOMINATOR-RECEIPT.json");
check("design-denominator-pass", denominator.verdict === "pass" && denominator.diagnostics.length === 0, denominator.receipt_digest);
check(
  "design-denominator-digest",
  canonicalDigestWithout(denominator, "receipt_digest") === denominator.receipt_digest,
  denominator.receipt_digest,
);

const selection = await json("DESIGN-SELECTION-RESULT.json");
const expectedOutputs = [
  "architecture",
  "architecture:authority-trust",
  "architecture:integration-versioning",
  "architecture:persistence-concurrency",
  "architecture:quality",
  "architecture:state-event",
  "ux-plan",
  "validation-contracts",
];
check(
  "design-selection-fixed-point",
  selection.verdict === "pass" && selection.evidence_state === "design-validator-pass" && selection.fixed_point === true && selection.pass_1_digest === selection.pass_2_digest,
  selection.pass_1_digest,
);
check(
  "design-selection-outputs",
  JSON.stringify(selection.selected_outputs) === JSON.stringify(expectedOutputs),
  selection.selected_outputs,
);
check(
  "design-selection-digest",
  canonicalDigestWithout(selection, "result_digest") === selection.result_digest,
  selection.result_digest,
);

const swuManifest = await json("work-pack/SWU-MANIFEST.json");
const ids = swuManifest.swus.map((item) => item.swu_id);
const expectedIds = Array.from({ length: 10 }, (_, index) => `SWU-LGP-${String(index + 1).padStart(3, "0")}`);
check(
  "swu-manifest",
  JSON.stringify(ids) === JSON.stringify(expectedIds) && new Set(ids).size === 10 && swuManifest.selected_swu === null && swuManifest.first_candidate_swu === "SWU-LGP-001",
  { ids, selected_swu: swuManifest.selected_swu },
);

const missingTaskContracts = [];
for (const swu of swuManifest.swus) {
  const task = path.join(packageRoot, swu.parent_task.replace(/^work-pack\//, "work-pack/"));
  try {
    const text = await readFile(task, "utf8");
    if (!text.includes(swu.swu_id) || !text.includes("Exact Write Scope") || !text.includes("Validation")) {
      missingTaskContracts.push(`${swu.swu_id}: incomplete ${swu.parent_task}`);
    }
  } catch {
    missingTaskContracts.push(`${swu.swu_id}: missing ${swu.parent_task}`);
  }
}
check("swu-task-contracts", missingTaskContracts.length === 0, missingTaskContracts.length ? missingTaskContracts : "10 SWUs navigable to detailed task contracts");

const workPack = await readFile(path.join(packageRoot, "WORK-PACK.md"), "utf8");
check(
  "work-pack-control",
  /workPackGateStatus \| pass/.test(workPack) && /executionAdmissionStatus \| block-learner-view-mutation-admission-and-selection/.test(workPack) && /selected_swu: none/.test(workPack),
  "Plan passes structurally while mutation admission remains blocked",
);

const mappings = await readFile(path.join(packageRoot, "MAPPINGS.md"), "utf8");
const witnesses = await readFile(path.join(packageRoot, "WITNESS-CONTRACTS.md"), "utf8");
const compilerTask = await readFile(path.join(packageRoot, "work-pack/tasks/TASK-LGP-COMPILER.md"), "utf8");
check(
  "admission-separation-negative-control",
  mappings.includes("`binding.concept_id` is empty") &&
    mappings.includes("`binding.current` is false") &&
    mappings.includes("`example-only-not-a-product-receipt`") &&
    mappings.includes("no native-adapter receipt exists") &&
    witnesses.includes("LGP-FIX-014") &&
    compilerTask.includes("never treat learner-view mutation admission as semantic evidence"),
  "exact four-premise question rule and LGP-FIX-014 remain explicit",
);

const distill = await readFile(path.join(packageRoot, "DISTILL-VALIDATION.md"), "utf8");
check(
  "distill-pass",
  distill.includes("- Status: pass") && distill.includes("task-shaped count 0") && distill.includes("selected: none"),
  "atomicity, narrowness, recomposition, and no-selection boundaries",
);

const dispatch = await json("INVOKE-DISPATCH.json");
check(
  "dispatch-non-executing",
  dispatch.subagent_strategy.status === "none" && dispatch.subagent_lifecycle.status === "none" && dispatch.gates.some((gate) => gate.gate_id === "g-learner-view-mutation-admission") && dispatch.gates.some((gate) => gate.gate_id === "g-selection"),
  dispatch.dispatch_id,
);

const dispatchReceipts = new Map(dispatch.boundary_evidence.receipts.map((receipt) => [receipt.receipt_id, receipt]));
const taskSessionReceipt = dispatchReceipts.get("r-selected-swu-task-session");
const ownerReceipt = dispatchReceipts.get("r-selected-swu-owner");
check(
  "disjoint-closeout-producers",
  taskSessionReceipt?.producer === "task-session" &&
    taskSessionReceipt.stores.every((store) => store.startsWith("work-pack/session-evidence/")) &&
    ownerReceipt?.producer === "learner-view-navigation-owner" &&
    ownerReceipt.stores.length === 1 &&
    ownerReceipt.stores[0] === "work-pack/owner-evidence/<SWU-ID>/owner-receipt.json" &&
    swuManifest.receipt_producers.lifecycle_owner.producer === "learner-view-navigation-owner",
  { task_session: taskSessionReceipt, lifecycle_owner: ownerReceipt },
);

const closeout = await readFile(path.join(packageRoot, "work-pack/shared/CLOSEOUT-CONTRACT.md"), "utf8");
const acceptanceTask = await readFile(path.join(packageRoot, "work-pack/tasks/TASK-LGP-ACCEPTANCE.md"), "utf8");
check(
  "no-task-session-owner-receipt-write",
  /Task Session[\s\S]*cannot self-issue this owner receipt/.test(closeout) &&
    !acceptanceTask.includes("session-evidence/SWU-LGP-010/owner-receipt.json") &&
    closeout.includes("It may update only this exact common Plan inventory") &&
    /It must not edit any\s+session or owner evidence file/.test(closeout),
  "Task Session, lifecycle owner, and Invoke Refresh write scopes remain disjoint",
);

const localLinkFailures = await checkLocalLinks();
check("local-markdown-links", localLinkFailures.length === 0, localLinkFailures.length ? localLinkFailures : "all local markdown link targets exist");

const allFiles = await readdir(packageRoot, { recursive: true });
check(
  "no-standalone-learning-graph-html",
  !allFiles.some((item) => item.endsWith("learning-graph.html")),
  "existing mutation-admitted ontology host is the only planned HTML surface",
);

const blocks = checks.filter((item) => item.status === "block");
const receipt = {
  schema: "learning-projection-invoke-package-validation/v1",
  status: blocks.length ? "block" : "pass",
  checked_at: "2026-08-01",
  package_root: path.relative(repositoryRoot, packageRoot),
  checks,
  blockers: blocks.map((item) => item.id),
  execution_authorized: false,
  selected_swu: null,
  authority_effect: "none",
  claim_ceiling: "Validated Define, Design, and Plan authoring artifacts only; no learner-view mutation admission, implementation, browser, human, adapter, semantic admission, destination-owner admission, promotion, publication, release, deployment, or production evidence."
};

await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(`VALIDATION=${receipt.status}`);
console.log(`CHECKS=${checks.length}`);
console.log(`BLOCKERS=${blocks.length}`);
process.exitCode = blocks.length ? 1 : 0;
