import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalize, sha256Canonical } from "../../evaluation/canonical-json.mjs";
import { validateEvaluationResult, validateSuiteResult } from "../../evaluation/validate-input.mjs";
import { validateGenerationIndex } from "../../evaluation/generation-index.mjs";
import {
  EXPECTED_GENERATION_3,
  buildGeneration3Artifacts,
} from "../../results/generation-003/build-generation.mjs";

const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const COMPOUND_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const RESULTS_ROOT = join(COMPOUND_ROOT, "results/generation-003");
const liveIndex = readJson(join(COMPOUND_ROOT, "generations/index.json"));
const generation2Prefix = { schema_version: liveIndex.schema_version, entries: liveIndex.entries.slice(0, 2) };
const artifacts = buildGeneration3Artifacts({ generationIndex: generation2Prefix });

test("generation-3 preflight requires the exact generation-2 index tail", () => {
  assert.equal(validateGenerationIndex(generation2Prefix), true);
  assert.equal(generation2Prefix.entries.length, 2);
  assert.equal(generation2Prefix.entries.at(-1).generation_id, EXPECTED_GENERATION_3.predecessor);
  assert.throws(
    () => buildGeneration3Artifacts({ generationIndex: { ...generation2Prefix, entries: generation2Prefix.entries.slice(0, 1) } }),
    /exact generation-2 index prefix/,
  );
});

test("F3 and suite outcomes are total and same-process deterministic", () => {
  assert.equal(validateEvaluationResult(artifacts.f3Result), true);
  assert.equal(validateSuiteResult(artifacts.suiteResult), true);
  assert.ok(["INSUFFICIENT-EVIDENCE", "EXPLAINED", "RUBRIC-FAIL", "RESIDUAL-SUPPORTED"].includes(artifacts.f3Result.semantic.fixture_outcome));
  assert.ok(["CALIBRATION-DEFER", "CALIBRATION-FAIL", "CALIBRATION-PASS"].includes(artifacts.suiteResult.semantic.suite_verdict));
  assert.equal(artifacts.suiteResult.semantic.replay_state, "identical");
  assert.equal(artifacts.suiteResult.predecessor_generation_id, EXPECTED_GENERATION_3.predecessor);
});

test("stable F1 and F2 handles compose with the new F3 result", () => {
  assert.ok(artifacts.suiteResult.semantic.fixture_result_handles.includes(EXPECTED_GENERATION_3.f1));
  assert.ok(artifacts.suiteResult.semantic.fixture_result_handles.includes(EXPECTED_GENERATION_3.f2));
  assert.ok(artifacts.suiteResult.semantic.fixture_result_handles.includes(artifacts.f3Result.record_id));
  assert.deepEqual(artifacts.runReceipt.fixture_outcomes, {
    F1: "EXPLAINED",
    F2: "EXPLAINED",
    F3: artifacts.f3Result.semantic.fixture_outcome,
  });
});

test("provenance links every generation-3 evidence layer and uncertainty", () => {
  const handles = artifacts.provenanceManifest.semantic.layer_handles;
  assert.deepEqual(handles, {
    parent_f3: EXPECTED_GENERATION_3.parent,
    atomic_target_set: EXPECTED_GENERATION_3.targetSet,
    permitted_observation: EXPECTED_GENERATION_3.permitted,
    breaking_observation: EXPECTED_GENERATION_3.breaking,
    usefulness_result: EXPECTED_GENERATION_3.usefulness,
    atomic_overlay: EXPECTED_GENERATION_3.overlay,
    compatibility_projection: EXPECTED_GENERATION_3.projection,
  });
  assert.equal(artifacts.provenanceManifest.semantic.carried_uncertainty_ids.length, 5);
  assert.equal(artifacts.runReceipt.uncertainty.length, 5);
});

test("duplicate, wrong-tail, and rerun preflights reject without mutation", () => {
  assert.match(artifacts.rejectionProof.failures.duplicate, /duplicate generation id/);
  assert.match(artifacts.rejectionProof.failures.wrong_tail, /predecessor conflict/);
  assert.match(artifacts.rejectionProof.failures.rerun, /successor predecessor must equal current generation tail/);
  assert.equal(artifacts.rejectionProof.index_unchanged, true);
  assert.equal(artifacts.rejectionProof.index_prefix_handle, sha256Canonical(generation2Prefix));
});

test("preflight index adds exactly one successor and preserves generations 1 and 2", () => {
  assert.equal(validateGenerationIndex(artifacts.nextIndex), true);
  assert.equal(artifacts.nextIndex.entries.length, 3);
  assert.equal(canonicalize(artifacts.nextIndex.entries.slice(0, 2)), canonicalize(generation2Prefix.entries));
  assert.deepEqual(artifacts.nextIndex.entries[2], artifacts.generationEntry);
  assert.equal(artifacts.generationEntry.predecessor_generation_id, EXPECTED_GENERATION_3.predecessor);
});

test("run receipt and results preserve all authority prohibitions", () => {
  for (const prohibition of ["candidate-promotion", "ds-d1-formation", "ds-d8-authority", "identity", "pattern-admission", "activation", "promotion"]) {
    assert.ok(artifacts.runReceipt.prohibited_inferences.includes(prohibition));
  }
  assert.doesNotMatch(JSON.stringify(artifacts.provenanceManifest), /candidate_state|activation_state|promotion_state/);
});

test("stored outputs, when appended, equal the deterministic preflight", () => {
  const resultPath = join(RESULTS_ROOT, "f3-result.json");
  if (!existsSync(resultPath)) {
    assert.equal(liveIndex.entries.length, 2, "pre-append index must still have two entries");
    return;
  }
  const stored = {
    f3Result: readJson(resultPath),
    suiteResult: readJson(join(RESULTS_ROOT, "suite-result.json")),
    provenanceManifest: readJson(join(RESULTS_ROOT, "provenance-manifest.json")),
    runReceipt: readJson(join(RESULTS_ROOT, "run-receipt.json")),
    generationEntry: readJson(join(RESULTS_ROOT, "generation-entry.json")),
    rejectionProof: readJson(join(RESULTS_ROOT, "append-rejection-proof.json")),
  };
  for (const [key, value] of Object.entries(stored)) assert.equal(canonicalize(value), canonicalize(artifacts[key]), `${key} drift`);
  assert.equal(liveIndex.entries.length, 3);
  assert.deepEqual(liveIndex, artifacts.nextIndex);
});

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
