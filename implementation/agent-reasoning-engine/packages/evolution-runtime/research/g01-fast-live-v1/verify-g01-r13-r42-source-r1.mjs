// Qualify prospective r42 against frozen r41 and the sealed r12 pair-3 failure.
// No model call, gold access, score mutation, or repair of r12.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-source-r12-prospective-r41`;
const newRoot = `${base}/g01-source-r13-prospective-r42`;
const evidenceRoot = `${base}/g01-r13-r42-source-qualification-r1`;
const pairRoot = `${base}/g01-product-replication-r12/cpp-json-6b14bf49`;
const prefix = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/";
const modulePath = `${prefix}bounded-archive-frontier-delivery-r1.mjs`;
const changed = new Map([
  [modulePath, "fcf93bb9dfae9117779be95969fc4a64fe98463d2ee62bcfd228b63cc9d56e8d"],
  [`${prefix}bounded-archive-frontier-delivery-compact-recovery.test.mjs`,
    "2ecd05883973dfaa3d84cc9b4354012d26d09e0781ed47eefbde59a7488ed20d"]
]);
const expectedInputs = {
  pair: "a53955b5f5ce994a0eaf155c6f20363527d5121216176fbb6dd376eb0b576430",
  events: "30c1e79fa659cfa446ffc8e1442259f01f313dd0e7406b2898e3f75b8d6ce347",
  control: "722ac2853ba0e0965f1f4438719fa51be5ff2d4cc3681093dfe62a892fc79807",
  candidate: "53357b8cae37afe92cacc3417b4a9b514c4dd59c2c601f5b48088c46e1accf1f"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g01-r42-source.${reason}`);};
const mode = process.argv[2];
need(["--check", "--verify"].includes(mode) && process.argv.length === 3, "arguments");
need(!existsSync(evidenceRoot), "evidence-root-exists");
const {bindSourceTree} = await import(pathToFileURL(join(newRoot,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
const before = bindSourceTree(oldRoot), after = bindSourceTree(newRoot);
need(before.file_count === 408 && before.tree_sha256 ===
  "bac9fcdf9d485b6bec42eb9372261dab9fc58797145e17917542f197b5ef13de" &&
  after.file_count === 409 && after.tree_sha256 ===
  "69c0098b5b04acac69825ea572affa1b749948af5e85a51e8859b2a8baced602",
"source-tree-binding");
const oldMap = new Map(before.sources.map(row => [row.path.slice(oldRoot.length + 1), row.sha256]));
const newMap = new Map(after.sources.map(row => [row.path.slice(newRoot.length + 1), row.sha256]));
const delta = [...newMap.keys()].filter(path => oldMap.get(path) !== newMap.get(path)).sort();
need(delta.length === 2 && oldMap.size === 408 && newMap.size === 409 &&
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
need(tests.length === 18 && testsRun === 97 && passed === 97 && failed === 0,
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
const pair = JSON.parse(bytes.pair), control = JSON.parse(bytes.control), candidate = JSON.parse(bytes.candidate);
need(pair.status === "unscored" && pair.arms?.control?.error ===
  "read.arguments-output-mismatch" && control.error ===
  "read.arguments-output-mismatch" && candidate.status ===
  "final_context_selected", "stopped-pair-shape");
const events = bytes.events.toString("utf8").trim().split("\n").map(JSON.parse);
const recovered = events.filter(event => event.kind === "source-tool-result" &&
  event.call?.function?.name === "recover_archived_read" && event.output?.ok === true);
need(recovered.length === 2 && recovered.every(event =>
  Object.keys(JSON.parse(event.call.function.arguments)).sort().join(",") ===
    "archive_sha256,observation_index"), "sealed-compact-recovery-shape");
const captures = events.filter(event => event.kind === "request-capture").map(event => event.capture);
const receipts = JSON.parse(readFileSync(`${pairRoot}/control/runs/00/episode.json`)).receipts;
need(captures.length === 9 && receipts.length === 31, "sealed-archive-shape");
const oldModule = await import(pathToFileURL(join(oldRoot, modulePath)).href);
const newModule = await import(pathToFileURL(join(newRoot, modulePath)).href);
let oldError = null;
try {oldModule.bindCompactDelivery({captures, receipts});} catch (error) {oldError = error.message;}
need(oldError === "read.arguments-output-mismatch", "old-failure-not-reproduced");
const admitted = newModule.bindCompactDelivery({captures, receipts});
need(admitted.read_observations.length === 16 && admitted.unmapped.length === 0,
  "r42-delivery-failed");
const receipt = {schema_version: "are.g01-r13-r42-source-qualification/v1",
  status: "source-qualified-not-campaign-frozen",
  old_source_tree_sha256: before.tree_sha256, source_tree_sha256: after.tree_sha256,
  source_root: newRoot, file_count: after.file_count,
  changed_files: delta.map(path => ({relative_path: path,
    old_sha256: oldMap.get(path) ?? null, new_sha256: newMap.get(path)})),
  test_files: tests.length, tests_run: testsRun, passed, failed,
  test_stdout_sha256: sha(run.stdout), test_stderr_sha256: sha(run.stderr),
  sealed_r12_input_sha256: expectedInputs,
  exact_replay: {old_error: oldError, r42_status: "admitted",
    r42_read_observations: admitted.read_observations.length,
    r42_unmapped: admitted.unmapped.length,
    measurement: "Receipt-bound sealed control archive; no new provider request"},
  script_sha256: sha(readFileSync(import.meta.filename)), node_version: process.version,
  model_calls: 0, gold_loaded: false,
  claim_ceiling: "R42 compact-recovery delivery binding only; r12 remains terminal and no superiority result follows"};
if (mode === "--verify") {
  mkdirSync(evidenceRoot, {mode: 0o700});
  writeFileSync(join(evidenceRoot, "SOURCE-QUALIFICATION.json"),
    `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--verify" ? receipt.status : "read-only-ready",
  source_tree_sha256: after.tree_sha256, file_count: after.file_count,
  tests_run: testsRun, passed, old_error: oldError,
  r42_read_observations: admitted.read_observations.length,
  receipt_sha256: mode === "--verify" ?
    sha(readFileSync(join(evidenceRoot, "SOURCE-QUALIFICATION.json"))) : null}));
