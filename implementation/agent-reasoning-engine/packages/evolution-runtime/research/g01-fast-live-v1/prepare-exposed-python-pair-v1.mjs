// Reusable G01 exposed Python pair preparer. --check has no writes/model/gold access.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [mode, inputPath] = process.argv.slice(2);
const need = (value, reason) => {if (!value) throw Error(`g01-exposed-python-pair.${reason}`);};
need(["--check", "--freeze"].includes(mode) && /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.json$/.test(inputPath ?? "") &&
  !inputPath.includes("/../") && process.argv.length === 4, "arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const inputBytes = read(inputPath), input = JSON.parse(inputBytes);
need(input.schema_version === "are.g01-exposed-python-pair-input/v1" &&
  /^g01-r[0-9]+-[a-z0-9-]+-r[0-9]+$/.test(input.study_id) &&
  /^python-[a-z0-9-]+-[a-f0-9]{8}$/.test(input.task_slug) &&
  Number.isSafeInteger(input.original_order) && input.original_order >= 16 && input.original_order <= 24 &&
  /^python-[a-z0-9-]+-[a-f0-9]{8}$/.test(input.preceding_task_slug) &&
  ["original_pair_sha256", "original_control_sha256", "original_candidate_sha256",
    "original_config_sha256", "import_rule_sha256"].every(key => /^[a-f0-9]{64}$/.test(input[key])) &&
  (input.source_revision === undefined || /^r[0-9]+$/.test(input.source_revision)) &&
  (input.source_receipt_sha256 === undefined || /^[a-f0-9]{64}$/.test(input.source_receipt_sha256)) &&
  (input.source_test_passed === undefined || Number.isSafeInteger(input.source_test_passed)) &&
  input.context_window === 8000 && input.total_tokens_per_arm === 160000 &&
  input.model_timeout_ms === 240000 && input.automatic_retries === 0 &&
  typeof input.claim_ceiling === "string" && input.claim_ceiling.length > 0, "input-shape");
const base = "/opt/are/evolution-runtime";
const root = `${base}/${input.study_id}`, outputRoot = `/tmp/are-${input.study_id}`;
const campaignRoot = `${base}/g01-product-replication-r10`;
const taskRoot = join(campaignRoot, input.task_slug);
const oldSource = `${base}/g01-source-r10-candidate-r14`;
const sourceRevision = input.source_revision ?? "r17";
const sourceRoot = `${base}/g01-source-r10-prospective-${sourceRevision}`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-${sourceRevision}-evidence/SOURCE-SNAPSHOT.json`;
const rulePath = `${base}/g01-relative-import-tools-r1/python-relative-import-target-r1.mjs`;
const campaignSha = "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c";
const sourceReceiptSha = input.source_receipt_sha256 ?? "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
need(!existsSync(root) && !existsSync(outputRoot) &&
  sha(read(join(campaignRoot, "CAMPAIGN-FREEZE.json"))) === campaignSha &&
  sha(read(sourceReceiptPath)) === sourceReceiptSha &&
  sha(read(join(taskRoot, "PAIR-PLAN.json"))) === input.original_pair_sha256 &&
  sha(read(join(taskRoot, "CONTROL-FREEZE.json"))) === input.original_control_sha256 &&
  sha(read(join(taskRoot, "CANDIDATE-FREEZE.json"))) === input.original_candidate_sha256 &&
  sha(read(join(taskRoot, "CONFIG.json"))) === input.original_config_sha256 &&
  sha(read(rulePath)) === input.import_rule_sha256, "pinned-input-or-output-drift");
const campaign = json(join(campaignRoot, "CAMPAIGN-FREEZE.json"));
need(campaign.ordered_tasks.length === 24 &&
  campaign.ordered_tasks[input.original_order - 2].slug === input.preceding_task_slug &&
  campaign.ordered_tasks[input.original_order - 1].slug === input.task_slug, "original-order-drift");
const oldControl = json(join(taskRoot, "CONTROL-FREEZE.json"));
const oldCandidate = json(join(taskRoot, "CANDIDATE-FREEZE.json"));
need(oldControl.arm === "intent-anchor-convergence-r3" &&
  oldCandidate.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
  oldControl.task_sha256 === oldCandidate.task_sha256 &&
  oldControl.sources.length === 406 && oldCandidate.sources.length === 406,
"old-arm-shape");
const sourceReceipt = json(sourceReceiptPath);
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 407 &&
  (sourceReceipt.tests?.passed ?? sourceReceipt.passed) === (input.source_test_passed ?? 90) &&
  (sourceReceipt.tests?.failed ?? 0) === 0, "source-receipt-shape");
const {bindSourceTree} = await import(pathToFileURL(`${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 407 && source.tree_sha256 === sourceReceipt.source_tree_sha256, "source-tree-drift");
const remap = value => JSON.parse(JSON.stringify(value).replaceAll(`${oldSource}/`, `${sourceRoot}/`));
const config = remap(json(join(taskRoot, "CONFIG.json")));
config.experiment_id = input.study_id;
config.total_tokens_per_arm = input.total_tokens_per_arm;
config.tasks[0].cell_template.limits.total_tokens = input.total_tokens_per_arm;
config.tasks[0].cell_template.provider_profile.model_timeout_ms = input.model_timeout_ms;
need(config.context_limit === input.context_window && config.tasks.length === 1 &&
  config.tasks[0].task_sha256 === oldControl.task_sha256, "config-shape");
const configPath = join(root, "CONFIG.json"), configBytes = encode(config);
const {buildIntentAnchorCell} = await import(pathToFileURL(`${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs`).href);
const freezes = {};
for (const [name, old] of [["control", oldControl], ["candidate", oldCandidate]]) {
  const cell = buildIntentAnchorCell({config, task_id: old.task_id, arm: old.arm});
  need(cell.context_limit === input.context_window && cell.limits.total_tokens === input.total_tokens_per_arm &&
    cell.provider_profile.model_timeout_ms === input.model_timeout_ms, `${name}-cell`);
  const freeze = remap(old);
  freeze.config_path = configPath;
  freeze.config_sha256 = sha(configBytes);
  freeze.output_root = join(outputRoot, name);
  delete freeze.source_out;
  freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: old.task_sha256}];
  freeze.claim_ceiling = input.claim_ceiling;
  need(freeze.sources.length === 408 && freeze.sources.every(binding => sha(read(binding.path)) === binding.sha256),
    `${name}-source-binding`);
  freezes[name] = {path: join(root, `${name.toUpperCase()}-FREEZE.json`), bytes: encode(freeze)};
}
const definition = {schema_version: "are.g01-exposed-python-pair-definition/v1",
  status: "frozen-before-dispatch", study_id: input.study_id,
  input_sha256: sha(inputBytes), task_choice: "original r10 order, immediately after preceding task",
  task_slug: input.task_slug, original_order: input.original_order,
  original_campaign_sha256: campaignSha, original_pair_sha256: input.original_pair_sha256,
  source_receipt_sha256: sourceReceiptSha, source_tree_sha256: source.tree_sha256,
  import_rule_sha256: input.import_rule_sha256,
  import_rule_posture: "apply to candidate prediction before native scoring only if it triggers; no gold access",
  task_sha256: oldControl.task_sha256, order: ["control", "candidate"],
  config_sha256: sha(configBytes),
  arms: Object.fromEntries(Object.entries(freezes).map(([name, item]) =>
    [name, {freeze_sha256: sha(item.bytes)}])),
  context_window: input.context_window, total_tokens_per_arm: input.total_tokens_per_arm,
  model_timeout_ms: input.model_timeout_ms, automatic_retries: input.automatic_retries,
  analysis: "Seal both native predictions, seal source-only candidate projection before score, report native and projected candidate quality, full known-token/time ratios, and failures",
  claim_ceiling: input.claim_ceiling};
const definitionBytes = encode(definition);
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  for (const item of Object.values(freezes)) writeFileSync(item.path, item.bytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "DEFINITION.json"), definitionBytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--freeze" ? definition.status : "read-only-ready",
  study_id: input.study_id, definition_sha256: sha(definitionBytes),
  control_sha256: sha(freezes.control.bytes), candidate_sha256: sha(freezes.candidate.bytes),
  source_files: source.file_count, model_calls: 0, claim_ceiling: input.claim_ceiling}));
