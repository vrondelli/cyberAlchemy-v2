// Provider-free replay of the exact r11 pair-13 compact-recovery failure.
// No score, model request, or campaign mutation. --write creates one receipt.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-source-r11-prospective-r40`;
const fixedRoot = `${base}/g01-source-r10-prospective-r21`;
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-hints-admission-r1.mjs";
const pairRoot = `${base}/g01-product-replication-r11/python-matplotlib-ce7f17a5`;
const receiptPath = `${base}/g01-r11-stop-diagnostic-r1/EXACT-FAILURE-REPLAY.json`;
const expected = {
  pair: "ddcdb76e4637e387375b7070670a0c24e9106630198d1ec0ce7b29f68cb1e560",
  events: "920efbc1d0bfbb0cdd65ca53358d5216d7766591b04ca48a74e3690b5fd6c85e",
  control: "72944383bb9afebeeaf8a3eef370cf38db8c3ba67790fe02b2e7970a9fdb1971",
  candidate: "8f8debd262779d619effe28c7bb2670a119d4ac36282298964211fc85e9e45e1",
  oldModule: "a449a7bc1e19368ada0c60517930e844147f214f3c511db27d84f5e752c8e66a",
  fixedModule: "c179fd284ef6f93fc0e34d31da74de550b44b8e84d4452bfa78038f4fdfda9dc"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r11-stop-replay.${reason}`);};
const mode = process.argv[2];
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const paths = {
  pair: `${pairRoot}/PAIR-RESULT.json`,
  events: `${pairRoot}/control/runs/00/events.jsonl`,
  control: `${pairRoot}/control/runs/00/result.json`,
  candidate: `${pairRoot}/candidate/runs/00/result.json`,
  oldModule: `${oldRoot}/${relative}`,
  fixedModule: `${fixedRoot}/${relative}`
};
const bytes = Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, readFileSync(path)]));
for (const [name, expectedSha] of Object.entries(expected))
  need(sha(bytes[name]) === expectedSha, `input-drift:${name}`);
const pair = JSON.parse(bytes.pair), control = JSON.parse(bytes.control),
  candidate = JSON.parse(bytes.candidate);
need(pair.schema === "are.g01-fast-live-pair-result/v1" && pair.status === "unscored" &&
  pair.arms?.control?.status === "run_error" &&
  pair.arms.control.error === "aggregate-admission.read-binding" &&
  pair.arms?.candidate?.status === "final_context_selected" &&
  control.status === "run_error" && control.error === "aggregate-admission.read-binding" &&
  candidate.status === "final_context_selected", "terminal-attempt-shape");
const events = bytes.events.toString("utf8").trim().split("\n").map(JSON.parse);
const raw = events.filter(event => event.kind === "frontier-raw-exchange").at(-1);
const exchange = raw?.exchange;
need(exchange?.assistant?.tool_calls?.length === 1 && exchange.results?.length === 1 &&
  exchange.assistant.tool_calls[0].function?.name === "recover_archived_read" &&
  Object.keys(JSON.parse(exchange.assistant.tool_calls[0].function.arguments)).sort().join(",") ===
    "archive_sha256,observation_index" &&
  exchange.results[0].ok === true &&
  exchange.results[0].archive_origin?.archive_sha256 &&
  Number.isSafeInteger(exchange.results[0].archive_origin.observation_index),
  "compact-recovery-exchange");
const {admitToolBatch: oldAdmit} = await import(pathToFileURL(paths.oldModule).href);
const {admitToolBatch: fixedAdmit} = await import(pathToFileURL(paths.fixedModule).href);
const args = {messages: [], tools: [], assistant: exchange.assistant, results: exchange.results,
  measure: async () => 1000, archive: async () => {}, limit: 8000};
let oldError = null;
try {await oldAdmit(args);} catch (error) {oldError = error.message;}
need(oldError === "aggregate-admission.read-binding", "old-failure-not-reproduced");
const fixed = await fixedAdmit(args);
need(fixed.status === "admitted" && fixed.outputs.length === 1 &&
  fixed.outputs[0].ok === true && fixed.outputs[0].output?.read_id,
  "fixed-admission-failed");
const receipt = {schema_version: "are.g01-r11-exact-compact-recovery-replay/v1",
  status: "r11-failure-reproduced-r21-fix-admits", campaign: "g01-product-replication-r11",
  slug: "python-matplotlib-ce7f17a5", input_sha256: expected,
  exchange_sha256: sha(Buffer.from(JSON.stringify(exchange))),
  compact_recovery_calls: 1, successful_recovery_results: 1,
  old_error: oldError, fixed_status: fixed.status, model_calls: 0,
  measurement: "Synthetic 1,000-token envelope; validates admission binding only, not real 8K continuation or a score",
  claim_ceiling: "Frozen r11 remains unscored and stopped; a separately named successor must be qualified before any new model dispatch",
  authority_effect: "none"};
const output = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
if (mode === "--write") writeFileSync(receiptPath, output, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, old_error: oldError,
  fixed_status: fixed.status, model_calls: 0, receipt_sha256: sha(output)}));
