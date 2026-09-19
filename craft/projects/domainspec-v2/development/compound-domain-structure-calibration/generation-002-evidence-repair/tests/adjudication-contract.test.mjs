import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildEnvelope, canonicalize } from "../../evaluation/canonical-json.mjs";
import { validateEvidenceReceipt } from "../../evaluation/validate-input.mjs";
import { materializeAdjudicatedF3, targetStatement } from "../runtime/materialize-adjudicated-f3.mjs";
import {
  ADJUDICATION_STATES,
  COVERAGE_STATES,
  RESOLUTION_STATES,
  REVIEW_STATES,
  UNCERTAINTY_STATES,
  USEFULNESS_STATES,
  substitutionTargetDigest,
  validateAdjudicationOverlay,
} from "../runtime/validate-adjudication-overlay.mjs";
import { verifyProtectedGeneration } from "../runtime/validate-generation-002.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parentRoot = resolve(root, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readParent = (path) => JSON.parse(readFileSync(resolve(parentRoot, path), "utf8"));

const schema = readJson("contracts/adjudication-overlay.schema.yml");
const vectors = readJson("fixtures/contracts/adjudication-overlay-vectors.json");
const protectedManifest = readJson("fixtures/contracts/generation-001-protected-files.json");
const parentReceipt = readParent("evidence/generation-001/f3-savvy-page/receipt.json");
const permittedReceipt = readJson("evidence/generation-002/m1-permitted-screen/receipt.json");
const breakingReceipt = readJson("evidence/generation-002/m2-breaking-guard/receipt.json");

const layers = { parentReceipt, permittedReceipt, breakingReceipt };
const prohibitions = ["candidate-promotion", "ds-d1-formation", "ds-d8-authority", "identity", "irreducibility", "pattern-admission", "portability"];

function makeOverlay(overrides = {}) {
  const substitutions = {
    permitted: { parent: parentReceipt.semantic.S.permitted, observation: permittedReceipt, mutationId: "M1" },
    breaking: { parent: parentReceipt.semantic.S.breaking, observation: breakingReceipt, mutationId: "M2" },
  };
  const matrix = parentReceipt.semantic.A.flatMap((explanation) =>
    Object.entries(substitutions).map(([kind, value]) => ({
      explanation_id: explanation.explanation_id,
      substitution_id: value.parent.substitution_id,
      coverage: "partial",
      state: "indeterminate",
      target_provenance: {
        source: "parent-substitution",
        baseline_receipt_handle: parentReceipt.record_id,
        source_field: `semantic.S.${kind}`,
        target_digest: substitutionTargetDigest(value.parent),
      },
      evidence_handles: [value.observation.record_id],
      rationale: "Contract fixture preserves partial coverage as indeterminate.",
      review_state: "approved",
    })),
  );
  const observationUncertainty = [
    ...permittedReceipt.semantic.uncertainty.map((statement, index) => ({ uncertainty_id: `F3-U-M1-${index + 1}`, state: "non-portable", statement })),
    ...breakingReceipt.semantic.uncertainty.map((statement, index) => ({ uncertainty_id: `F3-U-M2-${index + 1}`, state: "non-portable", statement })),
  ];
  const semantic = {
    fixture_id: "F3",
    baseline_receipt_handle: parentReceipt.record_id,
    baseline_generation_id: parentReceipt.generation_id,
    observation_bindings: Object.entries(substitutions).map(([kind, value]) => ({
      substitution_kind: kind,
      substitution_id: value.parent.substitution_id,
      mutation_id: value.mutationId,
      observation_receipt_handle: value.observation.record_id,
    })),
    adjudication_matrix: matrix,
    usefulness_adjudication: {
      state: "retained",
      ...structuredClone(parentReceipt.semantic.D),
      rationale: "Contract fixture retains the parent usefulness decision.",
      evidence_handles: [parentReceipt.record_id],
    },
    uncertainty_resolutions: [
      { parent_uncertainty_id: "F3-U-01", state: "retained", evidence_handles: [permittedReceipt.record_id], rationale: "Contract fixture retains the parent uncertainty." },
      { parent_uncertainty_id: "F3-U-02", state: "retained", evidence_handles: [breakingReceipt.record_id], rationale: "Contract fixture retains the parent uncertainty." },
    ],
    carried_uncertainty: [structuredClone(parentReceipt.semantic.U.find((item) => item.uncertainty_id === "F3-U-03")), ...observationUncertainty],
    reviewers: [{ reviewer_id: "contract-fixture-reviewer", state: "approved" }],
    ...overrides,
  };
  return buildOverlay(semantic);
}

function buildOverlay(semantic, inputHandles = [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id]) {
  return buildEnvelope({
    schemaVersion: "cdsc.adjudication-overlay.v1",
    contractId: "cdsc.adjudication-overlay",
    status: "frozen",
    semantic,
    prohibitedInferences: prohibitions,
    inputHandles,
  });
}

function mutateOverlay(source, mutate, inputHandles = source.input_handles) {
  const semantic = structuredClone(source.semantic);
  mutate(semantic);
  return buildOverlay(semantic, inputHandles);
}

test("overlay schema vocabulary matches the direct validator", () => {
  assert.deepEqual(schema.$defs.adjudication_cell.properties.coverage.enum, COVERAGE_STATES);
  assert.deepEqual(schema.$defs.adjudication_cell.properties.state.enum, ADJUDICATION_STATES);
  assert.deepEqual(schema.$defs.adjudication_cell.properties.review_state.enum, REVIEW_STATES);
  assert.deepEqual(schema.$defs.usefulness_adjudication.properties.state.enum, USEFULNESS_STATES);
  assert.deepEqual(schema.$defs.uncertainty_resolution.properties.state.enum, RESOLUTION_STATES);
  assert.deepEqual(schema.$defs.carried_uncertainty.properties.state.enum, UNCERTAINTY_STATES);
});

test("valid overlay binds the exact immutable parent, M1, and M2 layers", () => {
  const overlay = makeOverlay();
  assert.equal(validateAdjudicationOverlay(overlay, layers), true);
  assert.deepEqual(overlay.input_handles, [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id].sort());
  assert.equal(overlay.semantic.adjudication_matrix.length, parentReceipt.semantic.A.length * 2);
});

test("declared negative vectors fail at the contract boundary", async (t) => {
  const base = makeOverlay();
  const mutations = {
    "wrong-baseline-handle": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.baseline_receipt_handle = permittedReceipt.record_id; }),
    "wrong-mutation-binding": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.observation_bindings.find((item) => item.substitution_kind === "permitted").mutation_id = "M2"; }),
    "combined-substitution-coordinate": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].substitution_id = "F3-S-COMBINED"; }),
    "missing-coordinate": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix.pop(); }),
    "extra-explanation": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].explanation_id = "A-99"; }),
    "duplicate-coordinate": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[1] = structuredClone(semantic.adjudication_matrix[0]); }),
    "partial-marked-explained": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].state = "explained"; }),
    "disputed-marked-approved": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].coverage = "disputed"; }),
    "outcome-derived-target": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].target_provenance.source = "observation-consequence"; }),
    "target-digest-drift": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].target_provenance.target_digest = `sha256:${"0".repeat(64)}`; }),
    "dropped-parent-uncertainty": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.carried_uncertainty = semantic.carried_uncertainty.filter((item) => item.uncertainty_id !== "F3-U-03"); }),
    "dropped-observation-uncertainty": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.carried_uncertainty = semantic.carried_uncertainty.filter((item) => item.uncertainty_id !== "F3-U-M1-1"); }),
    "retained-usefulness-drift": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.usefulness_adjudication.deterministic = true; }),
    "unknown-adjudication-state": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.adjudication_matrix[0].state = "unsupported"; }),
    "wrong-overlay-input-handles": (overlay) => buildOverlay(structuredClone(overlay.semantic), [parentReceipt.record_id, permittedReceipt.record_id]),
    "unknown-semantic-field": (overlay) => mutateOverlay(overlay, (semantic) => { semantic.post_hoc_interpretation = true; }),
  };
  for (const vector of vectors.negative_vectors) {
    await t.test(vector.id, () => {
      const candidate = mutations[vector.id](base);
      assert.throws(() => validateAdjudicationOverlay(candidate, layers), new RegExp(vector.expected_error));
    });
  }
});

test("changed parent predictions invalidate the baseline handle binding", () => {
  const changedSemantic = structuredClone(parentReceipt.semantic);
  changedSemantic.S.permitted.prediction = `${changedSemantic.S.permitted.prediction} Changed.`;
  const changedParent = buildEnvelope({
    schemaVersion: parentReceipt.schema_version,
    contractId: parentReceipt.contract_id,
    status: parentReceipt.status,
    semantic: changedSemantic,
    prohibitedInferences: parentReceipt.prohibited_inferences,
    predecessorGenerationId: parentReceipt.predecessor_generation_id,
    inputHandles: parentReceipt.input_handles,
  });
  assert.throws(
    () => validateAdjudicationOverlay(makeOverlay(), { ...layers, parentReceipt: changedParent }),
    /overlay input handles mismatch|baseline receipt handle mismatch/,
  );
});

test("materializer emits a deterministic parent-valid compatibility projection", () => {
  const overlay = makeOverlay();
  const first = materializeAdjudicatedF3({ overlay, ...layers });
  const second = materializeAdjudicatedF3({ overlay, ...layers });
  assert.equal(validateEvidenceReceipt(first), true);
  assert.equal(canonicalize(first), canonicalize(second));
  assert.deepEqual(first.semantic.G, parentReceipt.semantic.G);
  assert.deepEqual(first.semantic.A, parentReceipt.semantic.A);
  assert.deepEqual(first.semantic.Q.slice(0, 5), parentReceipt.semantic.Q.slice(0, 5));
  assert.equal(first.semantic.Q[5].statement, targetStatement(parentReceipt.semantic.S.permitted));
  assert.equal(first.semantic.Q[6].statement, targetStatement(parentReceipt.semantic.S.breaking));
  assert.ok(!first.semantic.Q[5].statement.includes(permittedReceipt.semantic.observed_consequence));
  assert.ok(!first.semantic.Q[6].statement.includes(breakingReceipt.semantic.observed_consequence));
  assert.equal(first.predecessor_generation_id, parentReceipt.generation_id);
  assert.deepEqual(first.input_handles, [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id, overlay.record_id].sort());
});

test("generation 1 remains byte-protected", () => {
  assert.equal(verifyProtectedGeneration(parentRoot, protectedManifest), true);
});

test("M1 and M2 observation receipt bytes remain frozen", () => {
  const protectedObservations = [
    ["evidence/generation-002/m1-permitted-screen/receipt.json", "61679792f7a88b1c6e00aca88302c570f88382e97406d9fd4e4066c9aa58ed62"],
    ["evidence/generation-002/m2-breaking-guard/receipt.json", "89fca15c59d3ba894e31278a1efb11020819664abf2648dcb5392eaedc622a8c"],
  ];
  for (const [path, expected] of protectedObservations) {
    const actual = createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
    assert.equal(actual, expected, `protected observation drift: ${path}`);
  }
});
