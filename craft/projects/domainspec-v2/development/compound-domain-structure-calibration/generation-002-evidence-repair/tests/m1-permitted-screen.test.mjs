import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SCREEN_REGISTRY } from "../harness/baseline/screen-registry.mjs";
import { validateObservationReceipt, verifyProtectedGeneration } from "../runtime/validate-generation-002.mjs";
import { executeM1 } from "../experiments/generation-002/m1-permitted-screen/execute.mjs";
import { createM1Registry, M1_CHANGED_PATHS } from "../experiments/generation-002/m1-permitted-screen/mutant.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parent = resolve(root, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const manifest = readJson("fixtures/generation-002/harness-manifest.json");
const baseline = readJson("evidence/generation-002/baseline-equivalence/receipt.json");
const storedRun = readJson("experiments/generation-002/m1-permitted-screen/run.json");
const diff = readJson("experiments/generation-002/m1-permitted-screen/mutation-diff.json");
const receipt = readJson("evidence/generation-002/m1-permitted-screen/receipt.json");

test("M1 changes only the declared adapter implementation", () => {
  const mutation = manifest.semantic.mutations.find((item) => item.mutation_id === "M1");
  assert.deepEqual(M1_CHANGED_PATHS, mutation.allowed_edit_surface);
  assert.deepEqual(diff.changed_paths, mutation.allowed_edit_surface);
  assert.equal(diff.edit_surface_compliant, true);
  const mutant = createM1Registry()["9"];
  assert.notEqual(mutant.implementation, SCREEN_REGISTRY["9"].implementation);
  assert.equal(mutant.screen_key, SCREEN_REGISTRY["9"].screen_key);
  assert.deepEqual(mutant.ports, SCREEN_REGISTRY["9"].ports);
});

test("M1 raw run is deterministic and matches the frozen output", () => {
  const first = executeM1(manifest, baseline);
  const second = executeM1(structuredClone(manifest), structuredClone(baseline));
  assert.deepEqual(first, second);
  assert.deepEqual(first, storedRun);
  assert.equal(first.vector_results.length, 4);
  assert.ok(first.vector_results.every((result) => result.comparison === "match"));
  assert.equal(first.observation_state, "supported");
});

test("M1 observation receipt validates and preserves bounded uncertainty", () => {
  assert.equal(validateObservationReceipt(receipt), true);
  assert.equal(receipt.semantic.observation_state, "supported");
  assert.equal(receipt.semantic.manifest_handle, manifest.record_id);
  assert.equal(receipt.semantic.baseline_witness_handle, baseline.record_id);
  assert.equal(receipt.semantic.harness_handle, manifest.semantic.harness_digest);
  assert.equal(receipt.semantic.vector_results.length, storedRun.vector_results.length);
  assert.ok(receipt.semantic.uncertainty.some((item) => /Visual/.test(item)));
  assert.ok(receipt.prohibited_inferences.includes("identity"));
});

test("M1 leaves generation 1 protected", () => {
  assert.equal(verifyProtectedGeneration(parent, readJson("fixtures/contracts/generation-001-protected-files.json")), true);
});
