import { sha256Canonical, sortedUniqueStrings, validateEnvelope } from "./canonical-json.mjs";

export const REQUIRED_PROHIBITIONS = Object.freeze([
  "candidate-promotion",
  "ds-d1-formation",
  "ds-d8-authority",
  "identity",
  "irreducibility",
  "pattern-admission",
  "portability",
]);

const EVIDENCE_STATES = new Set(["explained", "not-explained", "indeterminate"]);
const REVIEW_STATES = new Set(["approved", "disputed"]);
const OBSERVATION_STATES = new Set(["supported", "refuted", "indeterminate"]);
const UNCERTAINTY_STATES = new Set(["missing", "disputed", "untested", "non-portable"]);
const FIXTURE_OUTCOMES = new Set(["INSUFFICIENT-EVIDENCE", "EXPLAINED", "RUBRIC-FAIL", "RESIDUAL-SUPPORTED"]);
const SUITE_VERDICTS = new Set(["CALIBRATION-DEFER", "CALIBRATION-FAIL", "CALIBRATION-PASS"]);

export function validateEvidenceReceipt(receipt) {
  validateEnvelope(receipt, {
    schemaVersion: "cdsc.evidence-receipt.v1",
    contractId: "cdsc.evidence-receipt",
  });
  if (receipt.status !== "frozen") throw new TypeError("evidence receipt must be frozen");
  assertRequiredProhibitions(receipt.prohibited_inferences);
  const semantic = requireObject(receipt.semantic, "semantic");
  if (!["F1", "F2", "F3"].includes(semantic.fixture_id)) throw new TypeError("unknown fixture id");
  validateObservedGraph(semantic.G);

  const explanations = requireNonemptyArray(semantic.A, "A");
  const observables = requireNonemptyArray(semantic.Q, "Q");
  const explanationIds = uniqueIds(explanations, "explanation_id", "explanation");
  const observableIds = uniqueIds(observables, "observable_id", "observable");
  for (const explanation of explanations) {
    requireString(explanation.statement, "explanation statement");
    requireString(explanation.kind, "explanation kind");
  }
  for (const observable of observables) {
    requireString(observable.statement, "observable statement");
    requireString(observable.class, "observable class");
    validateSelectors(observable.selectors, "observable selectors");
  }

  const coordinates = new Map();
  for (const cell of requireNonemptyArray(semantic.sigma_matrix, "sigma_matrix")) {
    if (!explanationIds.has(cell.explanation_id)) throw new TypeError("unknown explanation coordinate");
    if (!observableIds.has(cell.observable_id)) throw new TypeError("unknown observable coordinate");
    if (!EVIDENCE_STATES.has(cell.state)) throw new TypeError("unknown predicate state");
    if (!REVIEW_STATES.has(cell.review_state)) throw new TypeError("unknown predicate review state");
    validateSelectors(cell.selectors, "predicate selectors");
    requireString(cell.rationale, "predicate rationale");
    const key = coordinateKey(cell.explanation_id, cell.observable_id);
    if (coordinates.has(key)) {
      if (coordinates.get(key).state !== cell.state) throw new TypeError("conflicting predicate coordinate");
      throw new TypeError("duplicate predicate coordinate");
    }
    coordinates.set(key, cell);
  }
  if (coordinates.size !== explanations.length * observables.length) {
    throw new TypeError("predicate matrix must be total");
  }
  for (const explanationId of explanationIds) {
    for (const observableId of observableIds) {
      if (!coordinates.has(coordinateKey(explanationId, observableId))) {
        throw new TypeError("missing predicate coordinate");
      }
    }
  }

  validateSubstitutionPair(semantic.S);
  validateUsefulnessDelta(semantic.D);
  for (const uncertainty of requireArray(semantic.U, "U")) {
    requireString(uncertainty.uncertainty_id, "uncertainty id");
    if (!UNCERTAINTY_STATES.has(uncertainty.state)) throw new TypeError("unknown uncertainty state");
    requireString(uncertainty.statement, "uncertainty statement");
  }
  const reviewers = requireNonemptyArray(semantic.reviewers, "reviewers");
  uniqueIds(reviewers, "reviewer_id", "reviewer");
  for (const reviewer of reviewers) {
    if (!REVIEW_STATES.has(reviewer.state)) throw new TypeError("unknown reviewer state");
  }
  return true;
}

export function logicalReceiptProjection(receipt) {
  validateEvidenceReceipt(receipt);
  const semantic = structuredClone(receipt.semantic);
  semantic.G.members = sortedUniqueStrings(semantic.G.members, "graph members");
  semantic.G.relations = sortedUniqueStrings(semantic.G.relations, "graph relations");
  semantic.G.interactions = sortedUniqueStrings(semantic.G.interactions, "graph interactions");
  semantic.G.effects = sortedUniqueStrings(semantic.G.effects, "graph effects");
  semantic.A = [...semantic.A].sort((left, right) => left.explanation_id.localeCompare(right.explanation_id));
  semantic.Q = semantic.Q
    .map((item) => ({ ...item, selectors: sortedUniqueStrings(item.selectors, "observable selectors") }))
    .sort((left, right) => left.observable_id.localeCompare(right.observable_id));
  semantic.sigma_matrix = semantic.sigma_matrix
    .map((cell) => ({ ...cell, selectors: sortedUniqueStrings(cell.selectors, "predicate selectors") }))
    .sort((left, right) => coordinateKey(left.explanation_id, left.observable_id).localeCompare(coordinateKey(right.explanation_id, right.observable_id)));
  semantic.S = {
    permitted: { ...semantic.S.permitted, selectors: sortedUniqueStrings(semantic.S.permitted.selectors, "permitted selectors") },
    breaking: { ...semantic.S.breaking, selectors: sortedUniqueStrings(semantic.S.breaking.selectors, "breaking selectors") },
  };
  semantic.D = { ...semantic.D, selectors: sortedUniqueStrings(semantic.D.selectors, "usefulness selectors") };
  semantic.U = [...semantic.U].sort((left, right) => left.uncertainty_id.localeCompare(right.uncertainty_id));
  semantic.reviewers = [...semantic.reviewers].sort((left, right) => left.reviewer_id.localeCompare(right.reviewer_id));
  return {
    semantic,
    prohibited_inferences: sortedUniqueStrings(receipt.prohibited_inferences, "prohibited inferences"),
  };
}

export function logicalReceiptDigest(receipt) {
  return sha256Canonical(logicalReceiptProjection(receipt));
}

export function validateEvaluationResult(result) {
  validateEnvelope(result, {
    schemaVersion: "cdsc.evaluation-result.v1",
    contractId: "cdsc.evaluation-result",
  });
  assertRequiredProhibitions(result.prohibited_inferences);
  const semantic = requireObject(result.semantic, "evaluation semantic");
  if (!["F1", "F2", "F3"].includes(semantic.fixture_id)) throw new TypeError("unknown fixture id");
  if (!FIXTURE_OUTCOMES.has(semantic.fixture_outcome)) throw new TypeError("unknown fixture outcome");
  const expectedStatus = statusForFixtureOutcome(semantic.fixture_outcome);
  if (result.status !== expectedStatus) throw new TypeError("fixture outcome/status mismatch");
  if (typeof semantic.evidence_complete !== "boolean") throw new TypeError("evidence_complete must be boolean");
  assertSortedUniqueIds(semantic.residue_observable_ids, "residue observable ids", /^Q-[0-9]{2}$/);
  const conditions = requireObject(semantic.residual_conditions, "residual_conditions");
  for (const field of [
    "boundary_invariant_supported",
    "permitted_substitution_preserved",
    "breaking_substitution_consequence",
    "usefulness_deterministic",
    "usefulness_nonzero",
  ]) {
    if (typeof conditions[field] !== "boolean") throw new TypeError(`${field} must be boolean`);
  }
  requireDigest(semantic.input_digest, "input_digest");
  if (semantic.evaluator_version !== "cdsc-evaluator-v1") throw new TypeError("unsupported evaluator version");
  return true;
}

export function validateSuiteResult(result) {
  validateEnvelope(result, {
    schemaVersion: "cdsc.suite-result.v1",
    contractId: "cdsc.suite-result",
  });
  assertRequiredProhibitions(result.prohibited_inferences);
  const semantic = requireObject(result.semantic, "suite semantic");
  if (semantic.control_fixture_id !== "F2") throw new TypeError("control fixture must be F2");
  if (!["not-run", "identical", "drift"].includes(semantic.replay_state)) throw new TypeError("unknown replay state");
  if (!SUITE_VERDICTS.has(semantic.suite_verdict)) throw new TypeError("unknown suite verdict");
  if (result.status !== statusForSuiteVerdict(semantic.suite_verdict)) throw new TypeError("suite verdict/status mismatch");
  assertSortedUniqueStrings(semantic.fixture_result_handles, "fixture result handles");
  if (semantic.fixture_result_handles.length !== 3) throw new TypeError("suite requires three fixture result handles");
  if (!["evidence-repair", "method-review", "bounded-follow-up-research"].includes(semantic.next_route)) {
    throw new TypeError("unknown suite next route");
  }
  return true;
}

export function statusForFixtureOutcome(outcome) {
  return {
    "INSUFFICIENT-EVIDENCE": "insufficient-evidence",
    EXPLAINED: "explained",
    "RUBRIC-FAIL": "rubric-fail",
    "RESIDUAL-SUPPORTED": "residual-supported",
  }[outcome];
}

export function statusForSuiteVerdict(verdict) {
  return {
    "CALIBRATION-DEFER": "calibration-defer",
    "CALIBRATION-FAIL": "calibration-fail",
    "CALIBRATION-PASS": "calibration-pass",
  }[verdict];
}

function validateObservedGraph(graph) {
  const value = requireObject(graph, "G");
  requireString(value.boundary, "graph boundary");
  for (const field of ["members", "relations", "interactions", "effects"]) {
    for (const item of requireArray(value[field], `G.${field}`)) requireString(item, `G.${field} item`);
  }
}

function validateSubstitutionPair(pair) {
  const value = requireObject(pair, "S");
  for (const kind of ["permitted", "breaking"]) {
    const substitution = requireObject(value[kind], `${kind} substitution`);
    requireString(substitution.substitution_id, "substitution id");
    requireString(substitution.description, "substitution description");
    requireString(substitution.prediction, "substitution prediction");
    if (!OBSERVATION_STATES.has(substitution.observation_state)) throw new TypeError("unknown substitution observation state");
    validateSelectors(substitution.selectors, "substitution selectors");
  }
}

function validateUsefulnessDelta(delta) {
  const value = requireObject(delta, "D");
  requireString(value.baseline_decision, "baseline decision");
  requireString(value.residual_decision, "residual decision");
  if (typeof value.deterministic !== "boolean") throw new TypeError("D.deterministic must be boolean");
  if (typeof value.nonzero !== "boolean") throw new TypeError("D.nonzero must be boolean");
  validateSelectors(value.selectors, "usefulness selectors");
}

function assertRequiredProhibitions(values) {
  const set = new Set(requireNonemptyArray(values, "prohibited_inferences"));
  for (const required of REQUIRED_PROHIBITIONS) {
    if (!set.has(required)) throw new TypeError(`missing prohibited inference: ${required}`);
  }
}

function validateSelectors(values, label) {
  for (const selector of requireNonemptyArray(values, label)) requireString(selector, label);
}

function uniqueIds(values, field, label) {
  const ids = new Set();
  for (const value of values) {
    requireString(value[field], `${label} id`);
    if (ids.has(value[field])) throw new TypeError(`duplicate ${label} id`);
    ids.add(value[field]);
  }
  return ids;
}

function assertSortedUniqueIds(values, label, pattern) {
  assertSortedUniqueStrings(values, label);
  for (const value of values) if (!pattern.test(value)) throw new TypeError(`invalid ${label}`);
}

function assertSortedUniqueStrings(values, label) {
  const sorted = sortedUniqueStrings(values, label);
  if (values.length !== sorted.length || values.some((value, index) => value !== sorted[index])) {
    throw new TypeError(`${label} must be sorted and unique`);
  }
}

function coordinateKey(explanationId, observableId) {
  return `${explanationId}/${observableId}`;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function requireNonemptyArray(value, label) {
  const array = requireArray(value, label);
  if (array.length === 0) throw new TypeError(`${label} must be nonempty`);
  return array;
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} has invalid format`);
}
