// Four-call development screen. Source-only generation; no evaluator references.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {IDS, admitActualWire, answerMessages, loadSourceManifest, project, sha} from "./adapter-unexposed-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";

const [sourceDirectory, outputDirectory] = process.argv.slice(2);
assert.ok(sourceDirectory && outputDirectory, "usage: fast-treatment-5k-v1.mjs SOURCE_DIRECTORY NEW_OUTPUT_DIRECTORY");
const source = resolve(sourceDirectory), output = resolve(outputDirectory);
const manifestBytes = readFileSync(join(source, "manifest.json"));
const manifest = JSON.parse(manifestBytes);
const {rows, bindings} = loadSourceManifest(manifest, source);
assert.deepEqual(rows.map(row => row.question_id), [...IDS]);
mkdirSync(output, {recursive: false, mode: 0o700});
const save = (name, value) => writeFileSync(join(output, name), `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
save("RUN.json", {
  schema_version: "are.longmemeval-fast-treatment-run/v1", hypothesis: "Halving the ranked whole-turn projection to 5000 serialized characters preserves answer accuracy while reducing input tokens and elapsed time",
  falsifier: "Any task becomes incorrect or aggregate tokens/time fail to improve over the prior treatment", projection_character_limit: 5000,
  question_ids: IDS, source_manifest_sha256: digest(manifestBytes), source_bindings: bindings, script_sha256: digest(readFileSync(import.meta.filename)),
  model: "glm-5.3-flash", maximum_model_calls: 4, maximum_tokenizer_calls: 4, maximum_workers: 1,
  reference_access: false, retries: 0, claim_ceiling: "Four-task exposed development screen only", started_at: new Date().toISOString()
});
let event = 0;
const record = async value => save(`event-${String(++event).padStart(4, "0")}.json`, value);
const {meter, generate} = createGatewayProviders({record, maximum_calls: 4});
const results = [];
try {
  for (const row of rows) {
    const began = performance.now(), projection = project(row, 5000);
    const messages = answerMessages(row, {arm: "treatment", projection});
    const admission = await admitActualWire(messages, 1024, meter);
    assert.equal(admission.admitted, true, `${row.question_id}:8k-admission`);
    const receipt = await generate({id: `fast5k-${row.question_id}`, request: admission.request});
    assert.equal(receipt.status, 200); assert.equal(receipt.ok, true);
    assert.equal(receipt.finish_reason, "stop"); assert.ok(typeof receipt.output === "string" && receipt.output.trim());
    assert.ok(Number.isSafeInteger(receipt.usage?.total_tokens) && receipt.usage.total_tokens >= 0);
    const result = {question_id: row.question_id, source_row_sha256: sha(row), projection_sha256: sha(projection), selected_units: projection.units.length,
      projected_request_tokens: admission.input_tokens, request_sha256: admission.wire_sha256, answer: receipt.output,
      answer_sha256: sha(receipt.output), usage: receipt.usage, elapsed_ms: Math.round(performance.now() - began), status: "completed"};
    save(`task-${row.question_id}.json`, result); results.push(result);
    console.log(JSON.stringify({question_id: row.question_id, status: result.status, tokens: result.usage.total_tokens, elapsed_ms: result.elapsed_ms}));
  }
  const total_tokens = results.reduce((sum, row) => sum + row.usage.total_tokens, 0);
  save("RESULT.json", {schema_version: "are.longmemeval-fast-treatment-result/v1", status: "completed", question_ids: IDS,
    results, total_tokens, sum_task_elapsed_ms: results.reduce((sum, row) => sum + row.elapsed_ms, 0),
    model_calls: results.length, tokenizer_calls: results.length, unknown_usage: false, finished_at: new Date().toISOString(), claim_ceiling: "Development screen; accuracy requires separate reference-bound scoring"});
} catch (error) {
  save("FAILURE.json", {status: "failed", completed_task_ids: results.map(row => row.question_id), error: String(error?.message ?? error),
    model_calls_at_most: 4, unknown_usage: true, finished_at: new Date().toISOString()});
  throw error;
} finally {
  await Promise.allSettled([meter.settle(), generate.settle()]);
}
