import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnvelope, canonicalize, sha256Canonical } from "../../evaluation/canonical-json.mjs";
import { EVALUATOR_VERSION, evaluateFixture } from "../../evaluation/evaluate-fixture.mjs";
import {
  appendGeneration,
  appendGenerationFile,
  generationEntryFromSuite,
  validateGenerationIndex,
} from "../../evaluation/generation-index.mjs";
import { validateEvaluationResult, validateSuiteResult } from "../../evaluation/validate-input.mjs";
import { evaluateSuccessorSuite } from "../../generation-002-evidence-repair/runtime/evaluate-successor-suite.mjs";
import { buildAllAtomicArtifacts } from "../../generation-003-discriminating-evidence-repair/runtime/build-atomic-adjudication.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const parentRoot = resolve(directory, "../..");
const packageRoot = resolve(parentRoot, "generation-003-discriminating-evidence-repair");
const workspaceRoot = resolve(parentRoot, "../../../..");
const indexPath = resolve(parentRoot, "generations/index.json");
const fixedCreatedAt = "2026-07-12T19:20:00Z";

export const EXPECTED_GENERATION_3 = Object.freeze({
  predecessor: "generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683",
  parent: "record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a",
  targetSet: "sha256:6ae51fa18434106afa02bac24930517f1a6f574422fd81c29647ea9c7c96496e",
  permitted: "sha256:0f6aafa8f7a78278a712c44109935dd57d1dae316c9ff2fd02b91ddc76ac7d85",
  breaking: "sha256:879c37a64cf02ab1e28ca819e6a3e6c0de8bc05e061e9b65807d58033e74fdc5",
  usefulness: "sha256:4dd5dc535a28fe0351e9094ac4d7115f929cac4ca7582b1bd3fb46476860c6dd",
  overlay: "record:sha256:3731f6bbe8a33ab259d5846e35b175f91ea78fb941cba4306246443b104374a4",
  projection: "record:sha256:a3c119864e5749dfe0b0a2d5f2a8e3d70b593c9f7fd279a194195850afdd7da1",
  f1: "record:sha256:9bcb2a315e6505cd01ab5f7aff4c37679ac3d0e4dc9f9238915702bb05289b2d",
  f2: "record:sha256:c84b16072ad39c2c00d31b4752d7ffd4edf5d695b615051a2d8fb1ef501e14cb",
});

export function buildGeneration3Artifacts({ generationIndex } = {}) {
  const index = generationIndex ?? readJson(indexPath);
  validateGenerationIndex(index);
  if (index.entries.length !== 2) throw new TypeError("generation-3 build requires the exact generation-2 index prefix");
  if (index.entries.at(-1).generation_id !== EXPECTED_GENERATION_3.predecessor) throw new TypeError("generation-2 predecessor handle drift");

  const protectedManifest = readJson(resolve(packageRoot, "runs/SWU-CDSC3-001/protected-input-manifest.json"));
  validateProtectedGeneration2Prefix(protectedManifest, index);

  const fresh = buildAllAtomicArtifacts();
  const overlay = readJson(resolve(packageRoot, "evidence/generation-003/f3-atomic/overlay.json"));
  const projection = readJson(resolve(packageRoot, "evidence/generation-003/f3-atomic/projection.json"));
  assert.equal(canonicalize(fresh.overlay), canonicalize(overlay), "atomic overlay drift");
  assert.equal(canonicalize(fresh.projection), canonicalize(projection), "atomic projection drift");
  assertExactLayerHandles(fresh, overlay, projection);

  const f1Result = readJson(resolve(parentRoot, "results/generation-001/f1-result.json"));
  const f2Result = readJson(resolve(parentRoot, "results/generation-001/f2-result.json"));
  validateEvaluationResult(f1Result);
  validateEvaluationResult(f2Result);
  if (f1Result.record_id !== EXPECTED_GENERATION_3.f1 || f2Result.record_id !== EXPECTED_GENERATION_3.f2) {
    throw new TypeError("stable fixture result handle drift");
  }

  const f3Result = evaluateFixture(projection);
  const f3Replay = evaluateFixture(fresh.projection);
  assert.equal(canonicalize(f3Result), canonicalize(f3Replay), "F3 same-process replay drift");
  validateEvaluationResult(f3Result);

  const fixtureResults = [f1Result, f2Result, f3Result];
  const suiteOptions = {
    replayState: "identical",
    predecessorGenerationId: EXPECTED_GENERATION_3.predecessor,
    generationIndex: index,
  };
  const suiteResult = evaluateSuccessorSuite(fixtureResults, suiteOptions);
  const suiteReplay = evaluateSuccessorSuite([f3Replay, f2Result, f1Result], suiteOptions);
  assert.equal(canonicalize(suiteResult), canonicalize(suiteReplay), "suite same-process replay drift");
  validateSuiteResult(suiteResult);

  const generationEntry = generationEntryFromSuite(suiteResult, fixtureResults);
  const nextIndex = appendGeneration(index, generationEntry);
  const rejectionProof = buildRejectionProof({ index, nextIndex, generationEntry, fixtureResults });
  const provenanceManifest = buildProvenance({ projection, overlay, f1Result, f2Result, f3Result, suiteResult, generationEntry });
  const runReceipt = buildRunReceipt({ projection, f1Result, f2Result, f3Result, suiteResult, provenanceManifest });

  return {
    f3Result,
    suiteResult,
    provenanceManifest,
    runReceipt,
    generationEntry,
    rejectionProof,
    nextIndex,
  };
}

export function writeGeneration3() {
  const currentIndex = readJson(indexPath);
  const artifacts = buildGeneration3Artifacts({ generationIndex: currentIndex });
  const outputs = [
    ["f3-result.json", artifacts.f3Result],
    ["suite-result.json", artifacts.suiteResult],
    ["provenance-manifest.json", artifacts.provenanceManifest],
    ["run-receipt.json", artifacts.runReceipt],
    ["generation-entry.json", artifacts.generationEntry],
    ["append-rejection-proof.json", artifacts.rejectionProof],
  ];
  for (const [name] of outputs) {
    if (existsSync(resolve(directory, name))) throw new TypeError(`generation-3 output already exists: ${name}`);
  }
  for (const [name, value] of outputs) writeJsonExclusive(resolve(directory, name), value);
  const appended = appendGenerationFile(indexPath, artifacts.generationEntry);
  assert.equal(canonicalize(appended), canonicalize(artifacts.nextIndex), "atomic append output drift");
  return artifacts;
}

function assertExactLayerHandles(fresh, overlay, projection) {
  assert.deepEqual({
    parent: fresh.inputs.parent.record_id,
    targetSet: fresh.inputs.reviewInput.input_handles.target_set,
    permitted: fresh.inputs.reviewInput.input_handles.permitted_observation,
    breaking: fresh.inputs.reviewInput.input_handles.breaking_observation,
    usefulness: fresh.inputs.reviewInput.input_handles.usefulness,
    overlay: overlay.record_id,
    projection: projection.record_id,
  }, {
    parent: EXPECTED_GENERATION_3.parent,
    targetSet: EXPECTED_GENERATION_3.targetSet,
    permitted: EXPECTED_GENERATION_3.permitted,
    breaking: EXPECTED_GENERATION_3.breaking,
    usefulness: EXPECTED_GENERATION_3.usefulness,
    overlay: EXPECTED_GENERATION_3.overlay,
    projection: EXPECTED_GENERATION_3.projection,
  });
}

function validateProtectedGeneration2Prefix(manifest, index) {
  for (const entry of manifest.imports) {
    const bytes = readFileSync(resolve(workspaceRoot, entry.path));
    const handle = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (handle !== entry.raw_sha256) throw new TypeError(`protected import drift: ${entry.import_id}`);
  }
  if (index.entries.length !== manifest.generation_tail.entry_count) throw new TypeError("generation-2 protected prefix length drift");
  if (index.entries.at(-1).generation_id !== manifest.generation_tail.generation_id) throw new TypeError("generation-2 protected prefix tail drift");
  return true;
}

function buildProvenance({ projection, overlay, f1Result, f2Result, f3Result, suiteResult, generationEntry }) {
  const layerHandles = {
    parent_f3: EXPECTED_GENERATION_3.parent,
    atomic_target_set: EXPECTED_GENERATION_3.targetSet,
    permitted_observation: EXPECTED_GENERATION_3.permitted,
    breaking_observation: EXPECTED_GENERATION_3.breaking,
    usefulness_result: EXPECTED_GENERATION_3.usefulness,
    atomic_overlay: overlay.record_id,
    compatibility_projection: projection.record_id,
  };
  return buildEnvelope({
    schemaVersion: "cdsc.generation-provenance.v1",
    contractId: "cdsc.generation-provenance",
    status: "frozen",
    semantic: {
      generation_id: suiteResult.generation_id,
      predecessor_generation_id: EXPECTED_GENERATION_3.predecessor,
      layer_handles: layerHandles,
      fixture_result_handles: [f1Result.record_id, f2Result.record_id, f3Result.record_id].sort(),
      suite_result_handle: suiteResult.record_id,
      generation_entry: generationEntry,
      replay_state: "identical",
      target_provenance: "parent-substitution-only",
      carried_uncertainty_ids: projection.semantic.U.map((item) => item.uncertainty_id),
    },
    prohibitedInferences: projection.prohibited_inferences,
    inputHandles: [
      ...Object.values(layerHandles),
      f1Result.record_id,
      f2Result.record_id,
      f3Result.record_id,
      suiteResult.record_id,
    ],
    createdAt: fixedCreatedAt,
    storagePath: "results/generation-003/provenance-manifest.json",
  });
}

function buildRunReceipt({ projection, f1Result, f2Result, f3Result, suiteResult, provenanceManifest }) {
  return {
    schema_version: "cdsc.run-receipt.v1",
    generation_id: suiteResult.generation_id,
    evaluator_version: EVALUATOR_VERSION,
    input_handles: [
      EXPECTED_GENERATION_3.parent,
      EXPECTED_GENERATION_3.targetSet,
      EXPECTED_GENERATION_3.permitted,
      EXPECTED_GENERATION_3.breaking,
      EXPECTED_GENERATION_3.usefulness,
      EXPECTED_GENERATION_3.overlay,
      projection.record_id,
    ].sort(),
    fixture_result_handles: [f1Result.record_id, f2Result.record_id, f3Result.record_id].sort(),
    fixture_outcomes: {
      F1: f1Result.semantic.fixture_outcome,
      F2: f2Result.semantic.fixture_outcome,
      F3: f3Result.semantic.fixture_outcome,
    },
    suite_result_handle: suiteResult.record_id,
    suite_verdict: suiteResult.semantic.suite_verdict,
    next_route: suiteResult.semantic.next_route,
    same_process_replay: "identical",
    predecessor_generation_id: EXPECTED_GENERATION_3.predecessor,
    provenance_handle: provenanceManifest.record_id,
    uncertainty: projection.semantic.U.map((item) => item.statement),
    prohibited_inferences: projection.prohibited_inferences,
  };
}

function buildRejectionProof({ index, nextIndex, generationEntry, fixtureResults }) {
  const before = canonicalize(index);
  const failures = {};
  failures.duplicate = captureFailure(() => appendGeneration(nextIndex, generationEntry));
  failures.wrong_tail = captureFailure(() => appendGeneration(index, {
    ...generationEntry,
    predecessor_generation_id: index.entries[0].generation_id,
  }));
  failures.rerun = captureFailure(() => evaluateSuccessorSuite(fixtureResults, {
    replayState: "identical",
    predecessorGenerationId: EXPECTED_GENERATION_3.predecessor,
    generationIndex: nextIndex,
  }));
  assert.match(failures.duplicate, /duplicate generation id/);
  assert.match(failures.wrong_tail, /predecessor conflict/);
  assert.match(failures.rerun, /successor predecessor must equal current generation tail/);
  assert.equal(canonicalize(index), before, "rejection preflight mutated index");
  return {
    schema_version: "cdsc.generation-append-rejection-proof.v1",
    index_prefix_handle: sha256Canonical(index),
    next_index_handle: sha256Canonical(nextIndex),
    failures,
    index_unchanged: true,
  };
}

function captureFailure(action) {
  try {
    action();
  } catch (error) {
    return error.message;
  }
  throw new TypeError("expected rejection did not occur");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJsonExclusive(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifacts = writeGeneration3();
  process.stdout.write(`${JSON.stringify({
    generation_id: artifacts.generationEntry.generation_id,
    f3_outcome: artifacts.f3Result.semantic.fixture_outcome,
    suite_verdict: artifacts.suiteResult.semantic.suite_verdict,
  })}\n`);
}
