import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";
import {buildUnexposedCandidateQueue, createTokenizerQualification, materializeQualificationSourceBundle, PINNED_FULL_S, projectPinnedFullSSourceOnly, REQUIRED_EXPOSED_IDS, selectTokenizerQualifiedCohort} from "./unexposed-cohort-v1.mjs";

const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const sha = (value) => createHash("sha256").update(stable(value)).digest("hex");
const fields = ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"];
const row = (question_id, question_type) => ({question_id, question_type, question: `question ${question_id}`, question_date: "2024/01/01 (Mon) 10:00", haystack_dates: ["2023/01/01 (Sun) 10:00"], haystack_sessions: [[{role: "user", content: "source"}, {role: "assistant", content: "reply"}]]});
const rows = [...REQUIRED_EXPOSED_IDS.map((id, index) => row(id, `old-${index}`)), ...Array.from({length: 492}, (_, index) => row(`${index === 0 ? "gpt4_" : ""}${(index + 256).toString(16).padStart(8, "0")}`, `type-${index % 6}`))];
const poolMaterial = {schema_version: "are.longmemeval-full-s-source-only-pool/v1", source: PINNED_FULL_S, fields, rows, evaluator_fields_emitted: false, authority_effect: "none"};
const pool = {...poolMaterial, pool_sha256: sha(poolMaterial)};
const profile = "c".repeat(64);
const wire = "d".repeat(64);

test("projection requires the exact pinned upstream bytes", () => {
  assert.throws(() => projectPinnedFullSSourceOnly(Buffer.from("[]")), /pinned-source-bytes-invalid/);
});

test("queue uses a frozen seed, excludes all eight IDs and emits a source-only qualification bundle", () => {
  const first = buildUnexposedCandidateQueue(pool);
  assert.deepEqual(first, buildUnexposedCandidateQueue(pool));
  assert.equal(first.eligible_count, 492);
  assert.equal(first.qualification_window.length, 32);
  assert.equal(first.qualification_window.some((item) => REQUIRED_EXPOSED_IDS.includes(item.question_id)), false);
  const bundle = materializeQualificationSourceBundle(pool, first);
  assert.equal(bundle.rows.length, 32);
  assert.deepEqual(Object.keys(bundle.rows[0]).sort(), [...fields].sort());
  assert.equal(JSON.stringify(bundle).includes("answer"), false);
});

test("complete bound tokenizer coverage selects four long histories with type diversity", () => {
  const queue = buildUnexposedCandidateQueue(pool);
  const qualifications = queue.qualification_window.map((candidate, index) => createTokenizerQualification({candidate, model: "glm-5.3-flash", tokenizer_id: "glm-tokenizer", tokenizer_version: "2026-09-25", endpoint_profile_sha256: profile, wire_sha256: sha({wire, index}), original_history_tokens: index === 0 ? 8000 : 9000 + index}));
  const cohort = selectTokenizerQualifiedCohort(queue, qualifications);
  assert.equal(cohort.tasks.length, 4);
  assert.equal(new Set(cohort.tasks.map((item) => item.question_type)).size, 4);
  assert.equal(cohort.tasks.every((item) => item.original_history_tokens > 8000), true);
  assert.equal(cohort.exposed_ids_excluded, true);
});

test("partial, forged, mixed-profile and namespaced inputs fail closed", () => {
  const queue = buildUnexposedCandidateQueue(pool);
  const qualifications = queue.qualification_window.map((candidate, index) => createTokenizerQualification({candidate, model: "glm-5.3-flash", tokenizer_id: "glm-tokenizer", tokenizer_version: "v1", endpoint_profile_sha256: profile, wire_sha256: sha({index}), original_history_tokens: 9000 + index}));
  assert.throws(() => selectTokenizerQualifiedCohort(queue, qualifications.slice(1)), /qualification-coverage-invalid/);
  assert.throws(() => selectTokenizerQualifiedCohort(queue, qualifications.map((item, index) => index ? item : {...item, original_history_tokens: 999999})), /qualification-digest-invalid/);
  const mixed = qualifications.map((item, index) => index ? item : createTokenizerQualification({candidate: queue.qualification_window[0], model: "glm-5.3-flash", tokenizer_id: "other", tokenizer_version: "v1", endpoint_profile_sha256: profile, wire_sha256: sha({index}), original_history_tokens: 9000}));
  assert.throws(() => selectTokenizerQualifiedCohort(queue, mixed), /qualification-coverage-invalid/);
  const badRows = structuredClone(rows); badRows[8].question_id = `longmemeval:${REQUIRED_EXPOSED_IDS[0]}`;
  const badMaterial = {...poolMaterial, rows: badRows};
  assert.throws(() => buildUnexposedCandidateQueue({...badMaterial, pool_sha256: sha(badMaterial)}), /source-row-invalid/);
});
