import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnvelope, canonicalize } from "../../evaluation/canonical-json.mjs";
import { evaluateFixture, EVALUATOR_VERSION } from "../../evaluation/evaluate-fixture.mjs";
import {
  appendGeneration,
  appendGenerationFile,
  generationEntryFromSuite,
  validateGenerationIndex,
} from "../../evaluation/generation-index.mjs";
import { validateEvaluationResult, validateSuiteResult } from "../../evaluation/validate-input.mjs";
import { buildAdjudicationArtifacts } from "../../evidence/generation-002/f3-savvy-page/build-receipts.mjs";
import { evaluateSuccessorSuite } from "../../generation-002-evidence-repair/runtime/evaluate-successor-suite.mjs";
import { verifyProtectedGeneration } from "../../generation-002-evidence-repair/runtime/validate-generation-002.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const parentRoot = resolve(directory, "../..");
const packageRoot = resolve(parentRoot, "generation-002-evidence-repair");
const indexPath = resolve(parentRoot, "generations/index.json");
const fixedCreatedAt = "2026-07-12T14:08:00Z";

const EXPECTED = Object.freeze({
  predecessor: "generation:sha256:2ff6a0109e08f188388d580125ab6b185b4ff5f198300cb6bd5db0d9fe31349f",
  parent: "record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a",
  m1: "record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140",
  m2: "record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd",
  overlay: "record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5",
  compatibility: "record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd",
  f1: "record:sha256:9bcb2a315e6505cd01ab5f7aff4c37679ac3d0e4dc9f9238915702bb05289b2d",
  f2: "record:sha256:c84b16072ad39c2c00d31b4752d7ffd4edf5d695b615051a2d8fb1ef501e14cb",
});

export function buildGeneration2Artifacts({ generationIndex = readJson(indexPath) } = {}) {
  validateGenerationIndex(generationIndex);
  if (generationIndex.entries.length !== 1) throw new TypeError("generation-2 build requires the exact generation-1 index prefix");
  if (generationIndex.entries[0].generation_id !== EXPECTED.predecessor) throw new TypeError("generation-1 predecessor handle drift");

  const protectedManifest = readJson(resolve(packageRoot, "fixtures/contracts/generation-001-protected-files.json"));
  verifyProtectedGeneration(parentRoot, protectedManifest);

  const fresh = buildAdjudicationArtifacts();
  const overlay = readJson(resolve(parentRoot, "evidence/generation-002/f3-savvy-page/adjudication-overlay.json"));
  const compatibilityReceipt = readJson(resolve(parentRoot, "evidence/generation-002/f3-savvy-page/compatibility-receipt.json"));
  assert.equal(canonicalize(fresh.overlay), canonicalize(overlay), "frozen overlay drift");
  assert.equal(canonicalize(fresh.compatibilityReceipt), canonicalize(compatibilityReceipt), "compatibility projection drift");
  assertExactHandles({ fresh, overlay, compatibilityReceipt });

  const f1Result = readJson(resolve(parentRoot, "results/generation-001/f1-result.json"));
  const f2Result = readJson(resolve(parentRoot, "results/generation-001/f2-result.json"));
  validateEvaluationResult(f1Result);
  validateEvaluationResult(f2Result);
  if (f1Result.record_id !== EXPECTED.f1 || f2Result.record_id !== EXPECTED.f2) throw new TypeError("stable fixture result handle drift");

  const f3Result = evaluateFixture(compatibilityReceipt);
  const f3Replay = evaluateFixture(fresh.compatibilityReceipt);
  assert.equal(canonicalize(f3Result), canonicalize(f3Replay), "F3 same-process replay drift");
  validateEvaluationResult(f3Result);

  const fixtureResults = [f1Result, f2Result, f3Result];
  const suiteOptions = {
    replayState: "identical",
    predecessorGenerationId: EXPECTED.predecessor,
    generationIndex,
  };
  const suiteResult = evaluateSuccessorSuite(fixtureResults, suiteOptions);
  const suiteReplay = evaluateSuccessorSuite([f3Replay, f2Result, f1Result], suiteOptions);
  assert.equal(canonicalize(suiteResult), canonicalize(suiteReplay), "suite same-process replay drift");
  validateSuiteResult(suiteResult);

  const generationEntry = generationEntryFromSuite(suiteResult, fixtureResults);
  const nextIndex = appendGeneration(generationIndex, generationEntry);
  const provenanceManifest = buildProvenance({
    fresh,
    compatibilityReceipt,
    f1Result,
    f2Result,
    f3Result,
    suiteResult,
    generationEntry,
  });
  const runReceipt = buildRunReceipt({
    compatibilityReceipt,
    f1Result,
    f2Result,
    f3Result,
    suiteResult,
    provenanceManifest,
  });

  return {
    f3Result,
    suiteResult,
    provenanceManifest,
    runReceipt,
    generationEntry,
    nextIndex,
  };
}

export function writeGeneration2() {
  const currentIndex = readJson(indexPath);
  const artifacts = buildGeneration2Artifacts({ generationIndex: currentIndex });
  writeJson(resolve(directory, "f3-result.json"), artifacts.f3Result);
  writeJson(resolve(directory, "suite-result.json"), artifacts.suiteResult);
  writeJson(resolve(directory, "provenance-manifest.json"), artifacts.provenanceManifest);
  writeJson(resolve(directory, "run-receipt.json"), artifacts.runReceipt);
  const appended = appendGenerationFile(indexPath, artifacts.generationEntry);
  assert.equal(canonicalize(appended), canonicalize(artifacts.nextIndex), "atomic append output drift");
  return artifacts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeGeneration2();

function assertExactHandles({ fresh, overlay, compatibilityReceipt }) {
  const actual = {
    parent: fresh.parentReceipt.record_id,
    m1: fresh.permittedReceipt.record_id,
    m2: fresh.breakingReceipt.record_id,
    overlay: overlay.record_id,
    compatibility: compatibilityReceipt.record_id,
  };
  assert.deepEqual(actual, {
    parent: EXPECTED.parent,
    m1: EXPECTED.m1,
    m2: EXPECTED.m2,
    overlay: EXPECTED.overlay,
    compatibility: EXPECTED.compatibility,
  });
}

function buildProvenance({ fresh, compatibilityReceipt, f1Result, f2Result, f3Result, suiteResult, generationEntry }) {
  return buildEnvelope({
    schemaVersion: "cdsc.generation-provenance.v1",
    contractId: "cdsc.generation-provenance",
    status: "frozen",
    semantic: {
      generation_id: suiteResult.generation_id,
      predecessor_generation_id: EXPECTED.predecessor,
      layer_handles: {
        parent_f3: fresh.parentReceipt.record_id,
        m1_observation: fresh.permittedReceipt.record_id,
        m2_observation: fresh.breakingReceipt.record_id,
        adjudication_overlay: fresh.overlay.record_id,
        compatibility_projection: compatibilityReceipt.record_id,
      },
      fixture_result_handles: [f1Result.record_id, f2Result.record_id, f3Result.record_id].sort(),
      suite_result_handle: suiteResult.record_id,
      generation_entry: generationEntry,
      replay_state: "identical",
      target_provenance: "parent-substitution-only",
      carried_uncertainty_ids: compatibilityReceipt.semantic.U.map((item) => item.uncertainty_id),
    },
    prohibitedInferences: compatibilityReceipt.prohibited_inferences,
    inputHandles: [
      fresh.parentReceipt.record_id,
      fresh.permittedReceipt.record_id,
      fresh.breakingReceipt.record_id,
      fresh.overlay.record_id,
      compatibilityReceipt.record_id,
      f1Result.record_id,
      f2Result.record_id,
      f3Result.record_id,
      suiteResult.record_id,
    ],
    createdAt: fixedCreatedAt,
    storagePath: "results/generation-002/provenance-manifest.json",
  });
}

function buildRunReceipt({ compatibilityReceipt, f1Result, f2Result, f3Result, suiteResult, provenanceManifest }) {
  return {
    schema_version: "cdsc.run-receipt.v1",
    generation_id: suiteResult.generation_id,
    evaluator_version: EVALUATOR_VERSION,
    input_handles: [EXPECTED.parent, EXPECTED.m1, EXPECTED.m2, EXPECTED.overlay, compatibilityReceipt.record_id].sort(),
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
    predecessor_generation_id: EXPECTED.predecessor,
    provenance_handle: provenanceManifest.record_id,
    uncertainty: compatibilityReceipt.semantic.U.map((item) => item.statement),
    prohibited_inferences: compatibilityReceipt.prohibited_inferences,
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
