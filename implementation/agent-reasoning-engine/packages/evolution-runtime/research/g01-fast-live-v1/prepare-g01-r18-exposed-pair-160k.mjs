// Freeze one already-exposed G01 pair on one tested source and equal arm budgets.
// --check is read-only and exercises both client constructors without a secret or HTTP.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r18-pair.${why}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const oldSource = `${base}/g01-source-r10-candidate-r14`;
const sourceRoot = `${base}/g01-source-r10-prospective-r17`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const oldPair = `${base}/g01-product-replication-r10/cpp-json-b8ef1754`;
const oldCampaignSha = "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c";
const root = `${base}/g01-r18-exposed-pair-160k-r1`;
const outputRoot = "/tmp/are-g01-r18-exposed-pair-160k-r1";
const sha = b => createHash("sha256").update(b).digest("hex");
const bytes = p => readFileSync(p);
const read = p => JSON.parse(bytes(p));
const encode = v => Buffer.from(`${JSON.stringify(v, null, 2)}\n`);
need(sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(`${base}/g01-product-replication-r10/CAMPAIGN-FREEZE.json`)) === oldCampaignSha &&
  !existsSync(root) && !existsSync(outputRoot), "source-campaign-or-output-drift");
const sourceReceipt = read(sourceReceiptPath), oldPlan = read(`${oldPair}/PAIR-PLAN.json`);
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 407 &&
  sourceReceipt.passed === 90 && oldPlan.root === oldPair &&
  oldPlan.control_arm === "intent-anchor-convergence-r3" &&
  oldPlan.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
  "source-or-pair-shape");
const prepare = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const {bindSourceTree} = await import(pathToFileURL(prepare).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 407 && source.tree_sha256 === sourceReceipt.source_tree_sha256, "source-tree-drift");
const oldControlPath = `${oldPair}/CONTROL-FREEZE.json`, oldCandidatePath = `${oldPair}/CANDIDATE-FREEZE.json`;
need(oldPlan.arms?.control?.freeze_path === oldControlPath &&
  oldPlan.arms?.candidate?.freeze_path === oldCandidatePath &&
  sha(bytes(oldControlPath)) === oldPlan.arms.control.freeze_sha256 &&
  sha(bytes(oldCandidatePath)) === oldPlan.arms.candidate.freeze_sha256, "old-arm-drift");
const oldControl = read(oldControlPath), oldCandidate = read(oldCandidatePath);
need(oldControl.task_sha256 === oldCandidate.task_sha256 &&
  oldControl.arm === "intent-anchor-convergence-r3" &&
  oldCandidate.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
  oldControl.config_path === oldCandidate.config_path, "old-arm-shape");
const remap = v => JSON.parse(JSON.stringify(v).replaceAll(`${oldSource}/`, `${sourceRoot}/`));
const config = remap(read(oldControl.config_path));
config.experiment_id = "g01-r18-exposed-pair-160k-r1";
config.total_tokens_per_arm = 160000;
config.tasks[0].cell_template.limits.total_tokens = 160000;
need(config.context_limit === 8000 && config.tasks.length === 1 &&
  config.tasks[0].task_sha256 === oldControl.task_sha256, "config-shape");

// No-model end-to-end budget construction for both frozen arm identities.
const contextRoot = `${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
const {buildIntentAnchorCell} = await import(pathToFileURL(`${contextRoot}/intent-anchor-arm-r3.mjs`).href);
const {comparisonLiveClientFactory} = await import(pathToFileURL(`${contextRoot}/ranked-source-live-client-r1.mjs`).href);
const {createSecretReference} = await import(pathToFileURL(`${sourceRoot}/implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs`).href);
const signal = new AbortController().signal;
for (const arm of [oldControl.arm, oldCandidate.arm]) {
  const cell = buildIntentAnchorCell({config, task_id: oldControl.task_id, arm});
  need(cell.context_limit === 8000 && cell.limits.total_tokens === 160000 &&
    cell.phase_contract.exploration_tokens === 152000 &&
    cell.phase_contract.finalization_tokens === 8000, "cell-budget");
  const factory = comparisonLiveClientFactory({credential_path: "unused", signal,
    persistence: {atomicJson: () => {}}, before_dispatch: async () => true,
    credential_override: {registry: {consume: async () => {throw Error("unexpected-secret-access");}},
      reference: createSecretReference({provider_id: "fixture", locator: "unused"})}, candidate_arm: arm});
  need(typeof factory.create_client({cell, signal}).measure_index === "function", "client-budget");
}

const configPath = join(root, "CONFIG.json"), configBytes = encode(config);
const freezeRows = [];
for (const [name, old] of [["control", oldControl], ["candidate", oldCandidate]]) {
  const freeze = remap(old);
  freeze.config_path = configPath;
  freeze.config_sha256 = sha(configBytes);
  freeze.output_root = join(outputRoot, name);
  delete freeze.source_out;
  freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: old.task_sha256}];
  freeze.claim_ceiling = "One exposed matched-budget development pair; no fresh holdout, interval or superiority";
  need(freeze.sources.length === 408 && freeze.sources.every(b => sha(bytes(b.path)) === b.sha256), "binding-drift");
  const path = join(root, `${name.toUpperCase()}-FREEZE.json`), data = encode(freeze);
  freezeRows.push({name, path, data, sha256: sha(data), arm: freeze.arm,
    output_root: freeze.output_root, total_tokens: 160000, context_limit: 8000});
}
const pair = {schema_version: "are.g01-r18-exposed-pair-freeze/v1", status: "frozen-before-dispatch",
  task_sha256: oldControl.task_sha256, source_receipt_sha256: sourceReceiptSha,
  source_tree_sha256: source.tree_sha256, config_path: configPath, config_sha256: sha(configBytes),
  output_root: outputRoot, order: ["control", "candidate"], arms: freezeRows.map(({data, ...r}) => r),
  budget: {context_tokens_per_request: 8000, total_tokens_per_arm: 160000, maximum_calls_per_arm: 96,
    model: "glm-5.3-flash", automatic_retries: 0},
  analysis: "Both arms scored natively after independent pre-score seals; report differences descriptively only on this exposed task; no stopping on interim score",
  prior_exposure: {r10_pair_path: oldPair, r15_candidate_only: true, r17_control_only: true},
  claim_ceiling: "Exposed matched-budget development pair only; no fresh-cohort or superiority claim"};
const pairBytes = encode(pair), pairPath = join(root, "PAIR-FREEZE.json");
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  for (const r of freezeRows) writeFileSync(r.path, r.data, {flag: "wx", mode: 0o600});
  writeFileSync(pairPath, pairBytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--check" ? "read-only-ready" : pair.status,
  pair_sha256: sha(pairBytes), config_sha256: sha(configBytes), source_tree_sha256: source.tree_sha256,
  arms: freezeRows.map(({name, sha256, arm, output_root}) => ({name, sha256, arm, output_root})),
  predispatch_clients: 2, model_calls: 0, claim_ceiling: pair.claim_ceiling}));
