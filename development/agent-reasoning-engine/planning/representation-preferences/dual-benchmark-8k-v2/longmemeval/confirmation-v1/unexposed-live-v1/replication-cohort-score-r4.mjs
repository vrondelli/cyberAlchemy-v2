// Native-rubric, reference-bound scoring after the 80-question product replication seal.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {admission, loadCohort, sha} from "./replication-cohort-adapter-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";

const [sourcePath, generationPath, referencePath, rubricPath, outputPath, tenKPath] = process.argv.slice(2);
assert.ok([sourcePath, generationPath, referencePath, rubricPath, outputPath].every(Boolean) && !tenKPath, "usage: replication-cohort-score-v1.mjs SOURCE_DIR GENERATION_RESULT REFERENCE_DIR RUBRIC_FILE NEW_OUTPUT_DIR");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const {rows, manifest_file_sha256} = loadCohort(sourcePath);
const generationBytes = readFileSync(resolve(generationPath)), generation = JSON.parse(generationBytes);
assert.equal(generation.schema_version, "are.longmemeval-product-replication-paired-result/v2");
assert.equal(generation.status, "completed"); assert.equal(generation.terminal_count, 80); assert.equal(generation.unknown_usage, false);
assert.deepEqual(generation.question_ids, rows.map(row => row.question_id));
assert.equal(generation.results.length, 80);
const referenced = new Set();
for (const [index, result] of generation.results.entries()) {
  assert.equal(result.question_id, rows[index].question_id); assert.ok(["completed", "provider-refused"].includes(result.status)); assert.equal(result.unknown_usage, false);
  if (result.status === "provider-refused") {
    assert.equal(result.refusal?.provider_error_code, "1301");
    assert.match(result.refusal?.response_sha256 ?? "", /^[a-f0-9]{64}$/);
    assert.ok(result.calls.every(call => call.status === "completed" || call.provider_error_code === "1301"));
    assert.equal(result.known_tokens, result.calls.reduce((sum, call) => sum + (call.usage?.total_tokens ?? 0), 0));
    continue;
  }
  assert.equal(result.answers.length, 2); assert.deepEqual(new Set(result.answers.map(answer => answer.arm)), new Set(["control", "treatment"]));
  for (const answer of result.answers) { assert.equal(sha(answer.text), answer.answer_sha256); referenced.add(`${result.question_id}:${answer.arm}`); }
  assert.equal(result.known_tokens, result.calls.reduce((sum, call) => sum + call.usage.total_tokens, 0));
}
assert.equal(referenced.size, generation.completed * 2);
assert.equal(generation.provider_refused, generation.results.filter(row => row.status === "provider-refused").length);
assert.equal(generation.known_tokens, generation.results.reduce((sum, row) => sum + row.known_tokens, 0));
let tenK = null, tenKBytes = null;
if (tenKPath) {
  tenKBytes = readFileSync(resolve(tenKPath)); tenK = JSON.parse(tenKBytes);
  assert.equal(tenK.schema_version, "are.longmemeval-fast-cohort-10k-result/v1");
  assert.equal(tenK.status, "completed"); assert.equal(tenK.completed, 80); assert.equal(tenK.unknown_usage, false);
  assert.deepEqual(tenK.question_ids, rows.map(row => row.question_id)); assert.equal(tenK.results.length, 80);
  assert.equal(tenK.known_tokens, tenK.results.reduce((sum, result, index) => {
    assert.equal(result.question_id, rows[index].question_id); assert.equal(result.status, "completed");
    assert.equal(sha(result.answer), result.answer_sha256); assert.equal(result.known_tokens, result.usage.total_tokens);
    return sum + result.known_tokens;
  }, 0));
}
const refDir = resolve(referencePath), refBytes = readFileSync(join(refDir, "manifest.json")), refManifest = JSON.parse(refBytes);
assert.equal(refManifest.schema_version, "are.longmemeval-product-replication-references/v2"); assert.equal(refManifest.status, "verified");
assert.equal(refManifest.generation_result_sha256, hash(generationBytes));
assert.equal(refManifest.cohort_manifest_sha256, manifest_file_sha256);
assert.equal(refManifest.generator_reference_access, false);
assert.deepEqual(refManifest.question_ids, rows.map(row => row.question_id));
const answeredRows = rows.filter((row, index) => generation.results[index].status === "completed");
assert.deepEqual(refManifest.answered_question_ids, answeredRows.map(row => row.question_id));
assert.deepEqual(refManifest.refused_question_ids, rows.filter((row, index) => generation.results[index].status === "provider-refused").map(row => row.question_id));
const refs = refManifest.selected.map((entry, index) => {
  assert.equal(entry.question_id, answeredRows[index].question_id); assert.equal(entry.path, `reference-${entry.question_id}.json`);
  const bytes = readFileSync(join(refDir, entry.path)); assert.equal(bytes.length, entry.bytes); assert.equal(hash(bytes), entry.sha256);
  const reference = JSON.parse(bytes), row = answeredRows[index];
  assert.equal(sha({question_id: reference.question_id, question_type: reference.question_type, question: reference.question, question_date: reference.question_date}),
    sha({question_id: row.question_id, question_type: row.question_type, question: row.question, question_date: row.question_date}));
  return {...reference, abstention: reference.question_id.endsWith("_abs")};
});
const rubricBytes = readFileSync(resolve(rubricPath));
assert.equal(hash(rubricBytes), "64e3ee142988fecff66a37057e2259ad501978590ce4272ee88a5f39187f1f12");
const output = resolve(outputPath), started = performance.now();
mkdirSync(output, {recursive: false, mode: 0o700});
const save = (name, value) => writeFileSync(join(output, name), `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
save("RUN.json", {schema_version: "are.longmemeval-product-replication-score-run/v2", generation_result_sha256: hash(generationBytes),
  cohort_manifest_sha256: manifest_file_sha256, reference_manifest_sha256: hash(refBytes), rubric_sha256: hash(rubricBytes),
  ten_k_result_sha256: tenKBytes ? hash(tenKBytes) : null,
  question_ids: rows.map(row => row.question_id), planned_judgments: generation.completed * 2, maximum_workers: 1, retries: 0,
  reference_values_emitted: false, script_sha256: hash(readFileSync(import.meta.filename)), started_at: new Date().toISOString()});
let event = 0;
const record = async value => save(`event-${String(++event).padStart(4, "0")}.json`, value);
const {meter, generate} = createGatewayProviders({record, maximum_calls: generation.completed * 2});
const jobs = [...generation.results.filter(result => result.status === "completed").flatMap(result => result.answers.map(answer => ({question_id: result.question_id, ...answer}))),
  ...(tenK ? tenK.results.map(result => ({question_id: result.question_id, arm: "treatment10k", text: result.answer, answer_sha256: result.answer_sha256})) : [])]
  .sort((a, b) => sha([a.question_id, a.arm, a.answer_sha256]).localeCompare(sha([b.question_id, b.arm, b.answer_sha256])));
const judgments = [];
try {
  for (const job of jobs) {
    const ref = refs.find(row => row.question_id === job.question_id);
    const prompt = execFileSync("python3", ["-c", "import json,sys,runpy; x=json.load(sys.stdin); print(runpy.run_path(sys.argv[1])['get_anscheck_prompt'](x['question_type'],x['question'],x['answer'],x['response'],x['abstention']),end='')", resolve(rubricPath)],
      {input: JSON.stringify({...ref, response: job.text}), encoding: "utf8", timeout: 5000, maxBuffer: 1024 * 1024});
    const admitted = await admission([{role: "user", content: prompt}], 1024, meter);
    assert.equal(admitted.admitted, true, `${job.question_id}:judge-over-8k`);
    const began = performance.now();
    const reply = await generate({id: `judge-${sha([job.question_id, job.arm, job.answer_sha256]).slice(0, 24)}`, request: admitted.request});
    assert.equal(reply.request_sha256, admitted.wire_sha256); assert.equal(reply.status, 200); assert.equal(reply.ok, true);
    assert.equal(reply.finish_reason, "stop");
    assert.ok(Number.isSafeInteger(reply.usage?.total_tokens) && reply.usage.total_tokens <= 8000);
    const yesNo = typeof reply.output === "string" ? reply.output.trim().toLowerCase() : "";
    const valid = ["yes", "no"].includes(yesNo);
    const judgment = {question_id: job.question_id, arm: job.arm, answer_sha256: job.answer_sha256,
      correct: valid && yesNo === "yes", valid, usage: reply.usage, elapsed_ms: Math.round(performance.now() - began)};
    save(`judgment-${job.question_id}-${job.arm}.json`, judgment); judgments.push(judgment);
    console.log(JSON.stringify({question_id: job.question_id, arm: job.arm, correct: judgment.correct, judge_tokens: reply.usage.total_tokens}));
  }
  const totals = Object.fromEntries(["control", "treatment", ...(tenK ? ["treatment10k"] : [])].map(arm => {
    const judged = judgments.filter(item => item.arm === arm);
    const generation_tokens = arm === "treatment10k" ? tenK.known_tokens : generation.results.filter(row => row.status === "completed").reduce((sum, row) => sum + row.calls.filter(call => call.arm === arm).reduce((n, call) => n + call.usage.total_tokens, 0), 0);
    const judge_tokens = judged.reduce((sum, row) => sum + row.usage.total_tokens, 0);
    return [arm, {planned: 80, answered_pairs: generation.completed, provider_refused: generation.provider_refused,
      valid: judged.filter(row => row.valid).length, correct: judged.filter(row => row.correct).length,
      generation_tokens, judge_tokens, total_tokens: generation_tokens + judge_tokens,
      generation_arm_elapsed_ms: arm === "treatment10k" ? tenK.results.reduce((sum, row) => sum + row.elapsed_ms, 0) : generation.results.filter(row => row.status === "completed").reduce((sum, row) => sum + row.arm_elapsed_ms[arm], 0),
      judge_elapsed_ms: judged.reduce((sum, row) => sum + row.elapsed_ms, 0)}];
  }));
  save("RESULT.json", {schema_version: "are.longmemeval-product-replication-score-result/v2", status: "completed", question_ids: generation.question_ids,
    judgments, totals, ten_k_result_sha256: tenKBytes ? hash(tenKBytes) : null,
    valid_judgments: judgments.filter(row => row.valid).length, provider_refused: generation.provider_refused,
    fixed_incorrect_question_ids: refManifest.refused_question_ids, unknown_usage: false, reference_values_emitted: false,
    generation_campaign_wall_ms: generation.campaign_wall_ms, scoring_wall_ms: Math.round(performance.now() - started),
    claim_ceiling: "Fixed 80-question six-type LongMemEval-S replication; no full-benchmark or general workflow claim", finished_at: new Date().toISOString()});
  console.log(JSON.stringify({status: "completed", totals}));
} catch (error) {
  save("FAILURE.json", {status: "failed", judgments_completed: judgments.length, reason: String(error?.message ?? error),
    unknown_usage: true, reference_values_emitted: false, finished_at: new Date().toISOString()});
  throw error;
} finally {
  await Promise.allSettled([meter.settle(), generate.settle()]);
}
