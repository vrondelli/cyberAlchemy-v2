import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  buildEnvelope,
  canonicalize,
} from "../../ui-meta-type-repair/contracts/canonical-json-v1.mjs";

export const POLICY_ID = "DEC-UIR-008/009-v1";
export const DISPOSITIONS = Object.freeze([
  "covered-existing",
  "distinct-supported",
  "defer-missing",
]);

export const COVERAGE_DIMENSIONS = Object.freeze([
  "valid_instance_preservation",
  "invalid_instance_rejection",
  "substitutability",
  "composition_parity",
  "consequence_parity",
  "no_loss_audit",
]);

export const DISTINCT_CONJUNCTS = Object.freeze([
  "independent_positive",
  "stable_contrast",
  "label_erasure",
  "criterion_erasure",
  "changed_consequence",
  "typed_negatives",
  "owner_firewall",
]);

const REQUIRED_COUNTS = Object.freeze({
  real_corpora: 2,
  independent_authors: 2,
  implementation_styles: 2,
  independent_agreeing_reviewers: 2,
});

const PROHIBITED_INFERENCES = Object.freeze([
  "missing-evidence-is-not-covered-existing",
  "missing-evidence-is-not-distinct-supported",
  "disposition-is-not-candidate-identity",
  "disposition-does-not-mutate-DS-D1-or-DS-D8",
  "candidate-evidence-cannot-be-pooled",
  "portability-is-not-activation-or-promotion",
]);

const FORBIDDEN_KEYS = new Set([
  "score",
  "scores",
  "weight",
  "weights",
  "threshold",
  "thresholds",
  "threshold_override",
  "threshold_overrides",
  "authority_payload",
  "authority_mutation",
  "canonical_mutation",
  "ds_d1_mutation",
  "ds_d8_mutation",
  "promotion",
  "promote",
]);

export function createCandidateRun(input, options = {}) {
  assertObject(input, "input");
  assertObject(options, "options");
  const errors = [];

  for (const path of findForbiddenKeys(input)) {
    addError(errors, "prohibited-field", path, "scores, thresholds, and authority payloads are prohibited");
  }

  const candidate = normalizeCandidate(input.candidate, errors);
  const alternatives = normalizeAlternatives(input.alternatives, errors);
  const hypotheses = normalizeHypotheses(input.hypotheses, errors);
  const policyId = input.policy?.id ?? null;
  if (policyId !== POLICY_ID) {
    addError(errors, "unknown-policy", "$.policy.id", `policy must be ${POLICY_ID}`);
  }

  const inputHandles = normalizeHandles(input.input_handles, "$.input_handles", errors, true);
  const predecessorGenerationId = normalizePredecessor(input.predecessor_generation_id, errors);
  if (Object.hasOwn(options, "currentGenerationId") && predecessorGenerationId !== options.currentGenerationId) {
    addError(errors, "stale-predecessor", "$.predecessor_generation_id", "predecessor does not match the current generation");
  }

  const evidence = normalizeEvidence(input.evidence, candidate.id, alternatives, errors);
  const requestedDisposition = input.requested_disposition ?? null;
  if (requestedDisposition !== null && !DISPOSITIONS.includes(requestedDisposition)) {
    addError(errors, "unsupported-disposition", "$.requested_disposition", "disposition is not part of the three-value algebra");
  }

  let disposition = null;
  if (errors.length === 0 && requestedDisposition !== null) {
    disposition = composeDisposition({
      candidateId: candidate.id,
      requestedDisposition,
      coverageEvaluations: evidence.coverageEvaluations,
      distinctEvaluation: evidence.distinctEvaluation,
      missingConjuncts: input.missing_conjuncts,
      residue: input.residue,
      errors,
      alternativeCount: alternatives.length,
    });
  }

  const runState = errors.length > 0 ? "invalid" : disposition === null ? "evidence-pending" : "disposed";
  if (runState === "invalid") disposition = null;
  const semantic = {
    schema_version: "ucfe.candidate-run.v1",
    candidate,
    alternatives,
    hypotheses,
    policy_id: policyId === POLICY_ID ? policyId : null,
    evidence_planes: evidence.planes,
    coverage_evaluations: evidence.coverageEvaluations,
    distinct_evaluation: evidence.distinctEvaluation,
    requested_disposition: requestedDisposition,
    run_state: runState,
    disposition,
    errors,
    prohibited_inferences: [...PROHIBITED_INFERENCES],
  };

  const envelope = buildEnvelope({
    contractId: "ucfe.candidate-run",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: runState === "invalid" ? "invalid" : "valid",
    predecessorGenerationId,
    inputHandles,
    createdAt: input.created_at,
    storagePath: input.storage_path,
  });
  return { ...envelope, semantic };
}

export function publishCandidateRun(run, outputPath) {
  assertObject(run, "run");
  requireString(outputPath, "outputPath");
  if (existsSync(outputPath)) {
    const existing = JSON.parse(readFileSync(outputPath, "utf8"));
    if (existing.generation_id === run.generation_id
      && existing.record_id === run.record_id
      && canonicalize(existing.semantic) === canonicalize(run.semantic)) {
      return { status: "no-op", generation_id: run.generation_id };
    }
    throw new TypeError("refusing to overwrite non-identical candidate-run generation");
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  return { status: "published", generation_id: run.generation_id };
}

function normalizeCandidate(value, errors) {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const normalized = {
    id: stringOrNull(candidate.id),
    label: stringOrNull(candidate.label),
    law_version: stringOrNull(candidate.law_version),
    source_handle: stringOrNull(candidate.source_handle),
  };
  if (!/^DS-D1\.[0-9]+$/.test(normalized.id ?? "")) addError(errors, "invalid-candidate-id", "$.candidate.id", "candidate ID must match DS-D1.<number>");
  for (const key of ["label", "law_version", "source_handle"]) {
    if (normalized[key] === null) addError(errors, "missing-candidate-field", `$.candidate.${key}`, `${key} is required`);
  }
  return normalized;
}

function normalizeAlternatives(value, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    addError(errors, "missing-alternatives", "$.alternatives", "at least one named existing alternative is required");
    return [];
  }
  const names = new Set();
  return value.map((entry, index) => {
    const item = entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {};
    const normalized = {
      id: stringOrNull(item.id),
      label: stringOrNull(item.label),
      aliases: normalizeStringArray(item.aliases ?? [], `$.alternatives[${index}].aliases`, errors),
      source_handles: normalizeHandles(item.source_handles, `$.alternatives[${index}].source_handles`, errors, true),
    };
    if (normalized.id === null) addError(errors, "missing-alternative-id", `$.alternatives[${index}].id`, "alternative ID is required");
    if (normalized.label === null) addError(errors, "missing-alternative-label", `$.alternatives[${index}].label`, "alternative label is required");
    for (const name of [normalized.id, ...normalized.aliases].filter(Boolean)) {
      if (names.has(name)) addError(errors, "duplicate-alternative-alias", `$.alternatives[${index}]`, `duplicate alternative name or alias: ${name}`);
      names.add(name);
    }
    return normalized;
  });
}

function normalizeHypotheses(value, errors) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const seenFalsifiers = new Map();
  const output = {};
  for (const name of ["covered", "distinct", "defer"]) {
    const item = input[name] && typeof input[name] === "object" && !Array.isArray(input[name]) ? input[name] : {};
    const statement = stringOrNull(item.statement);
    const falsifiers = normalizeStringArray(item.falsifiers ?? [], `$.hypotheses.${name}.falsifiers`, errors);
    if (statement === null) addError(errors, "missing-hypothesis", `$.hypotheses.${name}.statement`, `${name} hypothesis is required`);
    if (falsifiers.length === 0) addError(errors, "missing-falsifier", `$.hypotheses.${name}.falsifiers`, `${name} hypothesis requires a falsifier`);
    for (const falsifier of falsifiers) {
      const prior = seenFalsifiers.get(falsifier);
      if (prior && prior !== name) addError(errors, "contradictory-falsifier", `$.hypotheses.${name}.falsifiers`, `falsifier is shared with ${prior}`);
      seenFalsifiers.set(falsifier, name);
    }
    output[name] = { statement, falsifiers };
  }
  return output;
}

function normalizeEvidence(value, candidateId, alternatives, errors) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  if (input.candidate_id !== candidateId) {
    addError(errors, "cross-candidate-evidence", "$.evidence.candidate_id", "evidence candidate must match the run candidate");
  }
  const planesInput = input.planes && typeof input.planes === "object" && !Array.isArray(input.planes) ? input.planes : {};
  const planes = {};
  for (const name of ["literal", "coverage", "distinct", "review"]) {
    planes[name] = normalizeHandles(planesInput[name] ?? [], `$.evidence.planes.${name}`, errors, false);
  }
  const alternativeIds = new Set(alternatives.map((entry) => entry.id).filter(Boolean));
  const coverageEvaluations = normalizeCoverageEvaluations(input.coverage_evaluations ?? [], candidateId, alternativeIds, errors);
  const distinctEvaluation = input.distinct_evaluation == null
    ? null
    : normalizeDistinctEvaluation(input.distinct_evaluation, candidateId, errors);
  return { planes, coverageEvaluations, distinctEvaluation };
}

function normalizeCoverageEvaluations(value, candidateId, alternativeIds, errors) {
  if (!Array.isArray(value)) {
    addError(errors, "invalid-coverage-evaluations", "$.evidence.coverage_evaluations", "coverage evaluations must be an array");
    return [];
  }
  const seen = new Set();
  return value.map((entry, index) => {
    const item = entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {};
    const alternativeId = stringOrNull(item.alternative_id);
    if (item.candidate_id !== candidateId) addError(errors, "cross-candidate-evidence", `$.evidence.coverage_evaluations[${index}].candidate_id`, "coverage candidate must match the run candidate");
    if (!alternativeIds.has(alternativeId)) addError(errors, "unknown-coverage-alternative", `$.evidence.coverage_evaluations[${index}].alternative_id`, "coverage evaluation must name a preregistered alternative");
    if (seen.has(alternativeId)) addError(errors, "duplicate-coverage-evaluation", `$.evidence.coverage_evaluations[${index}].alternative_id`, "alternative may be evaluated once per run");
    seen.add(alternativeId);
    const dimensions = {};
    for (const dimension of COVERAGE_DIMENSIONS) {
      const source = item.dimensions?.[dimension];
      const state = ["pass", "fail", "missing"].includes(source?.state) ? source.state : "missing";
      if (!source || !["pass", "fail", "missing"].includes(source.state)) {
        addError(errors, "invalid-coverage-dimension", `$.evidence.coverage_evaluations[${index}].dimensions.${dimension}`, "coverage dimension requires pass, fail, or missing");
      }
      const evidenceHandles = normalizeHandles(source?.evidence_handles ?? [], `$.evidence.coverage_evaluations[${index}].dimensions.${dimension}.evidence_handles`, errors, false);
      if (state === "pass" && evidenceHandles.length === 0) {
        addError(errors, "missing-positive-evidence", `$.evidence.coverage_evaluations[${index}].dimensions.${dimension}`, "passing coverage requires evidence handles");
      }
      dimensions[dimension] = { state, evidence_handles: evidenceHandles };
    }
    const states = Object.values(dimensions).map((dimension) => dimension.state);
    const outcome = states.every((state) => state === "pass") ? "pass" : states.some((state) => state === "fail") ? "fail" : "incomplete";
    return {
      schema_version: "ucfe.coverage-evaluation.v1",
      candidate_id: candidateId,
      alternative_id: alternativeId,
      dimensions,
      outcome,
      evidence_handles: [...new Set(Object.values(dimensions).flatMap((dimension) => dimension.evidence_handles))].sort(),
    };
  });
}

function normalizeDistinctEvaluation(value, candidateId, errors) {
  const item = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  if (item.candidate_id !== candidateId) addError(errors, "cross-candidate-evidence", "$.evidence.distinct_evaluation.candidate_id", "distinct evidence candidate must match the run candidate");
  const conjuncts = {};
  for (const name of DISTINCT_CONJUNCTS) {
    const state = ["pass", "fail", "missing"].includes(item.conjuncts?.[name]) ? item.conjuncts[name] : "missing";
    if (!["pass", "fail", "missing"].includes(item.conjuncts?.[name])) addError(errors, "invalid-distinct-conjunct", `$.evidence.distinct_evaluation.conjuncts.${name}`, "distinct conjunct requires pass, fail, or missing");
    conjuncts[name] = state;
  }
  const counts = {};
  for (const key of Object.keys(REQUIRED_COUNTS)) {
    const count = item.counts?.[key];
    if (!Number.isSafeInteger(count) || count < 0) addError(errors, "invalid-distinct-count", `$.evidence.distinct_evaluation.counts.${key}`, "count must be a non-negative safe integer");
    counts[key] = Number.isSafeInteger(count) && count >= 0 ? count : 0;
  }
  return {
    candidate_id: candidateId,
    conjuncts,
    counts,
    evidence_handles: normalizeHandles(item.evidence_handles ?? [], "$.evidence.distinct_evaluation.evidence_handles", errors, false),
  };
}

function composeDisposition({ candidateId, requestedDisposition, coverageEvaluations, distinctEvaluation, missingConjuncts, residue, errors, alternativeCount }) {
  const coveragePasses = coverageEvaluations.filter((entry) => entry.outcome === "pass");
  const coverageAuditComplete = coverageEvaluations.length === alternativeCount
    && coverageEvaluations.every((entry) => Object.values(entry.dimensions).every((dimension) => dimension.state !== "missing"));
  if (requestedDisposition === "covered-existing") {
    if (coveragePasses.length !== 1) {
      addError(errors, "covered-evidence-incomplete", "$.requested_disposition", "covered-existing requires exactly one complete positive coverage alternative");
      return null;
    }
    return buildDisposition(candidateId, requestedDisposition, coveragePasses[0].alternative_id, coveragePasses[0].evidence_handles, [], residue);
  }
  if (requestedDisposition === "distinct-supported") {
    if (coveragePasses.length > 0) {
      addError(errors, "coverage-precedence", "$.requested_disposition", "positive existing coverage takes precedence over distinct support");
      return null;
    }
    if (!coverageAuditComplete || !distinctPasses(distinctEvaluation)) {
      addError(errors, "distinct-evidence-incomplete", "$.requested_disposition", "distinct-supported requires a complete negative coverage audit and every distinct conjunct plus fixed 2/2/2 evidence");
      return null;
    }
    return buildDisposition(candidateId, requestedDisposition, null, distinctEvaluation.evidence_handles, [], residue);
  }
  if (coveragePasses.length > 0) {
    addError(errors, "coverage-precedence", "$.requested_disposition", "positive existing coverage takes precedence over defer-missing");
    return null;
  }
  const missing = normalizeStringArray(missingConjuncts ?? [], "$.missing_conjuncts", errors);
  if (missing.length === 0) {
    addError(errors, "missing-defer-residue", "$.missing_conjuncts", "defer-missing requires explicit missing conjuncts");
    return null;
  }
  const evidenceHandles = [...new Set([
    ...coverageEvaluations.flatMap((entry) => entry.evidence_handles),
    ...(distinctEvaluation?.evidence_handles ?? []),
  ])].sort();
  return buildDisposition(candidateId, requestedDisposition, null, evidenceHandles, missing, residue);
}

function buildDisposition(candidateId, disposition, coverageAlternativeId, evidenceHandles, missingConjuncts, residue) {
  return {
    schema_version: "ucfe.candidate-disposition.v1",
    candidate_id: candidateId,
    disposition,
    coverage_alternative_id: coverageAlternativeId,
    evidence_handles: [...new Set(evidenceHandles)].sort(),
    missing_conjuncts: [...new Set(missingConjuncts)].sort(),
    residue: [...new Set(Array.isArray(residue) ? residue.filter((item) => typeof item === "string" && item.length > 0) : [])].sort(),
    owner_handoff_required: true,
    authority_mutation: false,
  };
}

function distinctPasses(evaluation) {
  return evaluation !== null
    && DISTINCT_CONJUNCTS.every((name) => evaluation.conjuncts[name] === "pass")
    && Object.entries(REQUIRED_COUNTS).every(([name, required]) => evaluation.counts[name] >= required)
    && evaluation.evidence_handles.length > 0;
}

function normalizePredecessor(value, errors) {
  if (value == null) return null;
  if (!/^generation:sha256:[a-f0-9]{64}$/.test(value)) {
    addError(errors, "invalid-predecessor", "$.predecessor_generation_id", "predecessor must be a generation handle");
    return null;
  }
  return value;
}

function normalizeHandles(value, path, errors, requireOne) {
  if (!Array.isArray(value)) {
    addError(errors, "invalid-handles", path, "handles must be an array");
    return [];
  }
  const handles = value.filter((item) => typeof item === "string" && item.length > 0);
  if (handles.length !== value.length) addError(errors, "invalid-handle", path, "handles must be non-empty strings");
  if (requireOne && handles.length === 0) addError(errors, "missing-handle", path, "at least one handle is required");
  if (new Set(handles).size !== handles.length) addError(errors, "duplicate-handle", path, "handles must be unique");
  return [...new Set(handles)].sort();
}

function normalizeStringArray(value, path, errors) {
  if (!Array.isArray(value)) {
    addError(errors, "invalid-string-array", path, "value must be an array");
    return [];
  }
  const strings = value.filter((item) => typeof item === "string" && item.length > 0);
  if (strings.length !== value.length) addError(errors, "invalid-string", path, "items must be non-empty strings");
  if (new Set(strings).size !== strings.length) addError(errors, "duplicate-string", path, "items must be unique");
  return [...new Set(strings)].sort();
}

function findForbiddenKeys(value, path = "$") {
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenKeys(item, `${path}[${index}]`));
  return Object.entries(value).flatMap(([key, child]) => [
    ...(FORBIDDEN_KEYS.has(key.toLowerCase()) ? [`${path}.${key}`] : []),
    ...findForbiddenKeys(child, `${path}.${key}`),
  ]);
}

function addError(errors, code, path, message) {
  if (!errors.some((entry) => entry.code === code && entry.path === path)) errors.push({ code, path, message });
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
}
