// Two-file (code + test), separately versioned source snapshot for Django.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const mode = process.argv[2];
if (!["--check", "--verify"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-r32-source.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-r32-source.${reason}`);};
const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-source-r10-prospective-r17`;
const newRoot = `${base}/g01-source-r10-prospective-r32`;
const evidenceRoot = `${base}/g01-source-r10-prospective-r32-evidence`;
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.mjs";
const testRelative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.test.mjs";
const oldReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
need(sha(read(oldReceiptPath)) === "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035" &&
  !existsSync(evidenceRoot), "old-receipt-or-output-drift");
const {bindSourceTree} = await import(pathToFileURL(join(newRoot,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
const oldTree = bindSourceTree(oldRoot), newTree = bindSourceTree(newRoot);
need(oldTree.file_count === 407 && newTree.file_count === 407, "file-count");
const oldFiles = new Map(oldTree.sources.map(item => [item.path.slice(oldRoot.length + 1), item.sha256]));
const newFiles = new Map(newTree.sources.map(item => [item.path.slice(newRoot.length + 1), item.sha256]));
need(oldFiles.size === newFiles.size && [...oldFiles.keys()].every(path => newFiles.has(path)),
  "source-set-drift");
const changed = [...oldFiles.keys()].filter(path => oldFiles.get(path) !== newFiles.get(path));
need(changed.length === 2 && changed.includes(relative) && changed.includes(testRelative) &&
  oldFiles.get(relative) === "7341f666ed4fffa30788e44068a387ad962ddb71507f42248c9b036f06f30975" &&
  newFiles.get(relative) === "6b3cb50ab5a4527fe4bc186617835208b9fdb97779e873a620b8877a132199cf",
  "source-delta");
need(oldFiles.get(testRelative) === "0f0a4e26021dfc06cb1f506cc737d0cb6bc66e5d4f18945f3f94d0868bc2f940" &&
  newFiles.get(testRelative) === "05ab65548015ec53863e022e5341b1943eb58ebd3620da1e56318847c2db1566",
  "test-delta");
const tests = ["intent-anchor-convergence-r3.test.mjs", "intent-anchor-episode-r3.test.mjs",
  "intent-anchor-wiring-r3.test.mjs"].map(name => join(newRoot,
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench", name));
const run = spawnSync(process.execPath, ["--test", ...tests],
  {cwd: newRoot, encoding: "utf8", timeout: 120000, maxBuffer: 2 * 1024 * 1024});
need(!run.error && run.status === 0 && /ℹ tests 48/.test(run.stdout) &&
  /ℹ pass 48/.test(run.stdout) && /ℹ fail 0/.test(run.stdout),
  `tests:${String(run.error?.message ?? run.stderr).slice(-300)}`);
const receipt = {schema_version: "are.g01-source-snapshot-r32/v1",
  status: "tested-not-frozen", source_root: newRoot,
  old_source_tree_sha256: oldTree.tree_sha256,
  source_tree_sha256: newTree.tree_sha256, file_count: newTree.file_count,
  changed_files: changed.sort().map(path => ({path, old_sha256: oldFiles.get(path),
    new_sha256: newFiles.get(path)})),
  tests: {suite_count: 3, passed: 48, failed: 0}, model_calls: 0,
  claim_ceiling: "Two-file exposed repair source; no live completion or quality result"};
if (mode === "--verify") {
  mkdirSync(evidenceRoot, {mode: 0o700});
  writeFileSync(join(evidenceRoot, "SOURCE-SNAPSHOT.json"),
    `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--verify" ? receipt.status : "read-only-ready",
  source_tree_sha256: receipt.source_tree_sha256, changed_files: changed,
  file_count: receipt.file_count, passed: 48,
  receipt_sha256: mode === "--verify" ? sha(read(join(evidenceRoot, "SOURCE-SNAPSHOT.json"))) : null}));
