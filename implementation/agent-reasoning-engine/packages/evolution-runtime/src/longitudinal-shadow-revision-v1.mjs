import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {verifyInteractionIngestion} from "./interaction-learning-ingestion.mjs";
import {materializeLongitudinalPreferenceEvent, resolveLegacyInteractionPreference, resolveLongitudinalPreference} from "./linked-cycle-benchmark-v1.mjs";

export const LONGITUDINAL_SHADOW_REVISION_SCHEMA = "are.longitudinal-shadow-revision-cohort/v1";
export const LONGITUDINAL_SHADOW_REVISION_RESULT_SCHEMA = "are.longitudinal-shadow-revision-result/v1";
export const LONGITUDINAL_SHADOW_STRATA = Object.freeze([
  "cross-objective-boundary",
  "cross-workflow-exception",
  "temporal-expiry-or-inferred-conflict",
  "revision-or-revocation-later-query",
  "cross-thread-recurrence",
  "same-scope-or-no-preference-control",
]);

const DISCRIMINATING_STRATA = new Set(LONGITUDINAL_SHADOW_STRATA.slice(0, -1));
const HASH = /^[a-f0-9]{64}$/;
const OPAQUE_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const opaqueRef = (value) => typeof value === "string" && OPAQUE_REF.test(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => freeze({...material, [key]: digest(material)});

function sourceIndex(ingestion) {
  return new Map(ingestion.sessions.map((session) => [session.session_ref, {
    session,
    turns: new Map(session.turns.filter((turn) => turn.sensitive_signal === false).map((turn) => [turn.turn_ref, turn])),
  }]));
}

function validateBoundary(classification) {
  const {stratum, boundary} = classification;
  if (!object(boundary) || typeof boundary.kind !== "string") return false;
  const keys = Object.keys(boundary).sort();
  const transition = keys.join(",") === "from_ref,kind,to_ref" && opaqueRef(boundary.from_ref)
    && opaqueRef(boundary.to_ref) && boundary.from_ref !== boundary.to_ref;
  const kindOnly = keys.length === 1 && keys[0] === "kind";
  if (stratum === "cross-objective-boundary") return boundary.kind === "objective" && transition;
  if (stratum === "cross-workflow-exception") return boundary.kind === "workflow" && transition;
  if (stratum === "temporal-expiry-or-inferred-conflict") return kindOnly && ["temporal-expiry", "inferred-conflict"].includes(boundary.kind);
  if (stratum === "revision-or-revocation-later-query") return kindOnly && ["revision", "revocation"].includes(boundary.kind);
  if (stratum === "cross-thread-recurrence") return boundary.kind === "thread" && transition;
  return stratum === "same-scope-or-no-preference-control" && kindOnly && ["same-scope", "no-preference"].includes(boundary.kind);
}

function materializeClassification(classification, index, ingestionIndex) {
  if (!object(classification) || !LONGITUDINAL_SHADOW_STRATA.includes(classification.stratum)
    || !opaqueRef(classification.classification_ref)
    || !opaqueRef(classification.overlap_key)
    || classification.genuinely_later !== true || typeof classification.resolver_discriminating !== "boolean"
    || !Array.isArray(classification.evidence_points) || classification.evidence_points.length < 2
    || !validateBoundary(classification)) throw new Error(`classification-invalid:${index}`);
  const points = classification.evidence_points.map((point) => {
    if (!object(point) || typeof point.session_ref !== "string" || typeof point.turn_ref !== "string"
      || !["preference", "exception", "revision", "revocation", "application", "control"].includes(point.role)) {
      throw new Error(`classification-evidence-invalid:${index}`);
    }
    const indexed = ingestionIndex.get(point.session_ref);
    const turn = indexed?.turns.get(point.turn_ref);
    if (!indexed || !turn) throw new Error(`classification-provenance-invalid:${index}`);
    return {session: indexed.session, turn, role: point.role};
  });
  const applications = points.filter((point) => point.role === "application");
  if (applications.length !== 1) throw new Error(`classification-application-invalid:${index}`);
  const application = applications[0];
  const prior = points.filter((point) => point.role !== "application");
  if (prior.some((point) => String(point.turn.completed_at) >= String(application.turn.started_at))) {
    throw new Error(`classification-not-later:${index}`);
  }
  if (classification.stratum === "cross-thread-recurrence"
    && new Set(points.map((point) => point.session.session_ref)).size < 2) throw new Error(`classification-not-cross-thread:${index}`);
  return freeze({
    episode_ref: `shadow-revision-episode:${digest([classification.classification_ref, classification.stratum, classification.overlap_key])}`,
    classification_ref: classification.classification_ref,
    stratum: classification.stratum,
    overlap_key: classification.overlap_key,
    genuinely_later: true,
    resolver_discriminating: classification.resolver_discriminating,
    boundary: classification.boundary,
    application_at: application.turn.started_at,
    application_session_ref: application.session.session_ref,
    application_turn_ref: application.turn.turn_ref,
    source_id: application.session.source_id,
    source_locator: application.session.source_locator,
    source_sha256: application.session.source_sha256,
    evidence_points: points.map((point) => ({session_ref: point.session.session_ref, turn_ref: point.turn.turn_ref, role: point.role})),
    evaluator_status: "pending",
    authority_effect: "none",
  });
}

export function freezeLongitudinalShadowRevision({ingestion, classifications, episodes_per_stratum = 4, maximum_per_session = 4}) {
  if (!verifyInteractionIngestion(ingestion).ok || !Array.isArray(classifications)
    || episodes_per_stratum !== 4 || maximum_per_session !== 4) throw new Error("revision-input-invalid");
  const indexed = sourceIndex(ingestion);
  const refs = new Set();
  const candidates = classifications.map((classification, index) => materializeClassification(classification, index, indexed));
  for (const candidate of candidates) {
    if (refs.has(candidate.classification_ref)) throw new Error("classification-ref-duplicate");
    refs.add(candidate.classification_ref);
  }
  const selected = [];
  const usedOverlapKeys = new Set();
  const sessionCounts = new Map();
  const deficits = {};
  for (const stratum of LONGITUDINAL_SHADOW_STRATA) {
    const ordered = candidates.filter((candidate) => candidate.stratum === stratum)
      .sort((left, right) => left.application_at.localeCompare(right.application_at)
        || left.episode_ref.localeCompare(right.episode_ref));
    let selectedForStratum = 0;
    for (const candidate of ordered) {
      if (selectedForStratum === episodes_per_stratum) break;
      if (usedOverlapKeys.has(candidate.overlap_key)
        || (sessionCounts.get(candidate.application_session_ref) ?? 0) >= maximum_per_session) continue;
      selected.push(candidate);
      selectedForStratum += 1;
      usedOverlapKeys.add(candidate.overlap_key);
      sessionCounts.set(candidate.application_session_ref, (sessionCounts.get(candidate.application_session_ref) ?? 0) + 1);
    }
    deficits[stratum] = episodes_per_stratum - selectedForStratum;
  }
  const required = episodes_per_stratum * LONGITUDINAL_SHADOW_STRATA.length;
  const discriminatingCount = selected.filter((episode) => episode.resolver_discriminating).length;
  const ready = selected.length === required && Object.values(deficits).every((count) => count === 0)
    && discriminatingCount >= Math.ceil(required / 2);
  return seal({
    schema_version: LONGITUDINAL_SHADOW_REVISION_SCHEMA,
    cycle_ref: "cycle:il-lpc-01",
    task_ref: "lpc.shadow-revise",
    ingestion_manifest_digest: ingestion.manifest_digest,
    classification_set_digest: digest([...classifications].sort((left, right) => String(left.classification_ref).localeCompare(String(right.classification_ref)))),
    selection_policy: "chronological-within-six-strata-deduplicated-session-capped-v1",
    episodes_per_stratum,
    required_episode_count: required,
    maximum_per_session,
    candidate_classification_count: candidates.length,
    selected_episode_count: selected.length,
    resolver_discriminating_count: discriminatingCount,
    deficits,
    status: ready ? "FROZEN_AWAITING_INDEPENDENT_EVALUATION" : "COLLECTING",
    episodes: selected.map((episode, ordinal) => freeze({...episode, ordinal: ordinal + 1})),
    excluded_content: ["message_text", "reasoning_content", "tool_arguments", "tool_outputs", "credential_values", "environment_values", "sensitive_turns"],
    activation: "none",
    authority_effect: "none",
  }, "cohort_digest");
}

export function verifyLongitudinalShadowRevision(value) {
  if (!object(value) || value.schema_version !== LONGITUDINAL_SHADOW_REVISION_SCHEMA || !HASH.test(value.cohort_digest)
    || value.activation !== "none" || value.authority_effect !== "none") return false;
  const {cohort_digest, ...material} = value;
  return digest(material) === cohort_digest;
}

const matches = (actual, expected) => actual.disposition === expected.disposition && actual.value === (expected.value ?? null);

export function assessLongitudinalShadowRevision({cohort, verdicts}) {
  if (!verifyLongitudinalShadowRevision(cohort) || cohort.status !== "FROZEN_AWAITING_INDEPENDENT_EVALUATION"
    || !Array.isArray(verdicts) || verdicts.length !== cohort.required_episode_count) throw new Error("revision-assessment-input-invalid");
  const episodes = new Map(cohort.episodes.map((episode) => [episode.episode_ref, episode]));
  const seen = new Set();
  const rows = verdicts.map((verdict) => {
    const episode = episodes.get(verdict?.episode_ref);
    if (!episode || seen.has(verdict.episode_ref) || typeof verdict.evaluator_id !== "string" || !verdict.evaluator_id
      || !Array.isArray(verdict.events) || !object(verdict.query) || !object(verdict.expected)
      || !["apply", "none", "suspend"].includes(verdict.expected.disposition)
      || !Array.isArray(verdict.protected_failure_codes)) throw new Error("revision-verdict-invalid");
    seen.add(verdict.episode_ref);
    const events = verdict.events.map(materializeLongitudinalPreferenceEvent);
    const baseline = resolveLegacyInteractionPreference(events, verdict.query);
    const candidate = resolveLongitudinalPreference(events, verdict.query);
    return freeze({
      episode_ref: verdict.episode_ref,
      evaluator_id: verdict.evaluator_id,
      stratum: episode.stratum,
      expected: {disposition: verdict.expected.disposition, value: verdict.expected.value ?? null},
      baseline: {disposition: baseline.disposition, value: baseline.value},
      candidate: {disposition: candidate.disposition, value: candidate.value},
      baseline_passed: matches(baseline, verdict.expected),
      candidate_passed: matches(candidate, verdict.expected),
      protected_failure_codes: [...verdict.protected_failure_codes].sort(),
      authority_effect: "none",
    });
  }).sort((left, right) => left.episode_ref.localeCompare(right.episode_ref));
  const baselinePassed = rows.filter((row) => row.baseline_passed).length;
  const candidatePassed = rows.filter((row) => row.candidate_passed).length;
  const protectedFailures = rows.reduce((all, row) => {
    for (const code of row.protected_failure_codes) all[code] = (all[code] ?? 0) + 1;
    return all;
  }, {});
  const strata = Object.fromEntries(LONGITUDINAL_SHADOW_STRATA.map((stratum) => {
    const values = rows.filter((row) => row.stratum === stratum);
    const passed = values.filter((row) => row.candidate_passed).length;
    return [stratum, {episodes: values.length, candidate_passed: passed, candidate_rate: passed / values.length}];
  }));
  const baselineRate = baselinePassed / rows.length;
  const candidateRate = candidatePassed / rows.length;
  const improvement = candidateRate - baselineRate;
  const supported = candidateRate >= 0.80 && improvement >= 0.15
    && Object.values(protectedFailures).every((count) => count === 0)
    && [...DISCRIMINATING_STRATA].every((stratum) => strata[stratum].candidate_rate >= 0.75);
  return seal({
    schema_version: LONGITUDINAL_SHADOW_REVISION_RESULT_SCHEMA,
    cycle_ref: cohort.cycle_ref,
    task_ref: cohort.task_ref,
    cohort_digest: cohort.cohort_digest,
    verdict_set_digest: digest([...verdicts].sort((left, right) => left.episode_ref.localeCompare(right.episode_ref))),
    episode_count: rows.length,
    baseline: {passed: baselinePassed, rate: baselineRate},
    candidate: {passed: candidatePassed, rate: candidateRate},
    absolute_improvement: improvement,
    strata,
    protected_failures: protectedFailures,
    rows,
    disposition: supported ? "shadow-supported" : "shadow-rejected",
    next_frontier: supported ? "lpc.canary" : "lpc.shadow-revise",
    activation: "none",
    authority_effect: "none",
  }, "result_digest");
}
