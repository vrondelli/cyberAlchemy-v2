// Full-tree, no-model source verification for the r11 r3 candidate.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const sourceRoot = `${base}/g01-source-r10-prospective-r32`;
const evidenceRoot = `${base}/g01-r11-r3-source-verification-r1`;
const sourceReceipt = `${base}/g01-source-r10-prospective-r32-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "d6d4c3e2471c81ca2beb62e8d6f85bec230e7d30bb727bcf7a747e8e8602fb86";
const sourceTreeSha = "f51f168ed51774aee8745cfb61d5dd9a7616b137d3cf41b4a5abe02c214e70f7";
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r11-r3-source.${reason}`);};

need(!existsSync(evidenceRoot), "evidence-exists");
need(sha(readFileSync(sourceReceipt)) === sourceReceiptSha, "source-receipt-drift");
const prior = JSON.parse(readFileSync(sourceReceipt));
need(prior.source_root === sourceRoot && prior.source_tree_sha256 === sourceTreeSha &&
  prior.file_count === 407 && prior.tests?.passed === 48 && prior.tests?.failed === 0,
"source-receipt-shape");
const {bindSourceTree} = await import(pathToFileURL(join(sourceRoot,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
const tree = bindSourceTree(sourceRoot);
need(tree.file_count === 407 && tree.tree_sha256 === sourceTreeSha, "source-tree-drift");
const tests = tree.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
need(tests.length > 0, "test-list-empty");
const run = spawnSync(node, ["--test", ...tests],
  {cwd: sourceRoot, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024});
need(!run.error && run.status === 0 && run.signal === null,
  `test-process:${String(run.error?.message ?? run.stderr).slice(-300)}`);
const count = label => Number(run.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
const testsRun = count("tests"), passed = count("pass"), failed = count("fail");
need(testsRun >= 90 && passed === testsRun && failed === 0, "test-counts");
const receipt = {schema_version: "are.g01-r11-r3-source-verification/v1", status: "tested-not-frozen",
  source_root: sourceRoot, source_tree_sha256: tree.tree_sha256, file_count: tree.file_count,
  prior_source_receipt_sha256: sourceReceiptSha, test_files: tests.length,
  tests_run: testsRun, passed, failed, test_stdout_sha256: sha(run.stdout),
  test_stderr_sha256: sha(run.stderr), node_version: process.version,
  script_sha256: sha(readFileSync(import.meta.filename)), model_calls: 0, gold_loaded: false,
  claim_ceiling: "Full r32 source tree and bound tests only; r11 campaign remains unfrozen and unrun",
  open_questions: ["Will a guarded live pair stay within root and tmpfs capacity?", "Will a fresh 24-pair cohort clear its frozen quality, reliability, and cost gates?"]};
mkdirSync(evidenceRoot, {mode: 0o700});
const output = join(evidenceRoot, "SOURCE-VERIFICATION.json");
const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
writeFileSync(output, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, source_tree_sha256: receipt.source_tree_sha256,
  file_count: receipt.file_count, test_files: tests.length, tests_run: testsRun, passed,
  receipt_sha256: sha(bytes)}));
