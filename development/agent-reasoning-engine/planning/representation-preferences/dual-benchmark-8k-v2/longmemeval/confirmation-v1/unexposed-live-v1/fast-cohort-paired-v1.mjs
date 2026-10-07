// Fresh matched 16-task generation. No evaluator/reference access in this process.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {admission, answerMessages, flattenHistory, ingestionMessages, loadCohort, planIngestion, project, sha} from "./fast-cohort-adapter-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";

const [sourcePath, outputPath] = process.argv.slice(2);
assert.ok(sourcePath && outputPath, "usage: fast-cohort-paired-v1.mjs SOURCE_DIR NEW_OUTPUT_DIR");
const {rows, manifest_file_sha256} = loadCohort(sourcePath);
assert.equal(manifest_file_sha256, "f9346cc4487ecc6df1389d0548472d68389635ad344fbf266a1cd043317b390f");
const output = resolve(outputPath), started = performance.now();
mkdirSync(output, {recursive: false, mode: 0o700});
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const save = (dir, name, value) => writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
save(output, "RUN.json", {schema_version: "are.longmemeval-fast-cohort-paired-run/v1", hypothesis: "5K ranked whole-turn retrieval improves correctness and reduces all-in tokens and elapsed time versus sequential retained-note ingestion",
  source_manifest_file_sha256: manifest_file_sha256, question_ids: rows.map(row => row.question_id), projection_characters: 5000,
  arm_order: rows.map((row, index) => ({question_id: row.question_id, order: index % 2 ? ["treatment", "control"] : ["control", "treatment"]})),
  maximum_workers: 2, maximum_model_calls_per_task: 96, context_window: 8000, maximum_output_tokens: {ingestion: 768, answer: 1024},
  model: "glm-5.3-flash", retries: 0, evaluator_reference_access: false, script_sha256: digest(readFileSync(import.meta.filename)),
  started_at: new Date().toISOString(), claim_ceiling: "Prospective generation only; separate native rubric scoring required"});

let cursor = 0, stopped = false, stopReason = null;
const results = Array(rows.length);
async function runTask(index) {
  const row = rows[index], dir = join(output, `task-${String(index).padStart(2, "0")}-${row.question_id}`);
  mkdirSync(dir, {mode: 0o700});
  let event = 0, unknown_usage = false, model_calls = 0, known_tokens = 0;
  const record = async value => save(dir, `event-${String(++event).padStart(4, "0")}.json`, value);
  const {meter, generate} = createGatewayProviders({record, maximum_calls: 96});
  const calls = [], answers = [], armElapsed = {};
  const call = async (id, arm, phase, messages, cap) => {
    const admitted = await admission(messages, cap, meter);
    assert.equal(admitted.admitted, true, `${id}:actual-wire-over-8k`);
    const began = performance.now(); let receipt;
    try {
      receipt = await generate({id, request: admitted.request});
      assert.equal(receipt.request_sha256, admitted.wire_sha256);
      assert.equal(receipt.status, 200); assert.equal(receipt.ok, true); assert.equal(receipt.finish_reason, "stop");
      assert.ok(typeof receipt.output === "string" && receipt.output.trim());
      assert.ok(Number.isSafeInteger(receipt.usage?.total_tokens) && receipt.usage.total_tokens === receipt.usage.prompt_tokens + receipt.usage.completion_tokens);
      assert.ok(receipt.usage.prompt_tokens <= 8000 - cap && receipt.usage.completion_tokens <= cap && receipt.usage.total_tokens <= 8000);
      const item = {id, arm, phase, request_sha256: admitted.wire_sha256, input_tokens: admitted.input_tokens,
        output_sha256: sha(receipt.output), usage: receipt.usage, model_elapsed_ms: Math.round(performance.now() - began), status: "completed"};
      calls.push(item); model_calls++; known_tokens += receipt.usage.total_tokens;
      return receipt.output;
    } catch (error) {
      receipt = receipt ?? error.receipt;
      if (receipt?.dispatched) {
        model_calls++;
        if (Number.isSafeInteger(receipt.usage?.total_tokens)) known_tokens += receipt.usage.total_tokens;
        else unknown_usage = true;
      }
      calls.push({id, arm, phase, request_sha256: admitted.wire_sha256, status: "failed", model_started: receipt?.dispatched === true,
        usage: receipt?.usage ?? null, reason: String(error?.message ?? error)});
      throw error;
    }
  };
  try {
    const planningStart = performance.now();
    const original = flattenHistory(row), ingestion = await planIngestion(row, meter, {proposal_characters: 16000});
    assert.equal(ingestion.admitted, true); assert.equal(ingestion.coverage_complete, true);
    assert.equal(sha(ingestion.chunks.flat()), sha(original));
    const projection = project(row, 5000);
    assert.ok(ingestion.chunk_count > 0 && ingestion.chunk_count + 2 <= 96);
    save(dir, "PLAN.json", {question_id: row.question_id, source_row_sha256: sha(row), history_units: original.length,
      archive_sha256: sha(original), control_chunks: ingestion.chunk_count, chunk_sha256: ingestion.chunks.map(chunk => sha(chunk)),
      treatment_selected_units: projection.units.length, projection_sha256: projection.projection_sha256,
      planned_model_calls: ingestion.chunk_count + 2, planning_elapsed_ms: Math.round(performance.now() - planningStart),
      evaluator_reference_access: false});
    const order = index % 2 ? ["treatment", "control"] : ["control", "treatment"];
    for (const arm of order) {
      const armStart = performance.now(); let notes = "";
      if (arm === "control") for (const [chunkIndex, chunk] of ingestion.chunks.entries()) {
        notes = await call(`${row.question_id}-control-ingest-${chunkIndex}`, arm, "ingestion", ingestionMessages(chunk, arm, notes), 768);
      }
      const text = await call(`${row.question_id}-${arm}-answer`, arm, "answer",
        answerMessages(row, {arm, notes, projection}), 1024);
      armElapsed[arm] = Math.round(performance.now() - armStart);
      answers.push({arm, text, answer_sha256: sha(text)});
    }
    const result = {question_id: row.question_id, status: "completed", order, answers, calls, arm_elapsed_ms: armElapsed,
      model_calls, known_tokens, unknown_usage: false, retries: 0, source_row_sha256: sha(row)};
    save(dir, "RESULT.json", result);
    console.log(JSON.stringify({index, question_id: row.question_id, status: "completed", calls: model_calls, tokens: known_tokens,
      control_ms: armElapsed.control, treatment_ms: armElapsed.treatment}));
    return result;
  } catch (error) {
    stopped = true; stopReason ??= `${row.question_id}:${String(error?.message ?? error)}`;
    const result = {question_id: row.question_id, status: "failed", calls, answers, arm_elapsed_ms: armElapsed, model_calls,
      known_tokens, unknown_usage, retries: 0, reason: String(error?.message ?? error)};
    save(dir, "RESULT.json", result);
    console.log(JSON.stringify({index, question_id: row.question_id, status: "failed", calls: model_calls, known_tokens, unknown_usage}));
    return result;
  } finally {
    await Promise.allSettled([meter.settle(), generate.settle()]);
  }
}
await Promise.all([0, 1].map(async () => {
  while (!stopped && cursor < rows.length) {
    const index = cursor++;
    results[index] = await runTask(index);
  }
}));
const terminal = {schema_version: "are.longmemeval-fast-cohort-paired-result/v1", status: results.every(row => row?.status === "completed") ? "completed" : "failed",
  question_ids: rows.map(row => row.question_id), results: results.map((row, index) => row ?? {question_id: rows[index].question_id, status: "not-started"}),
  assignments: rows.length, completed: results.filter(row => row?.status === "completed").length, model_calls: results.reduce((sum, row) => sum + (row?.model_calls ?? 0), 0),
  known_tokens: results.reduce((sum, row) => sum + (row?.known_tokens ?? 0), 0), unknown_usage: results.some(row => row?.unknown_usage),
  stop_reason: stopReason, campaign_wall_ms: Math.round(performance.now() - started), finished_at: new Date().toISOString(),
  evaluator_reference_access: false, claim_ceiling: "Prospective generation only; separate native rubric scoring required"};
save(output, "RESULT.json", terminal);
console.log(JSON.stringify({status: terminal.status, completed: terminal.completed, model_calls: terminal.model_calls,
  known_tokens: terminal.known_tokens, unknown_usage: terminal.unknown_usage, campaign_wall_ms: terminal.campaign_wall_ms}));
