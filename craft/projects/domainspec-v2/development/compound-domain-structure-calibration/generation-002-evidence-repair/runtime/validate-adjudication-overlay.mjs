import { readFileSync } from "node:fs";

import { sha256Canonical, sortedUniqueStrings, validateEnvelope } from "../../evaluation/canonical-json.mjs";
import { REQUIRED_PROHIBITIONS } from "../../evaluation/validate-input.mjs";
import { validateEvidenceReceiptV2, validateObservationReceipt } from "./validate-generation-002.mjs";

export const ADJUDICATION_STATES = Object.freeze(["explained", "not-explained", "indeterminate"]);
export const COVERAGE_STATES = Object.freeze(["full", "none", "partial", "disputed"]);
export const REVIEW_STATES = Object.freeze(["approved", "disputed"]);
export const USEFULNESS_STATES = Object.freeze(["retained", "revised", "indeterminate"]);
export const RESOLUTION_STATES = Object.freeze(["resolved", "retained", "disputed"]);
export const UNCERTAINTY_STATES = Object.freeze(["missing", "disputed", "untested", "non-portable"]);

const STATE_FOR_COVERAGE = Object.freeze({
  full: "explained",
  none: "not-explained",
  partial: "indeterminate",
  disputed: "indeterminate",
});

const EXPECTED_BINDINGS = Object.freeze({
  permitted: { mutationId: "M1", sourceField: "semantic.S.permitted" },
  breaking: { mutationId: "M2", sourceField: "semantic.S.breaking" },
});

const PARENT_RECEIPT_SCHEMA = JSON.parse(
  readFileSync(new URL("../../contracts/evidence-receipt.schema.yml", import.meta.url), "utf8"),
);

export function substitutionTargetDigest(substitution) {
  const value = requireObject(substitution, "substitution");
  requireString(value.description, "substitution description");
  requireString(value.prediction, "substitution prediction");
  return sha256Canonical({ description: value.description, prediction: value.prediction });
}

export function validateAdjudicationOverlay(
  overlay,
  { parentReceipt, permittedReceipt, breakingReceipt },
) {
  validateEvidenceReceiptV2(parentReceipt, PARENT_RECEIPT_SCHEMA);
  validateObservationReceipt(permittedReceipt);
  validateObservationReceipt(breakingReceipt);
  if (parentReceipt.semantic.fixture_id !== "F3") throw new TypeError("baseline receipt must be F3");
  const parentObservableIds = new Set(parentReceipt.semantic.Q.map((item) => item.observable_id));
  if (!parentObservableIds.has("Q-06") || parentObservableIds.has("Q-07")) throw new TypeError("parent substitution observable layout is unsupported");
  if (permittedReceipt.semantic.mutation_id !== "M1") throw new TypeError("permitted observation must be M1");
  if (breakingReceipt.semantic.mutation_id !== "M2") throw new TypeError("breaking observation must be M2");
  assertSharedObservationKernel(permittedReceipt, breakingReceipt);

  validateEnvelope(overlay, {
    schemaVersion: "cdsc.adjudication-overlay.v1",
    contractId: "cdsc.adjudication-overlay",
  });
  assertExactKeys(overlay, [
    "schema_version", "contract_id", "contract_version", "record_id", "canonicalization", "digest_algorithm",
    "content_digest", "generation_id", "predecessor_generation_id", "input_handles", "status", "semantic",
    "prohibited_inferences", "created_at", "storage_path",
  ], "overlay envelope");
  if (overlay.status !== "frozen") throw new TypeError("adjudication overlay must be frozen");
  if (overlay.predecessor_generation_id !== null) throw new TypeError("adjudication overlay predecessor must be null");
  assertRequiredProhibitions(overlay.prohibited_inferences);
  assertSameStringSet(
    overlay.input_handles,
    [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id],
    "overlay input handles",
  );

  const semantic = requireObject(overlay.semantic, "overlay semantic");
  assertExactKeys(semantic, [
    "fixture_id", "baseline_receipt_handle", "baseline_generation_id", "observation_bindings", "adjudication_matrix",
    "usefulness_adjudication", "uncertainty_resolutions", "carried_uncertainty", "reviewers",
  ], "overlay semantic");
  if (semantic.fixture_id !== "F3") throw new TypeError("overlay fixture must be F3");
  if (semantic.baseline_receipt_handle !== parentReceipt.record_id) throw new TypeError("baseline receipt handle mismatch");
  if (semantic.baseline_generation_id !== parentReceipt.generation_id) throw new TypeError("baseline generation handle mismatch");

  const bindings = validateBindings(semantic.observation_bindings, {
    parentReceipt,
    permittedReceipt,
    breakingReceipt,
  });
  validateMatrix(semantic.adjudication_matrix, { parentReceipt, bindings });
  validateUsefulness(semantic.usefulness_adjudication, {
    parentReceipt,
    permittedReceipt,
    breakingReceipt,
  });
  validateUncertainty(
    semantic.uncertainty_resolutions,
    semantic.carried_uncertainty,
    { parentReceipt, permittedReceipt, breakingReceipt },
  );
  validateReviewers(semantic.reviewers);
  return true;
}

function validateBindings(values, { parentReceipt, permittedReceipt, breakingReceipt }) {
  const bindings = requireNonemptyArray(values, "observation bindings");
  if (bindings.length !== 2) throw new TypeError("overlay requires exactly two observation bindings");
  const byKind = new Map();
  const observations = { permitted: permittedReceipt, breaking: breakingReceipt };
  for (const binding of bindings) {
    requireObject(binding, "observation binding");
    assertExactKeys(binding, ["substitution_kind", "substitution_id", "mutation_id", "observation_receipt_handle"], "observation binding");
    if (!Object.hasOwn(EXPECTED_BINDINGS, binding.substitution_kind)) throw new TypeError("unknown substitution kind");
    if (byKind.has(binding.substitution_kind)) throw new TypeError("duplicate substitution binding");
    const expected = EXPECTED_BINDINGS[binding.substitution_kind];
    const observation = observations[binding.substitution_kind];
    const substitution = parentReceipt.semantic.S[binding.substitution_kind];
    if (binding.substitution_id !== substitution.substitution_id) throw new TypeError("substitution binding mismatch");
    if (binding.mutation_id !== expected.mutationId) throw new TypeError("mutation binding mismatch");
    if (binding.observation_receipt_handle !== observation.record_id) throw new TypeError("observation receipt handle mismatch");
    byKind.set(binding.substitution_kind, { ...binding, observation, substitution, sourceField: expected.sourceField });
  }
  for (const kind of Object.keys(EXPECTED_BINDINGS)) if (!byKind.has(kind)) throw new TypeError("missing substitution binding");
  return byKind;
}

function validateMatrix(values, { parentReceipt, bindings }) {
  const cells = requireNonemptyArray(values, "adjudication matrix");
  const explanationIds = new Set(parentReceipt.semantic.A.map((item) => item.explanation_id));
  const bindingBySubstitution = new Map([...bindings.values()].map((binding) => [binding.substitution_id, binding]));
  const expectedCount = explanationIds.size * bindingBySubstitution.size;
  if (cells.length !== expectedCount) throw new TypeError("adjudication matrix must be total over parent explanations and substitutions");
  const coordinates = new Set();
  for (const cell of cells) {
    requireObject(cell, "adjudication cell");
    assertExactKeys(cell, [
      "explanation_id", "substitution_id", "coverage", "state", "target_provenance", "evidence_handles", "rationale", "review_state",
    ], "adjudication cell");
    if (!explanationIds.has(cell.explanation_id)) throw new TypeError("unknown overlay explanation");
    const binding = bindingBySubstitution.get(cell.substitution_id);
    if (!binding) throw new TypeError("unknown or combined substitution coordinate");
    const key = `${cell.explanation_id}/${cell.substitution_id}`;
    if (coordinates.has(key)) throw new TypeError("duplicate adjudication coordinate");
    coordinates.add(key);
    if (!COVERAGE_STATES.includes(cell.coverage)) throw new TypeError("unknown coverage state");
    if (!ADJUDICATION_STATES.includes(cell.state)) throw new TypeError("unknown adjudication state");
    if (cell.state !== STATE_FOR_COVERAGE[cell.coverage]) throw new TypeError("coverage and adjudication state mismatch");
    if (!REVIEW_STATES.includes(cell.review_state)) throw new TypeError("unknown review state");
    if (cell.review_state === "disputed" && cell.state !== "indeterminate") throw new TypeError("disputed review must remain indeterminate");
    if (cell.coverage === "disputed" && cell.review_state !== "disputed") throw new TypeError("disputed coverage requires disputed review");
    assertSameStringSet(cell.evidence_handles, [binding.observation.record_id], "cell evidence handles");
    requireString(cell.rationale, "cell rationale");
    validateTargetProvenance(cell.target_provenance, binding, parentReceipt);
  }
  for (const explanationId of explanationIds) {
    for (const binding of bindingBySubstitution.values()) {
      if (!coordinates.has(`${explanationId}/${binding.substitution_id}`)) throw new TypeError("missing adjudication coordinate");
    }
  }
}

function validateTargetProvenance(value, binding, parentReceipt) {
  const provenance = requireObject(value, "target provenance");
  assertExactKeys(provenance, ["source", "baseline_receipt_handle", "source_field", "target_digest"], "target provenance");
  if (provenance.source !== "parent-substitution") throw new TypeError("target must derive from parent substitution");
  if (provenance.baseline_receipt_handle !== parentReceipt.record_id) throw new TypeError("target baseline handle mismatch");
  if (provenance.source_field !== binding.sourceField) throw new TypeError("target source field mismatch");
  if (provenance.target_digest !== substitutionTargetDigest(binding.substitution)) throw new TypeError("target digest mismatch");
}

function validateUsefulness(value, { parentReceipt, permittedReceipt, breakingReceipt }) {
  const adjudication = requireObject(value, "usefulness adjudication");
  assertExactKeys(adjudication, [
    "state", "baseline_decision", "residual_decision", "deterministic", "nonzero", "selectors", "rationale", "evidence_handles",
  ], "usefulness adjudication");
  if (!USEFULNESS_STATES.includes(adjudication.state)) throw new TypeError("unknown usefulness state");
  requireString(adjudication.baseline_decision, "baseline decision");
  requireString(adjudication.residual_decision, "residual decision");
  if (typeof adjudication.deterministic !== "boolean") throw new TypeError("usefulness deterministic must be boolean");
  if (typeof adjudication.nonzero !== "boolean") throw new TypeError("usefulness nonzero must be boolean");
  validateSelectors(adjudication.selectors, "usefulness selectors");
  requireString(adjudication.rationale, "usefulness rationale");
  assertAllowedHandles(
    adjudication.evidence_handles,
    [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id],
    "usefulness evidence handles",
  );
  if (adjudication.state === "retained") {
    const projection = {
      baseline_decision: adjudication.baseline_decision,
      residual_decision: adjudication.residual_decision,
      deterministic: adjudication.deterministic,
      nonzero: adjudication.nonzero,
      selectors: adjudication.selectors,
    };
    if (sha256Canonical(projection) !== sha256Canonical(parentReceipt.semantic.D)) throw new TypeError("retained usefulness must equal parent D");
    if (!adjudication.evidence_handles.includes(parentReceipt.record_id)) throw new TypeError("retained usefulness must cite parent receipt");
  }
  if (adjudication.state === "revised" && !adjudication.evidence_handles.some((handle) => handle === permittedReceipt.record_id || handle === breakingReceipt.record_id)) {
    throw new TypeError("revised usefulness must cite observation evidence");
  }
  if (adjudication.state === "indeterminate" && adjudication.deterministic) throw new TypeError("indeterminate usefulness cannot be deterministic");
}

function validateUncertainty(resolutionValues, carriedValues, { parentReceipt, permittedReceipt, breakingReceipt }) {
  const resolutions = requireArray(resolutionValues, "uncertainty resolutions");
  const carried = requireArray(carriedValues, "carried uncertainty");
  const parentById = new Map(parentReceipt.semantic.U.map((item) => [item.uncertainty_id, item]));
  const allowedHandles = [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id];
  const resolutionById = new Map();
  for (const resolution of resolutions) {
    requireObject(resolution, "uncertainty resolution");
    assertExactKeys(resolution, ["parent_uncertainty_id", "state", "evidence_handles", "rationale"], "uncertainty resolution");
    if (!parentById.has(resolution.parent_uncertainty_id)) throw new TypeError("unknown parent uncertainty resolution");
    if (resolutionById.has(resolution.parent_uncertainty_id)) throw new TypeError("duplicate uncertainty resolution");
    if (!RESOLUTION_STATES.includes(resolution.state)) throw new TypeError("unknown resolution state");
    assertAllowedHandles(resolution.evidence_handles, allowedHandles, "resolution evidence handles");
    requireString(resolution.rationale, "resolution rationale");
    resolutionById.set(resolution.parent_uncertainty_id, resolution);
  }

  const carriedById = new Map();
  for (const item of carried) {
    requireObject(item, "carried uncertainty");
    assertExactKeys(item, ["uncertainty_id", "state", "statement"], "carried uncertainty");
    requireString(item.uncertainty_id, "carried uncertainty id");
    if (carriedById.has(item.uncertainty_id)) throw new TypeError("duplicate carried uncertainty");
    if (!UNCERTAINTY_STATES.includes(item.state)) throw new TypeError("unknown carried uncertainty state");
    requireString(item.statement, "carried uncertainty statement");
    carriedById.set(item.uncertainty_id, item);
  }

  for (const [uncertaintyId, parentUncertainty] of parentById) {
    const resolution = resolutionById.get(uncertaintyId);
    const carriedItem = carriedById.get(uncertaintyId);
    if (resolution && carriedItem) throw new TypeError("parent uncertainty cannot be both resolved and carried");
    if (!resolution && !carriedItem) throw new TypeError("parent uncertainty was dropped");
    if (carriedItem && sha256Canonical(carriedItem) !== sha256Canonical(parentUncertainty)) {
      throw new TypeError("carried parent uncertainty drift");
    }
  }

  const carriedStatements = new Set(carried.map((item) => item.statement));
  for (const statement of [...permittedReceipt.semantic.uncertainty, ...breakingReceipt.semantic.uncertainty]) {
    if (!carriedStatements.has(statement)) throw new TypeError("observation uncertainty was dropped");
  }
}

function validateReviewers(values) {
  const reviewers = requireNonemptyArray(values, "overlay reviewers");
  const ids = new Set();
  for (const reviewer of reviewers) {
    requireObject(reviewer, "overlay reviewer");
    assertExactKeys(reviewer, ["reviewer_id", "state"], "overlay reviewer");
    requireString(reviewer.reviewer_id, "reviewer id");
    if (ids.has(reviewer.reviewer_id)) throw new TypeError("duplicate overlay reviewer");
    ids.add(reviewer.reviewer_id);
    if (!REVIEW_STATES.includes(reviewer.state)) throw new TypeError("unknown reviewer state");
  }
}

function assertSharedObservationKernel(permittedReceipt, breakingReceipt) {
  for (const field of ["manifest_handle", "harness_handle", "baseline_witness_handle"]) {
    if (permittedReceipt.semantic[field] !== breakingReceipt.semantic[field]) throw new TypeError(`observation ${field} mismatch`);
  }
}

function assertRequiredProhibitions(values) {
  const set = new Set(requireNonemptyArray(values, "prohibited inferences"));
  for (const required of REQUIRED_PROHIBITIONS) if (!set.has(required)) throw new TypeError(`missing prohibited inference: ${required}`);
}

function assertSameStringSet(actual, expected, label) {
  const left = sortedUniqueStrings(requireNonemptyArray(actual, label), label);
  const right = sortedUniqueStrings(expected, `${label} expected`);
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) throw new TypeError(`${label} mismatch`);
}

function assertAllowedHandles(values, allowed, label) {
  const items = requireNonemptyArray(values, label);
  const allowedSet = new Set(allowed);
  const seen = new Set();
  for (const item of items) {
    requireString(item, label);
    if (!allowedSet.has(item)) throw new TypeError(`${label} contains unknown handle`);
    if (seen.has(item)) throw new TypeError(`${label} contains duplicate handle`);
    seen.add(item);
  }
}

function validateSelectors(values, label) {
  for (const selector of requireNonemptyArray(values, label)) requireString(selector, label);
}

function assertExactKeys(value, allowed, label) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) if (!allowedSet.has(key)) throw new TypeError(`${label} has unknown field: ${key}`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function requireNonemptyArray(value, label) {
  const values = requireArray(value, label);
  if (values.length === 0) throw new TypeError(`${label} must be nonempty`);
  return values;
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
}
