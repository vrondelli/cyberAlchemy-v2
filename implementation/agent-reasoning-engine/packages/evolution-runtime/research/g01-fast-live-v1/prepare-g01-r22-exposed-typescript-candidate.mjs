// Prospective exposed TypeScript candidate qualification of bounded output-cap recovery.
// No model, gold or score call; --check is read-only.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [mode] = process.argv.slice(2);
const need = (value, why) => {if (!value) throw Error(`g01-r22-typescript.${why}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const oldSource = `${base}/g01-source-r10-prospective-r17`;
const sourceRoot = `${base}/g01-source-r10-prospective-r22`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r22-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "b6a6bcba037b8d4623ea494b06b8dabdef607a4b4b09709f7327155ab0f74874";
const oldRoot = `${base}/g01-r20-exposed-transfer-160k-240s-r1`;
const oldFreezeSha = "d367899f14444bdd9c3edb3c5b1a0e31eb8c51624c99744af22fd5783de77d73";
const slug = "typescript-core-8d2ac221";
const root = `${base}/g01-r22-exposed-typescript-candidate-r1`;
const outputRoot = "/tmp/are-g01-r22-exposed-typescript-candidate-r1";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = path => readFileSync(path), read = path => JSON.parse(bytes(path));
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
need(sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(join(oldRoot, "TRANSFER-FREEZE.json"))) === oldFreezeSha &&
  !existsSync(root) && !existsSync(outputRoot), "inputs-or-output-exists");
const sourceReceipt = read(sourceReceiptPath), oldCampaign = read(join(oldRoot, "TRANSFER-FREEZE.json"));
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 408 &&
  sourceReceipt.passed === 94 && oldCampaign.status === "frozen-before-dispatch", "source-shape");
const task = oldCampaign.tasks.find(row => row.slug === slug);
const oldArm = task?.arms.find(row => row.name === "candidate");
need(task?.language === "typescript" &&
  oldArm?.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
  sha(bytes(oldArm.freeze_path)) === oldArm.freeze_sha256, "old-task-drift");
const oldConfig = read(task.config_path), oldFreeze = read(oldArm.freeze_path);
need(oldConfig.context_limit === 8000 && oldConfig.total_tokens_per_arm === 160000 &&
  oldConfig.tasks.length === 1 && oldConfig.tasks[0].task_sha256 === task.task_sha256 &&
  oldConfig.tasks[0].cell_template.provider_profile.model_timeout_ms === 240000,
  "old-budget-shape");
const prepare = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const {bindSourceTree} = await import(pathToFileURL(prepare).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 408 && source.tree_sha256 === sourceReceipt.source_tree_sha256,
  "source-tree-drift");
const remap = value => JSON.parse(JSON.stringify(value).replaceAll(`${oldSource}/`, `${sourceRoot}/`));
const config = remap(oldConfig);
config.experiment_id = "g01-r22-exposed-typescript-candidate-r1";
const configPath = join(root, "CONFIG.json"), configBytes = encode(config);
const freeze = remap(oldFreeze);
freeze.config_path = configPath;
freeze.config_sha256 = sha(configBytes);
freeze.output_root = outputRoot;
delete freeze.source_out;
freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: task.task_sha256}];
freeze.claim_ceiling = "One exposed TypeScript candidate reliability qualification only; no pair or superiority";
need(freeze.sources.length === 409 && freeze.sources.every(binding => sha(bytes(binding.path)) === binding.sha256),
  "source-binding");
const contextRoot = `${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
const {buildIntentAnchorCell} = await import(pathToFileURL(`${contextRoot}/intent-anchor-arm-r3.mjs`).href);
const {comparisonLiveClientFactory} = await import(pathToFileURL(`${contextRoot}/ranked-source-live-client-r1.mjs`).href);
const {createSecretReference} = await import(pathToFileURL(`${sourceRoot}/implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs`).href);
const signal = new AbortController().signal;
const cell = buildIntentAnchorCell({config, task_id: oldFreeze.task_id, arm: oldFreeze.arm});
need(cell.context_limit === 8000 && cell.limits.total_tokens === 160000 &&
  cell.provider_profile.model_timeout_ms === 240000, "cell-budget");
const factory = comparisonLiveClientFactory({credential_path: "unused", signal,
  persistence: {atomicJson: () => {}}, before_dispatch: async () => true,
  credential_override: {registry: {consume: async () => {throw Error("unexpected-secret-access");}},
    reference: createSecretReference({provider_id: "fixture", locator: "unused"})},
  candidate_arm: oldFreeze.arm});
need(typeof factory.create_client({cell, signal}).measure_index === "function", "client-budget");
const freezePath = join(root, "CANDIDATE-FREEZE.json"), freezeBytes = encode(freeze);
const projection = {status: mode === "--check" ? "read-only-ready" : "frozen-before-dispatch",
  source_receipt_sha256: sourceReceiptSha, source_tree_sha256: source.tree_sha256,
  prior_r20_freeze_sha256: oldFreezeSha, prior_arm_freeze_sha256: oldArm.freeze_sha256,
  task_sha256: task.task_sha256, source_count: freeze.sources.length,
  config_sha256: sha(configBytes), freeze_sha256: sha(freezeBytes),
  output_root: outputRoot, model_calls: 0, claim_ceiling: freeze.claim_ceiling};
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  writeFileSync(freezePath, freezeBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "PRE-DISPATCH.json"), encode(projection), {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify(projection));
