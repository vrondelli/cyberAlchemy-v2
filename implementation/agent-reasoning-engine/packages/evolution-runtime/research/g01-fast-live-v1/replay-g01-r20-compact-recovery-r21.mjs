// Provider-free replay of the exact r20 TypeScript control exchange that failed admission.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-source-r10-prospective-r17`;
const newRoot = `${base}/g01-source-r10-prospective-r21`;
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-hints-admission-r1.mjs";
const eventsPath = "/tmp/are-g01-r20-exposed-transfer-160k-240s-r1/typescript-core-8d2ac221/control/runs/00/events.jsonl";
const resultPath = "/tmp/are-g01-r20-exposed-transfer-160k-240s-r1/typescript-core-8d2ac221/control/runs/00/result.json";
const outputPath = `${base}/g01-r21-exposed-typescript-control-r1/EXACT-FAILURE-REPLAY.json`;
const sha = b => createHash("sha256").update(b).digest("hex");
const need = (v, why) => {if (!v) throw Error(`g01-r21-replay.${why}`);};
const eventsBytes = readFileSync(eventsPath);
const events = eventsBytes.toString("utf8").trim().split("\n").map(JSON.parse);
const raw = events.filter(e => e.kind === "frontier-raw-exchange").at(-1);
const exchange = raw?.exchange;
need(exchange?.assistant?.tool_calls?.length === 2 && exchange.results?.length === 2 &&
  exchange.assistant.tool_calls.every(c => c.function?.name === "recover_archived_read" &&
    Object.keys(JSON.parse(c.function.arguments)).sort().join(",") === "archive_sha256,observation_index") &&
  exchange.results.every(r => r.ok === true && r.archive_origin?.archive_sha256), "exact-exchange-shape");
const oldResultBytes = readFileSync(resultPath), oldResult = JSON.parse(oldResultBytes);
need(oldResult.status === "run_error" && oldResult.error === "aggregate-admission.read-binding",
  "old-result-drift");
const {admitToolBatch: oldAdmit} = await import(pathToFileURL(`${oldRoot}/${relative}`).href);
const {admitToolBatch: newAdmit} = await import(pathToFileURL(`${newRoot}/${relative}`).href);
const args = {messages: [], tools: [], assistant: exchange.assistant, results: exchange.results,
  measure: async () => 1000, archive: async () => {}, limit: 8000};
let oldError = null;
try {await oldAdmit(args);} catch (error) {oldError = error.message;}
need(oldError === "aggregate-admission.read-binding", "old-failure-not-reproduced");
const recovered = await newAdmit(args);
need(recovered.status === "admitted" && recovered.outputs.length === 2 &&
  recovered.outputs.every(o => o.ok === true && o.output?.read_id), "new-admission-failed");
const receipt = {schema_version: "are.g01-r21-exact-compact-recovery-replay/v1",
  status: "old-failure-reproduced-new-admission-passed", r20_events_sha256: sha(eventsBytes),
  r20_result_sha256: sha(oldResultBytes), exchange_sha256: sha(Buffer.from(JSON.stringify(exchange))),
  old_module_sha256: sha(readFileSync(`${oldRoot}/${relative}`)),
  new_module_sha256: sha(readFileSync(`${newRoot}/${relative}`)),
  compact_recovery_calls: 2, successful_recovery_results: 2,
  old_error: oldError, new_status: recovered.status, model_calls: 0,
  measurement: "Synthetic 1,000-token value only; this replay verifies admission binding, not real 8K fit or model continuation",
  claim_ceiling: "Exact exposed tool-exchange harness diagnosis only; no paired quality or superiority"};
const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes),
  old_error: oldError, new_status: recovered.status, model_calls: 0}));
