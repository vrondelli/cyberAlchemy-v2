import assert from "node:assert/strict";
import test from "node:test";

import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";
import {assessLongitudinalShadow, excludeInteractionIngestionSessions, freezeLongitudinalShadowCohort, verifyLongitudinalShadowCohort} from "../src/longitudinal-shadow-v1.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");

function ingestion(sessionCount = 4, turnsPerSession = 6) {
  const sessions = Array.from({length: sessionCount}, (_, sessionIndex) => ({
    session_ref: `session:${sessionIndex}`,
    source_id: "test-source",
    source_locator: `2026/09/${sessionIndex + 1}/session.jsonl`,
    source_sha256: digest(`source:${sessionIndex}`),
    first_timestamp: `2026-09-${String(sessionIndex + 1).padStart(2, "0")}T00:00:00Z`,
    turns: Array.from({length: turnsPerSession}, (_, turnIndex) => ({turn_ref: `turn:${sessionIndex}:${turnIndex + 1}`, sequence: turnIndex + 1, started_at: `2026-09-01T00:00:${String(turnIndex).padStart(2, "0")}Z`, completed_at: `2026-09-01T00:01:${String(turnIndex).padStart(2, "0")}Z`, user_record_ordinal: turnIndex * 2 + 1, assistant_record_ordinal: turnIndex * 2 + 2, user_message_digest: digest(`user:${sessionIndex}:${turnIndex}`), assistant_message_digest: digest(`assistant:${sessionIndex}:${turnIndex}`), language_hint: turnIndex % 2 ? "en" : "mixed", correction_signals: turnIndex % 2 ? ["continuity_repair"] : [], sensitive_signal: false})),
  }));
  const material = {schema_version: "are.interaction-learning-ingestion/v1", cycle_kind: "interaction-learning", cohort_policy: "test", source_inventory: [], selected_session_count: sessions.length, evaluation_task_count: sessionCount * turnsPerSession, durable_content_policy: "metadata-digests-and-structural-signals-only", excluded_content: ["message_text"], sessions, authority_effect: "none"};
  return {...material, manifest_digest: digest(material)};
}

test("freezes a deterministic diverse 20-episode shadow cohort without raw content", () => {
  const cohort = freezeLongitudinalShadowCohort({ingestion: ingestion(), predecessor_ingestion_digest: digest("predecessor")});
  assert.equal(cohort.status, "FROZEN_AWAITING_INDEPENDENT_EVALUATION");
  assert.equal(cohort.selected_episode_count, 20);
  assert.equal(cohort.selected_session_count, 4);
  assert.equal(verifyLongitudinalShadowCohort(cohort), true);
  assert.equal(cohort.episodes.some((episode) => Object.keys(episode).some((key) => /message|reasoning|tool|credential|environment/i.test(key))), false);
  assert.deepEqual(cohort, freezeLongitudinalShadowCohort({ingestion: ingestion(), predecessor_ingestion_digest: digest("predecessor")}));
});

test("keeps an undersized cohort collecting", () => {
  const cohort = freezeLongitudinalShadowCohort({ingestion: ingestion(2, 3), predecessor_ingestion_digest: digest("predecessor")});
  assert.equal(cohort.status, "COLLECTING");
  assert.equal(cohort.selected_episode_count, 4);
});

test("excludes a drifting session and reseals the derived ingestion", () => {
  const source = ingestion();
  const filtered = excludeInteractionIngestionSessions(source, ["session:1"]);
  assert.equal(filtered.selected_session_count, 3);
  assert.equal(filtered.evaluation_task_count, 18);
  assert.notEqual(filtered.manifest_digest, source.manifest_digest);
  assert.equal(filtered.sessions.some((session) => session.session_ref === "session:1"), false);
});

test("scores independent typed verdicts and preserves the canary boundary", () => {
  const cohort = freezeLongitudinalShadowCohort({ingestion: ingestion(), predecessor_ingestion_digest: digest("predecessor")});
  const verdicts = cohort.episodes.map((episode, index) => ({
    episode_ref: episode.episode_ref,
    evaluator_id: "independent-agent:shadow-v1",
    family: "objective-boundary",
    events: [
      {event_id: `set:${index}`, event_type: "set", preference_ref: `preference:${index}`, sequence: 1, scope: {participant_ref: `participant:${index}`, product_ref: "product:are"}, posture: "explicit", value: "concise"},
      {event_id: `revise:${index}`, event_type: "revise", preference_ref: `preference:${index}`, sequence: 2, scope: {participant_ref: `participant:${index}`, product_ref: "product:are", objective_ref: "objective:old"}, posture: "explicit", value: "verbose"},
    ],
    query: {sequence: 3, scope: {participant_ref: `participant:${index}`, product_ref: "product:are", objective_ref: "objective:new"}},
    expected: {disposition: "apply", value: "concise"},
    protected_failure_codes: [],
    evidence_note: "typed evaluator judgment",
  }));
  const result = assessLongitudinalShadow({cohort, verdicts});
  assert.equal(result.baseline.rate, 0);
  assert.equal(result.candidate.rate, 1);
  assert.equal(result.disposition, "shadow-supported");
  assert.equal(result.next_frontier, "lpc.canary");
  assert.equal(result.activation, "none");
});

test("rejects cohort or verdict tampering", () => {
  const cohort = freezeLongitudinalShadowCohort({ingestion: ingestion(), predecessor_ingestion_digest: digest("predecessor")});
  assert.equal(verifyLongitudinalShadowCohort({...cohort, selected_episode_count: 19}), false);
  assert.throws(() => assessLongitudinalShadow({cohort, verdicts: []}), /assessment-input-invalid/);
});
