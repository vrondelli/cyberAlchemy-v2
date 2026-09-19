import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

const REQUIRED = Object.freeze({ real_corpora: 2, independent_authors: 2, implementation_styles: 2, independent_agreeing_reviewers: 2 });
const FORBIDDEN = new Set(["fail", "absent", "collapsed", "demoted", "kill", "killed"]);
const PROHIBITED = [
  "portability-pass-is-not-independent-replication",
  "policy-evaluation-is-not-candidate-identity",
  "missing-is-not-fail-absence-collapse-demotion-or-kill",
  "candidate-evidence-cannot-be-pooled",
  "policy-evaluation-does-not-authorize-activation-or-promotion",
];

export function createDossierPolicyEvaluation(input) {
  assertObject(input, "input");
  requireThreshold(input.required_counts);
  const sourceHandles = input.source_handles;
  requireGeneration(sourceHandles?.corpus_generation, "source_handles.corpus_generation");
  requireGeneration(sourceHandles?.dossier_generation, "source_handles.dossier_generation");
  requireString(sourceHandles?.accepted_review, "source_handles.accepted_review");
  if (!Array.isArray(input.candidates) || input.candidates.length === 0) throw new TypeError("candidates must be a non-empty array");

  const candidateIds = new Set();
  const candidateEvaluations = input.candidates.map((candidate) => {
    assertObject(candidate, "candidate");
    requireString(candidate.candidate_id, "candidate.candidate_id");
    requireString(candidate.label, "candidate.label");
    if (candidateIds.has(candidate.candidate_id)) throw new TypeError(`duplicate candidate ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);
    validateIndependentPositive(candidate);
    const evidence = normalizeEvidence(candidate.evidence ?? [], candidate.candidate_id);
    const reviewers = normalizeReviewers(candidate.reviewers ?? [], candidate.candidate_id);
    const eligible = evidence.filter((entry) => entry.correspondence_state === "partial" || entry.correspondence_state === "positive");
    const corpusIds = new Set(eligible.map((entry) => entry.corpus_id));
    const authors = new Set(eligible.map((entry) => entry.author_id));
    const styles = new Set(eligible.map((entry) => entry.implementation_style));
    const agreeing = reviewers.filter((entry) => entry.agreement === true);
    const independentAgreeing = new Set(agreeing.filter((entry) => entry.independence_attested).map((entry) => entry.reviewer_id));
    const independenceValid = agreeing.every((entry) => entry.independence_attested);
    const observedCounts = {
      real_corpora: corpusIds.size,
      independent_authors: authors.size,
      implementation_styles: styles.size,
      independent_agreeing_reviewers: independentAgreeing.size,
    };
    const portabilityState = independenceValid
      && observedCounts.real_corpora >= REQUIRED.real_corpora
      && observedCounts.independent_authors >= REQUIRED.independent_authors
      && observedCounts.implementation_styles >= REQUIRED.implementation_styles
      && observedCounts.independent_agreeing_reviewers >= REQUIRED.independent_agreeing_reviewers
      ? "pass"
      : "missing";
    const evidenceHandles = [...new Set([
      ...evidence.flatMap((entry) => entry.receipt_handles),
      ...reviewers.map((entry) => entry.evidence_handle),
      ...candidate.independent_positive.partial_correspondence_handles,
    ])].sort();
    return {
      candidate_id: candidate.candidate_id,
      label: candidate.label,
      observed_counts: observedCounts,
      required_counts: { ...REQUIRED },
      independence_valid: independenceValid,
      portability_state: portabilityState,
      evidence_handles: evidenceHandles,
      independent_positive: candidate.independent_positive,
    };
  }).sort((left, right) => left.candidate_id.localeCompare(right.candidate_id));

  for (const id of ["DS-D1.20", "DS-D1.21"]) {
    const row = candidateEvaluations.find((entry) => entry.candidate_id === id);
    if (!row || row.independent_positive.state !== "missing" || row.independent_positive.rationale_handle !== "decision:DEC-UIR-009") {
      throw new TypeError(`${id} independent positive must be missing under DEC-UIR-009`);
    }
  }
  const semantic = {
    schema_version: "ui-repair.dossier-policy-evaluation.v1",
    policy_id: "DEC-UIR-008/009-v1",
    source_handles: sourceHandles,
    required_counts: { ...REQUIRED },
    candidate_evaluations: candidateEvaluations,
    overall_state: candidateEvaluations.every((entry) => entry.portability_state === "pass") ? "pass" : "missing",
    prohibited_inferences: PROHIBITED,
  };
  const inputHandles = [...new Set([...(Object.values(sourceHandles)), ...candidateEvaluations.flatMap((entry) => entry.evidence_handles)])].sort();
  const envelope = buildEnvelope({
    contractId: "ui-repair.dossier-policy-evaluation",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: semantic.overall_state === "pass" ? "complete" : "defer",
    inputHandles,
    createdAt: input.created_at,
  });
  return { ...envelope, semantic };
}

function normalizeEvidence(entries, candidateId) {
  if (!Array.isArray(entries)) throw new TypeError(`${candidateId} evidence must be an array`);
  const receiptCorpus = new Map();
  return entries.map((entry) => {
    assertObject(entry, `${candidateId} evidence`);
    for (const key of ["corpus_id", "author_id", "implementation_style", "correspondence_state"]) requireString(entry[key], `${candidateId} evidence.${key}`);
    if (!["positive", "partial", "negative"].includes(entry.correspondence_state)) throw new TypeError(`${candidateId} evidence correspondence_state is invalid`);
    if (!Array.isArray(entry.receipt_handles) || entry.receipt_handles.length === 0) throw new TypeError(`${candidateId} evidence requires receipt_handles`);
    for (const handle of entry.receipt_handles) {
      requireRecord(handle, `${candidateId} receipt handle`);
      const prior = receiptCorpus.get(handle);
      if (prior && prior !== entry.corpus_id) throw new TypeError(`duplicate corpus alias for ${candidateId}: ${handle}`);
      receiptCorpus.set(handle, entry.corpus_id);
    }
    return { ...entry, receipt_handles: [...new Set(entry.receipt_handles)].sort() };
  });
}

function normalizeReviewers(entries, candidateId) {
  if (!Array.isArray(entries)) throw new TypeError(`${candidateId} reviewers must be an array`);
  return entries.map((entry) => {
    assertObject(entry, `${candidateId} reviewer`);
    requireString(entry.reviewer_id, `${candidateId} reviewer_id`);
    requireString(entry.role_id, `${candidateId} role_id`);
    requireString(entry.evidence_handle, `${candidateId} reviewer evidence_handle`);
    if (typeof entry.agreement !== "boolean" || typeof entry.independence_attested !== "boolean") throw new TypeError(`${candidateId} reviewer booleans are required`);
    return entry;
  });
}

function validateIndependentPositive(candidate) {
  const value = candidate.independent_positive;
  assertObject(value, `${candidate.candidate_id}.independent_positive`);
  if (FORBIDDEN.has(value.state)) throw new TypeError(`prohibited independent-positive classification: ${value.state}`);
  if (!["missing", "not-evaluated"].includes(value.state)) throw new TypeError(`${candidate.candidate_id} independent-positive state is invalid`);
  if (!Array.isArray(value.partial_correspondence_handles)) throw new TypeError(`${candidate.candidate_id} partial_correspondence_handles must be an array`);
  if (value.rationale_handle !== null) requireString(value.rationale_handle, `${candidate.candidate_id} rationale_handle`);
}

function requireThreshold(value) {
  assertObject(value, "required_counts");
  for (const [key, expected] of Object.entries(REQUIRED)) {
    if (value[key] !== expected) throw new TypeError(`threshold tailoring is prohibited: ${key} must be ${expected}`);
  }
  if (Object.keys(value).length !== Object.keys(REQUIRED).length) throw new TypeError("threshold tailoring is prohibited");
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}
function requireString(value, label) { if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required`); }
function requireRecord(value, label) { if (typeof value !== "string" || !/^record:sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} is invalid`); }
function requireGeneration(value, label) { if (typeof value !== "string" || !/^generation:sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} is invalid`); }
