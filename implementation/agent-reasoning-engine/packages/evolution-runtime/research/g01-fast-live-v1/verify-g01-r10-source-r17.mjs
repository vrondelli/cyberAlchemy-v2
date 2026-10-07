// Bind the pre-dispatch client-budget repair without mutating r16 or r10.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-source-r10-prospective-r16`;
const sourceRoot = `${base}/g01-source-r10-prospective-r17`;
const evidenceRoot = `${base}/g01-source-r10-prospective-r17-evidence`;
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const priorTreeSha = "8e6872e10add94526f6d0066b588f53ae594c171c20b638c4092da2e2d099030";
const prefix = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/";
const changed = new Map([
  [`${prefix}ranked-source-live-client-r1.mjs`, "bdc7d5832a200eed3c91570426ca697570cccd0c13f8fdcff0ea15c5db48adf5"],
  [`${prefix}intent-anchor-wiring-r3.test.mjs`, "22b755a7e43c2221e891c1f94f3e790bf8b1a46791c349614d4e51a8d1b8279e"]
]);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r17-source.${reason}`);};

async function main() {
  need(!existsSync(evidenceRoot), "evidence-exists");
  const prepareRelative = "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs";
  const priorPrepare = join(priorRoot, prepareRelative), currentPrepare = join(sourceRoot, prepareRelative);
  need(sha(readFileSync(priorPrepare)) === sha(readFileSync(currentPrepare)), "binder-source-drift");
  const {bindSourceTree} = await import(pathToFileURL(currentPrepare).href);
  const before = bindSourceTree(priorRoot), after = bindSourceTree(sourceRoot);
  need(before.file_count === 407 && before.tree_sha256 === priorTreeSha && after.file_count === 407, "tree-basis");
  const beforeMap = new Map(before.sources.map(row => [relative(priorRoot, row.path), row.sha256]));
  const afterMap = new Map(after.sources.map(row => [relative(sourceRoot, row.path), row.sha256]));
  const changedPaths = [...afterMap].filter(([path, digest]) => beforeMap.get(path) !== digest).map(([path]) => path);
  const removedPaths = [...beforeMap.keys()].filter(path => !afterMap.has(path));
  need(removedPaths.length === 0 && changedPaths.length === changed.size &&
    changedPaths.every(path => afterMap.get(path) === changed.get(path)), "unexpected-source-change");
  const tests = after.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
  const run = spawnSync(node, ["--test", ...tests],
    {cwd: sourceRoot, encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024});
  need(!run.error && run.status === 0 && run.signal === null, `test-process:${run.stdout.slice(-500)}:${run.stderr.slice(-300)}`);
  const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
  const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
  need(testsRun >= 90 && passed === testsRun && failed === 0, "test-counts");
  const receipt = {schema_version: "are.g01-r17-source-snapshot/v1", status: "tested-not-frozen",
    prior_root: priorRoot, prior_tree_sha256: before.tree_sha256,
    source_root: sourceRoot, source_tree_sha256: after.tree_sha256, file_count: after.file_count,
    changed_files: [...changed].map(([relative_path, sha256]) => ({relative_path, sha256})),
    test_files: tests.length, tests_run: testsRun, passed, failed,
    test_stdout_sha256: sha(run.stdout), test_stderr_sha256: sha(run.stderr),
    node_version: process.version, script_sha256: sha(readFileSync(import.meta.filename)),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Prospective 160k source-tree and tests only; no model or quality result",
    open_questions: ["Will exposed control complete at 160k?", "Does a matched fresh cohort clear quality and efficiency gates?"]};
  mkdirSync(evidenceRoot, {mode: 0o700});
  const output = join(evidenceRoot, "SOURCE-SNAPSHOT.json");
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(output, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, source_tree_sha256: after.tree_sha256,
    file_count: after.file_count, tests_run: testsRun, passed, output_sha256: sha(bytes)}));
}

main().catch(error => {console.error(JSON.stringify({status: "source-verification-error", error: String(error.message)})); process.exitCode = 2;});
