// Isolate a third, pre-model-repaired exposed control diagnostic from r10/r15/r16.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r17-exposed.${why}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const originalSource = `${base}/g01-source-r10-candidate-r14`;
const sourceRoot = `${base}/g01-source-r10-prospective-r17`;
const receiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
const receiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const campaignRoot = `${base}/g01-product-replication-r10`;
const campaignSha = "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c";
const pairRoot = `${campaignRoot}/cpp-json-b8ef1754`;
const previousFreeze = `${base}/g01-r16-exposed-control-160k-r1/CONTROL-FREEZE.json`;
const previousSha = "784997426cde3b82f9ae27ef4144e46bbca292c8ecb0b129760329c082328be4";
const root = `${base}/g01-r17-exposed-control-160k-r1`;
const outputRoot = "/tmp/are-g01-r17-exposed-control-160k-r1";
const bytes = p => readFileSync(p);
const read = p => JSON.parse(bytes(p));
const sha = v => createHash("sha256").update(v).digest("hex");
const encoded = v => Buffer.from(`${JSON.stringify(v, null, 2)}\n`);
need(sha(bytes(receiptPath)) === receiptSha && sha(bytes(`${campaignRoot}/CAMPAIGN-FREEZE.json`)) === campaignSha &&
  sha(bytes(previousFreeze)) === previousSha && !existsSync(root) && !existsSync(outputRoot), "inputs-or-output-exists");
const sourceReceipt = read(receiptPath), campaign = read(`${campaignRoot}/CAMPAIGN-FREEZE.json`);
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 407 && sourceReceipt.passed === 90 &&
  campaign.status === "frozen-before-dispatch" && campaign.ordered_tasks?.some(t => t.slug === "cpp-json-b8ef1754"), "source-or-campaign-shape");
const plan = read(`${pairRoot}/PAIR-PLAN.json`), originalFreezePath = plan.arms?.control?.freeze_path;
need(originalFreezePath === `${pairRoot}/CONTROL-FREEZE.json` && sha(bytes(originalFreezePath)) === plan.arms.control.freeze_sha256,
  "original-arm-drift");
const originalFreeze = read(originalFreezePath), originalConfig = read(originalFreeze.config_path), terminal = read(`${pairRoot}/PAIR-RESULT.json`);
need(terminal.status === "unscored" && terminal.arms?.control?.error === "intent-anchor-episode.budget-exhausted" &&
  originalFreeze.task_sha256 === terminal.task_sha256 && originalFreeze.output_root === `${pairRoot}/control`, "original-result-drift");
const prepare = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const {bindSourceTree} = await import(pathToFileURL(prepare).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 407 && source.tree_sha256 === sourceReceipt.source_tree_sha256, "source-tree-drift");
const remap = v => JSON.parse(JSON.stringify(v).replaceAll(`${originalSource}/`, `${sourceRoot}/`));
const config = remap(originalConfig);
config.experiment_id = "g01-r17-exposed-control-160k-r1";
config.total_tokens_per_arm = 160000;
config.tasks[0].cell_template.limits.total_tokens = 160000;
const configBytes = encoded(config), configPath = join(root, "CONFIG.json");
const freeze = remap(originalFreeze);
freeze.config_path = configPath;
freeze.config_sha256 = sha(configBytes);
freeze.output_root = outputRoot;
delete freeze.source_out;
freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: originalFreeze.task_sha256}];
freeze.claim_ceiling = "Exposed r17 control budget/native-score feasibility only; no fresh holdout or superiority";
need(freeze.sources.length === 408 && freeze.sources.every(b => sha(bytes(b.path)) === b.sha256), "source-binding");
const freezeBytes = encoded(freeze), freezePath = join(root, "CONTROL-FREEZE.json");
const projection = {status: mode === "--check" ? "read-only-ready" : "frozen-before-dispatch",
  root, output_root: outputRoot, task_sha256: freeze.task_sha256, source_tree_sha256: source.tree_sha256,
  source_count: freeze.sources.length, config_sha256: sha(configBytes), freeze_sha256: sha(freezeBytes),
  prior_failed_freeze_sha256: previousSha, model_calls: 0, claim_ceiling: freeze.claim_ceiling};
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  writeFileSync(freezePath, freezeBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "PRE-DISPATCH.json"), encoded(projection), {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify(projection));
