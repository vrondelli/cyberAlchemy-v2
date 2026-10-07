// Prospective G01 r10 source-tree binding and complete snapshot test receipt.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {readFileSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-source-post-r8-candidate-r13`;
const sourceRoot = `${base}/g01-source-r10-candidate-r14`;
const output = `${base}/g01-source-r10-candidate-r14-evidence/SOURCE-SNAPSHOT.json`;
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const priorTreeSha = "8f6c4ba764bea79c6738c952053e6f88e58a6dfb6021d18d964fe43c520144d6";
const changed = "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs";
const added = "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.test.mjs";
const changedSha = "a6c6bc394985d81d3dfc09632bda4c0eff65336bf9ab89659a95c4c1426afac3";
const addedSha = "9c9087e95e6f26e5fe10c0b2f24f0b4c3b38d789da2550c8c7e618c938507183";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r10-source.${reason}`); };

async function main() {
  const prepareRelative = "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs";
  const priorPrepare = join(priorRoot, prepareRelative), currentPrepare = join(sourceRoot, prepareRelative);
  need(sha(readFileSync(priorPrepare)) === sha(readFileSync(currentPrepare)), "binder-source-drift");
  const {bindSourceTree} = await import(pathToFileURL(currentPrepare).href);
  const before = bindSourceTree(priorRoot), after = bindSourceTree(sourceRoot);
  need(before.file_count === 404 && before.tree_sha256 === priorTreeSha && after.file_count === 405,
    "tree-basis");
  const beforeMap = new Map(before.sources.map(row => [relative(priorRoot, row.path), row.sha256]));
  const afterMap = new Map(after.sources.map(row => [relative(sourceRoot, row.path), row.sha256]));
  const changedPaths = [...afterMap].filter(([path, digest]) => beforeMap.get(path) !== digest).map(([path]) => path);
  const removedPaths = [...beforeMap.keys()].filter(path => !afterMap.has(path));
  need(removedPaths.length === 0 && changedPaths.length === 2 &&
    changedPaths.includes(changed) && changedPaths.includes(added) &&
    beforeMap.has(changed) && !beforeMap.has(added) &&
    afterMap.get(changed) === changedSha && afterMap.get(added) === addedSha,
  "unexpected-source-change");
  const tests = after.sources.filter(row => row.path.endsWith(".test.mjs"))
    .map(row => row.path).sort();
  need(tests.length === 14 && tests.includes(join(sourceRoot, added)), "test-file-set");
  const run = spawnSync(node, ["--test", ...tests],
    {cwd: sourceRoot, encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024});
  need(!run.error && run.status === 0 && run.signal === null, "test-process");
  const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
  const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
  need(testsRun === 79 && passed === 79 && failed === 0, "test-counts");
  const receipt = {schema_version: "are.g01-r10-source-snapshot/v1", status: "tested-not-frozen",
    prior_root: priorRoot, prior_tree_sha256: before.tree_sha256,
    source_root: sourceRoot, source_tree_sha256: after.tree_sha256, file_count: after.file_count,
    changed_files: [{relative_path: changed, sha256: changedSha},
      {relative_path: added, sha256: addedSha}],
    test_files: tests.length, tests_run: testsRun, passed, failed,
    test_stdout_sha256: sha(run.stdout), test_stderr_sha256: sha(run.stderr),
    node_version: process.version, script_sha256: sha(readFileSync(import.meta.filename)),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Exact prospective source-tree and test evidence only; no campaign freeze or benchmark superiority proof",
    open_questions: ["Will live-pair storage and provider readiness pass?", "Will a separately frozen 24-pair campaign clear its quality, cost and reliability gates?"]};
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(output, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, source_tree_sha256: after.tree_sha256,
    file_count: after.file_count, tests_run: testsRun, passed,
    output_sha256: sha(bytes)}));
}

main().catch(error => { console.error(JSON.stringify({status: "source-verification-error", error: String(error.message)})); process.exitCode = 2; });
