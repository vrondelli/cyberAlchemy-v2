// Reference-bound scoring for the completed four-call development screen.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {IDS, admitActualWire, loadSourceManifest, sha} from "./adapter-unexposed-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";

const [sourceDir, generationFile, referenceDir, rubricFile, outputDir] = process.argv.slice(2);
assert.ok([sourceDir, generationFile, referenceDir, rubricFile, outputDir].every(Boolean), "usage: fast-score-5k-v1.mjs SOURCE_DIR GENERATION_RESULT REFERENCE_DIR RUBRIC_FILE NEW_OUTPUT_DIR");
const source = resolve(sourceDir), reference = resolve(referenceDir), output = resolve(outputDir);
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(readFileSync(join(source, "manifest.json")));
const {rows} = loadSourceManifest(manifest, source);
const generationBytes = readFileSync(resolve(generationFile)), generation = JSON.parse(generationBytes);
assert.equal(generation.schema_version, "are.longmemeval-fast-treatment-result/v1");
assert.equal(generation.status, "completed"); assert.equal(generation.results.length, 4);
assert.deepEqual(generation.results.map(row => row.question_id), [...IDS]);
assert.equal(generation.unknown_usage, false);
const rubricBytes = readFileSync(resolve(rubricFile));
assert.equal(digest(rubricBytes), "64e3ee142988fecff66a37057e2259ad501978590ce4272ee88a5f39187f1f12");
const receiptBytes = readFileSync(join(reference, "reference-acquisition.json"));
const receipt = JSON.parse(receiptBytes);
assert.equal(receipt.status, "verified-evaluator-reference-projection");
assert.equal(receipt.generator_reference_access, false);
assert.equal(receipt.selected.length, 4);
const refs = receipt.selected.map((entry, index) => {
  assert.equal(entry.question_id, IDS[index]);
  assert.equal(entry.path, `reference-${IDS[index]}.json`);
  const bytes = readFileSync(join(reference, entry.path));
  assert.equal(bytes.length, entry.bytes); assert.equal(digest(bytes), entry.sha256);
  const row = JSON.parse(bytes), original = rows[index];
  assert.equal(sha({question_id: row.question_id, question_type: row.question_type, question: row.question, question_date: row.question_date}),
    sha({question_id: original.question_id, question_type: original.question_type, question: original.question, question_date: original.question_date}));
  return {...row, abstention: row.question_id.endsWith("_abs")};
});
mkdirSync(output, {recursive: false, mode: 0o700});
const save = (name, value) => writeFileSync(join(output, name), `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
save("RUN.json", {schema_version: "are.longmemeval-fast-score-run/v1", generation_file_sha256: digest(generationBytes),
  reference_receipt_sha256: digest(receiptBytes), rubric_sha256: digest(rubricBytes), question_ids: IDS,
  maximum_judge_calls: 4, maximum_tokenizer_calls: 4, automatic_retries: 0, reference_values_emitted: false,
  script_sha256: digest(readFileSync(import.meta.filename)), started_at: new Date().toISOString()});
let event = 0;
const record = async value => save(`event-${String(++event).padStart(4, "0")}.json`, value);
const {meter, generate} = createGatewayProviders({record, maximum_calls: 4});
const judgments = [];
try {
  for (const [index, result] of generation.results.entries()) {
    assert.equal(sha(result.answer), result.answer_sha256);
    const ref = refs[index];
    const prompt = execFileSync("python3", ["-c", "import json,sys,runpy; x=json.load(sys.stdin); print(runpy.run_path(sys.argv[1])['get_anscheck_prompt'](x['question_type'],x['question'],x['answer'],x['response'],x['abstention']),end='')", resolve(rubricFile)],
      {input: JSON.stringify({...ref, response: result.answer}), encoding: "utf8", timeout: 5000, maxBuffer: 1024 * 1024});
    const admission = await admitActualWire([{role: "user", content: prompt}], 1024, meter);
    assert.equal(admission.admitted, true);
    const began = performance.now();
    const model = await generate({id: `fast5k-judge-${result.question_id}`, request: admission.request});
    assert.equal(model.status, 200); assert.equal(model.ok, true); assert.equal(model.finish_reason, "stop");
    const answer = model.output.trim().toLowerCase();
    assert.ok(["yes", "no"].includes(answer), `${result.question_id}:invalid-judge-answer`);
    const judgment = {question_id: result.question_id, answer_sha256: result.answer_sha256, request_sha256: admission.wire_sha256,
      correct: answer === "yes", valid: true, usage: model.usage, elapsed_ms: Math.round(performance.now() - began)};
    save(`judgment-${result.question_id}.json`, judgment); judgments.push(judgment);
    console.log(JSON.stringify({question_id: result.question_id, correct: judgment.correct, judge_tokens: judgment.usage.total_tokens}));
  }
  save("RESULT.json", {schema_version: "are.longmemeval-fast-score-result/v1", status: "completed", question_ids: IDS,
    correct: judgments.filter(row => row.correct).length, valid: judgments.length, generation_tokens: generation.total_tokens,
    judge_tokens: judgments.reduce((sum, row) => sum + row.usage.total_tokens, 0),
    total_tokens: generation.total_tokens + judgments.reduce((sum, row) => sum + row.usage.total_tokens, 0),
    sum_generation_task_elapsed_ms: generation.sum_task_elapsed_ms, sum_judge_elapsed_ms: judgments.reduce((sum, row) => sum + row.elapsed_ms, 0),
    judgments, unknown_usage: false, reference_values_emitted: false, claim_ceiling: "Four-task development screen, not untouched confirmation", finished_at: new Date().toISOString()});
} catch (error) {
  save("FAILURE.json", {status: "failed", completed_question_ids: judgments.map(row => row.question_id), reason: String(error?.message ?? error), unknown_usage: true, finished_at: new Date().toISOString()});
  throw error;
} finally {
  await Promise.allSettled([meter.settle(), generate.settle()]);
}
