import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildEnvelope, canonicalize, sha256Canonical } from "../../evaluation/canonical-json.mjs";
import {
  ATOMIC_OBSERVABLES,
  PROHIBITED_INFERENCES,
  validateAtomicOverlay,
  validateAtomicProjection,
} from "./validate-atomic-adjudication.mjs";

const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const COMPOUND_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PATHS = Object.freeze({
  parent: join(COMPOUND_ROOT, "evidence/generation-001/f3-savvy-page/receipt.json"),
  generation2Overlay: join(COMPOUND_ROOT, "evidence/generation-002/f3-savvy-page/adjudication-overlay.json"),
  generation2Projection: join(COMPOUND_ROOT, "evidence/generation-002/f3-savvy-page/compatibility-receipt.json"),
  targetSet: join(PACKAGE_ROOT, "runs/SWU-CDSC3-001/atomic-target-set.json"),
  permitted: join(PACKAGE_ROOT, "evidence/generation-003/m3-permitted-child/receipt.json"),
  breaking: join(PACKAGE_ROOT, "evidence/generation-003/m3-breaking-commit/receipt.json"),
  usefulness: join(PACKAGE_ROOT, "evidence/generation-003/usefulness-differential/result.json"),
  reviewInput: join(PACKAGE_ROOT, "fixtures/adjudication/review-input.json"),
});

export function loadAtomicInputs() {
  return Object.fromEntries(Object.entries(PATHS).map(([key, path]) => [key, JSON.parse(readFileSync(path, "utf8"))]));
}

export function buildAtomicOverlay(inputs) {
  const explanations = new Map(inputs.parent.semantic.A.map((item) => [item.explanation_id, item]));
  const targets = new Map(inputs.targetSet.targets.map((item) => [item.target_id, item]));
  const evidenceHandles = {
    permitted: inputs.reviewInput.input_handles.permitted_observation,
    breaking: inputs.reviewInput.input_handles.breaking_observation,
  };
  const adjudicationMatrix = [...inputs.reviewInput.reviews]
    .sort((left, right) => `${left.explanation_id}/${left.target_id}`.localeCompare(`${right.explanation_id}/${right.target_id}`))
    .map((review) => {
      const explanation = explanations.get(review.explanation_id);
      const target = targets.get(review.target_id);
      return {
        explanation_id: review.explanation_id,
        target_id: review.target_id,
        coverage: review.coverage,
        state: { full: "explained", none: "not-explained", partial: "indeterminate" }[review.coverage],
        explanation_digest: sha256Canonical(explanation.statement),
        target_digest: target.target_digest,
        evidence_handle: evidenceHandles[target.kind],
        rationale: review.rationale,
        review_state: inputs.reviewInput.reviewer.state,
      };
    });

  const semantic = {
    fixture_id: "F3",
    baseline_receipt_handle: inputs.parent.record_id,
    target_set_handle: inputs.reviewInput.input_handles.target_set,
    observation_bindings: [
      { kind: "breaking", observation_handle: evidenceHandles.breaking, target_ids: ["T-B-01", "T-B-02"] },
      { kind: "permitted", observation_handle: evidenceHandles.permitted, target_ids: ["T-P-01", "T-P-02", "T-P-03", "T-P-04"] },
    ],
    usefulness_result_handle: inputs.reviewInput.input_handles.usefulness,
    adjudication_matrix: adjudicationMatrix,
    usefulness_adjudication: {
      state: "retained",
      baseline_test_set: structuredClone(inputs.usefulness.baseline_test_set),
      residual_test_set: structuredClone(inputs.usefulness.residual_test_set),
      symmetric_difference: structuredClone(inputs.usefulness.symmetric_difference),
      deterministic: inputs.usefulness.deterministic,
      nonzero: inputs.usefulness.nonzero,
      evidence_handle: inputs.reviewInput.input_handles.usefulness,
      uncertainty: structuredClone(inputs.usefulness.uncertainty),
      rationale: "The empty finite differential is retained exactly and does not establish identity or promotion sufficiency.",
    },
    uncertainty_resolutions: [
      { parent_uncertainty_id: "F3-U-01", state: "resolved", evidence_handle: evidenceHandles.permitted },
      { parent_uncertainty_id: "F3-U-02", state: "resolved", evidence_handle: evidenceHandles.breaking },
    ],
    carried_uncertainty: [
      {
        uncertainty_id: "F3-U-03",
        state: "non-portable",
        statement: "One Next specimen and its export convention do not establish a portable Page kind.",
        evidence_handles: [inputs.parent.record_id, inputs.reviewInput.input_handles.generation_2_projection],
      },
      {
        uncertainty_id: "F3-U-G3-ATTESTATION",
        state: "missing",
        statement: "Independent route and content attestations remain incomplete.",
        evidence_handles: [inputs.parent.record_id, inputs.reviewInput.input_handles.generation_2_overlay],
      },
      {
        uncertainty_id: "F3-U-G3-BROWSER",
        state: "non-portable",
        statement: "Real browser observations are bounded to the source-derived Savvy harness vectors.",
        evidence_handles: [evidenceHandles.permitted, evidenceHandles.breaking],
      },
      {
        uncertainty_id: "F3-U-G3-CATALOG",
        state: "untested",
        statement: inputs.usefulness.uncertainty[0],
        evidence_handles: [inputs.reviewInput.input_handles.usefulness],
      },
      {
        uncertainty_id: "F3-U-G3-SOURCE",
        state: "non-portable",
        statement: "Pinned Savvy source slices do not establish behavior outside the selected selectors.",
        evidence_handles: [evidenceHandles.permitted, evidenceHandles.breaking],
      },
    ],
    reviewers: [structuredClone(inputs.reviewInput.reviewer)],
  };

  const overlay = buildEnvelope({
    schemaVersion: "cdsc.atomic-adjudication-overlay.v1",
    contractId: "cdsc.atomic-adjudication-overlay",
    status: "frozen",
    semantic,
    prohibitedInferences: PROHIBITED_INFERENCES,
    predecessorGenerationId: inputs.reviewInput.predecessor_generation_id,
    inputHandles: Object.values(inputs.reviewInput.input_handles),
    createdAt: inputs.reviewInput.created_at,
    storagePath: "evidence/generation-003/f3-atomic/overlay.json",
  });
  validateAtomicOverlay(overlay, inputs);
  return overlay;
}

export function buildAtomicProjection(inputs, overlay) {
  const parent = inputs.parent.semantic;
  const targets = new Map(inputs.targetSet.targets.map((item) => [item.target_id, item]));
  const baseObservables = parent.Q.filter((item) => item.observable_id !== "Q-06").map((item) => structuredClone(item));
  const atomicObservables = Object.entries(ATOMIC_OBSERVABLES).map(([targetId, observableId]) => {
    const target = targets.get(targetId);
    const kind = target.kind;
    return {
      observable_id: observableId,
      class: "substitution",
      statement: target.canonical_proposition,
      selectors: structuredClone(parent.S[kind].selectors),
      target_id: targetId,
    };
  });
  const baseMatrix = parent.sigma_matrix.filter((cell) => cell.observable_id !== "Q-06").map((cell) => structuredClone(cell));
  const atomicMatrix = overlay.semantic.adjudication_matrix.map((cell) => ({
    explanation_id: cell.explanation_id,
    observable_id: ATOMIC_OBSERVABLES[cell.target_id],
    state: cell.state,
    selectors: structuredClone(parent.S[cell.target_id.startsWith("T-P") ? "permitted" : "breaking"].selectors),
    rationale: cell.rationale,
    review_state: cell.review_state,
  }));
  const semantic = {
    fixture_id: "F3",
    G: structuredClone(parent.G),
    A: structuredClone(parent.A),
    Q: [...baseObservables, ...atomicObservables],
    sigma_matrix: [...baseMatrix, ...atomicMatrix],
    S: {
      permitted: { ...structuredClone(parent.S.permitted), observation_state: "supported" },
      breaking: { ...structuredClone(parent.S.breaking), observation_state: "supported" },
    },
    D: {
      baseline_decision: parent.D.baseline_decision,
      residual_decision: parent.D.residual_decision,
      deterministic: inputs.usefulness.deterministic,
      nonzero: inputs.usefulness.nonzero,
      selectors: structuredClone(parent.D.selectors),
    },
    U: overlay.semantic.carried_uncertainty.map(({ uncertainty_id, state, statement }) => ({ uncertainty_id, state, statement })),
    reviewers: structuredClone(overlay.semantic.reviewers),
  };
  const projection = buildEnvelope({
    schemaVersion: "cdsc.evidence-receipt.v1",
    contractId: "cdsc.evidence-receipt",
    status: "frozen",
    semantic,
    prohibitedInferences: overlay.prohibited_inferences,
    predecessorGenerationId: inputs.reviewInput.predecessor_generation_id,
    inputHandles: [...Object.values(inputs.reviewInput.input_handles), overlay.record_id],
    createdAt: inputs.reviewInput.created_at,
    storagePath: "evidence/generation-003/f3-atomic/projection.json",
  });
  validateAtomicProjection(projection, { overlay, ...inputs });
  return projection;
}

export function buildProvenanceReport(inputs, overlay, projection) {
  const explanations = new Map(inputs.parent.semantic.A.map((item) => [item.explanation_id, item]));
  const targets = new Map(inputs.targetSet.targets.map((item) => [item.target_id, item]));
  return {
    schema_version: "cdsc.atomic-adjudication-provenance.v1",
    overlay_record_id: overlay.record_id,
    projection_record_id: projection.record_id,
    coordinate_count: 36,
    coordinates: overlay.semantic.adjudication_matrix.map((cell) => ({
      explanation_id: cell.explanation_id,
      explanation_statement: explanations.get(cell.explanation_id).statement,
      explanation_digest: cell.explanation_digest,
      target_id: cell.target_id,
      target_proposition: targets.get(cell.target_id).canonical_proposition,
      target_digest: cell.target_digest,
      observation_handle: cell.evidence_handle,
      coverage: cell.coverage,
      state: cell.state,
      rationale: cell.rationale,
      review_state: cell.review_state,
    })),
    uncertainty_ids: overlay.semantic.carried_uncertainty.map((item) => item.uncertainty_id),
    prohibited_inferences: structuredClone(overlay.prohibited_inferences),
  };
}

export function buildReplaySummary(overlay, projection) {
  return {
    schema_version: "cdsc.atomic-adjudication-replay.v1",
    overlay_record_id: overlay.record_id,
    overlay_canonical_handle: sha256Canonical(JSON.parse(canonicalize(overlay))),
    projection_record_id: projection.record_id,
    projection_canonical_handle: sha256Canonical(JSON.parse(canonicalize(projection))),
    deterministic: true,
  };
}

export function buildAllAtomicArtifacts(inputs = loadAtomicInputs()) {
  const overlay = buildAtomicOverlay(inputs);
  const projection = buildAtomicProjection(inputs, overlay);
  return {
    inputs,
    overlay,
    projection,
    provenance: buildProvenanceReport(inputs, overlay, projection),
    replay: buildReplaySummary(overlay, projection),
  };
}

export function writeAtomicArtifacts() {
  const artifacts = buildAllAtomicArtifacts();
  const outputRoot = join(PACKAGE_ROOT, "evidence/generation-003/f3-atomic");
  mkdirSync(outputRoot, { recursive: true });
  writeJson(join(outputRoot, "overlay.json"), artifacts.overlay);
  writeJson(join(outputRoot, "projection.json"), artifacts.projection);
  writeJson(join(outputRoot, "provenance-report.json"), artifacts.provenance);
  writeJson(join(outputRoot, "replay-1.json"), artifacts.replay);
  writeJson(join(outputRoot, "replay-2.json"), artifacts.replay);
  return artifacts;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const artifacts = writeAtomicArtifacts();
  process.stdout.write(`${JSON.stringify({
    overlay_record_id: artifacts.overlay.record_id,
    projection_record_id: artifacts.projection.record_id,
    coordinates: artifacts.overlay.semantic.adjudication_matrix.length,
  })}\n`);
}
