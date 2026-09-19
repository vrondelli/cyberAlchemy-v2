import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalize, validateEnvelope } from "../../evaluation/canonical-json.mjs";
import { appendGeneration, validateGenerationIndex } from "../../evaluation/generation-index.mjs";
import { validateEvaluationResult, validateSuiteResult } from "../../evaluation/validate-input.mjs";
import { buildGeneration2Artifacts } from "../../results/generation-002/build-generation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parentRoot = resolve(root, "..");
const readParent = (path) => JSON.parse(readFileSync(resolve(parentRoot, path), "utf8"));
const index = readParent("generations/index.json");
const parentIndex = { schema_version: index.schema_version, entries: [structuredClone(index.entries[0])] };
const stored = {
  f3Result: readParent("results/generation-002/f3-result.json"),
  suiteResult: readParent("results/generation-002/suite-result.json"),
  provenanceManifest: readParent("results/generation-002/provenance-manifest.json"),
  runReceipt: readParent("results/generation-002/run-receipt.json"),
};

test("stored generation-2 artifacts equal a fresh deterministic replay", () => {
  const first = buildGeneration2Artifacts({ generationIndex: parentIndex });
  const second = buildGeneration2Artifacts({ generationIndex: parentIndex });
  for (const key of ["f3Result", "suiteResult", "provenanceManifest", "runReceipt"]) {
    assert.equal(canonicalize(first[key]), canonicalize(stored[key]));
    assert.equal(canonicalize(first[key]), canonicalize(second[key]));
  }
  assert.equal(canonicalize(first.nextIndex), canonicalize(index));
});

test("frozen evaluator preserves insufficient F3 and deferred suite outcomes", () => {
  assert.equal(validateEvaluationResult(stored.f3Result), true);
  assert.equal(stored.f3Result.semantic.fixture_outcome, "INSUFFICIENT-EVIDENCE");
  assert.equal(stored.f3Result.semantic.evidence_complete, false);
  assert.equal(stored.f3Result.status, "insufficient-evidence");
  assert.equal(validateSuiteResult(stored.suiteResult), true);
  assert.equal(stored.suiteResult.semantic.suite_verdict, "CALIBRATION-DEFER");
  assert.equal(stored.suiteResult.semantic.next_route, "evidence-repair");
  assert.equal(stored.suiteResult.semantic.replay_state, "identical");
});

test("generation index contains one exact predecessor-consistent successor", () => {
  assert.equal(validateGenerationIndex(index), true);
  assert.equal(index.entries.length, 2);
  assert.equal(index.entries[1].predecessor_generation_id, index.entries[0].generation_id);
  assert.equal(index.entries[1].generation_id, stored.suiteResult.generation_id);
  assert.equal(index.entries[1].suite_result_handle, stored.suiteResult.record_id);
  assert.ok(index.entries[1].fixture_result_handles.includes(stored.f3Result.record_id));
});

test("duplicate and wrong-tail appends reject without mutating the accepted index", () => {
  const before = canonicalize(index);
  assert.throws(() => appendGeneration(index, index.entries[1]), /duplicate generation id/);
  assert.throws(
    () => appendGeneration(index, { ...index.entries[1], generation_id: `generation:sha256:${"0".repeat(64)}`, predecessor_generation_id: index.entries[0].generation_id }),
    /predecessor conflict/,
  );
  assert.equal(canonicalize(index), before);
});

test("provenance binds every layer, result, uncertainty, and authority prohibition", () => {
  assert.equal(validateEnvelope(stored.provenanceManifest, {
    schemaVersion: "cdsc.generation-provenance.v1",
    contractId: "cdsc.generation-provenance",
  }), true);
  assert.equal(stored.provenanceManifest.semantic.target_provenance, "parent-substitution-only");
  assert.deepEqual(stored.provenanceManifest.semantic.carried_uncertainty_ids, [
    "F3-U-03",
    "F3-U-M1-1",
    "F3-U-M1-2",
    "F3-U-M2-1",
    "F3-U-M2-2",
  ]);
  for (const required of ["identity", "irreducibility", "portability", "pattern-admission", "ds-d1-formation", "ds-d8-authority", "candidate-promotion"]) {
    assert.ok(stored.provenanceManifest.prohibited_inferences.includes(required));
    assert.ok(stored.runReceipt.prohibited_inferences.includes(required));
  }
});

test("run receipt points only to the accepted deterministic generation", () => {
  assert.equal(stored.runReceipt.generation_id, stored.suiteResult.generation_id);
  assert.equal(stored.runReceipt.suite_result_handle, stored.suiteResult.record_id);
  assert.equal(stored.runReceipt.provenance_handle, stored.provenanceManifest.record_id);
  assert.equal(stored.runReceipt.same_process_replay, "identical");
  assert.equal(stored.runReceipt.fixture_outcomes.F3, "INSUFFICIENT-EVIDENCE");
  assert.equal(stored.runReceipt.uncertainty.length, 5);
});
