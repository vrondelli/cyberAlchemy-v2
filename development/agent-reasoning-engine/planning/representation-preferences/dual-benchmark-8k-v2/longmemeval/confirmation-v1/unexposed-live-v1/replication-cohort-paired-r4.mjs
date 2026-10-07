// Frozen 80-question matched replication. No evaluator/reference access in this process.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {admission, answerMessages, flattenHistory, ingestionMessages, loadCohort, planIngestion, project, sha} from "./replication-cohort-adapter-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";

const [sourcePath, outputPath, expectedManifestSha256] = process.argv.slice(2);
assert.ok(sourcePath && outputPath && /^[a-f0-9]{64}$/.test(expectedManifestSha256), "usage: replication-cohort-paired-v1.mjs SOURCE_DIR NEW_OUTPUT_DIR MANIFEST_SHA256");
const {rows, manifest_file_sha256} = loadCohort(sourcePath);
assert.equal(manifest_file_sha256, expectedManifestSha256);
const output = resolve(outputPath), started = performance.now();
mkdirSync(output, {recursive: false, mode: 0o700});
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const save = (dir, name, value) => writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
save(output, "RUN.json", {schema_version: "are.longmemeval-product-replication-paired-run/v2", hypothesis: "5K ranked whole-turn retrieval improves correctness and reduces all-in tokens and elapsed time versus sequential retained-note ingestion",
  source_manifest_file_sha256: manifest_file_sha256, question_ids: rows.map(row => row.question_id), projection_characters: 5000,
  attempted_question_ids: rows.map(row => row.question_id),
  provider_refusal_policy: "numeric-code-1301-terminal-both-arms-incorrect; other-errors-fail-fast",
  arm_order: rows.map((row, index) => ({question_id: row.question_id, order: index % 2 ? ["treatment", "control"] : ["control", "treatment"]})),
  maximum_workers: 2, maximum_model_calls_per_task: 96, context_window: 8000, maximum_output_tokens: {ingestion: 768, answer: 1024},
  model: "glm-5.3-flash", retries: 0, evaluator_reference_access: false, script_sha256: digest(readFileSync(import.meta.filename)),
  started_at: new Date().toISOString(), claim_ceiling: "Prospective 80-question generation only; separate reference-bound native scoring required"});

function splitOne(row, sourceId) {
  const match = /^s(\d+)-m(\d+)$/.exec(sourceId);
  assert.ok(match, "invalid-unfit-source-id");
  const session = row.haystack_sessions[Number(match[1])], index = Number(match[2]);
  assert.ok(session && session[index], "unfit-source-missing");
  const original = session[index], points = Array.from(original.content);
  assert.ok(points.length > 1, "unfit-single-codepoint");
  const middle = Math.floor(points.length / 2), left = points.slice(0, middle).join(""), right = points.slice(middle).join("");
  assert.equal(left + right, original.content);
  session.splice(index, 1, {...original, content: left}, {...original, content: right});
  return {source_id: sourceId, original_codepoints: points.length, left_codepoints: middle, right_codepoints: points.length - middle};
}

async function planControl(row, meter) {
  const effective = structuredClone(row), splits = [];
  for (let attempt = 0; attempt <= 8; attempt++) {
    const plan = await planIngestion(effective, meter, {proposal_characters: 16000});
    if (plan.admitted) {
      assert.equal(plan.coverage_complete, true);
      assert.equal(sha(plan.chunks.flat()), sha(flattenHistory(effective)));
      return {effective, plan, splits};
    }
    assert.ok(attempt < 8 && plan.reason === "unfit-whole-turn" && plan.unfit_source_id, "control-source-cannot-fit");
    splits.push(splitOne(effective, plan.unfit_source_id));
  }
  throw Error("control-source-cannot-fit");
}

let cursor = 0, failureSeen = false;
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
        usage: receipt?.usage ?? null, http_status: receipt?.status ?? null, provider_error_code: receipt?.provider_error_code ?? null,
        response_sha256: receipt?.response_sha256 ?? null, reason: String(error?.message ?? error)});
      throw error;
    }
  };
  try {
    const planningStart = performance.now();
    const original = flattenHistory(row), {effective, plan: ingestion, splits} = await planControl(row, meter);
    const projection = project(row, 5000);
    assert.ok(ingestion.chunk_count > 0 && ingestion.chunk_count + 2 <= 96);
    save(dir, "PLAN.json", {question_id: row.question_id, source_row_sha256: sha(row), history_units: original.length, effective_archive_sha256: sha(flattenHistory(effective)), lossless_control_splits: splits,
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
      model_calls, known_tokens, unknown_usage: false, retries: 0, source_row_sha256: sha(row), control_splits: splits};
    save(dir, "RESULT.json", result);
    console.log(JSON.stringify({index, question_id: row.question_id, status: "completed", calls: model_calls, tokens: known_tokens,
      control_ms: armElapsed.control, treatment_ms: armElapsed.treatment}));
    return result;
  } catch (error) {
    const receipt = error?.receipt;
    const refusal = receipt?.failure_code === "provider-http-error" && receipt?.provider_error_code === "1301"
      && Number.isInteger(receipt?.http_status ?? receipt?.status) && /^[a-f0-9]{64}$/.test(receipt?.response_sha256 ?? "")
      && receipt?.persistence_failure !== true && !unknown_usage
      && (receipt.kind === "tokenizer" || (receipt.kind === "model" && Number.isSafeInteger(receipt?.usage?.total_tokens)));
    const result = {question_id: row.question_id, status: refusal ? "provider-refused" : "failed", calls, answers,
      arm_elapsed_ms: armElapsed, model_calls, known_tokens, unknown_usage, retries: 0,
      refusal: refusal ? {kind: receipt.kind, http_status: receipt.http_status ?? receipt.status,
        provider_error_code: "1301", response_sha256: receipt.response_sha256,
        request_sha256: receipt.request_sha256 ?? receipt.wire_sha256, source: "provider-receipt"} : null,
      reason: String(error?.message ?? error)};
    save(dir, "RESULT.json", result);
    console.log(JSON.stringify({index, question_id: row.question_id, status: result.status, calls: model_calls, known_tokens, unknown_usage}));
    return result;
  } finally {
    await Promise.allSettled([meter.settle(), generate.settle()]);
  }
}
await Promise.all([0, 1].map(async () => {
  while (cursor < rows.length && !failureSeen) {
    const index = cursor++;
    results[index] = await runTask(index);
    if (results[index].status === "failed") failureSeen = true;
  }
}));
const terminal = {schema_version: "are.longmemeval-product-replication-paired-result/v2",
  status: results.every(row => ["completed", "provider-refused"].includes(row?.status)) ? "completed" : "failed",
  question_ids: rows.map(row => row.question_id), results: results.map((row, index) => row ?? {question_id: rows[index].question_id, status: "not-started"}),
  assignments: results.filter(Boolean).length, completed: results.filter(row => row?.status === "completed").length,
  provider_refused: results.filter(row => row?.status === "provider-refused").length,
  terminal_count: results.filter(row => ["completed", "provider-refused"].includes(row?.status)).length,
  model_calls: results.reduce((sum, row) => sum + (row?.model_calls ?? 0), 0),
  known_tokens: results.reduce((sum, row) => sum + (row?.known_tokens ?? 0), 0), unknown_usage: results.some(row => row?.unknown_usage),
  failure_count: results.filter(row => row?.status === "failed").length, campaign_wall_ms: Math.round(performance.now() - started), finished_at: new Date().toISOString(),
  evaluator_reference_access: false, claim_ceiling: "Prospective 80-question generation only; separate reference-bound native scoring required"};
save(output, "RESULT.json", terminal);
console.log(JSON.stringify({status: terminal.status, completed: terminal.completed, provider_refused: terminal.provider_refused, model_calls: terminal.model_calls,
  known_tokens: terminal.known_tokens, unknown_usage: terminal.unknown_usage, campaign_wall_ms: terminal.campaign_wall_ms}));
if (terminal.status !== "completed") process.exitCode = 1;
