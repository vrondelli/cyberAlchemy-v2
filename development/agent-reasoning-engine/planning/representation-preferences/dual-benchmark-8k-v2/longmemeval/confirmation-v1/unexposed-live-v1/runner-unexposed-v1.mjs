// Injectable generation core for the frozen unexposed cohort. No provider or evaluator access.
import assert from "node:assert/strict";
import {
  IDS,
  sha,
  flattenHistory,
  answerMessages,
  ingestionMessages,
  admitActualWire,
  createTokenizerSession,
  SELECTION_SHA256,
  COHORT_SHA256,
  SOURCE_MANIFEST_SHA256
} from "./adapter-unexposed-v1.mjs";

export const PLANNING_PLAN_SHA256 = "f0bdaf51c90f27553c1fc0fa85879a7e497eb05d72b1e441a30cf756f6f01abc";
export const PLANNED_GENERATION_CALLS = 152;
export const GENERATION_TOKEN_RESERVATION = 1216000;
export const RECOVERY_MODEL_CALLS = 75;
export const RECOVERY_TOKEN_RESERVATION = 600000;
const need = (value, code) => assert.ok(value, `unexposed-runner.${code}`);
const zero = () => ({prompt_tokens: 0, completion_tokens: 0, total_tokens: 0});
const validUsage = (usage) => Number.isSafeInteger(usage?.prompt_tokens) && usage.prompt_tokens >= 0 && Number.isSafeInteger(usage?.completion_tokens) && usage.completion_tokens >= 0 && usage.total_tokens === usage.prompt_tokens + usage.completion_tokens;
const capacity = (receipt) => [429, 503].includes(receipt?.status) || ["1302", "1305"].includes(String(receipt?.error_code ?? receipt?.provider_code));
const clone = (value) => structuredClone(value);

function validateFrozenQualification(qualification) {
  need(qualification?.admitted === true && qualification.status === "tokenizer-planned-not-frozen", "admitted-qualification");
  need(qualification.plan_sha256 === PLANNING_PLAN_SHA256, "planning-plan-identity");
  const material = clone(qualification); delete material.plan_sha256;
  need(sha(material) === qualification.plan_sha256, "planning-plan-drift");
  need(qualification.selection_sha256 === SELECTION_SHA256 && qualification.cohort_sha256 === COHORT_SHA256 && qualification.source_manifest_sha256 === SOURCE_MANIFEST_SHA256, "planning-source-binding");
  need(qualification.generation_calls === PLANNED_GENERATION_CALLS && qualification.generation_reservation === GENERATION_TOKEN_RESERVATION, "planning-budget-binding");
  need(qualification.planned_pairs === 4 && qualification.planned_answer_slots === 8 && qualification.maximum_pair_concurrency === 2 && qualification.model_generation_calls === 0, "planning-shape");
}

/** Reconstruct the exact generation schedule from source-only rows and the immutable live plan. */
export function generationPlan(rows, qualification) {
  validateFrozenQualification(qualification);
  need(Array.isArray(rows) && rows.length === 4 && rows.every((row, index) => row.question_id === IDS[index]), "fixed-source-order");
  need(qualification.tasks?.length === 4, "fixed-qualified-tasks");
  const pairs = rows.map((row, index) => {
    const task = qualification.tasks[index], archive = flattenHistory(row), ingestion = task.ingestion, projection = task.treatment;
    need(task.question_id === row.question_id && task.original_history?.long === true && task.original_history.input_tokens > 8000, "qualified-long-identity");
    need(ingestion?.admitted && ingestion.coverage_complete && ingestion.chunk_count === ingestion.chunks?.length && ingestion.chunk_count > 0 && ingestion.chunks.every((chunk) => Array.isArray(chunk) && chunk.length), "qualified-chunks");
    need(sha(ingestion.chunks.flat()) === sha(archive) && ingestion.archive_sha256 === sha(archive), "complete-original-source-coverage");
    need(projection?.admission?.admitted && projection.archive_sha256 === sha(archive) && sha(projection.units) === projection.projection_sha256, "qualified-projection");
    const selected = new Set(projection.units.map((unit) => unit.source_id));
    need(selected.size === projection.units.length && sha(archive.filter((unit) => selected.has(unit.source_id))) === sha(projection.units), "whole-turn-projection");
    need(sha(answerMessages(row, {arm: "treatment", projection})) === sha(projection.admission.request.messages), "qualified-answer-wire");
    const order = index % 2 ? ["treatment", "control"] : ["control", "treatment"];
    need(sha(task.order) === sha(order), "qualified-counterbalance");
    const token_budget = 8000 * ingestion.chunk_count + 16000;
    need(task.generation_reservation === token_budget && ingestion.reservation_tokens === 8000 * ingestion.chunk_count, "qualified-generation-budget");
    const pair = {question_id: row.question_id, index, order, token_budget, row: clone(row), chunks: clone(ingestion.chunks), projection: clone(projection), archive_sha256: sha(archive)};
    return {...pair, pair_sha256: sha(pair)};
  });
  const token_budget = pairs.reduce((total, pair) => total + pair.token_budget, 0), planned_model_calls = pairs.reduce((total, pair) => total + pair.chunks.length + 2, 0);
  need(qualification.generation_reservation === token_budget && token_budget === GENERATION_TOKEN_RESERVATION, "qualified-branch-budget");
  need(planned_model_calls === PLANNED_GENERATION_CALLS, "qualified-call-count");
  return {schema: "are.longmemeval-unexposed-generation-plan/v1", qualification_sha256: sha(qualification), planning_plan_sha256: qualification.plan_sha256, selection_sha256: SELECTION_SHA256, cohort_sha256: COHORT_SHA256, source_manifest_sha256: SOURCE_MANIFEST_SHA256, pairs, token_budget, planned_answer_slots: 8, maximum_pair_concurrency: 2, planned_model_calls};
}

function checkPair(pair) {
  const {pair_sha256, ...body} = pair;
  need(IDS[pair.index] === pair.question_id && sha(body) === pair_sha256, "pair-drift");
  need(sha(pair.chunks.flat()) === sha(flattenHistory(pair.row)), "pair-coverage");
}

/** Run one counterbalanced pair sequentially. Every actual wire is freshly tokenized. */
export async function runPair({pair, meter, generate, record, health, signal}) {
  checkPair(pair); need(typeof meter === "function" && typeof generate === "function" && typeof record === "function" && health, "explicit-effects");
  const usage = zero(), calls = [], answers = []; let held_tokens = 0, reserved_tokens = 0, persistence_failure = false;
  const stop = (reason) => { health.stopped = true; health.reason ??= reason; };
  const journal = async (value) => { try { await record(clone(value)); } catch (error) { persistence_failure = true; stop("journal-failure"); throw error; } };
  const blocked = (id, arm, phase, reason) => { const call = {id, arm, phase, status: "blocked", reason, usage: zero(), model_started: false}; calls.push(call); return call; };
  const call = async (id, arm, phase, messages, output_cap) => {
    if (health.stopped || signal?.aborted) return blocked(id, arm, phase, health.reason ?? "aborted");
    const reservation_tokens = 8000, entry = {id, arm, phase, status: "started", messages: clone(messages), messages_sha256: sha(messages), reservation_tokens, model_started: false}; calls.push(entry);
    let receipt;
    try {
      entry.admission = await admitActualWire(messages, output_cap, meter); need(entry.admission.admitted, "actual-wire-over-budget");
      if (health.stopped || signal?.aborted) { Object.assign(entry, {status: "blocked", reason: health.reason ?? "aborted", usage: zero()}); return entry; }
      need(reserved_tokens + reservation_tokens <= pair.token_budget && health.reserved_tokens + reservation_tokens <= health.token_budget, "generation-reservation");
      await journal({kind: "call-start", pair_sha256: pair.pair_sha256, ...entry});
      if (health.stopped || signal?.aborted) { Object.assign(entry, {status: "blocked", reason: health.reason ?? "aborted", usage: zero()}); return entry; }
      need(health.reserved_tokens + reservation_tokens <= health.token_budget, "shared-generation-reservation");
      reserved_tokens += reservation_tokens; health.reserved_tokens += reservation_tokens; entry.model_started = true;
      receipt = await generate({id, request: clone(entry.admission.request), signal}); entry.receipt = clone(receipt);
      need(validUsage(receipt?.usage), "model-usage-unknown"); entry.usage = clone(receipt.usage);
      for (const [detail, maximum] of [[receipt.usage.completion_tokens_details?.reasoning_tokens, receipt.usage.completion_tokens], [receipt.usage.prompt_tokens_details?.cached_tokens, receipt.usage.prompt_tokens]]) need(detail === undefined || (Number.isSafeInteger(detail) && detail >= 0 && detail <= maximum), "usage-detail-inconsistent");
      need(receipt.request_sha256 === entry.admission.wire_sha256, "model-request-binding");
      need(receipt.status === 200 && receipt.ok !== false && receipt.finish_reason === "stop" && typeof receipt.output === "string" && receipt.output.trim().length > 0, "model-incomplete");
      need(receipt.usage.prompt_tokens <= 8000 - output_cap && receipt.usage.completion_tokens <= output_cap && receipt.usage.total_tokens <= reservation_tokens, "actual-usage-over-reservation");
      need(!receipt.persistence_failure, "provider-persistence");
      entry.status = "completed"; entry.text = receipt.output; entry.text_sha256 = sha(receipt.output);
    } catch (error) {
      receipt = receipt ?? error.receipt; entry.receipt = receipt ? clone(receipt) : null;
      const observed = receipt?.usage ?? error.usage;
      if (entry.model_started && error.model_started === false) {
        const positive = [receipt?.usage, error.usage].some((item) => item && ["prompt_tokens", "completion_tokens", "total_tokens"].some((key) => typeof item[key] === "number" && item[key] > 0)) || receipt?.dispatched === true || receipt?.status !== undefined;
        if (error.dispatch_proof === "not-dispatched" && !positive) entry.model_started = false; else stop("contradictory-or-unproven-dispatch-claim");
      }
      if (!entry.model_started) entry.usage = zero(); else if (!entry.usage && validUsage(observed)) entry.usage = clone(observed);
      if (entry.model_started && !validUsage(entry.usage)) { entry.usage = null; entry.unknown_usage = true; held_tokens += reservation_tokens; stop("unknown-model-usage"); }
      entry.status = "failed"; entry.reason = String(error.message); entry.provider_status = receipt?.status ?? null; entry.provider_error_code = receipt?.error_code ?? receipt?.provider_code ?? null;
      if (capacity(receipt)) stop("provider-capacity");
      if (receipt?.persistence_failure) { persistence_failure = true; stop("provider-persistence"); }
      if (entry.admission && !entry.admission.admitted) entry.reason = "actual-wire-over-budget";
      if (validUsage(entry.usage) && (entry.usage.prompt_tokens > 8000 - output_cap || entry.usage.completion_tokens > output_cap || entry.usage.total_tokens > reservation_tokens)) stop("provider-usage-over-reservation");
      if (entry.model_started && receipt?.request_sha256 !== entry.admission?.wire_sha256) stop("model-request-binding");
      if (entry.reason.includes("usage-detail-inconsistent")) stop("provider-usage-detail");
    }
    if (validUsage(entry.usage)) for (const key of Object.keys(usage)) usage[key] += entry.usage[key];
    try { await journal({kind: "call-result", pair_sha256: pair.pair_sha256, ...entry}); } catch (error) { entry.status = "failed"; entry.reason ??= String(error.message); }
    return entry;
  };
  for (const arm of pair.order) {
    let notes = "", dependencyFailure = null;
    if (arm === "control") for (const [index, chunk] of pair.chunks.entries()) {
      const id = `${pair.question_id}-control-ingest-${index}`;
      const result = dependencyFailure ? blocked(id, arm, "ingestion", dependencyFailure) : await call(id, arm, "ingestion", ingestionMessages(chunk, "control", notes), 768);
      if (result.status === "completed") notes = result.text; else dependencyFailure ??= "prior-ingestion-failed";
    }
    const id = `${pair.question_id}-${arm}-answer`;
    const result = dependencyFailure ? blocked(id, arm, "answer", dependencyFailure) : await call(id, arm, "answer", answerMessages(pair.row, {arm, notes, projection: pair.projection}), 1024);
    answers.push({arm, status: result.status, text: result.status === "completed" ? result.text : null, answer_sha256: result.status === "completed" ? result.text_sha256 : null, reason: result.reason ?? null});
  }
  const result = {schema: "are.longmemeval-unexposed-pair-result/v1", question_id: pair.question_id, pair_sha256: pair.pair_sha256, archive_sha256: pair.archive_sha256, projection_sha256: pair.projection.projection_sha256, status: answers.every((answer) => answer.status === "completed") ? "completed" : "failed", planned_answer_slots: 2, answers, calls, usage, held_tokens, reserved_tokens, token_budget: pair.token_budget, unknown_usage: calls.some((item) => item.unknown_usage), persistence_failure};
  try { await journal({kind: "pair-result", result}); } catch (error) { result.status = "failed"; result.persistence_failure = true; throw Object.assign(Error("pair-result-persistence-failure"), {cause: error, result, ...(!result.unknown_usage ? {usage: clone(usage)} : {})}); }
  return result;
}

/** Exactly two workers; each pair remains sequential and no retry path exists. */
export async function runGeneration({plan, meter, generate, record, tokenizer_limits, signal, health_state}) {
  need(plan?.schema === "are.longmemeval-unexposed-generation-plan/v1" && plan.pairs?.length === 4 && plan.pairs.every((pair, index) => pair.question_id === IDS[index] && pair.index === index), "fixed-plan");
  plan.pairs.forEach(checkPair); need(plan.planned_model_calls === PLANNED_GENERATION_CALLS && plan.token_budget === GENERATION_TOKEN_RESERVATION && plan.token_budget === plan.pairs.reduce((total, pair) => total + pair.token_budget, 0), "branch-budget");
  need(tokenizer_limits && Number.isSafeInteger(tokenizer_limits.max_calls) && tokenizer_limits.max_calls >= 1 && Number.isSafeInteger(tokenizer_limits.timeout_ms) && tokenizer_limits.timeout_ms > 0, "explicit-tokenizer-limits");
  const deadline = performance.now() + tokenizer_limits.timeout_ms; let meterCalls = 0, tail = Promise.resolve();
  const health = health_state ?? {stopped: false, reason: null, reserved_tokens: 0, token_budget: plan.token_budget};
  need(health.stopped === false && health.reserved_tokens === 0 && health.token_budget === plan.token_budget, "initial-shared-health");
  const sharedMeter = (request) => {
    const invoke = async () => { try {
      need(!health.stopped && !signal?.aborted, "shared-health-stop"); need(meterCalls < tokenizer_limits.max_calls && performance.now() < deadline, "shared-tokenizer-budget"); meterCalls++;
      const cancellable = (wire, options) => meter(wire, {signal: signal ? AbortSignal.any([signal, options.signal]) : options.signal});
      return await createTokenizerSession(cancellable, {max_calls: 1, timeout_ms: Math.max(1, Math.ceil(deadline - performance.now()))})(request);
    } catch (error) { health.stopped = true; health.reason ??= "tokenizer-failure"; throw error; } };
    const pending = tail.then(invoke); tail = pending.catch(() => {}); return pending;
  };
  const results = Array(4); let cursor = 0;
  await Promise.all([0, 1].map(async () => { while (cursor < 4) { const index = cursor++; try { results[index] = await runPair({pair: plan.pairs[index], meter: sharedMeter, generate, record, health, signal}); } catch (error) { need(error.result, "unaccounted-pair-exception"); results[index] = error.result; health.stopped = true; health.reason ??= "pair-persistence"; } } }));
  const usage = zero(); for (const result of results) for (const key of Object.keys(usage)) usage[key] += result.usage[key];
  const result = {schema: "are.longmemeval-unexposed-generation-result/v1", status: results.every((item) => item.status === "completed") ? "completed" : "failed", qualification_sha256: plan.qualification_sha256, planning_plan_sha256: plan.planning_plan_sha256, selection_sha256: plan.selection_sha256, cohort_sha256: plan.cohort_sha256, source_manifest_sha256: plan.source_manifest_sha256, planned_pairs: 4, planned_answer_slots: 8, maximum_pair_concurrency: 2, results, usage, unknown_usage: results.some((item) => item.unknown_usage), held_tokens: results.reduce((total, item) => total + item.held_tokens, 0), reserved_tokens: health.reserved_tokens, token_budget: plan.token_budget, tokenizer_calls: meterCalls, health_stop: health.reason, model_generation_calls: results.reduce((total, item) => total + item.calls.filter((call) => call.model_started).length, 0), campaign_goal_achieved: false};
  try { await record({kind: "generation-result", result: clone(result)}); } catch (error) { result.status = "failed"; result.persistence_failure = true; throw Object.assign(Error("generation-result-persistence-failure"), {cause: error, result, ...(!result.unknown_usage ? {usage: clone(usage)} : {})}); }
  return result;
}

/**
 * Prospectively recover only the two incomplete pairs from a sealed predecessor.
 * Completed predecessor pairs are copied whole; partial pairs are never spliced.
 */
export async function runRecoveryComposite({plan, predecessor, meter, generate, record, signal, forbidden_request_sha256 = []}) {
  need(plan?.schema === "are.longmemeval-unexposed-generation-plan/v1" && plan.pairs?.length === 4, "recovery-fixed-plan");
  plan.pairs.forEach(checkPair);
  need(predecessor?.schema === "are.longmemeval-unexposed-generation-result/v1" && predecessor.status === "failed", "recovery-failed-predecessor");
  need(predecessor.planning_plan_sha256 === plan.planning_plan_sha256 && predecessor.selection_sha256 === plan.selection_sha256 && predecessor.cohort_sha256 === plan.cohort_sha256 && predecessor.source_manifest_sha256 === plan.source_manifest_sha256, "recovery-predecessor-binding");
  need(Array.isArray(predecessor.results) && predecessor.results.length === 4, "recovery-predecessor-shape");
  for (let index = 0; index < 4; index++) need(predecessor.results[index]?.question_id === plan.pairs[index].question_id && predecessor.results[index]?.pair_sha256 === plan.pairs[index].pair_sha256, "recovery-pair-binding");
  need(predecessor.results[0].status === "completed" && predecessor.results[1].status === "completed" && predecessor.results[2].status === "failed" && predecessor.results[3].status === "failed", "recovery-eligible-pairs");
  need(plan.pairs[2].token_budget + plan.pairs[3].token_budget === RECOVERY_TOKEN_RESERVATION, "recovery-token-budget");
  need(plan.pairs[2].chunks.length + plan.pairs[3].chunks.length + 4 === RECOVERY_MODEL_CALLS, "recovery-call-budget");
  need(Array.isArray(forbidden_request_sha256) && forbidden_request_sha256.length === 2 && forbidden_request_sha256.every((value) => /^[a-f0-9]{64}$/.test(value)), "recovery-forbidden-digests");
  const forbidden = new Set(forbidden_request_sha256);
  const health = {stopped: false, reason: null, reserved_tokens: 0, token_budget: RECOVERY_TOKEN_RESERVATION};
  let tokenizerCalls = 0;
  const boundedMeter = async (request) => {
    need(!health.stopped && !signal?.aborted && tokenizerCalls < RECOVERY_MODEL_CALLS, "recovery-tokenizer-budget");
    tokenizerCalls++;
    try { return await meter(request, {signal}); }
    catch (error) { health.stopped = true; health.reason ??= "tokenizer-failure"; throw error; }
  };
  const guardedGenerate = ({id, request, signal: callSignal}) => {
    const requestDigest = sha(request);
    if (forbidden.has(requestDigest)) {
      health.stopped = true; health.reason ??= "indeterminate-request-replay-denied";
      throw Object.assign(Error("unexposed-runner.recovery-indeterminate-request-replay"), {model_started: false, dispatch_proof: "not-dispatched"});
    }
    return generate({id: `recovery-r1-${id}`, request, signal: callSignal});
  };
  const recovered = new Map();
  for (const index of [3, 2]) {
    let result;
    try { result = await runPair({pair: plan.pairs[index], meter: boundedMeter, generate: guardedGenerate, record, health, signal}); }
    catch (error) { need(error.result, "recovery-unaccounted-pair-exception"); result = error.result; health.stopped = true; health.reason ??= "pair-persistence"; }
    recovered.set(index, result);
  }
  const results = [clone(predecessor.results[0]), clone(predecessor.results[1]), recovered.get(2), recovered.get(3)];
  const recoveryUsage = zero(); for (const result of recovered.values()) for (const key of Object.keys(recoveryUsage)) recoveryUsage[key] += result.usage[key];
  const result = {schema: "are.longmemeval-unexposed-recovery-composite-result/v1", status: results.every((item) => item.status === "completed") ? "completed" : "failed", qualification_sha256: plan.qualification_sha256, planning_plan_sha256: plan.planning_plan_sha256, selection_sha256: plan.selection_sha256, cohort_sha256: plan.cohort_sha256, source_manifest_sha256: plan.source_manifest_sha256, predecessor_preserved_pair_indexes: [0, 1], recovery_execution_order: [3, 2], planned_pairs: 4, planned_answer_slots: 8, maximum_recovery_pair_concurrency: 1, results, recovery_usage: recoveryUsage, recovery_unknown_usage: [...recovered.values()].some((item) => item.unknown_usage), recovery_held_tokens: [...recovered.values()].reduce((total, item) => total + item.held_tokens, 0), recovery_reserved_tokens: health.reserved_tokens, recovery_token_budget: RECOVERY_TOKEN_RESERVATION, recovery_tokenizer_calls: tokenizerCalls, recovery_model_generation_calls: [...recovered.values()].reduce((total, item) => total + item.calls.filter((call) => call.model_started).length, 0), health_stop: health.reason, forbidden_request_sha256: [...forbidden].sort(), campaign_goal_achieved: false};
  try { await record({kind: "recovery-composite-result", result: clone(result)}); } catch (error) { result.status = "failed"; result.persistence_failure = true; throw Object.assign(Error("recovery-composite-persistence-failure"), {cause: error, result}); }
  return result;
}
