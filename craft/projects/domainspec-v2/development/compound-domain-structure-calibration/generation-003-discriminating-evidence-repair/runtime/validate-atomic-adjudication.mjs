import { isDeepStrictEqual } from "node:util";
import { sha256Canonical, validateEnvelope } from "../../evaluation/canonical-json.mjs";
import { REQUIRED_PROHIBITIONS, validateEvidenceReceipt } from "../../evaluation/validate-input.mjs";

export const EXPLANATION_IDS = Object.freeze(["A-01", "A-02", "A-03", "A-04", "A-05", "A-06"]);
export const TARGET_IDS = Object.freeze(["T-P-01", "T-P-02", "T-P-03", "T-P-04", "T-B-01", "T-B-02"]);
export const ATOMIC_OBSERVABLES = Object.freeze({
  "T-P-01": "Q-06",
  "T-P-02": "Q-07",
  "T-P-03": "Q-08",
  "T-P-04": "Q-09",
  "T-B-01": "Q-10",
  "T-B-02": "Q-11",
});
export const REQUIRED_UNCERTAINTY_IDS = Object.freeze([
  "F3-U-03",
  "F3-U-G3-ATTESTATION",
  "F3-U-G3-BROWSER",
  "F3-U-G3-CATALOG",
  "F3-U-G3-SOURCE",
]);
export const PROHIBITED_INFERENCES = Object.freeze([
  ...REQUIRED_PROHIBITIONS,
  "activation",
  "promotion",
  "usefulness-sufficient-for-promotion",
]);

const COVERAGE_STATE = Object.freeze({ full: "explained", none: "not-explained", partial: "indeterminate" });
const OVERLAY_KEYS = [
  "adjudication_matrix",
  "baseline_receipt_handle",
  "carried_uncertainty",
  "fixture_id",
  "observation_bindings",
  "reviewers",
  "target_set_handle",
  "uncertainty_resolutions",
  "usefulness_adjudication",
  "usefulness_result_handle",
];
const CELL_KEYS = [
  "coverage",
  "evidence_handle",
  "explanation_digest",
  "explanation_id",
  "rationale",
  "review_state",
  "state",
  "target_digest",
  "target_id",
];

export function validateAtomicOverlay(overlay, inputs) {
  validateEnvelope(overlay, {
    schemaVersion: "cdsc.atomic-adjudication-overlay.v1",
    contractId: "cdsc.atomic-adjudication-overlay",
  });
  if (overlay.status !== "frozen") throw new TypeError("overlay must be frozen");
  if (overlay.predecessor_generation_id !== inputs.reviewInput.predecessor_generation_id) {
    throw new TypeError("wrong predecessor generation");
  }
  assertExactKeys(overlay.semantic, OVERLAY_KEYS, "overlay semantic");
  assertRequiredProhibitions(overlay.prohibited_inferences);
  assertInputHandles(overlay.input_handles, inputs.reviewInput.input_handles);

  const semantic = overlay.semantic;
  if (semantic.fixture_id !== "F3") throw new TypeError("overlay fixture must be F3");
  if (semantic.baseline_receipt_handle !== inputs.parent.record_id) throw new TypeError("parent handle mismatch");
  if (semantic.target_set_handle !== inputs.reviewInput.input_handles.target_set) throw new TypeError("target set handle mismatch");
  if (semantic.usefulness_result_handle !== inputs.reviewInput.input_handles.usefulness) throw new TypeError("usefulness handle mismatch");
  validateObservationBindings(semantic.observation_bindings, inputs);
  validateMatrix(semantic.adjudication_matrix, inputs);
  validateUsefulness(semantic.usefulness_adjudication, inputs);
  validateUncertainty(semantic, inputs);
  if (!isDeepStrictEqual(semantic.reviewers, [inputs.reviewInput.reviewer])) throw new TypeError("reviewer mismatch");
  return true;
}

export function validateAtomicProjection(projection, { overlay, ...inputs }) {
  validateEvidenceReceipt(projection);
  if (projection.predecessor_generation_id !== inputs.reviewInput.predecessor_generation_id) {
    throw new TypeError("projection predecessor mismatch");
  }
  const expectedHandles = [...Object.values(inputs.reviewInput.input_handles), overlay.record_id].sort();
  if (!isDeepStrictEqual(projection.input_handles, expectedHandles)) throw new TypeError("projection input handles mismatch");
  assertRequiredProhibitions(projection.prohibited_inferences);

  const semantic = projection.semantic;
  if (!isDeepStrictEqual(semantic.G, inputs.parent.semantic.G)) throw new TypeError("parent G changed");
  if (!isDeepStrictEqual(semantic.A, inputs.parent.semantic.A)) throw new TypeError("parent A changed");
  validateProjectionObservables(semantic.Q, inputs);
  validateProjectionMatrix(semantic.sigma_matrix, overlay, inputs);
  if (semantic.S.permitted.observation_state !== "supported" || semantic.S.breaking.observation_state !== "supported") {
    throw new TypeError("projection substitution state mismatch");
  }
  if (semantic.D.deterministic !== true || semantic.D.nonzero !== false) throw new TypeError("projection D mismatch");
  if (semantic.D.baseline_decision !== inputs.parent.semantic.D.baseline_decision || semantic.D.residual_decision !== inputs.parent.semantic.D.residual_decision) {
    throw new TypeError("projection decision text changed");
  }
  const projectedUncertainty = overlay.semantic.carried_uncertainty.map(({ uncertainty_id, state, statement }) => ({ uncertainty_id, state, statement }));
  if (!isDeepStrictEqual(semantic.U, projectedUncertainty)) throw new TypeError("projection uncertainty mismatch");
  if (!isDeepStrictEqual(semantic.reviewers, overlay.semantic.reviewers)) throw new TypeError("projection reviewer mismatch");
  return true;
}

export function assertNoEvaluatorUse(sourceTexts) {
  const text = sourceTexts.join("\n");
  const moduleToken = ["evaluate", "fixture"].join("-");
  const callToken = ["evaluate", "Fixture"].join("");
  const versionToken = ["cdsc", "evaluator", "v1"].join("-");
  if (text.includes(moduleToken) || new RegExp(`${callToken}\\s*\\(`).test(text) || text.includes(versionToken)) {
    throw new TypeError("evaluator use prohibited");
  }
  return true;
}

function validateObservationBindings(bindings, inputs) {
  if (!Array.isArray(bindings) || bindings.length !== 2) throw new TypeError("exactly two observation bindings required");
  const expected = [
    { kind: "breaking", observation_handle: inputs.reviewInput.input_handles.breaking_observation, target_ids: ["T-B-01", "T-B-02"] },
    { kind: "permitted", observation_handle: inputs.reviewInput.input_handles.permitted_observation, target_ids: ["T-P-01", "T-P-02", "T-P-03", "T-P-04"] },
  ];
  if (!isDeepStrictEqual(bindings, expected)) throw new TypeError("observation bindings mismatch");
}

function validateMatrix(matrix, inputs) {
  if (!Array.isArray(matrix) || matrix.length !== 36) throw new TypeError("overlay matrix must contain exactly 36 cells");
  const explanations = new Map(inputs.parent.semantic.A.map((item) => [item.explanation_id, item]));
  const targets = new Map(inputs.targetSet.targets.map((item) => [item.target_id, item]));
  const observationHandles = {
    permitted: inputs.reviewInput.input_handles.permitted_observation,
    breaking: inputs.reviewInput.input_handles.breaking_observation,
  };
  const seen = new Set();
  for (const cell of matrix) {
    assertExactKeys(cell, CELL_KEYS, "cell");
    const key = `${cell.explanation_id}/${cell.target_id}`;
    if (seen.has(key)) throw new TypeError("duplicate adjudication coordinate");
    seen.add(key);
    const explanation = explanations.get(cell.explanation_id);
    const target = targets.get(cell.target_id);
    if (!explanation) throw new TypeError("unknown explanation coordinate");
    if (!target) throw new TypeError("unknown target coordinate");
    if (cell.explanation_digest !== sha256Canonical(explanation.statement)) throw new TypeError("explanation digest mismatch");
    if (cell.target_digest !== target.target_digest) throw new TypeError("target digest mismatch");
    if (cell.evidence_handle !== observationHandles[target.kind]) throw new TypeError("target evidence mismatch");
    if (COVERAGE_STATE[cell.coverage] !== cell.state) throw new TypeError("coverage/state mismatch");
    if (!cell.rationale || cell.rationale.length < 20) throw new TypeError("rationale too short");
    if (!["approved", "disputed"].includes(cell.review_state)) throw new TypeError("unknown review state");
    if (cell.review_state === "disputed" && cell.state !== "indeterminate") throw new TypeError("dispute must remain indeterminate");
  }
  for (const explanationId of EXPLANATION_IDS) {
    for (const targetId of TARGET_IDS) {
      if (!seen.has(`${explanationId}/${targetId}`)) throw new TypeError("missing adjudication coordinate");
    }
  }
}

function validateUsefulness(adjudication, inputs) {
  assertExactKeys(adjudication, ["baseline_test_set", "deterministic", "evidence_handle", "nonzero", "rationale", "residual_test_set", "state", "symmetric_difference", "uncertainty"], "usefulness adjudication");
  const result = inputs.usefulness;
  if (adjudication.state !== "retained" || adjudication.evidence_handle !== inputs.reviewInput.input_handles.usefulness) {
    throw new TypeError("usefulness evidence mismatch");
  }
  for (const field of ["baseline_test_set", "residual_test_set", "symmetric_difference", "deterministic", "nonzero", "uncertainty"]) {
    if (!isDeepStrictEqual(adjudication[field], result[field])) throw new TypeError("usefulness differential mismatch");
  }
  if (!adjudication.rationale.includes("does not establish identity")) throw new TypeError("usefulness authority boundary missing");
}

function validateUncertainty(semantic, inputs) {
  const resolutions = semantic.uncertainty_resolutions;
  if (!Array.isArray(resolutions) || resolutions.length !== 2) throw new TypeError("exactly two uncertainty resolutions required");
  const expected = [
    { parent_uncertainty_id: "F3-U-01", state: "resolved", evidence_handle: inputs.reviewInput.input_handles.permitted_observation },
    { parent_uncertainty_id: "F3-U-02", state: "resolved", evidence_handle: inputs.reviewInput.input_handles.breaking_observation },
  ];
  if (!isDeepStrictEqual(resolutions, expected)) throw new TypeError("uncertainty resolution mismatch");
  if (!Array.isArray(semantic.carried_uncertainty)) throw new TypeError("carried uncertainty must be an array");
  const ids = semantic.carried_uncertainty.map((item) => item.uncertainty_id).sort();
  if (!isDeepStrictEqual(ids, [...REQUIRED_UNCERTAINTY_IDS])) throw new TypeError("required carried uncertainty missing");
  for (const item of semantic.carried_uncertainty) {
    assertExactKeys(item, ["evidence_handles", "state", "statement", "uncertainty_id"], "carried uncertainty");
    if (!["missing", "disputed", "untested", "non-portable"].includes(item.state)) throw new TypeError("unknown uncertainty state");
    if (!Array.isArray(item.evidence_handles) || item.evidence_handles.length === 0) throw new TypeError("uncertainty evidence missing");
  }
}

function validateProjectionObservables(observables, inputs) {
  if (!Array.isArray(observables) || observables.length !== 11) throw new TypeError("projection must contain eleven observables");
  const base = inputs.parent.semantic.Q.filter((item) => item.observable_id !== "Q-06");
  if (!isDeepStrictEqual(observables.slice(0, 5), base)) throw new TypeError("pre-atomic observables changed");
  const targets = new Map(inputs.targetSet.targets.map((item) => [item.target_id, item]));
  for (const [targetId, observableId] of Object.entries(ATOMIC_OBSERVABLES)) {
    const observable = observables.find((item) => item.observable_id === observableId);
    const target = targets.get(targetId);
    if (!observable || observable.statement !== target.canonical_proposition || observable.target_id !== targetId) {
      throw new TypeError("atomic observable mismatch");
    }
  }
}

function validateProjectionMatrix(matrix, overlay, inputs) {
  if (!Array.isArray(matrix) || matrix.length !== 66) throw new TypeError("projection matrix must contain 66 cells");
  const base = inputs.parent.semantic.sigma_matrix.filter((cell) => cell.observable_id !== "Q-06");
  if (!isDeepStrictEqual(matrix.slice(0, 30), base)) throw new TypeError("pre-atomic matrix changed");
  const expected = overlay.semantic.adjudication_matrix.map((cell) => ({
    explanation_id: cell.explanation_id,
    observable_id: ATOMIC_OBSERVABLES[cell.target_id],
    state: cell.state,
    selectors: inputs.parent.semantic.S[cell.target_id.startsWith("T-P") ? "permitted" : "breaking"].selectors,
    rationale: cell.rationale,
    review_state: cell.review_state,
  }));
  if (!isDeepStrictEqual(matrix.slice(30), expected)) throw new TypeError("atomic projection matrix mismatch");
}

function assertInputHandles(actual, handles) {
  const expected = Object.values(handles).sort();
  if (!isDeepStrictEqual(actual, expected)) throw new TypeError("overlay input handles mismatch");
}

function assertRequiredProhibitions(actual) {
  for (const prohibition of PROHIBITED_INFERENCES) {
    if (!actual.includes(prohibition)) throw new TypeError(`missing prohibited inference ${prohibition}`);
  }
}

function assertExactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) {
    const unknown = actual.find((key) => !expected.includes(key));
    if (unknown) throw new TypeError(`unknown ${label === "cell" ? "cell" : label} field`);
    throw new TypeError(`${label} fields mismatch`);
  }
}
