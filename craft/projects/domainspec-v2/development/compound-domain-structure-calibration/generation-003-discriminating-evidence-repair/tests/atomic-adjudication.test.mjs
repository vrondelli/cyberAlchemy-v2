import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEnvelope, canonicalize, sha256Canonical } from "../../evaluation/canonical-json.mjs";
import { validateEvidenceReceipt } from "../../evaluation/validate-input.mjs";
import {
  buildAllAtomicArtifacts,
  loadAtomicInputs,
} from "../runtime/build-atomic-adjudication.mjs";
import {
  ATOMIC_OBSERVABLES,
  EXPLANATION_IDS,
  PROHIBITED_INFERENCES,
  REQUIRED_UNCERTAINTY_IDS,
  TARGET_IDS,
  assertNoEvaluatorUse,
  validateAtomicOverlay,
  validateAtomicProjection,
} from "../runtime/validate-atomic-adjudication.mjs";
import { validateProtectedImports } from "../runtime/validate-imports.mjs";

const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const WORKSPACE_ROOT = fileURLToPath(new URL("../../../../../../", import.meta.url));
const EVIDENCE_ROOT = join(PACKAGE_ROOT, "evidence/generation-003/f3-atomic");
const inputs = loadAtomicInputs();
const generated = buildAllAtomicArtifacts(inputs);
const storedOverlay = readJson(join(EVIDENCE_ROOT, "overlay.json"));
const storedProjection = readJson(join(EVIDENCE_ROOT, "projection.json"));

test("schemas freeze the finite 6 x 6 overlay and parent-compatible projection", () => {
  const overlaySchema = readJson(join(PACKAGE_ROOT, "contracts/atomic-adjudication-overlay.schema.yml"));
  const projectionSchema = readJson(join(PACKAGE_ROOT, "contracts/atomic-compatibility-projection.schema.yml"));
  assert.equal(overlaySchema.properties.semantic.properties.adjudication_matrix.minItems, 36);
  assert.equal(overlaySchema.properties.semantic.properties.adjudication_matrix.maxItems, 36);
  assert.deepEqual(overlaySchema.$defs.cell.properties.explanation_id.enum, EXPLANATION_IDS);
  assert.deepEqual(overlaySchema.$defs.cell.properties.target_id.enum, TARGET_IDS);
  assert.equal(projectionSchema.properties.semantic.properties.Q.minItems, 11);
  assert.equal(projectionSchema.properties.semantic.properties.sigma_matrix.minItems, 66);
});

test("overlay contains every coordinate exactly once with matching evidence provenance", () => {
  assert.equal(validateAtomicOverlay(storedOverlay, inputs), true);
  assert.equal(storedOverlay.semantic.adjudication_matrix.length, 36);
  const coordinates = new Set(storedOverlay.semantic.adjudication_matrix.map((cell) => `${cell.explanation_id}/${cell.target_id}`));
  assert.equal(coordinates.size, 36);
  for (const explanationId of EXPLANATION_IDS) {
    for (const targetId of TARGET_IDS) assert.ok(coordinates.has(`${explanationId}/${targetId}`));
  }
  const evidenceByKind = {
    permitted: inputs.reviewInput.input_handles.permitted_observation,
    breaking: inputs.reviewInput.input_handles.breaking_observation,
  };
  const targets = new Map(inputs.targetSet.targets.map((target) => [target.target_id, target]));
  for (const cell of storedOverlay.semantic.adjudication_matrix) {
    assert.equal(cell.evidence_handle, evidenceByKind[targets.get(cell.target_id).kind]);
  }
});

test("projection is parent-valid and preserves pre-atomic semantics", () => {
  assert.equal(validateAtomicProjection(storedProjection, { overlay: storedOverlay, ...inputs }), true);
  assert.equal(validateEvidenceReceipt(storedProjection), true);
  assert.deepEqual(storedProjection.semantic.G, inputs.parent.semantic.G);
  assert.deepEqual(storedProjection.semantic.A, inputs.parent.semantic.A);
  assert.deepEqual(storedProjection.semantic.Q.slice(0, 5), inputs.parent.semantic.Q.filter((item) => item.observable_id !== "Q-06"));
  assert.deepEqual(storedProjection.semantic.sigma_matrix.slice(0, 30), inputs.parent.semantic.sigma_matrix.filter((cell) => cell.observable_id !== "Q-06"));
  assert.deepEqual(storedProjection.semantic.Q.slice(5).map((item) => item.observable_id), Object.values(ATOMIC_OBSERVABLES));
});

test("empty D and all uncertainty and authority limits survive projection", () => {
  assert.equal(storedOverlay.semantic.usefulness_adjudication.deterministic, true);
  assert.equal(storedOverlay.semantic.usefulness_adjudication.nonzero, false);
  assert.deepEqual(storedOverlay.semantic.usefulness_adjudication.symmetric_difference, []);
  assert.deepEqual(storedOverlay.semantic.carried_uncertainty.map((item) => item.uncertainty_id).sort(), [...REQUIRED_UNCERTAINTY_IDS]);
  assert.deepEqual(storedProjection.semantic.U.map((item) => item.uncertainty_id).sort(), [...REQUIRED_UNCERTAINTY_IDS]);
  for (const prohibition of PROHIBITED_INFERENCES) assert.ok(storedProjection.prohibited_inferences.includes(prohibition));
  assert.doesNotMatch(JSON.stringify(storedProjection), /fixture_outcome|suite_verdict|candidate_state/);
});

test("all protected and generation-3 evidence handles remain exact", () => {
  const manifest = readJson(join(PACKAGE_ROOT, "runs/SWU-CDSC3-001/protected-input-manifest.json"));
  assert.equal(validateProtectedImports(manifest, { root: WORKSPACE_ROOT, allowSuccessors: true }), true);
  assert.equal(inputs.parent.record_id, inputs.reviewInput.input_handles.parent);
  assert.equal(inputs.generation2Overlay.record_id, inputs.reviewInput.input_handles.generation_2_overlay);
  assert.equal(inputs.generation2Projection.record_id, inputs.reviewInput.input_handles.generation_2_projection);
  assert.equal(fileHandle(join(PACKAGE_ROOT, "runs/SWU-CDSC3-001/atomic-target-set.json")), inputs.reviewInput.input_handles.target_set);
  assert.equal(fileHandle(join(PACKAGE_ROOT, "evidence/generation-003/m3-permitted-child/receipt.json")), inputs.reviewInput.input_handles.permitted_observation);
  assert.equal(fileHandle(join(PACKAGE_ROOT, "evidence/generation-003/m3-breaking-commit/receipt.json")), inputs.reviewInput.input_handles.breaking_observation);
  assert.equal(fileHandle(join(PACKAGE_ROOT, "evidence/generation-003/usefulness-differential/result.json")), inputs.reviewInput.input_handles.usefulness);
});

test("fresh materialization and both replay summaries are byte-identical", () => {
  assert.equal(canonicalize(generated.overlay), canonicalize(storedOverlay));
  assert.equal(canonicalize(generated.projection), canonicalize(storedProjection));
  const replay1 = readJson(join(EVIDENCE_ROOT, "replay-1.json"));
  const replay2 = readJson(join(EVIDENCE_ROOT, "replay-2.json"));
  assert.deepEqual(replay1, replay2);
  assert.equal(replay1.overlay_record_id, storedOverlay.record_id);
  assert.equal(replay1.projection_record_id, storedProjection.record_id);
});

test("field-level provenance report covers all 36 reviewed cells", () => {
  const report = readJson(join(EVIDENCE_ROOT, "provenance-report.json"));
  assert.equal(report.coordinate_count, 36);
  assert.equal(report.coordinates.length, 36);
  assert.equal(new Set(report.coordinates.map((item) => `${item.explanation_id}/${item.target_id}`)).size, 36);
  for (const item of report.coordinates) {
    assert.equal(item.explanation_digest, sha256Canonical(item.explanation_statement));
    assert.match(item.observation_handle, /^sha256:[a-f0-9]{64}$/);
  }
});

test("all declared negative vectors reject at their owning boundary", async (t) => {
  const catalog = readJson(join(PACKAGE_ROOT, "fixtures/adjudication/negative-vectors.json"));
  const cases = new Map([
    ["cells-35", () => validateAtomicOverlay(rebuildOverlay({ adjudication_matrix: storedOverlay.semantic.adjudication_matrix.slice(0, 35) }), inputs)],
    ["cells-37", () => validateAtomicOverlay(rebuildOverlay({ adjudication_matrix: [...storedOverlay.semantic.adjudication_matrix, storedOverlay.semantic.adjudication_matrix[0]] }), inputs)],
    ["duplicate-coordinate", () => {
      const matrix = structuredClone(storedOverlay.semantic.adjudication_matrix);
      matrix[35] = structuredClone(matrix[0]);
      return validateAtomicOverlay(rebuildOverlay({ adjudication_matrix: matrix }), inputs);
    }],
    ["changed-explanation", () => mutateCell(0, { explanation_digest: sha256Canonical("changed") })],
    ["changed-target", () => mutateCell(0, { target_digest: sha256Canonical("changed") })],
    ["observed-outcome-target", () => mutateCell(0, { target_digest: sha256Canonical("supported") })],
    ["partial-as-explained", () => {
      const index = storedOverlay.semantic.adjudication_matrix.findIndex((cell) => cell.coverage === "partial");
      return mutateCell(index, { state: "explained" });
    }],
    ["dropped-uncertainty", () => validateAtomicOverlay(rebuildOverlay({ carried_uncertainty: storedOverlay.semantic.carried_uncertainty.slice(0, 4) }), inputs)],
    ["d-inflation", () => validateAtomicOverlay(rebuildOverlay({ usefulness_adjudication: { ...storedOverlay.semantic.usefulness_adjudication, symmetric_difference: ["unit:invented"] } }), inputs)],
    ["unknown-field", () => mutateCell(0, { fixture_outcome: "EXPLAINED" })],
    ["evaluator-import-call", () => assertNoEvaluatorUse(["import { evaluateFixture } from './evaluate-fixture.mjs'; evaluateFixture(input);"])],
  ]);
  assert.deepEqual(catalog.vectors.map((item) => item.id), [...cases.keys()]);
  for (const vector of catalog.vectors) {
    await t.test(vector.id, () => assert.throws(cases.get(vector.id), new RegExp(vector.error)));
  }
});

test("runtime materializer and validator contain no evaluator import or call", () => {
  const sources = [
    readFileSync(join(PACKAGE_ROOT, "runtime/build-atomic-adjudication.mjs"), "utf8"),
    readFileSync(join(PACKAGE_ROOT, "runtime/validate-atomic-adjudication.mjs"), "utf8"),
  ];
  assert.equal(assertNoEvaluatorUse(sources), true);
});

function mutateCell(index, fields) {
  const matrix = structuredClone(storedOverlay.semantic.adjudication_matrix);
  matrix[index] = { ...matrix[index], ...fields };
  return validateAtomicOverlay(rebuildOverlay({ adjudication_matrix: matrix }), inputs);
}

function rebuildOverlay(changes) {
  return buildEnvelope({
    schemaVersion: storedOverlay.schema_version,
    contractId: storedOverlay.contract_id,
    contractVersion: storedOverlay.contract_version,
    status: storedOverlay.status,
    semantic: { ...structuredClone(storedOverlay.semantic), ...changes },
    prohibitedInferences: storedOverlay.prohibited_inferences,
    predecessorGenerationId: storedOverlay.predecessor_generation_id,
    inputHandles: storedOverlay.input_handles,
    createdAt: storedOverlay.created_at,
    storagePath: storedOverlay.storage_path,
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fileHandle(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}
