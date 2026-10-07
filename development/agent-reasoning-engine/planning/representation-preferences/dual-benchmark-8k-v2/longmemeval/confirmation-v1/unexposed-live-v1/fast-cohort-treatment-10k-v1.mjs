// Source-only 10K-character treatment comparator on the same 16 questions, before reference access.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {admission, answerMessages, loadCohort, project, sha} from "./fast-cohort-adapter-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";

const [sourcePath, outputPath] = process.argv.slice(2);
assert.ok(sourcePath && outputPath, "usage: fast-cohort-treatment-10k-v1.mjs SOURCE_DIR NEW_OUTPUT_DIR");
const {rows, manifest_file_sha256} = loadCohort(sourcePath);
assert.equal(manifest_file_sha256, "f9346cc4487ecc6df1389d0548472d68389635ad344fbf266a1cd043317b390f");
const output = resolve(outputPath), started = performance.now();
mkdirSync(output, {recursive: false, mode: 0o700});
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const save = (dir, name, value) => writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
save(output, "RUN.json", {schema_version: "are.longmemeval-fast-cohort-10k-run/v1", question_ids: rows.map(row => row.question_id),
  hypothesis: "The original 10K projection may recover accuracy lost by the cheaper 5K projection on a larger source-only cohort",
  projection_characters: 10000, context_window: 8000, model: "glm-5.3-flash", maximum_model_calls: 16,
  maximum_workers: 2, retries: 0, evaluator_reference_access: false, source_manifest_file_sha256: manifest_file_sha256,
  script_sha256: hash(readFileSync(import.meta.filename)), started_at: new Date().toISOString(),
  claim_ceiling: "Prospective treatment comparator; same fixed cohort, no reference access or standalone confirmation"});
let cursor = 0, stopped = false, stopReason = null;
const results = Array.from({length: 16}, () => null);
async function task(index) {
  const row = rows[index], dir = join(output, `task-${String(index).padStart(2, "0")}-${row.question_id}`);
  mkdirSync(dir, {mode: 0o700}); let event = 0;
  const record = async value => save(dir, `event-${String(++event).padStart(4, "0")}.json`, value);
  const {meter, generate} = createGatewayProviders({record, maximum_calls: 1});
  let receipt;
  try {
    const projection = project(row, 10000), began = performance.now();
    const admitted = await admission(answerMessages(row, {arm: "treatment", projection}), 1024, meter);
    assert.equal(admitted.admitted, true, "treatment-over-8k");
    receipt = await generate({id: `t10k-${row.question_id}`, request: admitted.request});
    assert.equal(receipt.request_sha256, admitted.wire_sha256); assert.equal(receipt.status, 200);
    assert.equal(receipt.ok, true); assert.equal(receipt.finish_reason, "stop");
    assert.ok(typeof receipt.output === "string" && receipt.output.trim());
    assert.ok(Number.isSafeInteger(receipt.usage?.total_tokens) && receipt.usage.total_tokens === receipt.usage.prompt_tokens + receipt.usage.completion_tokens);
    assert.ok(receipt.usage.prompt_tokens <= 6976 && receipt.usage.completion_tokens <= 1024 && receipt.usage.total_tokens <= 8000);
    const result = {question_id: row.question_id, status: "completed", source_row_sha256: sha(row),
      projection_sha256: projection.projection_sha256, selected_units: projection.units.length, request_sha256: admitted.wire_sha256,
      answer: receipt.output, answer_sha256: sha(receipt.output), usage: receipt.usage,
      elapsed_ms: Math.round(performance.now() - began), model_calls: 1, known_tokens: receipt.usage.total_tokens, unknown_usage: false};
    save(dir, "RESULT.json", result);
    console.log(JSON.stringify({index, question_id: row.question_id, status: "completed", tokens: result.known_tokens, elapsed_ms: result.elapsed_ms}));
    return result;
  } catch (error) {
    receipt = receipt ?? error.receipt;
    const model_calls = receipt?.dispatched ? 1 : 0, known_tokens = Number.isSafeInteger(receipt?.usage?.total_tokens) ? receipt.usage.total_tokens : 0;
    const result = {question_id: row.question_id, status: "failed", reason: String(error?.message ?? error), model_calls,
      known_tokens, unknown_usage: model_calls === 1 && !Number.isSafeInteger(receipt?.usage?.total_tokens)};
    stopped = true; stopReason ??= `${row.question_id}:${result.reason}`;
    save(dir, "RESULT.json", result);
    console.log(JSON.stringify({index, question_id: row.question_id, status: "failed", model_calls, known_tokens, unknown_usage: result.unknown_usage}));
    return result;
  } finally { await Promise.allSettled([meter.settle(), generate.settle()]); }
}
await Promise.all([0, 1].map(async () => {
  while (!stopped && cursor < 16) { const index = cursor++; results[index] = await task(index); }
}));
const terminal = {schema_version: "are.longmemeval-fast-cohort-10k-result/v1", status: results.every(row => row?.status === "completed") ? "completed" : "failed",
  question_ids: rows.map(row => row.question_id), results: results.map((row, index) => row ?? {question_id: rows[index].question_id, status: "not-started"}),
  completed: results.filter(row => row?.status === "completed").length, model_calls: results.reduce((sum, row) => sum + (row?.model_calls ?? 0), 0),
  known_tokens: results.reduce((sum, row) => sum + (row?.known_tokens ?? 0), 0), unknown_usage: results.some(row => row?.unknown_usage),
  stop_reason: stopReason, campaign_wall_ms: Math.round(performance.now() - started), evaluator_reference_access: false,
  finished_at: new Date().toISOString(), claim_ceiling: "Prospective treatment comparator; separate native rubric scoring required"};
save(output, "RESULT.json", terminal);
console.log(JSON.stringify({status: terminal.status, completed: terminal.completed, model_calls: terminal.model_calls,
  known_tokens: terminal.known_tokens, unknown_usage: terminal.unknown_usage, campaign_wall_ms: terminal.campaign_wall_ms}));
