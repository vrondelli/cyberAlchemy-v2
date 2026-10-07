import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";
import {
  assessLongitudinalShadowRevision,
  freezeLongitudinalShadowRevision,
  LONGITUDINAL_SHADOW_STRATA,
  verifyLongitudinalShadowRevision,
} from "../src/longitudinal-shadow-revision-v1.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");

function ingestion(sessionCount = 24) {
  const sessions = Array.from({length: sessionCount}, (_, index) => ({
    session_ref: `session:${index}`,
    source_id: "test-source",
    source_locator: `sessions/${index}.jsonl`,
    source_sha256: digest(`source:${index}`),
    first_timestamp: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
    turns: [
      {turn_ref: `turn:${index}:preference`, sequence: 1, started_at: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00Z`, completed_at: `2026-08-${String(index + 1).padStart(2, "0")}T00:01:00Z`, user_record_ordinal: 1, assistant_record_ordinal: 2, user_message_digest: digest(`u:${index}:1`), assistant_message_digest: digest(`a:${index}:1`), language_hint: "en", correction_signals: [], sensitive_signal: false},
      {turn_ref: `turn:${index}:application`, sequence: 2, started_at: `2026-08-${String(index + 1).padStart(2, "0")}T00:02:00Z`, completed_at: `2026-08-${String(index + 1).padStart(2, "0")}T00:03:00Z`, user_record_ordinal: 3, assistant_record_ordinal: 4, user_message_digest: digest(`u:${index}:2`), assistant_message_digest: digest(`a:${index}:2`), language_hint: "en", correction_signals: [], sensitive_signal: false},
    ],
  }));
  const material = {schema_version: "are.interaction-learning-ingestion/v1", cycle_kind: "interaction-learning", cohort_policy: "test", source_inventory: [], selected_session_count: sessions.length, evaluation_task_count: sessionCount * 2, durable_content_policy: "metadata-digests-and-structural-signals-only", excluded_content: ["message_text"], sessions, authority_effect: "none"};
  return {...material, manifest_digest: digest(material)};
}

function boundary(stratum, index) {
  if (stratum === "cross-objective-boundary") return {kind: "objective", from_ref: `old:${index}`, to_ref: `new:${index}`};
  if (stratum === "cross-workflow-exception") return {kind: "workflow", from_ref: `old:${index}`, to_ref: `new:${index}`};
  if (stratum === "temporal-expiry-or-inferred-conflict") return {kind: "temporal-expiry"};
  if (stratum === "revision-or-revocation-later-query") return {kind: "revision"};
  if (stratum === "cross-thread-recurrence") return {kind: "thread", from_ref: `old:${index}`, to_ref: `new:${index}`};
  return {kind: "same-scope"};
}

function classifications() {
  return LONGITUDINAL_SHADOW_STRATA.flatMap((stratum, stratumIndex) => Array.from({length: 4}, (_, offset) => {
    const index = stratumIndex * 4 + offset;
    const evidenceSession = stratum === "cross-thread-recurrence" ? index - 1 : index;
    return {
      classification_ref: `classification:${index}`,
      stratum,
      overlap_key: `window:${index}`,
      genuinely_later: true,
      resolver_discriminating: stratum !== "same-scope-or-no-preference-control",
      boundary: boundary(stratum, index),
      evidence_points: [
        {session_ref: `session:${evidenceSession}`, turn_ref: `turn:${evidenceSession}:preference`, role: "preference"},
        {session_ref: `session:${index}`, turn_ref: `turn:${index}:application`, role: "application"},
      ],
    };
  }));
}

test("freezes only a complete balanced and structurally discriminating revision cohort", () => {
  const cohort = freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: classifications()});
  assert.equal(cohort.status, "FROZEN_AWAITING_INDEPENDENT_EVALUATION");
  assert.equal(cohort.selected_episode_count, 24);
  assert.equal(cohort.resolver_discriminating_count, 20);
  assert.deepEqual(new Set(cohort.episodes.map((episode) => episode.overlap_key)).size, 24);
  assert.equal(verifyLongitudinalShadowRevision(cohort), true);
  for (const stratum of LONGITUDINAL_SHADOW_STRATA) assert.equal(cohort.episodes.filter((episode) => episode.stratum === stratum).length, 4);
});

test("missing strata remain collecting and cannot borrow easier cases", () => {
  const partial = classifications().filter((item) => item.stratum === "same-scope-or-no-preference-control");
  const cohort = freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: partial});
  assert.equal(cohort.status, "COLLECTING");
  assert.equal(cohort.selected_episode_count, 4);
  assert.equal(cohort.deficits["cross-objective-boundary"], 4);
  assert.equal(cohort.deficits["same-scope-or-no-preference-control"], 0);
});

test("rejects invented same-turn application points and false cross-thread labels", () => {
  const sameTurn = classifications()[0];
  sameTurn.evidence_points[1].turn_ref = sameTurn.evidence_points[0].turn_ref;
  assert.throws(() => freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: [sameTurn]}), /not-later/);
  const falseCrossThread = classifications().find((item) => item.stratum === "cross-thread-recurrence");
  falseCrossThread.evidence_points[0].session_ref = falseCrossThread.evidence_points[1].session_ref;
  falseCrossThread.evidence_points[0].turn_ref = `turn:${falseCrossThread.evidence_points[1].session_ref.split(":")[1]}:preference`;
  assert.throws(() => freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: [falseCrossThread]}), /not-cross-thread/);
});

test("deduplicates overlapping windows and caps session contribution", () => {
  const values = classifications();
  values[1].overlap_key = values[0].overlap_key;
  const cohort = freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: values, maximum_per_session: 4});
  assert.equal(cohort.status, "COLLECTING");
  assert.equal(cohort.deficits["cross-objective-boundary"], 1);
});

test("a balanced cohort still collects below twelve discriminating structures", () => {
  const values = classifications();
  for (const value of values.slice(0, 9)) value.resolver_discriminating = false;
  const cohort = freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: values});
  assert.equal(cohort.selected_episode_count, 24);
  assert.equal(cohort.resolver_discriminating_count, 11);
  assert.equal(cohort.status, "COLLECTING");
});

test("requires overall improvement and per-discriminating-stratum accuracy", () => {
  const cohort = freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: classifications()});
  const verdicts = cohort.episodes.map((episode, index) => ({
    episode_ref: episode.episode_ref,
    evaluator_id: "independent-agent:revision-v1",
    events: [
      {event_id: `set:${index}`, event_type: "set", preference_ref: `preference:${index}`, sequence: 1, scope: {participant_ref: `participant:${index}`, product_ref: "product:are"}, posture: "explicit", value: "concise"},
      {event_id: `revise:${index}`, event_type: "revise", preference_ref: `preference:${index}`, sequence: 2, scope: {participant_ref: `participant:${index}`, product_ref: "product:are", objective_ref: "objective:old"}, posture: "explicit", value: "verbose"},
    ],
    query: {sequence: 3, scope: {participant_ref: `participant:${index}`, product_ref: "product:are", objective_ref: "objective:new"}},
    expected: {disposition: "apply", value: "concise"},
    protected_failure_codes: [],
  }));
  const result = assessLongitudinalShadowRevision({cohort, verdicts});
  assert.equal(result.baseline.rate, 0);
  assert.equal(result.candidate.rate, 1);
  assert.equal(result.disposition, "shadow-supported");
  assert.equal(result.next_frontier, "lpc.canary");
  assert.equal(result.activation, "none");
});

test("rejects a high aggregate score when one discriminating stratum is below 75 percent", () => {
  const cohort = freezeLongitudinalShadowRevision({ingestion: ingestion(), classifications: classifications()});
  const verdicts = cohort.episodes.map((episode, index) => ({
    episode_ref: episode.episode_ref,
    evaluator_id: "independent-agent:revision-v1",
    events: [
      {event_id: `set:${index}`, event_type: "set", preference_ref: `preference:${index}`, sequence: 1, scope: {participant_ref: `participant:${index}`, product_ref: "product:are"}, posture: "explicit", value: "concise"},
      {event_id: `revise:${index}`, event_type: "revise", preference_ref: `preference:${index}`, sequence: 2, scope: {participant_ref: `participant:${index}`, product_ref: "product:are", objective_ref: "objective:old"}, posture: "explicit", value: "verbose"},
    ],
    query: {sequence: 3, scope: {participant_ref: `participant:${index}`, product_ref: "product:are", objective_ref: "objective:new"}},
    expected: {disposition: "apply", value: episode.stratum === "cross-objective-boundary" && index < 2 ? "verbose" : "concise"},
    protected_failure_codes: [],
  }));
  const result = assessLongitudinalShadowRevision({cohort, verdicts});
  assert.equal(result.candidate.rate > 0.80, true);
  assert.equal(result.strata["cross-objective-boundary"].candidate_rate, 0.5);
  assert.equal(result.disposition, "shadow-rejected");
});
