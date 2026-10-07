// Qualify the isolated r41 source repair against r40 and the sealed r11 stop.
// No model or evaluator call, scoring, or mutation of a prior campaign.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-source-r11-prospective-r40`;
const newRoot = `${base}/g01-source-r12-prospective-r41`;
const evidenceRoot = `${base}/g01-source-r12-prospective-r41-evidence`;
const pairRoot = `${base}/g01-product-replication-r11/python-matplotlib-ce7f17a5`;
const prefix = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/";
const modulePath = `${prefix}ranked-source-hints-admission-r1.mjs`;
const changed = new Map([
  [modulePath, "c179fd284ef6f93fc0e34d31da74de550b44b8e84d4452bfa78038f4fdfda9dc"],
  [`${prefix}ranked-source-hints-admission-compact-recovery.test.mjs`, "0ba821374150eac21e424d304a83d62b53da6b8aa9bddd465f5e04a7f8ba2da5"]
]);
const expectedInputs = {
  pair: "ddcdb76e4637e387375b7070670a0c24e9106630198d1ec0ce7b29f68cb1e560",
  events: "920efbc1d0bfbb0cdd65ca53358d5216d7766591b04ca48a74e3690b5fd6c85e",
  control: "72944383bb9afebeeaf8a3eef370cf38db8c3ba67790fe02b2e7970a9fdb1971",
  candidate: "8f8debd262779d619effe28c7bb2670a119d4ac36282298964211fc85e9e45e1"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g01-r41-source.${reason}`);};
const mode = process.argv[2];
need(["--check", "--verify"].includes(mode) && process.argv.length === 3, "arguments");
need(!existsSync(evidenceRoot), "evidence-root-exists");
const {bindSourceTree} = await import(pathToFileURL(join(newRoot,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
const before = bindSourceTree(oldRoot), after = bindSourceTree(newRoot);
need(before.file_count === 407 && before.tree_sha256 ===
  "8b30437bb41bf68ca5385d05054bd9e60444599da7c522c866a54a1635d15faa" &&
  after.file_count === 408 && after.tree_sha256 ===
  "bac9fcdf9d485b6bec42eb9372261dab9fc58797145e17917542f197b5ef13de",
"source-tree-binding");
const oldMap = new Map(before.sources.map(row => [row.path.slice(oldRoot.length + 1), row.sha256]));
const newMap = new Map(after.sources.map(row => [row.path.slice(newRoot.length + 1), row.sha256]));
const delta = [...newMap.keys()].filter(path => oldMap.get(path) !== newMap.get(path)).sort();
need(delta.length === 2 && oldMap.size === 407 && newMap.size === 408 &&
  delta.every(path => newMap.get(path) === changed.get(path)) &&
  [...oldMap.keys()].every(path => newMap.has(path)), "exact-two-file-delta");
const tests = after.sources.filter(row => row.path.endsWith(".test.mjs"))
  .map(row => row.path).sort();
const run = spawnSync("/opt/cyberalchemy-are-tools/node-24.10.0/node", ["--test", ...tests],
  {cwd: newRoot, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024});
need(!run.error && run.status === 0 && run.signal === null,
  `test-process:${String(run.error?.message ?? run.stderr).slice(-300)}`);
const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
need(tests.length === 17 && testsRun === 95 && passed === 95 && failed === 0,
  "test-counts");
const paths = {
  pair: `${pairRoot}/PAIR-RESULT.json`,
  events: `${pairRoot}/control/runs/00/events.jsonl`,
  control: `${pairRoot}/control/runs/00/result.json`,
  candidate: `${pairRoot}/candidate/runs/00/result.json`
};
const bytes = Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, readFileSync(path)]));
for (const [name, expected] of Object.entries(expectedInputs))
  need(sha(bytes[name]) === expected, `sealed-input-drift:${name}`);
const pair = JSON.parse(bytes.pair), control = JSON.parse(bytes.control),
  candidate = JSON.parse(bytes.candidate);
need(pair.status === "unscored" && pair.arms?.control?.error ===
  "aggregate-admission.read-binding" && control.error ===
  "aggregate-admission.read-binding" && candidate.status ===
  "final_context_selected", "stopped-pair-shape");
const events = bytes.events.toString("utf8").trim().split("\n").map(JSON.parse);
const exchange = events.filter(event => event.kind === "frontier-raw-exchange").at(-1)?.exchange;
need(exchange?.assistant?.tool_calls?.length === 1 && exchange.results?.length === 1 &&
  exchange.assistant.tool_calls[0].function?.name === "recover_archived_read" &&
  Object.keys(JSON.parse(exchange.assistant.tool_calls[0].function.arguments)).sort().join(",") ===
    "archive_sha256,observation_index" && exchange.results[0].ok === true,
  "sealed-compact-recovery-shape");
const {admitToolBatch: oldAdmit} = await import(pathToFileURL(join(oldRoot, modulePath)).href);
const {admitToolBatch: fixedAdmit} = await import(pathToFileURL(join(newRoot, modulePath)).href);
const args = {messages: [], tools: [], assistant: exchange.assistant, results: exchange.results,
  measure: async () => 1000, archive: async () => {}, limit: 8000};
let oldError = null;
try {await oldAdmit(args);} catch (error) {oldError = error.message;}
need(oldError === "aggregate-admission.read-binding", "old-failure-not-reproduced");
const fixed = await fixedAdmit(args);
need(fixed.status === "admitted" && fixed.outputs.length === 1 &&
  fixed.outputs[0].ok === true && fixed.outputs[0].output?.read_id,
  "r41-admission-failed");
const receipt = {schema_version: "are.g01-r12-r41-source-qualification/v1",
  status: "source-qualified-not-campaign-frozen", old_source_tree_sha256: before.tree_sha256,
  source_tree_sha256: after.tree_sha256, source_root: newRoot,
  file_count: after.file_count, changed_files: delta.map(path => ({relative_path: path,
    old_sha256: oldMap.get(path) ?? null, new_sha256: newMap.get(path)})),
  test_files: tests.length, tests_run: testsRun, passed, failed,
  test_stdout_sha256: sha(run.stdout), test_stderr_sha256: sha(run.stderr),
  sealed_r11_input_sha256: expectedInputs,
  exact_replay: {old_error: oldError, r41_status: fixed.status,
    measurement: "Synthetic 1,000-token envelope; admission only"},
  script_sha256: sha(readFileSync(import.meta.filename)), node_version: process.version,
  model_calls: 0, gold_loaded: false,
  claim_ceiling: "R41 source and exact admission repair only; r11 remains terminal, no fresh cohort or superiority result"};
if (mode === "--verify") {
  mkdirSync(evidenceRoot, {mode: 0o700});
  writeFileSync(join(evidenceRoot, "SOURCE-QUALIFICATION.json"),
    `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--verify" ? receipt.status : "read-only-ready",
  source_tree_sha256: after.tree_sha256, file_count: after.file_count,
  tests_run: testsRun, passed, old_error: oldError, r41_status: fixed.status,
  receipt_sha256: mode === "--verify" ?
    sha(readFileSync(join(evidenceRoot, "SOURCE-QUALIFICATION.json"))) : null}));
