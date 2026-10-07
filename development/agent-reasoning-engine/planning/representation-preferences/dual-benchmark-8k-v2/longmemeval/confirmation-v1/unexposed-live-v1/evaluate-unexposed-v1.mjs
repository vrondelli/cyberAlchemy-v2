// Evaluator-only bridge for the sealed unexposed recovery composite.
// It performs no provider, credential, or generation access by itself.
import assert from "node:assert/strict";
import {lstatSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {IDS, SOURCE_REVISION, SOURCE_SHA256, loadSourceManifest, sha} from "./adapter-unexposed-v1.mjs";
import * as legacyAdapter from "../adapter.mjs";
import {
  RUBRIC_PATH,
  RUBRIC_SHA256,
  evaluator as legacyEvaluator,
  referenceBinding as legacyReferenceBinding,
  renderNative,
} from "../evaluate.mjs";

export {RUBRIC_PATH, RUBRIC_SHA256};

export const RECOVERY_SEAL_SCHEMA = "are.longmemeval-unexposed-recovery-composite-seal/v1";
export const EVALUATOR_FREEZE_SCHEMA = "are.longmemeval-unexposed-evaluator-freeze/v1";
export const RECOVERY_SEAL_FILE_SHA256 = "03528b41d2d4c956fd4b2425d58e36258b76fd7dc4870b4953e75b06a007e1c2";
export const EXPECTED = Object.freeze({
  qualification_sha256: "609a2936d00db81d03aa9380981c378d8c028fbc96455527618c7c9db5cfe273",
  planning_plan_sha256: "f0bdaf51c90f27553c1fc0fa85879a7e497eb05d72b1e441a30cf756f6f01abc",
  selection_sha256: "2232f5cb5a59e16e8d74ed474e18556e6eddd3cd074f2a90c60215854a8b9c18",
  cohort_sha256: "4f97a9e1f121fd7938ec266ba995552845696df803b7cb5fd852cfe02f56ceec",
  source_manifest_sha256: "ba59f28a061728002e607e2ecb4cfd3fbdaff03494d62039268fb02422a6d437",
});
export const SCORER_PATH = fileURLToPath(new URL("../evaluate.mjs", import.meta.url));
export const ADAPTER_PATH = fileURLToPath(import.meta.url);

// The only legacy opaque ID ending in `_abs` must represent the current abstention task.
const LEGACY_BY_CURRENT = Object.freeze([
  legacyAdapter.IDS[1],
  legacyAdapter.IDS[2],
  legacyAdapter.IDS[3],
  legacyAdapter.IDS[0],
]);
const CURRENT_INDEX_BY_LEGACY_ORDER = Object.freeze([3, 0, 1, 2]);
const CURRENT_BY_LEGACY = new Map(LEGACY_BY_CURRENT.map((legacy, index) => [legacy, IDS[index]]));
const HASH = /^[a-f0-9]{64}$/;
const need = (value, code) => assert.ok(value, `unexposed-evaluator.${code}`);
const validUsage = (usage) => ["prompt_tokens", "completion_tokens", "total_tokens"].every((key) => Number.isSafeInteger(usage?.[key]) && usage[key] >= 0) && usage.total_tokens === usage.prompt_tokens + usage.completion_tokens;
const sumUsage = (items) => Object.fromEntries(["prompt_tokens", "completion_tokens", "total_tokens"].map((key) => [key, items.reduce((total, item) => total + item.usage[key], 0)]));
const identity = (row) => ({question_id: row.question_id, question_type: row.question_type, question: row.question, question_date: row.question_date});
const answerType = (value) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};
const alias = (row, index) => ({...structuredClone(row), question_id: LEGACY_BY_CURRENT[index]});
const remap = (value) => {
  const copy = structuredClone(value);
  const visit = (item) => {
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item)) return item.forEach(visit);
    if (CURRENT_BY_LEGACY.has(item.question_id)) item.question_id = CURRENT_BY_LEGACY.get(item.question_id);
    for (const child of Object.values(item)) visit(child);
  };
  visit(copy);
  return copy;
};

/** Convert the recovery composite to the minimal exact view accepted by the reviewed scorer. */
export function normalizeRecoverySeal(seal) {
  need(seal?.schema_version === RECOVERY_SEAL_SCHEMA, "recovery-seal-schema");
  need(seal.terminal === true && seal.status === "completed" && seal.source_integrity_verified === true && seal.transport_settled === true && seal.wrapper_error === null, "recovery-seal-not-clean");
  need(seal.evaluator_reference_access === false && seal.automatic_retries === 0, "generation-separation");
  const result = seal.result;
  for (const [key, expected] of Object.entries(EXPECTED)) need(result?.[key] === expected, `${key}-drift`);
  need(result.status === "completed" && result.planned_pairs === 4 && result.planned_answer_slots === 8 && result.health_stop === null, "recovery-result-not-clean");
  need(result.recovery_unknown_usage === false && result.recovery_held_tokens === 0, "recovery-accounting-unknown");
  need(Array.isArray(result.results) && result.results.length === 4 && result.results.every((pair, index) => pair.question_id === IDS[index]), "fixed-current-pairs");
  const currentPairs = result.results.map((pair) => {
    need(pair.status === "completed" && pair.unknown_usage === false && pair.persistence_failure === false && pair.held_tokens === 0 && validUsage(pair.usage), "pair-not-clean");
    need(Array.isArray(pair.calls) && pair.calls.length > 0 && pair.calls.every((call) => ["control", "treatment"].includes(call.arm) && call.model_started === true && validUsage(call.usage)), "call-accounting");
    need(["prompt_tokens", "completion_tokens", "total_tokens"].every((key) => pair.calls.reduce((total, call) => total + call.usage[key], 0) === pair.usage[key]), "pair-usage-sum");
    need(Array.isArray(pair.answers) && pair.answers.length === 2 && new Set(pair.answers.map((answer) => answer.arm)).size === 2, "answer-slots");
    need(pair.answers.every((answer) => ["control", "treatment"].includes(answer.arm) && answer.status === "completed" && typeof answer.text === "string" && answer.text.length > 0 && sha(answer.text) === answer.answer_sha256), "answer-binding");
    return pair;
  });
  const usage = sumUsage(currentPairs);
  const results = CURRENT_INDEX_BY_LEGACY_ORDER.map((currentIndex, legacyIndex) => {
    const pair = currentPairs[currentIndex];
    return {
      question_id: legacyAdapter.IDS[legacyIndex],
      unknown_usage: false,
      persistence_failure: false,
      held_tokens: 0,
      usage: structuredClone(pair.usage),
      calls: pair.calls.map((call) => ({arm: call.arm, model_started: true, usage: structuredClone(call.usage)})),
      answers: pair.answers.map((answer) => ({arm: answer.arm, status: answer.status, text: answer.text, answer_sha256: answer.answer_sha256})),
    };
  });
  return deepFreeze({
    schema: "are.full-s-generation-seal/v1",
    terminal: true,
    status: "completed",
    source_integrity_verified: true,
    transport_settled: true,
    wrapper_error: null,
    result: {planned_pairs: 4, planned_answer_slots: 8, unknown_usage: false, persistence_failure: false, held_tokens: 0, usage, results},
  });
}

/** Pure constructor used by production opening and synthetic tests. Public binding contains hashes only. */
export function createUnexposedEvaluator({rows, references, source_binding, reference_receipt_sha256, reference_files, production_verified = false}) {
  need(Array.isArray(rows) && rows.length === 4 && rows.every((row, index) => row.question_id === IDS[index]), "fixed-source-rows");
  need(Array.isArray(references) && references.length === 4 && references.every((row, index) => row.question_id === IDS[index]), "fixed-reference-rows");
  need(HASH.test(reference_receipt_sha256 ?? "") || !production_verified, "reference-receipt-binding");
  const aliasedRows = CURRENT_INDEX_BY_LEGACY_ORDER.map((currentIndex, legacyIndex) => ({...structuredClone(rows[currentIndex]), question_id: legacyAdapter.IDS[legacyIndex]}));
  const aliasedReferences = CURRENT_INDEX_BY_LEGACY_ORDER.map((currentIndex, legacyIndex) => ({...structuredClone(references[currentIndex]), question_id: legacyAdapter.IDS[legacyIndex]}));
  const legacyBinding = legacyReferenceBinding({rows: aliasedRows, oracle: aliasedReferences, source_binding, oracle_sha256: reference_receipt_sha256, rubric_sha256: RUBRIC_SHA256, production: production_verified});
  const internal = legacyEvaluator({rows: aliasedRows, oracle: aliasedReferences, binding: legacyBinding, render: (reference, response) => renderNative(RUBRIC_PATH, reference, response)});
  const binding = {
    schema: "are.longmemeval-unexposed-reference-binding/v1",
    production_verified,
    source_binding_sha256: sha(source_binding),
    reference_acquisition_sha256: reference_receipt_sha256,
    scorer_sha256: sha(readFileSync(SCORER_PATH)),
    rubric_sha256: RUBRIC_SHA256,
    question_ids: [...IDS],
    rows: references.map((reference, index) => ({question_id: reference.question_id, identity_sha256: sha(identity(reference)), reference_sha256: sha(reference), answer_json_type: answerType(reference.answer), file_sha256: reference_files?.[index]?.sha256 ?? null})),
    reference_values_emitted: false,
    normalization: {schema: "are.longmemeval-unexposed-scorer-normalization/v1", abstention_preserving_permutation: [...CURRENT_INDEX_BY_LEGACY_ORDER], legacy_binding_sha256: sha(legacyBinding)},
    claim_ceiling: "Four fixed unexposed full-S tasks; not full-benchmark perfection.",
    expected_recovery_seal_file_sha256: RECOVERY_SEAL_FILE_SHA256,
  };
  const bindingDigest = sha(binding);
  return {
    binding: deepFreeze(structuredClone(binding)),
    score: async ({seal, seal_file_sha256, freeze, ...effects}) => {
      const normalized = normalizeRecoverySeal(seal);
      need(freeze?.schema === EVALUATOR_FREEZE_SCHEMA && freeze.approved === true, "evaluator-freeze");
      need(HASH.test(seal_file_sha256 ?? "") && freeze.recovery_seal_file_sha256 === seal_file_sha256, "freeze-seal-file-binding");
      if (production_verified) need(seal_file_sha256 === RECOVERY_SEAL_FILE_SHA256, "recovery-seal-file-drift");
      need(freeze.reference_binding_sha256 === bindingDigest && freeze.recovery_seal_object_sha256 === sha(seal) && freeze.normalized_scorer_view_sha256 === sha(normalized), "freeze-input-drift");
      need(freeze.adapter_sha256 === sha(readFileSync(ADAPTER_PATH)) && freeze.scorer_sha256 === binding.scorer_sha256 && freeze.rubric_sha256 === RUBRIC_SHA256, "freeze-code-drift");
      need(freeze.maximum_judge_calls === 8 && freeze.maximum_judge_tokens === 64000 && freeze.context_limit === 8000, "freeze-budget");
      need(Number.isSafeInteger(freeze.tokenizer_timeout_ms) && freeze.tokenizer_timeout_ms > 0, "freeze-timeout");
      const legacyFreeze = {schema: "are.full-s-evaluator-freeze/v1", approved: true, reference_binding_sha256: sha(legacyBinding), generation_seal_sha256: sha(normalized), maximum_judge_calls: 8, maximum_judge_tokens: 64000, context_limit: 8000, tokenizer_timeout_ms: freeze.tokenizer_timeout_ms, evaluator_sha256: binding.scorer_sha256, rubric_sha256: RUBRIC_SHA256};
      const record = effects.record;
      const publicize = (internalResult) => {
        const publicResult = remap(internalResult);
        publicResult.schema = "are.longmemeval-unexposed-evaluation-result/v1";
        publicResult.reference_binding_sha256 = bindingDigest;
        publicResult.recovery_seal_file_sha256 = seal_file_sha256;
        publicResult.recovery_seal_object_sha256 = sha(seal);
        publicResult.normalized_scorer_view_sha256 = sha(normalized);
        delete publicResult.generation_seal_sha256;
        return publicResult;
      };
      let result;
      try { result = await internal.score({...effects, seal: normalized, freeze: legacyFreeze, record: async (event) => {
          const publicEvent = remap(event);
          if (publicEvent.kind === "evaluation-result" && publicEvent.result) publicEvent.result = publicize(publicEvent.result);
          await record(publicEvent);
        }});
      } catch (error) {
        if (error.result) error.result = publicize(error.result);
        throw error;
      }
      const publicResult = publicize(result);
      return publicResult;
    },
  };
}

/** Production opener. Reference values stay inside this evaluator process. */
export function openUnexposedEvaluator({source_manifest, source_directory, reference_directory, synthetic_only = false, load_source = loadSourceManifest}) {
  need(synthetic_only || load_source === loadSourceManifest, "production-source-loader");
  const loaded = load_source(source_manifest, source_directory);
  const readBound = (name, limit, digest) => {
    const path = join(reference_directory, name), stat = lstatSync(path);
    need(stat.isFile() && !stat.isSymbolicLink() && stat.size <= limit, "reference-file-bound");
    const raw = readFileSync(path); if (digest) need(sha(raw) === digest, "reference-file-drift");
    return {raw, value: JSON.parse(raw)};
  };
  const receipt = readBound("reference-acquisition.json", 1024 ** 2);
  need(receipt.value.status === "verified-evaluator-reference-projection" && receipt.value.pinned_upstream_source_verified === true && receipt.value.source_revision === SOURCE_REVISION && receipt.value.source_sha256 === SOURCE_SHA256 && receipt.value.source_bytes === 277383467 && receipt.value.source_records === 500 && receipt.value.source_filename === "longmemeval_s_cleaned.json" && receipt.value.evaluation_references_emitted === true && receipt.value.generator_reference_access === false && receipt.value.provider_calls === 0, "verified-references");
  need(Array.isArray(receipt.value.selected) && receipt.value.selected.length === 4, "fixed-reference-selection");
  const references = IDS.map((id, index) => {
    const selected = receipt.value.selected[index];
    need(selected?.question_id === id && selected.path === `reference-${id}.json` && HASH.test(selected.sha256 ?? ""), "reference-path-identity");
    const bound = readBound(selected.path, 1024 ** 2, selected.sha256), row = bound.value;
    need(selected.bytes === bound.raw.length && selected.answer_json_type === answerType(row.answer), "reference-metadata-drift");
    need(Object.keys(row).sort().join("|") === ["question_id", "question_type", "question", "question_date", "answer"].sort().join("|"), "reference-whitelist");
    need(sha(identity(row)) === sha(identity(loaded.rows[index])), "source-reference-identity");
    return row;
  });
  return createUnexposedEvaluator({rows: loaded.rows, references, source_binding: loaded.bindings, reference_receipt_sha256: sha(receipt.raw), reference_files: receipt.value.selected, production_verified: !synthetic_only});
}
