// Verify the exact two-file 160K admission delta and full r11 source suite.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-source-r10-prospective-r32`;
const newRoot = `${base}/g01-source-r11-prospective-r40`;
const evidenceRoot = `${base}/g01-source-r11-prospective-r40-evidence`;
const oldTreeSha = "f51f168ed51774aee8745cfb61d5dd9a7616b137d3cf41b4a5abe02c214e70f7";
const oldReceipt = `${base}/g01-r11-r3-source-verification-r1/SOURCE-VERIFICATION.json`;
const oldReceiptSha = "132b19afd4278e8a15544254bc9a9f866b6bfd534085753b8e9d233c3bb72abb";
const prefix = "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/";
const changed = new Map([
  [`${prefix}prepare-campaign.mjs`, "986fa254d93937a8ee462a663fab1339294194bc841dba53951581108e40ccc5"],
  [`${prefix}prepare-campaign.test.mjs`, "7f6f8d89b722fa2da665923322e60d04e0c6cd352d7626ba7badf9f691a45645"]
]);
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g01-r40-source.${reason}`);};
const mode = process.argv[2];
need(["--check", "--verify"].includes(mode) && process.argv.length === 3, "arguments");
need(sha(readFileSync(oldReceipt)) === oldReceiptSha && !existsSync(evidenceRoot),
"old-receipt-or-output-drift");
const {bindSourceTree} = await import(pathToFileURL(join(newRoot, `${prefix}prepare-campaign.mjs`)).href);
const before = bindSourceTree(oldRoot), after = bindSourceTree(newRoot);
need(before.file_count === 407 && before.tree_sha256 === oldTreeSha && after.file_count === 407,
"tree-basis");
const beforeMap = new Map(before.sources.map(row => [row.path.slice(oldRoot.length + 1), row.sha256]));
const afterMap = new Map(after.sources.map(row => [row.path.slice(newRoot.length + 1), row.sha256]));
need(beforeMap.size === afterMap.size && [...beforeMap.keys()].every(path => afterMap.has(path)),
"source-set-drift");
const delta = [...afterMap.keys()].filter(path => beforeMap.get(path) !== afterMap.get(path)).sort();
need(delta.length === 2 && delta.every(path => afterMap.get(path) === changed.get(path)),
"unexpected-source-change");
const tests = after.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
const run = spawnSync(node, ["--test", ...tests],
  {cwd: newRoot, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024});
need(!run.error && run.status === 0 && run.signal === null,
  `test-process:${String(run.error?.message ?? run.stderr).slice(-300)}`);
const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
need(tests.length === 16 && testsRun >= 92 && passed === testsRun && failed === 0,
"test-counts");
const receipt = {schema_version: "are.g01-r11-r40-source-snapshot/v1",
  status: "tested-not-frozen", old_source_root: oldRoot,
  old_source_tree_sha256: before.tree_sha256, source_root: newRoot,
  source_tree_sha256: after.tree_sha256, file_count: after.file_count,
  changed_files: delta.map(path => ({relative_path: path, old_sha256: beforeMap.get(path),
    new_sha256: afterMap.get(path)})),
  prior_full_source_receipt_sha256: oldReceiptSha, test_files: tests.length,
  tests_run: testsRun, passed, failed, test_stdout_sha256: sha(run.stdout),
  test_stderr_sha256: sha(run.stderr), node_version: process.version,
  script_sha256: sha(readFileSync(import.meta.filename)), model_calls: 0,
  gold_loaded: false,
  claim_ceiling: "Two-file 160K campaign-binder source and all bound tests only; no campaign freeze or model result"};
if (mode === "--verify") {
  mkdirSync(evidenceRoot, {mode: 0o700});
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(join(evidenceRoot, "SOURCE-SNAPSHOT.json"), bytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--verify" ? receipt.status : "read-only-ready",
  source_tree_sha256: after.tree_sha256, file_count: after.file_count,
  changed_files: delta, tests_run: testsRun, passed,
  receipt_sha256: mode === "--verify" ? sha(readFileSync(join(evidenceRoot, "SOURCE-SNAPSHOT.json"))) : null}));
