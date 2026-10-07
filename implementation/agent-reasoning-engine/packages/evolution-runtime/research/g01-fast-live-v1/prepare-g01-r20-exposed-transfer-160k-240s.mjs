// Separate r20 exposed transfer after r19's 120-second unknown-usage timeout.
// No model, gold or score call; --check is read-only.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r20-transfer.${why}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime", oldSource = `${base}/g01-source-r10-candidate-r14`;
const sourceRoot = `${base}/g01-source-r10-prospective-r17`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const campaignRoot = `${base}/g01-product-replication-r10`;
const campaignSha = "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c";
const root = `${base}/g01-r20-exposed-transfer-160k-240s-r1`;
const outputRoot = "/tmp/are-g01-r20-exposed-transfer-160k-240s-r1";
const selected = [
  {language: "cpp", slug: "cpp-fmt-13ef1e10", order: 3},
  {language: "java", slug: "java-jackson-6ba3d94b", order: 5},
  {language: "javascript", slug: "javascript-svelte-55d29da8", order: 7},
  {language: "typescript", slug: "typescript-core-8d2ac221", order: 11},
  {language: "python", slug: "python-requests-9cca0774", order: 15}
];
const sha = b => createHash("sha256").update(b).digest("hex"), bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const encode = v => Buffer.from(`${JSON.stringify(v, null, 2)}\n`);
need(sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(`${campaignRoot}/CAMPAIGN-FREEZE.json`)) === campaignSha &&
  !existsSync(root) && !existsSync(outputRoot), "source-campaign-or-output-drift");
const campaign = read(`${campaignRoot}/CAMPAIGN-FREEZE.json`), sourceReceipt = read(sourceReceiptPath);
need(campaign.status === "frozen-before-dispatch" && campaign.ordered_tasks?.length === 24 &&
  sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 407 && sourceReceipt.passed === 90 &&
  sha(bytes(`${base}/g01-r19-exposed-transfer-160k-r1/FAILURE-AUDIT.json`)) === "720e29738e9ddb278a4e3fba96ad865fd978e471560026dfdeb3fa952ec14b78" &&
  selected.every(s => campaign.ordered_tasks[s.order - 1]?.slug === s.slug && s.slug.startsWith(`${s.language}-`)),
  "fixed-selection-drift");
const prepare = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const {bindSourceTree} = await import(pathToFileURL(prepare).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 407 && source.tree_sha256 === sourceReceipt.source_tree_sha256, "source-tree-drift");
const contextRoot = `${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
const {buildIntentAnchorCell} = await import(pathToFileURL(`${contextRoot}/intent-anchor-arm-r3.mjs`).href);
const {comparisonLiveClientFactory} = await import(pathToFileURL(`${contextRoot}/ranked-source-live-client-r1.mjs`).href);
const {createSecretReference} = await import(pathToFileURL(`${sourceRoot}/implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs`).href);
const signal = new AbortController().signal;
const remap = v => JSON.parse(JSON.stringify(v).replaceAll(`${oldSource}/`, `${sourceRoot}/`));
const tasks = [], writes = [];
for (const s of selected) {
  const oldRoot = join(campaignRoot, s.slug), oldPlan = read(join(oldRoot, "PAIR-PLAN.json"));
  const oldControlPath = join(oldRoot, "CONTROL-FREEZE.json"), oldCandidatePath = join(oldRoot, "CANDIDATE-FREEZE.json");
  need(oldPlan.status === "frozen-before-dispatch" && oldPlan.root === oldRoot &&
    oldPlan.arms?.control?.freeze_path === oldControlPath &&
    oldPlan.arms?.candidate?.freeze_path === oldCandidatePath &&
    sha(bytes(oldControlPath)) === oldPlan.arms.control.freeze_sha256 &&
    sha(bytes(oldCandidatePath)) === oldPlan.arms.candidate.freeze_sha256, `${s.slug}-old-plan-drift`);
  const oldControl = read(oldControlPath), oldCandidate = read(oldCandidatePath);
  need(oldControl.task_sha256 === oldCandidate.task_sha256 &&
    oldControl.arm === "intent-anchor-convergence-r3" &&
    oldCandidate.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    oldControl.config_path === oldCandidate.config_path, `${s.slug}-old-arm-shape`);
  const config = remap(read(oldControl.config_path));
  config.experiment_id = `g01-r20-${s.slug}-160k-240s-r1`;
  config.total_tokens_per_arm = 160000;
  config.tasks[0].cell_template.limits.total_tokens = 160000;
  config.tasks[0].cell_template.provider_profile.model_timeout_ms = 240000;
  need(config.context_limit === 8000 && config.tasks.length === 1 &&
    config.tasks[0].task_sha256 === oldControl.task_sha256, `${s.slug}-config-shape`);
  const taskRoot = join(root, s.slug), configPath = join(taskRoot, "CONFIG.json"), configBytes = encode(config);
  const arms = [];
  for (const [name, old] of [["control", oldControl], ["candidate", oldCandidate]]) {
    const cell = buildIntentAnchorCell({config, task_id: old.task_id, arm: old.arm});
    need(cell.context_limit === 8000 && cell.limits.total_tokens === 160000 &&
      cell.phase_contract.exploration_tokens === 152000 && cell.phase_contract.finalization_tokens === 8000 &&
      cell.provider_profile.model_timeout_ms === 240000,
      `${s.slug}-${name}-cell-budget`);
    const factory = comparisonLiveClientFactory({credential_path: "unused", signal,
      persistence: {atomicJson: () => {}}, before_dispatch: async () => true,
      credential_override: {registry: {consume: async () => {throw Error("unexpected-secret-access");}},
        reference: createSecretReference({provider_id: "fixture", locator: "unused"})}, candidate_arm: old.arm});
    need(typeof factory.create_client({cell, signal}).measure_index === "function", `${s.slug}-${name}-client-budget`);
    const freeze = remap(old);
    freeze.config_path = configPath;
    freeze.config_sha256 = sha(configBytes);
    freeze.output_root = join(outputRoot, s.slug, name);
    delete freeze.source_out;
    freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: old.task_sha256}];
    freeze.claim_ceiling = "Five-language exposed transfer development only; no fresh holdout or superiority";
    need(freeze.sources.length === 408 && freeze.sources.every(b => sha(bytes(b.path)) === b.sha256),
      `${s.slug}-${name}-source-binding`);
    const freezePath = join(taskRoot, `${name.toUpperCase()}-FREEZE.json`), freezeBytes = encode(freeze);
    arms.push({name, arm: old.arm, freeze_path: freezePath, freeze_sha256: sha(freezeBytes),
      output_root: freeze.output_root});
    writes.push({path: freezePath, data: freezeBytes});
  }
  const task = {language: s.language, slug: s.slug, original_r10_order: s.order,
    task_sha256: oldControl.task_sha256, config_path: configPath, config_sha256: sha(configBytes),
    original_plan_sha256: sha(bytes(join(oldRoot, "PAIR-PLAN.json"))), order: ["control", "candidate"], arms};
  tasks.push(task);
  writes.push({path: configPath, data: configBytes});
}
const freeze = {schema_version: "are.g01-r20-exposed-transfer-freeze/v1", status: "frozen-before-dispatch",
  source_receipt_sha256: sourceReceiptSha, source_tree_sha256: source.tree_sha256,
  original_campaign_sha256: campaignSha, selection_rule: "first r10-frozen task per language after r18 task, in original r10 order",
  output_root: outputRoot, tasks,
  budget: {context_tokens_per_request: 8000, total_tokens_per_arm: 160000,
    maximum_calls_per_arm: 96, model_timeout_ms: 240000, model: "glm-5.3-flash", automatic_retries: 0},
  execution: "serial in frozen task and arm order; attempt all unless provider/unknown-usage safety stop; no score-guided stopping or replacement",
  analysis: "Report per-task paired native File-/Span-F1, known token/time ratios, failures and descriptive five-pair means; no inferential or product claim",
  prior_r19_safety_stop_audit_sha256: "720e29738e9ddb278a4e3fba96ad865fd978e471560026dfdeb3fa952ec14b78",
  claim_ceiling: "Five already manifested exposed pairs under a prospective timeout policy only; not fresh holdout or superiority"};
const freezeBytes = encode(freeze), freezePath = join(root, "TRANSFER-FREEZE.json");
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  for (const s of selected) mkdirSync(join(root, s.slug), {mode: 0o700});
  for (const row of writes) writeFileSync(row.path, row.data, {flag: "wx", mode: 0o600});
  writeFileSync(freezePath, freezeBytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--check" ? "read-only-ready" : freeze.status,
  freeze_sha256: sha(freezeBytes), source_tree_sha256: source.tree_sha256,
  tasks: tasks.map(t => ({language: t.language, slug: t.slug,
    control_sha256: t.arms[0].freeze_sha256, candidate_sha256: t.arms[1].freeze_sha256})),
  predispatch_clients: 10, model_calls: 0, claim_ceiling: freeze.claim_ceiling}));
