// Prospective 160k diagnostic source. Preserve r15 and all frozen campaigns.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-source-r10-prospective-r15`;
const sourceRoot = `${base}/g01-source-r10-prospective-r16`;
const evidenceRoot = `${base}/g01-source-r10-prospective-r16-evidence`;
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const priorTreeSha = "81dcf4a4cf6e32d239de8641e4518de90d3bfcb3984131f6484a88be90a70edd";
const prefix = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/";
const changed = new Map([
  [`${prefix}discovery-v1/run-recovery-pair.mjs`, "5417e1f4bafa22b60a611421300391517ad073dd32a9da497353dfea8787cdf6"],
  [`${prefix}comparison-arm.mjs`, "c6edf7ce148db610652f0c533115874134c0c2abaa9bd3f2cab2a3b380596f3d"],
  [`${prefix}intent-anchor-arm-r3.mjs`, "92c1e6df4ddb13641999cec31a0d60a11886cbface3a5b9f45c28e3bc1815e3a"],
  [`${prefix}discovery-v1/orchestrate-intent-anchor-r3.mjs`, "4240d8bb3f6a3662b506fb15e204373ea32fc77631d096d5560b5015958f5bbc"],
  [`${prefix}intent-anchor-wiring-r3.test.mjs`, "42e545e10fda158770f40176b258abeb5d0cce5b764783cd9bb246ba301af89e"]
]);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r16-source.${reason}`);};

async function main() {
  need(!existsSync(evidenceRoot), "evidence-exists");
  const prepareRelative = "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs";
  const priorPrepare = join(priorRoot, prepareRelative), currentPrepare = join(sourceRoot, prepareRelative);
  need(sha(readFileSync(priorPrepare)) === sha(readFileSync(currentPrepare)), "binder-source-drift");
  const {bindSourceTree} = await import(pathToFileURL(currentPrepare).href);
  const before = bindSourceTree(priorRoot), after = bindSourceTree(sourceRoot);
  need(before.file_count === 406 && before.tree_sha256 === priorTreeSha && after.file_count === 407, "tree-basis");
  const beforeMap = new Map(before.sources.map(row => [relative(priorRoot, row.path), row.sha256]));
  const afterMap = new Map(after.sources.map(row => [relative(sourceRoot, row.path), row.sha256]));
  const changedPaths = [...afterMap].filter(([path, digest]) => beforeMap.get(path) !== digest).map(([path]) => path);
  const removedPaths = [...beforeMap.keys()].filter(path => !afterMap.has(path));
  need(removedPaths.length === 0 && changedPaths.length === changed.size &&
    changedPaths.every(path => afterMap.get(path) === changed.get(path)), "unexpected-source-change");
  const tests = after.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
  const run = spawnSync(node, ["--test", ...tests],
    {cwd: sourceRoot, encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024});
  need(!run.error && run.status === 0 && run.signal === null, `test-process:${run.stderr.slice(-300)}`);
  const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
  const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
  need(testsRun >= 87 && passed === testsRun && failed === 0, "test-counts");
  const receipt = {schema_version: "are.g01-r16-source-snapshot/v1", status: "tested-not-frozen",
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
