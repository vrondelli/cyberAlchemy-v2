import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateProtectedImports } from "../runtime/validate-imports.mjs";
import { validateBrowserEditDiff, validateBrowserObservationReceipt } from "../runtime/validate-browser-contracts.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(packageRoot, path), "utf8"));
const firstRun = readJson("evidence/generation-003/m3-breaking-commit/raw-run-1/run.json");
const secondRun = readJson("evidence/generation-003/m3-breaking-commit/raw-run-2/run.json");
const receipt = readJson("evidence/generation-003/m3-breaking-commit/receipt.json");
const editDiff = readJson("evidence/generation-003/m3-breaking-commit/edit-diff.json");
const comparison = readJson("evidence/generation-003/m3-breaking-commit/target-comparison.json");
const buildReceipt = readJson("evidence/generation-003/m3-breaking-commit/build-receipt.json");
const descriptor = readJson("browser-runtime/runtime-descriptor.json");
const baselineReceipt = readJson("evidence/generation-003/browser-baseline/build-receipt.json");
const protectedManifest = readJson("runs/SWU-CDSC3-001/protected-input-manifest.json");

test("breaking edit diff changes only the cloned commit adapter", () => {
  assert.equal(validateBrowserEditDiff(editDiff), true);
  assert.deepEqual(editDiff.changed_paths, ["harness/browser-baseline/App.jsx"]);
  const baselineRoot = resolve(packageRoot, "experiments/generation-003/m3-breaking-commit/frames/baseline");
  const mutantRoot = resolve(packageRoot, "experiments/generation-003/m3-breaking-commit/frames/mutant");
  const changed = readdirSync(baselineRoot).sort().filter((name) => digest(readFileSync(resolve(baselineRoot, name))) !== digest(readFileSync(resolve(mutantRoot, name))));
  assert.deepEqual(changed, ["App.jsx"]);
  const baselineApp = readFileSync(resolve(baselineRoot, "App.jsx"), "utf8");
  const mutantApp = readFileSync(resolve(mutantRoot, "App.jsx"), "utf8");
  assert.equal(baselineApp.replace("setStep(result.step);", "setStep(requested);"), mutantApp);
});

test("two breaking browser runs and screenshot files are identical", () => {
  assert.deepEqual(firstRun, secondRun);
  assert.equal(buildReceipt.replay_state, "identical");
  assert.equal(buildReceipt.raw_run_handle, digest(readFileSync(resolve(packageRoot, "evidence/generation-003/m3-breaking-commit/raw-run-1/run.json"))));
  assert.deepEqual(screenshotDigests("raw-run-1"), screenshotDigests("raw-run-2"));
});

test("guard result and committed destination remain separate for both vectors", () => {
  assert.deepEqual(comparison.map((item) => item.vector_id), ["V4-inactive-request-9", "V5-premature-request-9"]);
  assert.deepEqual(comparison.map((item) => item.guard_result_step), ["login", "3"]);
  for (const item of comparison) {
    assert.equal(item.guard_allowed, false);
    assert.equal(item.requested_step, "9");
    assert.equal(item.mutant_committed_step, "9");
    assert.notEqual(item.guard_result_step, item.mutant_committed_step);
    assert.equal(item.notice_present, true);
  }
});

test("breaking receipt binds exact inputs and both atomic targets", () => {
  assert.equal(validateBrowserObservationReceipt(receipt, {
    runtimeHandle: descriptor.runtime_handle,
    sourceManifestHandle: firstRun.observation_receipt.source_manifest_handle,
    baselineWitnessHandle: baselineReceipt.baseline_witness_handle,
    targetSetHandle: descriptor.atomic_target_set_handle,
  }), true);
  assert.deepEqual(receipt.target_observations.map((item) => [item.target_id, item.state]), [["T-B-01", "supported"], ["T-B-02", "supported"]]);
  assert.equal(receipt.vector_results.length, 2);
  assert.ok(receipt.vector_results.every((item) => item.comparison === "different"));
});

test("breaking observation preserves prior evidence and carries no adjudication", () => {
  assert.equal(validateProtectedImports(protectedManifest, { root: repositoryRoot, allowSuccessors: true }), true);
  assert.equal(digest(readFileSync(resolve(packageRoot, "evidence/generation-003/m3-permitted-child/receipt.json"))), "sha256:0f6aafa8f7a78278a712c44109935dd57d1dae316c9ff2fd02b91ddc76ac7d85");
  const text = JSON.stringify(receipt);
  for (const prohibited of ["coverage", "explained", "not-explained", "review_state"]) assert.equal(text.includes(prohibited), false);
});

function screenshotDigests(runName) {
  const root = resolve(packageRoot, "evidence/generation-003/m3-breaking-commit", runName, "screenshots");
  return readdirSync(root).sort().map((name) => digest(readFileSync(resolve(root, name))));
}

function digest(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
