// Prospective r21 source snapshot: exact compact archived-read admission repair.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-source-r10-prospective-r17`;
const sourceRoot = `${base}/g01-source-r10-prospective-r21`;
const evidenceRoot = `${base}/g01-source-r10-prospective-r21-evidence`;
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const priorTreeSha = "7bfe648f5d953ca805a9ec29923bfa69abfe354e475759e26dc149d472f4a3bb";
const prefix = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/";
const changed = new Map([
  [`${prefix}ranked-source-hints-admission-r1.mjs`, "c179fd284ef6f93fc0e34d31da74de550b44b8e84d4452bfa78038f4fdfda9dc"],
  [`${prefix}ranked-source-hints-recovery-admission-r1.test.mjs`, "228eeccbac76be3e113ec4e09cd2319aeefc40b2990453af4f8c60866a951e36"]
]);
const sha = b => createHash("sha256").update(b).digest("hex");
const need = (v, why) => {if (!v) throw Error(`g01-r21-source.${why}`);};
const prepareRelative = "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs";
const priorPrepare = join(priorRoot, prepareRelative), currentPrepare = join(sourceRoot, prepareRelative);
need(!existsSync(evidenceRoot) && sha(readFileSync(priorPrepare)) === sha(readFileSync(currentPrepare)),
  "evidence-or-binder-drift");
const {bindSourceTree} = await import(pathToFileURL(currentPrepare).href);
const before = bindSourceTree(priorRoot), after = bindSourceTree(sourceRoot);
need(before.file_count === 407 && before.tree_sha256 === priorTreeSha && after.file_count === 408,
  "tree-basis");
const beforeMap = new Map(before.sources.map(row => [relative(priorRoot, row.path), row.sha256]));
const afterMap = new Map(after.sources.map(row => [relative(sourceRoot, row.path), row.sha256]));
const changedPaths = [...afterMap].filter(([path, digest]) => beforeMap.get(path) !== digest).map(([path]) => path);
const removedPaths = [...beforeMap.keys()].filter(path => !afterMap.has(path));
need(removedPaths.length === 0 && changedPaths.length === changed.size &&
  changedPaths.every(path => afterMap.get(path) === changed.get(path)), "unexpected-source-change");
const tests = after.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
const run = spawnSync(node, ["--test", ...tests],
  {cwd: sourceRoot, encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024});
need(!run.error && run.status === 0 && run.signal === null,
  `test-process:${run.stdout.slice(-500)}:${run.stderr.slice(-300)}`);
const count = label => Number(run.stdout.match(new RegExp(`(?:^|\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\n|$)`))?.[1]);
const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
need(testsRun >= 92 && passed === testsRun && failed === 0, "test-counts");
const receipt = {schema_version: "are.g01-r21-source-snapshot/v1", status: "tested-not-frozen",
  prior_root: priorRoot, prior_tree_sha256: before.tree_sha256,
  source_root: sourceRoot, source_tree_sha256: after.tree_sha256, file_count: after.file_count,
  changed_files: [...changed].map(([relative_path, sha256]) => ({relative_path, sha256})),
  test_files: tests.length, tests_run: testsRun, passed, failed,
  test_stdout_sha256: sha(run.stdout), test_stderr_sha256: sha(run.stderr),
  node_version: process.version, script_sha256: sha(readFileSync(import.meta.filename)),
  model_calls: 0, gold_loaded: false,
  claim_ceiling: "Prospective exposed-task harness reliability source only; no model or quality result",
  open_questions: ["Does exact TypeScript control recover past the compact archived-read admission?",
    "Can the separate candidate output-cap and cost failures be corrected prospectively?"]};
mkdirSync(evidenceRoot, {mode: 0o700});
const output = join(evidenceRoot, "SOURCE-SNAPSHOT.json");
const outputBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
writeFileSync(output, outputBytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, source_tree_sha256: after.tree_sha256,
  file_count: after.file_count, tests_run: testsRun, passed, output_sha256: sha(outputBytes)}));
