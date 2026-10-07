import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {IDS, sha, wire, ingestionMessages, answerMessages} from "./adapter-unexposed-v1.mjs";
import {generationPlan, runGeneration, runPair, runRecoveryComposite, PLANNED_GENERATION_CALLS, GENERATION_TOKEN_RESERVATION, RECOVERY_MODEL_CALLS, RECOVERY_TOKEN_RESERVATION} from "./runner-unexposed-v1.mjs";

const root = resolve(import.meta.dirname, "../../../../../../../..");
const planPath = resolve(root, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/longmemeval-unexposed-planning-v1/PLAN.json");
const frozen = () => JSON.parse(readFileSync(planPath));
const LEGACY_IDS = ["09ba9854_abs", "06db6396", "cc06de0d", "54026fce"];

// Generation uses no question_type semantics. The immutable plan contains the complete
// ordered archive and exact query wire, allowing a provider-free local reconstruction.
function rowsFromFrozen(plan) {
  return plan.tasks.map((task) => {
    const units = task.ingestion.chunks.flat(), sessions = [], dates = [];
    for (const unit of units) {
      const match = /^s(\d+)-m(\d+)$/.exec(unit.source_id); assert.ok(match, unit.source_id);
      const session = Number(match[1]), message = Number(match[2]);
      sessions[session] ??= []; dates[session] ??= unit.date;
      assert.equal(dates[session], unit.date); assert.equal(sessions[session].length, message);
      sessions[session].push({role: unit.role, content: unit.content});
    }
    assert.ok(sessions.every((session) => Array.isArray(session) && session.length));
    const query = JSON.parse(task.treatment.admission.request.messages.at(-1).content);
    return {question_id: task.question_id, question_type: "generation-only-bound-source", question: query.current_question, question_date: query.current_question_date, haystack_dates: dates, haystack_sessions: sessions};
  });
}

const meter = async (request) => ({input_tokens: 1000, wire_sha256: sha(request)});
const response = (request) => ({status: 200, ok: true, finish_reason: "stop", output: request.max_tokens === 768 ? "retained source notes" : "final answer", request_sha256: sha(request), usage: {prompt_tokens: 1000, completion_tokens: 20, total_tokens: 1020, completion_tokens_details: {reasoning_tokens: 10}}});

test("exact imported planning evidence reconstructs the fixed 152-call real-ID schedule", () => {
  const qualification = frozen(), rows = rowsFromFrozen(qualification), plan = generationPlan(rows, qualification);
  assert.equal(plan.planning_plan_sha256, "f0bdaf51c90f27553c1fc0fa85879a7e497eb05d72b1e441a30cf756f6f01abc");
  assert.deepEqual(plan.pairs.map((pair) => pair.question_id), IDS);
  assert.deepEqual(plan.pairs.map((pair) => pair.chunks.length), [37, 36, 35, 36]);
  assert.deepEqual(plan.pairs.map((pair) => pair.order), [["control", "treatment"], ["treatment", "control"], ["control", "treatment"], ["treatment", "control"]]);
  assert.equal(plan.planned_model_calls, PLANNED_GENERATION_CALLS); assert.equal(plan.planned_model_calls, 152);
  assert.equal(plan.token_budget, GENERATION_TOKEN_RESERVATION); assert.equal(plan.token_budget, 1216000);
  for (const legacy of LEGACY_IDS) assert.equal(JSON.stringify(plan).includes(legacy), false);
});

test("two workers preserve sequential pairs, fresh admission, accounting, and real structural IDs", async () => {
  const qualification = frozen(), plan = generationPlan(rowsFromFrozen(qualification), qualification), events = [];
  let active = 0, peak = 0, generated = 0, measured = 0; const activePairs = new Map();
  const result = await runGeneration({
    plan,
    meter: async (request) => { measured++; return meter(request); },
    generate: async ({id, request}) => { const questionId = IDS.find((candidate) => id.startsWith(`${candidate}-`)); assert.ok(questionId); assert.equal(activePairs.get(questionId) ?? 0, 0); activePairs.set(questionId, 1); generated++; active++; peak = Math.max(peak, active); await new Promise((resolvePromise) => setImmediate(resolvePromise)); active--; activePairs.set(questionId, 0); return response(request); },
    record: async (event) => events.push(event),
    tokenizer_limits: {max_calls: 152, timeout_ms: 30000}
  });
  assert.equal(result.status, "completed"); assert.equal(result.model_generation_calls, 152); assert.equal(result.tokenizer_calls, 152);
  assert.equal(generated, 152); assert.equal(measured, 152); assert.equal(peak, 2); assert.equal(result.reserved_tokens, 1216000);
  assert.deepEqual(result.results.map((pair) => pair.question_id), IDS); assert.equal(result.results.flatMap((pair) => pair.answers).length, 8);
  assert.ok(result.results.every((pair) => pair.calls.every((call, index, calls) => index === 0 || calls[index - 1].status === "completed")));
  for (const legacy of LEGACY_IDS) { assert.equal(JSON.stringify(result).includes(legacy), false); assert.equal(JSON.stringify(events).includes(legacy), false); }
});

test("plan/source/identity tampering and reduced runtime budget fail closed", async () => {
  const qualification = frozen(), rows = rowsFromFrozen(qualification);
  for (const mutate of [
    (value) => { value.plan_sha256 = "0".repeat(64); },
    (value) => { value.generation_calls--; },
    (value) => { value.tasks[0].ingestion.chunks[0].pop(); }
  ]) { const changed = structuredClone(qualification); mutate(changed); assert.throws(() => generationPlan(rows, changed)); }
  const wrongRows = structuredClone(rows); wrongRows[0].question_id = "09ba9854_abs"; assert.throws(() => generationPlan(wrongRows, qualification), /fixed-source-order/);
  const plan = generationPlan(rows, qualification), result = await runGeneration({plan, meter, generate: async ({request}) => response(request), record: async () => {}, tokenizer_limits: {max_calls: 1, timeout_ms: 30000}});
  assert.equal(result.status, "failed"); assert.equal(result.tokenizer_calls, 1); assert.equal(result.model_generation_calls, 0); assert.equal(result.health_stop, "tokenizer-failure");
  assert.equal(result.results.flatMap((pair) => pair.answers).length, 8);
});

test("unknown dispatched usage and journal failure preserve conservative evidence without retry", async () => {
  const qualification = frozen(), pair = generationPlan(rowsFromFrozen(qualification), qualification).pairs[0];
  const health = {stopped: false, reason: null, reserved_tokens: 0, token_budget: pair.token_budget}; let calls = 0;
  const unknown = await runPair({pair, meter, generate: async () => { calls++; throw Error("transport lost"); }, record: async () => {}, health});
  assert.equal(calls, 1); assert.equal(unknown.status, "failed"); assert.equal(unknown.unknown_usage, true); assert.equal(unknown.held_tokens, 8000); assert.equal(health.stopped, true);
  const secondHealth = {stopped: false, reason: null, reserved_tokens: 0, token_budget: pair.token_budget}; let generated = 0;
  const journal = await runPair({pair, meter, generate: async ({request}) => { generated++; return response(request); }, record: async (event) => { if (event.kind === "call-start") throw Error("disk"); }, health: secondHealth});
  assert.equal(generated, 0); assert.equal(journal.persistence_failure, true); assert.equal(journal.usage.total_tokens, 0);
});

test("failed-pair recovery preserves completed pairs and reruns whole pairs 3 then 2 serially", async () => {
  const qualification = frozen(), plan = generationPlan(rowsFromFrozen(qualification), qualification);
  const predecessor = await runGeneration({plan, meter, generate: async ({request}) => response(request), record: async () => {}, tokenizer_limits: {max_calls: 152, timeout_ms: 30000}});
  predecessor.status = "failed"; predecessor.results[2].status = "failed"; predecessor.results[3].status = "failed";
  const preserved = predecessor.results.slice(0, 2).map((value) => sha(value)), order = []; let active = 0, peak = 0;
  const result = await runRecoveryComposite({
    plan, predecessor, meter,
    generate: async ({id, request}) => { assert.match(id, /^recovery-r1-/); const index = IDS.findIndex((value) => id.includes(value)); if (order.at(-1) !== index) order.push(index); active++; peak = Math.max(peak, active); await new Promise((resolvePromise) => setImmediate(resolvePromise)); active--; return response(request); },
    record: async () => {}, forbidden_request_sha256: ["a".repeat(64), "b".repeat(64)]
  });
  assert.equal(result.status, "completed"); assert.deepEqual(order, [3, 2]); assert.equal(peak, 1);
  assert.equal(result.recovery_model_generation_calls, RECOVERY_MODEL_CALLS); assert.equal(result.recovery_tokenizer_calls, RECOVERY_MODEL_CALLS);
  assert.equal(result.recovery_reserved_tokens, RECOVERY_TOKEN_RESERVATION); assert.deepEqual(result.results.slice(0, 2).map((value) => sha(value)), preserved);
});

test("failed-pair recovery rejects an indeterminate request digest before dispatch", async () => {
  const qualification = frozen(), plan = generationPlan(rowsFromFrozen(qualification), qualification);
  const predecessor = await runGeneration({plan, meter, generate: async ({request}) => response(request), record: async () => {}, tokenizer_limits: {max_calls: 152, timeout_ms: 30000}});
  predecessor.status = "failed"; predecessor.results[2].status = "failed"; predecessor.results[3].status = "failed";
  const firstRequest = plan.pairs[3].order[0] === "control" ? ingestionMessages(plan.pairs[3].chunks[0], "control", "") : answerMessages(plan.pairs[3].row, {arm: "treatment", projection: plan.pairs[3].projection});
  const forbidden = sha(wire(firstRequest, plan.pairs[3].order[0] === "control" ? 768 : 1024)); let calls = 0;
  const result = await runRecoveryComposite({plan, predecessor, meter, generate: async ({request}) => { calls++; return response(request); }, record: async () => {}, forbidden_request_sha256: [forbidden, "c".repeat(64)]});
  assert.equal(calls, 0); assert.equal(result.status, "failed"); assert.equal(result.health_stop, "indeterminate-request-replay-denied"); assert.equal(result.recovery_unknown_usage, false);
});
