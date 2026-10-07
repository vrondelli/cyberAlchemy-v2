// Prospective r15 source-tree binding after exposed no-generation projection repair.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {readFileSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-source-r10-candidate-r14`;
const sourceRoot = `${base}/g01-source-r10-prospective-r15`;
const output = `${base}/g01-source-r10-prospective-r15-evidence/SOURCE-SNAPSHOT.json`;
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const priorTreeSha = "5076bd31924e97aab04e8ded4f706882fc120ed5bd42c7e22511e37e7f88be12";
const prefix = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/";
const changed = new Map([
  [`${prefix}bounded-archive-frontier-recovery-r1.mjs`, "66e6cfe1bef952df2b3070e113f950aa86dd65c5ebb40abdd689a839873dbc6e"],
  [`${prefix}ranked-source-hints-admission-r1.mjs`, "a449a7bc1e19368ada0c60517930e844147f214f3c511db27d84f5e752c8e66a"],
  [`${prefix}ranked-source-hints-views-r1.mjs`, "fe20ae36a9791f01ade00c463ab434da92ef2b45dc5c846bf838d570de984e19"],
  [`${prefix}ranked-source-hints-views-r1.test.mjs`, "12bfc2f32ed4f698362761ea8284ac694776be788e20ea7e6a00e39b34ed72e8"]
]);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r15-source.${reason}`);};

async function main() {
  const prepareRelative = "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs";
  const priorPrepare = join(priorRoot, prepareRelative), currentPrepare = join(sourceRoot, prepareRelative);
  need(sha(readFileSync(priorPrepare)) === sha(readFileSync(currentPrepare)), "binder-source-drift");
  const {bindSourceTree} = await import(pathToFileURL(currentPrepare).href);
  const before = bindSourceTree(priorRoot), after = bindSourceTree(sourceRoot);
  need(before.file_count === 405 && before.tree_sha256 === priorTreeSha &&
    after.file_count === 406, "tree-basis");
  const beforeMap = new Map(before.sources.map(row => [relative(priorRoot, row.path), row.sha256]));
  const afterMap = new Map(after.sources.map(row => [relative(sourceRoot, row.path), row.sha256]));
  const changedPaths = [...afterMap].filter(([path, digest]) => beforeMap.get(path) !== digest).map(([path]) => path);
  const removedPaths = [...beforeMap.keys()].filter(path => !afterMap.has(path));
  need(removedPaths.length === 0 && changedPaths.length === changed.size &&
    changedPaths.every(path => afterMap.get(path) === changed.get(path)) &&
    !beforeMap.has(`${prefix}ranked-source-hints-views-r1.test.mjs`),
    "unexpected-source-change");
  const tests = after.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
  need(tests.length === 15 && tests.includes(join(sourceRoot,
    `${prefix}ranked-source-hints-views-r1.test.mjs`)), "test-file-set");
  const run = spawnSync(node, ["--test", ...tests],
    {cwd: sourceRoot, encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024});
  need(!run.error && run.status === 0 && run.signal === null, "test-process");
  const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
  const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
  need(testsRun >= 85 && passed === testsRun && failed === 0, "test-counts");
  const receipt = {schema_version: "are.g01-r15-source-snapshot/v1", status: "tested-not-frozen",
    prior_root: priorRoot, prior_tree_sha256: before.tree_sha256,
    source_root: sourceRoot, source_tree_sha256: after.tree_sha256, file_count: after.file_count,
    changed_files: [...changed].map(([relative_path, sha256]) => ({relative_path, sha256})),
    test_files: tests.length, tests_run: testsRun, passed, failed,
    test_stdout_sha256: sha(run.stdout), test_stderr_sha256: sha(run.stderr),
    node_version: process.version, script_sha256: sha(readFileSync(import.meta.filename)),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Prospective source-tree and tests only; exposed projection replay is separate and no benchmark quality follows",
    open_questions: ["Will a live exposed-task continuation qualify this candidate?",
      "Can a separately drawn, frozen successor cohort clear 24/24 paired accounting and interval gates?"]};
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(output, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, source_tree_sha256: after.tree_sha256,
    file_count: after.file_count, tests_run: testsRun, passed, output_sha256: sha(bytes)}));
}

main().catch(error => {console.error(JSON.stringify({status: "source-verification-error", error: String(error.message)})); process.exitCode = 2;});
