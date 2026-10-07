// Separately freeze the exposed control with the tested r16 budget-capable source.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [mode] = process.argv.slice(2);
const need = (value, reason) => {if (!value) throw Error(`g01-r16-exposed.${reason}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-source-r10-candidate-r14`;
const sourceRoot = `${base}/g01-source-r10-prospective-r16`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r16-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "eec841712224b48f7517d3892dc728b9e6bf3dfabb797242e7c3a8915d1cfb86";
const campaignRoot = `${base}/g01-product-replication-r10`;
const campaignFreezeSha = "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c";
const slug = "cpp-json-b8ef1754";
const originalPair = `${campaignRoot}/${slug}`;
const root = `${base}/g01-r16-exposed-control-160k-r1`;
const outputRoot = "/tmp/are-g01-r16-exposed-control-160k-r1";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = path => readFileSync(path);
const read = path => JSON.parse(bytes(path));
const asBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

need(sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(`${campaignRoot}/CAMPAIGN-FREEZE.json`)) === campaignFreezeSha, "source-or-campaign-drift");
const sourceReceipt = read(sourceReceiptPath), campaign = read(`${campaignRoot}/CAMPAIGN-FREEZE.json`);
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 407 &&
  sourceReceipt.passed === 89 && campaign.status === "frozen-before-dispatch" &&
  campaign.ordered_tasks?.some(task => task.slug === slug), "source-or-campaign-shape");
const plan = read(`${originalPair}/PAIR-PLAN.json`);
const originalFreezePath = plan.arms?.control?.freeze_path;
need(originalFreezePath === `${originalPair}/CONTROL-FREEZE.json` &&
  sha(bytes(originalFreezePath)) === plan.arms.control.freeze_sha256, "original-arm-drift");
const originalFreeze = read(originalFreezePath), originalConfig = read(originalFreeze.config_path);
const terminal = read(`${originalPair}/PAIR-RESULT.json`);
need(terminal.status === "unscored" &&
  terminal.arms?.control?.error === "intent-anchor-episode.budget-exhausted" &&
  originalFreeze.task_sha256 === terminal.task_sha256 &&
  originalFreeze.output_root === `${originalPair}/control` &&
  !existsSync(outputRoot) && !existsSync(root), "scope-or-output-exists");
const priorFailed = `${base}/g01-r15-exposed-control-160k-r1/CONTROL-FREEZE.json`;
need(sha(bytes(priorFailed)) === "9090ca88e3961b6dd7d43915805f5b023586f222220a065f262e039d91460b84", "prior-failed-freeze-drift");
const prepare = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const {bindSourceTree} = await import(pathToFileURL(prepare).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 407 && source.tree_sha256 === sourceReceipt.source_tree_sha256,
  "source-tree-drift");
const remap = value => JSON.parse(JSON.stringify(value).replaceAll(`${priorRoot}/`, `${sourceRoot}/`));
const config = remap(originalConfig);
config.experiment_id = "g01-r16-exposed-control-160k-r1";
config.total_tokens_per_arm = 160000;
config.tasks[0].cell_template.limits.total_tokens = 160000;
const configBytes = asBytes(config), configPath = join(root, "CONFIG.json");
const freeze = remap(originalFreeze);
freeze.config_path = configPath;
freeze.config_sha256 = sha(configBytes);
freeze.output_root = outputRoot;
delete freeze.source_out;
freeze.sources = [...source.sources, {path: config.tasks[0].task_path,
  sha256: originalFreeze.task_sha256}];
freeze.claim_ceiling = "Exposed r16 control budget and native-score qualification only; not a fresh holdout or superiority";
need(freeze.sources.length === 408 && freeze.sources.every(binding =>
  sha(bytes(binding.path)) === binding.sha256), "source-binding");
const freezeBytes = asBytes(freeze), freezePath = join(root, "CONTROL-FREEZE.json");
const projection = {status: mode === "--check" ? "read-only-ready" : "frozen-before-dispatch",
  root, output_root: outputRoot, task_sha256: freeze.task_sha256,
  source_tree_sha256: source.tree_sha256, source_count: freeze.sources.length,
  config_sha256: sha(configBytes), freeze_sha256: sha(freezeBytes),
  prior_failed_freeze_sha256: sha(bytes(priorFailed)), model_calls: 0,
  claim_ceiling: freeze.claim_ceiling};
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  writeFileSync(freezePath, freezeBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "PRE-DISPATCH.json"), asBytes(projection), {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify(projection));
