import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {verifyInteractionIngestion} from "./interaction-learning-ingestion.mjs";
import {materializeLongitudinalPreferenceEvent, resolveLegacyInteractionPreference, resolveLongitudinalPreference} from "./linked-cycle-benchmark-v1.mjs";

export const LONGITUDINAL_SHADOW_COHORT_SCHEMA = "are.longitudinal-shadow-cohort/v1";
export const LONGITUDINAL_SHADOW_RESULT_SCHEMA = "are.longitudinal-shadow-result/v1";

const HASH = /^[a-f0-9]{64}$/;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => freeze({...material, [key]: digest(material)});

export function excludeInteractionIngestionSessions(ingestion, excludedSessionRefs) {
  if (!verifyInteractionIngestion(ingestion).ok || !Array.isArray(excludedSessionRefs)
    || !excludedSessionRefs.every((ref) => typeof ref === "string")) throw new Error("longitudinal-shadow.exclusion-input-invalid");
  const excluded = new Set(excludedSessionRefs);
  const sessions = ingestion.sessions.filter((session) => !excluded.has(session.session_ref));
  if (sessions.length + excluded.size !== ingestion.sessions.length) throw new Error("longitudinal-shadow.exclusion-ref-invalid");
  const material = {
    ...ingestion,
    source_inventory: ingestion.source_inventory.map((source) => ({...source, selected_session_count: sessions.filter((session) => session.source_id === source.source_id).length})),
    selected_session_count: sessions.length,
    evaluation_task_count: sessions.reduce((count, session) => count + (Number.isSafeInteger(session.turn_candidate_count) ? session.turn_candidate_count : session.turns.length), 0),
    sessions,
  };
  delete material.manifest_digest;
  return freeze({...material, manifest_digest: digest(material)});
}

function familyFor(signals) {
  if (signals.includes("ordering_repair")) return "interactive-workflow";
  if (signals.includes("continuity_repair")) return "iterative-workflow";
  if (signals.includes("lost_or_unclear")) return "open-ended-workflow";
  if (signals.includes("explicit_correction")) return "reactive-workflow";
  return "unclassified";
}

function sessionCandidates(session) {
  if (!object(session) || !Array.isArray(session.turns)) return [];
  return session.turns
    .filter((turn) => Number.isSafeInteger(turn.sequence) && turn.sequence >= 2 && turn.sensitive_signal === false)
    .filter((turn) => session.turns.filter((prior) => prior.sequence < turn.sequence && prior.sensitive_signal === false).length > 0)
    .map((turn) => {
      const context = session.turns.filter((prior) => prior.sequence < turn.sequence && prior.sensitive_signal === false).slice(-3);
      return {session, turn, context};
    })
    .sort((left, right) => right.turn.correction_signals.length - left.turn.correction_signals.length
      || String(left.turn.started_at).localeCompare(String(right.turn.started_at))
      || left.turn.turn_ref.localeCompare(right.turn.turn_ref));
}

function roundRobin(groups, maximum) {
  const selected = [];
  for (let offset = 0; selected.length < maximum; offset += 1) {
    let added = false;
    for (const group of groups) {
      if (group[offset] && selected.length < maximum) {
        selected.push(group[offset]);
        added = true;
      }
    }
    if (!added) break;
  }
  return selected;
}

export function freezeLongitudinalShadowCohort({ingestion, predecessor_ingestion_digest, minimum_episodes = 20}) {
  if (!verifyInteractionIngestion(ingestion).ok || !HASH.test(predecessor_ingestion_digest)
    || !Number.isSafeInteger(minimum_episodes) || minimum_episodes < 1 || minimum_episodes > 1000) throw new Error("longitudinal-shadow.input-invalid");
  const groups = ingestion.sessions
    .map(sessionCandidates)
    .filter((group) => group.length > 0)
    .sort((left, right) => String(left[0].session.first_timestamp).localeCompare(String(right[0].session.first_timestamp))
      || left[0].session.session_ref.localeCompare(right[0].session.session_ref));
  const candidates = groups.flat();
  const selected = roundRobin(groups, minimum_episodes);
  const episodes = selected.map(({session, turn, context}, index) => freeze({
    episode_ref: `shadow-episode:${digest([ingestion.manifest_digest, session.session_ref, turn.turn_ref])}`,
    ordinal: index + 1,
    source_id: session.source_id,
    session_ref: session.session_ref,
    source_locator: session.source_locator,
    source_sha256: session.source_sha256,
    anchor_turn_ref: turn.turn_ref,
    context_turn_refs: context.map((item) => item.turn_ref),
    user_record_ordinal: turn.user_record_ordinal,
    assistant_record_ordinal: turn.assistant_record_ordinal,
    started_at: turn.started_at,
    completed_at: turn.completed_at,
    user_content_hash: turn.user_message_digest,
    assistant_content_hash: turn.assistant_message_digest,
    language_hint: turn.language_hint,
    correction_signal_classes: [...turn.correction_signals],
    provisional_family: familyFor(turn.correction_signals),
    evaluator_status: "pending",
    authority_effect: "none",
  }));
  return seal({
    schema_version: LONGITUDINAL_SHADOW_COHORT_SCHEMA,
    cycle_ref: "cycle:il-lpc-01",
    task_ref: "lpc.shadow",
    predecessor_ingestion_digest,
    ingestion_manifest_digest: ingestion.manifest_digest,
    minimum_episodes,
    candidate_episode_count: candidates.length,
    selected_episode_count: episodes.length,
    selected_session_count: new Set(episodes.map((episode) => episode.session_ref)).size,
    status: episodes.length === minimum_episodes ? "FROZEN_AWAITING_INDEPENDENT_EVALUATION" : "COLLECTING",
    selection_policy: "correction-signal-priority-round-robin-across-sessions-v1",
    excluded_content: ["message_text", "reasoning_content", "tool_arguments", "tool_outputs", "credential_values", "environment_values", "sensitive_turns"],
    episodes,
    activation: "none",
    authority_effect: "none",
  }, "cohort_digest");
}

export function verifyLongitudinalShadowCohort(value) {
  if (!object(value) || value.schema_version !== LONGITUDINAL_SHADOW_COHORT_SCHEMA || !HASH.test(value.cohort_digest)
    || value.activation !== "none" || value.authority_effect !== "none") return false;
  const {cohort_digest, ...material} = value;
  return digest(material) === cohort_digest;
}

function decisionMatches(actual, expected) {
  return actual.disposition === expected.disposition && actual.value === (expected.value ?? null);
}

export function assessLongitudinalShadow({cohort, verdicts}) {
  if (!verifyLongitudinalShadowCohort(cohort) || cohort.status !== "FROZEN_AWAITING_INDEPENDENT_EVALUATION"
    || !Array.isArray(verdicts) || verdicts.length !== cohort.selected_episode_count) throw new Error("longitudinal-shadow.assessment-input-invalid");
  const episodeRefs = new Set(cohort.episodes.map((episode) => episode.episode_ref));
  const verdictSetDigest = digest([...verdicts].sort((left, right) => String(left.episode_ref).localeCompare(String(right.episode_ref))));
  const seen = new Set();
  const rows = verdicts.map((verdict) => {
    if (!object(verdict) || !episodeRefs.has(verdict.episode_ref) || seen.has(verdict.episode_ref)
      || typeof verdict.evaluator_id !== "string" || verdict.evaluator_id.length === 0
      || !Array.isArray(verdict.events) || !object(verdict.query) || !object(verdict.expected)
      || !["apply", "none", "suspend"].includes(verdict.expected.disposition)
      || !Array.isArray(verdict.protected_failure_codes)) throw new Error("longitudinal-shadow.verdict-invalid");
    seen.add(verdict.episode_ref);
    const events = verdict.events.map(materializeLongitudinalPreferenceEvent);
    const baseline = resolveLegacyInteractionPreference(events, verdict.query);
    const candidate = resolveLongitudinalPreference(events, verdict.query);
    return freeze({
      episode_ref: verdict.episode_ref,
      evaluator_id: verdict.evaluator_id,
      family: verdict.family ?? "unclassified",
      event_count: events.length,
      expected: {disposition: verdict.expected.disposition, value: verdict.expected.value ?? null},
      baseline: {disposition: baseline.disposition, value: baseline.value},
      candidate: {disposition: candidate.disposition, value: candidate.value},
      baseline_passed: decisionMatches(baseline, verdict.expected),
      candidate_passed: decisionMatches(candidate, verdict.expected),
      protected_failure_codes: [...verdict.protected_failure_codes].sort(),
      evidence_note: typeof verdict.evidence_note === "string" ? verdict.evidence_note : "",
      authority_effect: "none",
    });
  }).sort((left, right) => left.episode_ref.localeCompare(right.episode_ref));
  const baselinePassed = rows.filter((row) => row.baseline_passed).length;
  const candidatePassed = rows.filter((row) => row.candidate_passed).length;
  const protectedFailures = rows.reduce((counts, row) => {
    for (const code of row.protected_failure_codes) counts[code] = (counts[code] ?? 0) + 1;
    return counts;
  }, {});
  const baselineRate = baselinePassed / rows.length;
  const candidateRate = candidatePassed / rows.length;
  const improvement = candidateRate - baselineRate;
  const evaluatorIds = [...new Set(rows.map((row) => row.evaluator_id))].sort();
  const supported = rows.length >= cohort.minimum_episodes && evaluatorIds.length > 0 && improvement >= 0.15
    && candidateRate >= 0.80 && Object.values(protectedFailures).every((count) => count === 0);
  return seal({
    schema_version: LONGITUDINAL_SHADOW_RESULT_SCHEMA,
    cycle_ref: cohort.cycle_ref,
    task_ref: cohort.task_ref,
    cohort_digest: cohort.cohort_digest,
    verdict_set_digest: verdictSetDigest,
    episode_count: rows.length,
    evaluator_ids: evaluatorIds,
    baseline: {baseline_ref: "legacy-interaction-scope-model/v1", passed: baselinePassed, rate: baselineRate},
    candidate: {candidate_ref: "typed-longitudinal-projection/v1", passed: candidatePassed, rate: candidateRate},
    absolute_improvement: improvement,
    protected_failures: protectedFailures,
    rows,
    disposition: supported ? "shadow-supported" : "shadow-rejected",
    next_frontier: supported ? "lpc.canary" : "lpc.shadow-revise",
    claim_limit: "Independent semantic projection shadow over post-predecessor interactions; no live response intervention, cycle settlement, or activation claim.",
    activation: "none",
    authority_effect: "none",
  }, "result_digest");
}
