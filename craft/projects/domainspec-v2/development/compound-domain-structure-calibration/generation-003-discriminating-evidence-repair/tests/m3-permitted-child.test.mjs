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
const firstRun = readJson("evidence/generation-003/m3-permitted-child/raw-run-1/run.json");
const secondRun = readJson("evidence/generation-003/m3-permitted-child/raw-run-2/run.json");
const receipt = readJson("evidence/generation-003/m3-permitted-child/receipt.json");
const editDiff = readJson("evidence/generation-003/m3-permitted-child/edit-diff.json");
const buildReceipt = readJson("evidence/generation-003/m3-permitted-child/build-receipt.json");
const descriptor = readJson("browser-runtime/runtime-descriptor.json");
const baselineReceipt = readJson("evidence/generation-003/browser-baseline/build-receipt.json");
const protectedManifest = readJson("runs/SWU-CDSC3-001/protected-input-manifest.json");

test("permitted edit diff changes only the cloned step-registry adapter", () => {
  assert.equal(validateBrowserEditDiff(editDiff), true);
  assert.deepEqual(editDiff.changed_paths, ["harness/browser-baseline/model.mjs"]);
  const baselineRoot = resolve(packageRoot, "experiments/generation-003/m3-permitted-child/frames/baseline");
  const mutantRoot = resolve(packageRoot, "experiments/generation-003/m3-permitted-child/frames/mutant");
  const changed = readdirSync(baselineRoot).sort().filter((name) => digest(readFileSync(resolve(baselineRoot, name))) !== digest(readFileSync(resolve(mutantRoot, name))));
  assert.deepEqual(changed, ["model.mjs"]);
  const baselineModel = readFileSync(resolve(baselineRoot, "model.mjs"), "utf8");
  const mutantModel = readFileSync(resolve(mutantRoot, "model.mjs"), "utf8");
  assert.equal(baselineModel.replace("step-9-baseline", "step-9-alternate"), mutantModel);
});

test("two permitted browser runs are byte-identical", () => {
  assert.deepEqual(firstRun, secondRun);
  assert.equal(buildReceipt.replay_state, "identical");
  assert.equal(buildReceipt.raw_run_handle, digest(readFileSync(resolve(packageRoot, "evidence/generation-003/m3-permitted-child/raw-run-1/run.json"))));
  assert.deepEqual(screenshotDigests("raw-run-1"), screenshotDigests("raw-run-2"));
});

test("permitted receipt binds exact inputs and all four target observations", () => {
  assert.equal(validateBrowserObservationReceipt(receipt, {
    runtimeHandle: descriptor.runtime_handle,
    sourceManifestHandle: firstRun.observation_receipt.source_manifest_handle,
    baselineWitnessHandle: baselineReceipt.baseline_witness_handle,
    targetSetHandle: descriptor.atomic_target_set_handle,
  }), true);
  assert.deepEqual(receipt.target_observations.map((item) => [item.target_id, item.state]), [
    ["T-P-01", "supported"],
    ["T-P-02", "supported"],
    ["T-P-03", "supported"],
    ["T-P-04", "supported"],
  ]);
  assert.equal(receipt.vector_results.length, 7);
  assert.equal(receipt.supporting_screenshots.length, 7);
});

test("child identity changes while interaction, route, and guard fields remain stable", () => {
  const changed = receipt.vector_results.filter((item) => item.comparison === "different");
  assert.deepEqual(changed.map((item) => item.vector_id), ["V1-active-request-9", "V7-mounted-step-9"]);
  for (const item of receipt.vector_results) {
    for (const field of ["interaction_ports", "guard_allowed", "notice_present", "requested_step", "committed_step", "route_tree_state"]) {
      assert.deepEqual(item.mutant[field], item.baseline[field], `${item.vector_id}:${field}`);
    }
  }
  assert.ok(changed.every((item) => item.baseline.rendered_child_id === "step-9-baseline" && item.mutant.rendered_child_id === "step-9-alternate"));
});

test("receipt contains observation state but no adjudication authority", () => {
  const text = JSON.stringify(receipt);
  for (const prohibited of ["coverage", "explained", "not-explained", "review_state", "candidate-promotion", "identity-pass"]) assert.equal(text.includes(prohibited), false);
  assert.equal(validateProtectedImports(protectedManifest, { root: repositoryRoot, allowSuccessors: true }), true);
});

function screenshotDigests(runName) {
  const root = resolve(packageRoot, "evidence/generation-003/m3-permitted-child", runName, "screenshots");
  return readdirSync(root).sort().map((name) => digest(readFileSync(resolve(root, name)))).sort();
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
