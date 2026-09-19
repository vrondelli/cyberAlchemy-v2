import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateObservationReceipt, verifyProtectedGeneration } from "../runtime/validate-generation-002.mjs";
import { executeM2 } from "../experiments/generation-002/m2-breaking-guard/execute.mjs";
import { M2_CHANGED_PATHS, M2_COMMIT_DIFF } from "../experiments/generation-002/m2-breaking-guard/mutant.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parent = resolve(root, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const manifest = readJson("fixtures/generation-002/harness-manifest.json");
const baseline = readJson("evidence/generation-002/baseline-equivalence/receipt.json");
const storedRun = readJson("experiments/generation-002/m2-breaking-guard/run.json");
const diff = readJson("experiments/generation-002/m2-breaking-guard/mutation-diff.json");
const receipt = readJson("evidence/generation-002/m2-breaking-guard/receipt.json");

test("M2 changes only committed-step selection", () => {
  const mutation = manifest.semantic.mutations.find((item) => item.mutation_id === "M2");
  assert.deepEqual(M2_CHANGED_PATHS, mutation.allowed_edit_surface);
  assert.deepEqual(diff.changed_paths, mutation.allowed_edit_surface);
  assert.equal(diff.edit_surface_compliant, true);
  assert.deepEqual(M2_COMMIT_DIFF, { before: "guardResult.step", after: "requestedStep" });
});

test("M2 raw run is deterministic and bypasses both redirects", () => {
  const first = executeM2(manifest, baseline);
  const second = executeM2(structuredClone(manifest), structuredClone(baseline));
  assert.deepEqual(first, second);
  assert.deepEqual(first, storedRun);
  assert.equal(first.vector_results.length, 2);
  assert.ok(first.vector_results.every((result) => result.comparison === "different"));
  assert.ok(first.vector_results.every((result) => result.baseline.allowed === false));
  assert.ok(first.vector_results.every((result) => result.mutant.committed_step === result.mutant.requested_step));
  assert.equal(first.observation_state, "supported");
});

test("M2 receipt validates and does not misreport the guard result", () => {
  assert.equal(validateObservationReceipt(receipt), true);
  assert.equal(receipt.semantic.observation_state, "supported");
  assert.ok(receipt.semantic.vector_results.every((result) => result.mutant.allowed === false));
  assert.ok(receipt.semantic.vector_results.every((result) => result.mutant.notice_present === true));
  assert.ok(receipt.semantic.uncertainty.some((item) => /allowed false/.test(item)));
  assert.ok(receipt.prohibited_inferences.includes("irreducibility"));
});

test("M2 leaves generation 1 protected", () => {
  assert.equal(verifyProtectedGeneration(parent, readJson("fixtures/contracts/generation-001-protected-files.json")), true);
});
