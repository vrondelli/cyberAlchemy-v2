import assert from "node:assert/strict";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {IDS, sha} from "./adapter-unexposed-v1.mjs";
import {ADAPTER_PATH, EVALUATOR_FREEZE_SCHEMA, EXPECTED, RECOVERY_SEAL_FILE_SHA256, RUBRIC_SHA256, SCORER_PATH, createUnexposedEvaluator, normalizeRecoverySeal, openUnexposedEvaluator} from "./evaluate-unexposed-v1.mjs";

const usage = {prompt_tokens: 10, completion_tokens: 2, total_tokens: 12};
const row = (question_id) => ({question_id, question_type: "multi-session", question: "Synthetic question?", question_date: "2024/01/01 (Mon) 12:00"});
function fixture() {
  const rows = IDS.map(row), references = rows.map((source) => ({...source, answer: "PRIVATE_SYNTHETIC_REFERENCE"}));
  const opened = createUnexposedEvaluator({rows, references, source_binding: {source: "synthetic"}, reference_receipt_sha256: sha("synthetic-references")});
  const results = IDS.map((question_id) => ({question_id, status: "completed", unknown_usage: false, persistence_failure: false, held_tokens: 0, usage: {prompt_tokens: 20, completion_tokens: 4, total_tokens: 24}, calls: ["control", "treatment"].map((arm) => ({arm, model_started: true, usage})), answers: ["control", "treatment"].map((arm) => ({arm, status: "completed", text: "synthetic answer", answer_sha256: sha("synthetic answer")}))}));
  const seal = {schema_version: "are.longmemeval-unexposed-recovery-composite-seal/v1", terminal: true, status: "completed", source_integrity_verified: true, transport_settled: true, wrapper_error: null, evaluator_reference_access: false, automatic_retries: 0, result: {schema: "are.longmemeval-unexposed-recovery-composite-result/v1", status: "completed", ...EXPECTED, planned_pairs: 4, planned_answer_slots: 8, health_stop: null, recovery_unknown_usage: false, recovery_held_tokens: 0, results}};
  const normalized = normalizeRecoverySeal(seal);
  const seal_file_sha256 = sha(JSON.stringify(seal));
  const freeze = {schema: EVALUATOR_FREEZE_SCHEMA, approved: true, reference_binding_sha256: sha(opened.binding), recovery_seal_file_sha256: seal_file_sha256, recovery_seal_object_sha256: sha(seal), normalized_scorer_view_sha256: sha(normalized), adapter_sha256: sha(readFileSync(ADAPTER_PATH)), scorer_sha256: sha(readFileSync(SCORER_PATH)), rubric_sha256: RUBRIC_SHA256, maximum_judge_calls: 8, maximum_judge_tokens: 64000, context_limit: 8000, tokenizer_timeout_ms: 10000};
  return {opened, seal, seal_file_sha256, normalized, freeze};
}

test("normalization is immutable, exact, abstention preserving, and usage conserving", () => {
  const {seal, normalized} = fixture();
  assert.ok(Object.isFrozen(normalized) && Object.isFrozen(normalized.result.results[0]));
  assert.deepEqual(normalized.result.results.map((pair) => pair.question_id), ["09ba9854_abs", "06db6396", "cc06de0d", "54026fce"]);
  assert.equal(normalized.result.results[0].answers[0].text, seal.result.results[3].answers[0].text);
  assert.deepEqual(normalized.result.usage, {prompt_tokens: 80, completion_tokens: 16, total_tokens: 96});
  assert.throws(() => { normalized.result.held_tokens = 1; }, TypeError);
  assert.throws(() => normalizeRecoverySeal({...seal, evaluator_reference_access: true}), /generation-separation/);
  assert.throws(() => normalizeRecoverySeal({...seal, result: {...seal.result, selection_sha256: "0".repeat(64)}}), /selection_sha256-drift/);
});

test("current binding is hashes-only and binds adapter, scorer, rubric and all current IDs", () => {
  const {opened} = fixture(), serialized = JSON.stringify(opened.binding);
  assert.deepEqual(opened.binding.question_ids, IDS);
  assert.equal(opened.binding.rows.length, 4);
  assert.equal(opened.binding.scorer_sha256, sha(readFileSync(SCORER_PATH)));
  assert.equal(opened.binding.rubric_sha256, RUBRIC_SHA256);
  assert.equal(opened.binding.expected_recovery_seal_file_sha256, RECOVERY_SEAL_FILE_SHA256);
  assert.equal(serialized.includes("PRIVATE_SYNTHETIC_REFERENCE"), false);
  assert.equal(serialized.includes("Synthetic question?"), false);
});

test("freeze rejects drift before any synthetic judge effect", async () => {
  const {opened, seal, seal_file_sha256, freeze} = fixture(); let calls = 0;
  const options = {seal, seal_file_sha256, freeze: {...freeze, recovery_seal_object_sha256: "0".repeat(64)}, meter: async () => { calls++; }, generate: async () => { calls++; }, record: async () => { calls++; }, synthetic_only: true};
  await assert.rejects(opened.score(options), /freeze-input-drift/);
  assert.equal(calls, 0);
});

test("reviewed scorer runs through the bridge with synthetic effects and restores current IDs", async () => {
  const {opened, seal, seal_file_sha256, freeze} = fixture(), events = [];
  const meter = async (request) => ({input_tokens: 100, wire_sha256: sha(request)});
  const generate = async ({request}) => ({status: 200, ok: true, finish_reason: "stop", output: "yes", request_sha256: sha(request), usage: {prompt_tokens: 100, completion_tokens: 10, total_tokens: 110}});
  const result = await opened.score({seal, seal_file_sha256, freeze, meter, generate, record: async (event) => events.push(event), synthetic_only: true});
  assert.equal(result.schema, "are.longmemeval-unexposed-evaluation-result/v1");
  assert.deepEqual(new Set(result.judgments.map((item) => item.question_id)), new Set(IDS));
  assert.equal(result.judge_calls, 8);
  assert.equal(result.totals.control.correct, 4);
  assert.equal(result.totals.treatment.correct, 4);
  const finalEvent = events.find((event) => event.kind === "evaluation-result");
  assert.equal(finalEvent.result.reference_binding_sha256, sha(opened.binding));
  assert.equal(finalEvent.result.recovery_seal_file_sha256, seal_file_sha256);
  assert.equal(finalEvent.result.recovery_seal_object_sha256, sha(seal));
  assert.equal(JSON.stringify(events).includes("PRIVATE_SYNTHETIC_REFERENCE"), false);
  assert.equal(JSON.stringify(result).includes("09ba9854_abs"), false);
});

test("production opener path accepts an exact current-ID evaluator projection and rejects loader injection outside tests", () => {
  const root=mkdtempSync(join(tmpdir(),"unexposed-production-open-")),referenceDirectory=join(root,"references");mkdirSync(referenceDirectory);
  try{
    const rows=IDS.map(row),references=rows.map(source=>({...source,answer:"PRIVATE_CURRENT_REFERENCE"}));
    const selected=references.map(reference=>{const path=`reference-${reference.question_id}.json`,raw=Buffer.from(JSON.stringify(reference));writeFileSync(join(referenceDirectory,path),raw);return {question_id:reference.question_id,path,bytes:raw.length,sha256:sha(raw),answer_json_type:"string"};});
    writeFileSync(join(referenceDirectory,"reference-acquisition.json"),JSON.stringify({status:"verified-evaluator-reference-projection",pinned_upstream_source_verified:true,source_revision:"98d7416c24c778c2fee6e6f3006e7a073259d48f",source_sha256:"d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442",source_bytes:277383467,source_records:500,source_filename:"longmemeval_s_cleaned.json",selected,evaluation_references_emitted:true,generator_reference_access:false,provider_calls:0}));
    const loader=()=>({rows,bindings:{source:"synthetic-current-production-shape"}}),opened=openUnexposedEvaluator({source_manifest:{},source_directory:root,reference_directory:referenceDirectory,synthetic_only:true,load_source:loader});
    assert.deepEqual(opened.binding.question_ids,IDS);assert.equal(opened.binding.production_verified,false);assert.equal(JSON.stringify(opened.binding).includes("PRIVATE_CURRENT_REFERENCE"),false);
    assert.throws(()=>openUnexposedEvaluator({source_manifest:{},source_directory:root,reference_directory:referenceDirectory,load_source:loader}),/production-source-loader/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
