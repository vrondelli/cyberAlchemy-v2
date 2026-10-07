// Prospective 2304-token output-reservation test on the already exposed TypeScript task.
// This program performs no model or gold request; --check is read-only.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [mode] = process.argv.slice(2);
const need = (value, why) => {if (!value) throw Error(`g01-r23-typescript.${why}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const priorSource = `${base}/g01-source-r10-prospective-r22`;
const sourceRoot = `${base}/g01-source-r10-prospective-r23`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r23-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "480e7a4f9e902a149da2b2b735cb26c1ca603e0a4e968a39b178c61a8c1a1ea2";
const priorRoot = `${base}/g01-r22-exposed-typescript-candidate-r1`;
const priorFreezeSha = "e236bede0fc67fe7bc0b85b0167281f5cf522b1353ff04ff4c601b3d3ecdd04b";
const failureAuditSha = "7fed0d3ca14ae3cb4aab447940e4ec186572ad7b04adc6b11df8648650e822c8";
const root = `${base}/g01-r23-exposed-typescript-candidate-r1`;
const outputRoot = "/tmp/are-g01-r23-exposed-typescript-candidate-r1";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = path => readFileSync(path), read = path => JSON.parse(bytes(path));
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
need(sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(join(priorRoot, "CANDIDATE-FREEZE.json"))) === priorFreezeSha &&
  sha(bytes(join(priorRoot, "FAILURE-AUDIT.json"))) === failureAuditSha &&
  !existsSync(root) && !existsSync(outputRoot), "inputs-or-output-exists");
const sourceReceipt = read(sourceReceiptPath), priorFreeze = read(join(priorRoot, "CANDIDATE-FREEZE.json"));
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 408 &&
  sourceReceipt.passed === 95 && priorFreeze.arm ===
  "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1", "source-or-arm-shape");
const priorConfig = read(priorFreeze.config_path);
need(priorConfig.context_limit === 8000 && priorConfig.total_tokens_per_arm === 160000 &&
  priorConfig.tasks.length === 1 && priorConfig.tasks[0].cell_template.limits.output_cap === 2048 &&
  priorConfig.tasks[0].cell_template.provider_profile.model_timeout_ms === 240000,
  "prior-budget-shape");
const prepare = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const {bindSourceTree} = await import(pathToFileURL(prepare).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 408 && source.tree_sha256 === sourceReceipt.source_tree_sha256,
  "source-tree-drift");
const remap = value => JSON.parse(JSON.stringify(value).replaceAll(`${priorSource}/`, `${sourceRoot}/`));
const config = remap(priorConfig);
config.experiment_id = "g01-r23-exposed-typescript-candidate-r1";
config.tasks[0].cell_template.limits.output_cap = 2304;
const configPath = join(root, "CONFIG.json"), configBytes = encode(config);
const freeze = remap(priorFreeze);
freeze.config_path = configPath;
freeze.config_sha256 = sha(configBytes);
freeze.output_root = outputRoot;
delete freeze.source_out;
freeze.sources = [...source.sources, {path: config.tasks[0].task_path,
  sha256: priorFreeze.task_sha256}];
freeze.claim_ceiling = "One exposed TypeScript 2304-cap candidate only; no pair or superiority";
need(freeze.sources.length === 409 && freeze.sources.every(binding =>
  sha(bytes(binding.path)) === binding.sha256), "source-binding");
const contextRoot = `${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
const {buildIntentAnchorCell} = await import(pathToFileURL(`${contextRoot}/intent-anchor-arm-r3.mjs`).href);
const {comparisonLiveClientFactory} = await import(pathToFileURL(`${contextRoot}/ranked-source-live-client-r1.mjs`).href);
const {createSecretReference} = await import(pathToFileURL(`${sourceRoot}/implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs`).href);
const signal = new AbortController().signal;
const cell = buildIntentAnchorCell({config, task_id: freeze.task_id, arm: freeze.arm});
need(cell.context_limit === 8000 && cell.limits.output_cap === 2304 &&
  cell.limits.total_tokens === 160000 && cell.provider_profile.model_timeout_ms === 240000,
  "cell-budget");
const factory = comparisonLiveClientFactory({credential_path: "unused", signal,
  persistence: {atomicJson: () => {}}, before_dispatch: async () => true,
  credential_override: {registry: {consume: async () => {throw Error("unexpected-secret-access");}},
    reference: createSecretReference({provider_id: "fixture", locator: "unused"})},
  candidate_arm: freeze.arm});
const client = factory.create_client({cell, signal});
need(typeof client.measure_index === "function" &&
  client.transport.maximum_output_tokens === 2304, "client-budget");
const r22FinalReservedInput = 5641;
need(r22FinalReservedInput + cell.limits.output_cap + 2 === 7947 &&
  r22FinalReservedInput + cell.limits.output_cap + 2 <= 8000, "observed-envelope");
const freezePath = join(root, "CANDIDATE-FREEZE.json"), freezeBytes = encode(freeze);
const projection = {status: mode === "--check" ? "read-only-ready" : "frozen-before-dispatch",
  source_receipt_sha256: sourceReceiptSha, source_tree_sha256: source.tree_sha256,
  prior_freeze_sha256: priorFreezeSha, prior_failure_audit_sha256: failureAuditSha,
  task_sha256: freeze.task_sha256, source_count: freeze.sources.length,
  context_limit: 8000, output_cap: 2304, total_tokens_per_arm: 160000,
  prior_failure_last_reserved_input: r22FinalReservedInput,
  prior_failure_envelope_at_new_cap: 7947, prior_failure_envelope_headroom: 53,
  config_sha256: sha(configBytes), freeze_sha256: sha(freezeBytes),
  output_root: outputRoot, model_calls: 0, claim_ceiling: freeze.claim_ceiling};
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  writeFileSync(freezePath, freezeBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "PRE-DISPATCH.json"), encode(projection), {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify(projection));
