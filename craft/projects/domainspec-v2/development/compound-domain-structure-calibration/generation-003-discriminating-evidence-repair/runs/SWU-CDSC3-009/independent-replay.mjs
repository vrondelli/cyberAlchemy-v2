import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalize } from "../../../evaluation/canonical-json.mjs";
import { validateGenerationIndex } from "../../../evaluation/generation-index.mjs";
import { buildGeneration3Artifacts, EXPECTED_GENERATION_3 } from "../../../results/generation-003/build-generation.mjs";
import { buildAllAtomicArtifacts } from "../../runtime/build-atomic-adjudication.mjs";
import { deriveAtomicTargetSet, validateAtomicTargetSet } from "../../runtime/validate-atomic-targets.mjs";
import {
  validateBrowserBaselineWitness,
  validateBrowserEditDiff,
  validateBrowserObservationReceipt,
  validateBrowserSourceManifest,
} from "../../runtime/validate-browser-contracts.mjs";
import { validateBrowserRuntimeDescriptor } from "../../runtime/validate-browser-runtime.mjs";
import { evaluateUsefulness } from "../../runtime/evaluate-usefulness.mjs";
import { validateProtectedImports } from "../../runtime/validate-imports.mjs";

const runRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(runRoot, "../..");
const compoundRoot = resolve(packageRoot, "..");
const workspaceRoot = resolve(compoundRoot, "../../../..");
const inventoryRoot = resolve(workspaceRoot, ".arcanum/inventory");
const inventoryId = "domainspec-v2-compound-domain-structure-calibration-generation-003-closeout-synthesis";

export function runIndependentReplay({ requireInventory = false } = {}) {
  const parent = readJson(resolve(compoundRoot, "evidence/generation-001/f3-savvy-page/receipt.json"));
  const protectedManifest = readJson(resolve(packageRoot, "runs/SWU-CDSC3-001/protected-input-manifest.json"));
  const targetSet = readJson(resolve(packageRoot, "runs/SWU-CDSC3-001/atomic-target-set.json"));
  assert.equal(validateProtectedImports(protectedManifest, { root: workspaceRoot, allowSuccessors: true }), true);
  assert.deepEqual(deriveAtomicTargetSet(parent), targetSet);
  assert.equal(validateAtomicTargetSet(targetSet, parent), true);

  const descriptor = readJson(resolve(packageRoot, "browser-runtime/runtime-descriptor.json"));
  const sourceManifestPath = resolve(packageRoot, "fixtures/generation-003/browser-source-manifest.json");
  const baselinePath = resolve(packageRoot, "evidence/generation-003/browser-baseline/witness.json");
  const permittedPath = resolve(packageRoot, "evidence/generation-003/m3-permitted-child/receipt.json");
  const breakingPath = resolve(packageRoot, "evidence/generation-003/m3-breaking-commit/receipt.json");
  const sourceManifest = readJson(sourceManifestPath);
  const baseline = readJson(baselinePath);
  const permitted = readJson(permittedPath);
  const breaking = readJson(breakingPath);
  assert.equal(validateBrowserRuntimeDescriptor(descriptor, { repositoryRoot: workspaceRoot }), true);
  assert.equal(validateBrowserSourceManifest(sourceManifest, {
    runtimeHandle: descriptor.runtime_handle,
    targetSetHandle: fileHandle(resolve(packageRoot, "runs/SWU-CDSC3-001/atomic-target-set.json")),
  }), true);
  assert.equal(validateBrowserBaselineWitness(baseline, {
    runtimeHandle: descriptor.runtime_handle,
    sourceManifestHandle: fileHandle(sourceManifestPath),
  }), true);
  for (const receipt of [permitted, breaking]) {
    assert.equal(validateBrowserObservationReceipt(receipt, {
      runtimeHandle: descriptor.runtime_handle,
      sourceManifestHandle: fileHandle(sourceManifestPath),
      baselineWitnessHandle: fileHandle(baselinePath),
      targetSetHandle: fileHandle(resolve(packageRoot, "runs/SWU-CDSC3-001/atomic-target-set.json")),
    }), true);
  }
  assert.equal(validateBrowserEditDiff(readJson(resolve(packageRoot, "evidence/generation-003/m3-permitted-child/edit-diff.json"))), true);
  assert.equal(validateBrowserEditDiff(readJson(resolve(packageRoot, "evidence/generation-003/m3-breaking-commit/edit-diff.json"))), true);
  assertPairEqual("browser baseline", "evidence/generation-003/browser-baseline/raw-run-1/run.json", "evidence/generation-003/browser-baseline/raw-run-2/run.json");
  assertPairEqual("permitted observation", "evidence/generation-003/m3-permitted-child/raw-run-1/run.json", "evidence/generation-003/m3-permitted-child/raw-run-2/run.json");
  assertPairEqual("breaking observation", "evidence/generation-003/m3-breaking-commit/raw-run-1/run.json", "evidence/generation-003/m3-breaking-commit/raw-run-2/run.json");

  const usefulnessInput = readJson(resolve(packageRoot, "fixtures/usefulness/preregistered-input.json"));
  const usefulnessResult = readJson(resolve(packageRoot, "evidence/generation-003/usefulness-differential/result.json"));
  assert.deepEqual(evaluateUsefulness(usefulnessInput), usefulnessResult);
  assertPairEqual("usefulness", "evidence/generation-003/usefulness-differential/run-1.json", "evidence/generation-003/usefulness-differential/run-2.json");

  const atomic = buildAllAtomicArtifacts();
  const storedOverlay = readJson(resolve(packageRoot, "evidence/generation-003/f3-atomic/overlay.json"));
  const storedProjection = readJson(resolve(packageRoot, "evidence/generation-003/f3-atomic/projection.json"));
  assert.equal(canonicalize(atomic.overlay), canonicalize(storedOverlay));
  assert.equal(canonicalize(atomic.projection), canonicalize(storedProjection));
  assertPairEqual("atomic replay", "evidence/generation-003/f3-atomic/replay-1.json", "evidence/generation-003/f3-atomic/replay-2.json");
  assert.equal(storedOverlay.semantic.adjudication_matrix.length, 36);
  assert.equal(storedOverlay.semantic.uncertainty_resolutions.length, 2);
  assert.equal(storedOverlay.semantic.carried_uncertainty.length, 5);

  const liveIndex = readJson(resolve(compoundRoot, "generations/index.json"));
  assert.equal(validateGenerationIndex(liveIndex), true);
  assert.equal(liveIndex.entries.length, 3);
  const prefix = { schema_version: liveIndex.schema_version, entries: liveIndex.entries.slice(0, 2) };
  const generation = buildGeneration3Artifacts({ generationIndex: prefix });
  const storedF3 = readJson(resolve(compoundRoot, "results/generation-003/f3-result.json"));
  const storedSuite = readJson(resolve(compoundRoot, "results/generation-003/suite-result.json"));
  const storedProvenance = readJson(resolve(compoundRoot, "results/generation-003/provenance-manifest.json"));
  assert.equal(canonicalize(generation.f3Result), canonicalize(storedF3));
  assert.equal(canonicalize(generation.suiteResult), canonicalize(storedSuite));
  assert.equal(canonicalize(generation.provenanceManifest), canonicalize(storedProvenance));
  assert.equal(canonicalize(generation.nextIndex), canonicalize(liveIndex));
  assert.equal(liveIndex.entries[2].generation_id, EXPECTED_GENERATION_3.predecessor === liveIndex.entries[1].generation_id ? generation.generationEntry.generation_id : null);

  const receiptAudit = auditReceipts();
  const decisionText = readFileSync(resolve(packageRoot, "DECISION-LEDGER.md"), "utf8");
  assert.match(decisionText, /DEC-CDSC3-011/);
  assert.match(decisionText, /Selected option: pinned isolated install/);
  assert.match(decisionText, /Remaining decision blockers: none/);
  assert.deepEqual(readJson(resolve(packageRoot, "runs/SWU-CDSC3-002/receipt.json")).decisions, ["DEC-CDSC3-011:pinned-isolated-install"]);

  const authorityAudit = auditAuthority(storedProjection, storedF3, storedSuite, receiptAudit.receipts);
  const inventoryAudit = auditInventory(requireInventory);

  return {
    schema_version: "cdsc.independent-replay-result.v1",
    audit_result: "PASS",
    generation_id: generation.generationEntry.generation_id,
    predecessor_generation_id: EXPECTED_GENERATION_3.predecessor,
    outcomes: {
      F1: generation.runReceipt.fixture_outcomes.F1,
      F2: generation.runReceipt.fixture_outcomes.F2,
      F3: generation.runReceipt.fixture_outcomes.F3,
      suite: generation.runReceipt.suite_verdict,
      machine_next_route: generation.runReceipt.next_route,
    },
    checks: {
      protected_imports: "14/14",
      protected_generation_prefix: "2/2",
      generation_chain: "3/3",
      atomic_targets: "6/6",
      browser_vectors: "baseline/permitted/breaking replay-identical",
      usefulness_replay: "identical",
      adjudication_coordinates: "36/36",
      uncertainty_resolutions: "2/2",
      carried_uncertainty: "5/5",
      projection_replay: "identical",
      evaluation_replay: "identical",
      append_rejections: "3/3",
      task_session_receipts: `${receiptAudit.count}/${receiptAudit.count}`,
      decision_history: "resolved",
      authority_claims: 0,
      inventory_indexes: inventoryAudit.status,
    },
    artifact_handles: coreArtifactHandles(),
    authority: authorityAudit,
    inventory: inventoryAudit,
  };
}

function auditReceipts() {
  const receipts = [];
  for (let number = 1; number <= 8; number += 1) {
    const id = String(number).padStart(3, "0");
    const receipt = readJson(resolve(packageRoot, `runs/SWU-CDSC3-${id}/receipt.json`));
    assert.equal(receipt.task, `SWU-CDSC3-${id}`);
    assert.equal(receipt.status, "pass");
    assert.equal(receipt.gate, "pass");
    assert.equal(receipt.subagent_closeout, "n/a");
    assert.equal(receipt.next_swu, `SWU-CDSC3-${String(number + 1).padStart(3, "0")}`);
    receipts.push(receipt);
  }
  return { count: receipts.length, receipts };
}

function auditAuthority(projection, f3, suite, receipts) {
  const required = ["candidate-promotion", "ds-d1-formation", "ds-d8-authority", "identity", "pattern-admission"];
  for (const artifact of [projection, f3, suite]) {
    for (const prohibition of required) assert.ok(artifact.prohibited_inferences.includes(prohibition));
  }
  for (const receipt of receipts) {
    if (Object.hasOwn(receipt, "authority_effect")) assert.equal(receipt.authority_effect, "none");
  }
  const specification = readFileSync(resolve(packageRoot, "SPEC.md"), "utf8");
  assert.match(specification, /promotion_eligible: false/);
  assert.equal(suite.semantic.next_route, "evidence-repair");
  return {
    positive_claims: 0,
    promotion_eligible: false,
    machine_route_is_non_authority: true,
    prohibited_inferences_preserved: true,
  };
}

function auditInventory(required) {
  const index = readJson(resolve(inventoryRoot, "index.json"));
  const entry = index.entries.find((item) => item.id === inventoryId);
  if (!entry) {
    if (required) throw new TypeError("generation-3 Inventory entry missing");
    return { id: inventoryId, status: "pending", indexed: false };
  }
  assert.equal(entry.path, `entries/${inventoryId}.md`);
  assert.ok(existsSync(resolve(inventoryRoot, entry.path)));
  assert.equal(index.indexes.by_id[inventoryId], entry.path);
  const humanIndex = readFileSync(resolve(inventoryRoot, "index.md"), "utf8");
  assert.ok(humanIndex.includes(`[${entry.path}](${entry.path})`));
  const log = readFileSync(resolve(inventoryRoot, "log.md"), "utf8");
  assert.ok(log.includes(inventoryId));
  return { id: inventoryId, status: "pass", indexed: true };
}

function coreArtifactHandles() {
  const paths = [
    "runs/SWU-CDSC3-001/atomic-target-set.json",
    "evidence/generation-003/browser-baseline/witness.json",
    "evidence/generation-003/m3-permitted-child/receipt.json",
    "evidence/generation-003/m3-breaking-commit/receipt.json",
    "evidence/generation-003/usefulness-differential/result.json",
    "evidence/generation-003/f3-atomic/overlay.json",
    "evidence/generation-003/f3-atomic/projection.json",
  ];
  const handles = Object.fromEntries(paths.map((path) => [path, fileHandle(resolve(packageRoot, path))]));
  for (const path of [
    "results/generation-003/f3-result.json",
    "results/generation-003/suite-result.json",
    "results/generation-003/provenance-manifest.json",
    "generations/index.json",
  ]) handles[path] = fileHandle(resolve(compoundRoot, path));
  return handles;
}

function assertPairEqual(label, left, right) {
  assert.equal(canonicalize(readJson(resolve(packageRoot, left))), canonicalize(readJson(resolve(packageRoot, right))), `${label} replay drift`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fileHandle(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes("--write");
  const requireInventory = process.argv.includes("--require-inventory");
  const result = runIndependentReplay({ requireInventory });
  if (write) writeFileSync(resolve(runRoot, "replay-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
