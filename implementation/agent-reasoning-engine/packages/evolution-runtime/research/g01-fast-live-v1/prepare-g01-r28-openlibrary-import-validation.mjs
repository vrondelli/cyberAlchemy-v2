// Predeclared next-r10-order Python task, already manifested but never run.
// --check is read-only; no gold, native score, credential, or model access.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const mode = process.argv[2];
const need = (value, reason) => {if (!value) throw Error(`g01-r28-openlibrary.${reason}`);};
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const campaignRoot = `${base}/g01-product-replication-r10`;
const taskRoot = `${campaignRoot}/python-openlibrary-fd2aaa2a`;
const oldSource = `${base}/g01-source-r10-candidate-r14`;
const sourceRoot = `${base}/g01-source-r10-prospective-r17`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
const root = `${base}/g01-r28-openlibrary-import-validation-r1`;
const outputRoot = "/tmp/are-g01-r28-openlibrary-import-validation-r1";
const rulePath = `${base}/g01-relative-import-tools-r1/python-relative-import-target-r1.mjs`;
const hashes = {
  campaign: "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c",
  pair: "a8001ba6b6bb42624f47c2e9c47539a1fd019f60b578bf587acadb077ea49eab",
  control: "6ec78f0e0f61df34813fdc5d2a380711ae0c357c3705d09c76f6689f47aa4c27",
  candidate: "f6b98ad1911a06241c526428d4b95a8546d5defb5d907603f89fcba33d08b6a9",
  config: "cdd76c90789862826e1b837453af59eb61c398b6d7e0ec31995ebc905d72651b",
  sourceReceipt: "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035",
  rule: "e37f65bad70fd92ebb5a4c5e48234750cfcab4dfe822c401d3ab15b41ed3756c"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
need(!existsSync(root) && !existsSync(outputRoot), "output-exists");
for (const [name, path] of Object.entries({campaign: join(campaignRoot, "CAMPAIGN-FREEZE.json"),
  pair: join(taskRoot, "PAIR-PLAN.json"), control: join(taskRoot, "CONTROL-FREEZE.json"),
  candidate: join(taskRoot, "CANDIDATE-FREEZE.json"), config: join(taskRoot, "CONFIG.json"),
  sourceReceipt: sourceReceiptPath, rule: rulePath})) need(sha(read(path)) === hashes[name], `${name}-drift`);
const campaign = json(join(campaignRoot, "CAMPAIGN-FREEZE.json"));
need(campaign.ordered_tasks.length === 24 && campaign.ordered_tasks[14].slug === "python-requests-9cca0774" &&
  campaign.ordered_tasks[15].slug === "python-openlibrary-fd2aaa2a", "fixed-order-drift");
const oldControl = json(join(taskRoot, "CONTROL-FREEZE.json"));
const oldCandidate = json(join(taskRoot, "CANDIDATE-FREEZE.json"));
need(oldControl.arm === "intent-anchor-convergence-r3" &&
  oldCandidate.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
  oldControl.task_sha256 === oldCandidate.task_sha256 &&
  oldControl.sources.length === 406 && oldCandidate.sources.length === 406, "old-arm-shape");
const sourceReceipt = json(sourceReceiptPath);
need(sourceReceipt.status === "tested-not-frozen" && sourceReceipt.file_count === 407 &&
  sourceReceipt.passed === 90, "source-receipt-shape");
const {bindSourceTree} = await import(pathToFileURL(`${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`).href);
const source = bindSourceTree(sourceRoot);
need(source.file_count === 407 && source.tree_sha256 === sourceReceipt.source_tree_sha256, "source-tree-drift");
const remap = value => JSON.parse(JSON.stringify(value).replaceAll(`${oldSource}/`, `${sourceRoot}/`));
const config = remap(json(join(taskRoot, "CONFIG.json")));
config.experiment_id = "g01-r28-openlibrary-import-validation-r1";
config.total_tokens_per_arm = 160000;
config.tasks[0].cell_template.limits.total_tokens = 160000;
config.tasks[0].cell_template.provider_profile.model_timeout_ms = 240000;
need(config.context_limit === 8000 && config.tasks.length === 1 &&
  config.tasks[0].task_sha256 === oldControl.task_sha256, "config-shape");
const configPath = join(root, "CONFIG.json"), configBytes = encode(config);
const {buildIntentAnchorCell} = await import(pathToFileURL(`${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs`).href);
const freezes = {};
for (const [name, old] of [["control", oldControl], ["candidate", oldCandidate]]) {
  const cell = buildIntentAnchorCell({config, task_id: old.task_id, arm: old.arm});
  need(cell.context_limit === 8000 && cell.limits.total_tokens === 160000 &&
    cell.provider_profile.model_timeout_ms === 240000, `${name}-cell`);
  const freeze = remap(old);
  freeze.config_path = configPath;
  freeze.config_sha256 = sha(configBytes);
  freeze.output_root = join(outputRoot, name);
  delete freeze.source_out;
  freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: old.task_sha256}];
  freeze.claim_ceiling = "One previously manifested, unrun Python task; prospective development validation, not fresh holdout";
  need(freeze.sources.length === 408 && freeze.sources.every(binding => sha(read(binding.path)) === binding.sha256),
    `${name}-source-binding`);
  freezes[name] = {path: join(root, `${name.toUpperCase()}-FREEZE.json`), bytes: encode(freeze)};
}
const definition = {schema_version: "are.g01-r28-openlibrary-import-validation-definition/v1",
  status: "frozen-before-dispatch", task_choice: "first unrun Python task after r20's Requests task in original r10 order",
  original_campaign_sha256: hashes.campaign, original_pair_sha256: hashes.pair,
  source_receipt_sha256: hashes.sourceReceipt, source_tree_sha256: source.tree_sha256,
  import_rule_sha256: hashes.rule, import_rule_posture: "apply to candidate prediction before native scoring if it triggers; no gold access",
  task_sha256: oldControl.task_sha256, task_slug: "python-openlibrary-fd2aaa2a",
  order: ["control", "candidate"], config_sha256: sha(configBytes),
  arms: Object.fromEntries(Object.entries(freezes).map(([name, item]) =>
    [name, {freeze_sha256: sha(item.bytes)}])),
  context_window: 8000, total_tokens_per_arm: 160000, model_timeout_ms: 240000, automatic_retries: 0,
  analysis: "Seal both native predictions, seal source-only candidate projection before score, then report both native candidate and projected-candidate quality, known-token/time ratios, and failures",
  claim_ceiling: "One already-manifested exposed development pair only; no cohort interval or product superiority"};
const definitionBytes = encode(definition);
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  for (const item of Object.values(freezes)) writeFileSync(item.path, item.bytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "DEFINITION.json"), definitionBytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--freeze" ? definition.status : "read-only-ready",
  definition_sha256: sha(definitionBytes), control_sha256: sha(freezes.control.bytes),
  candidate_sha256: sha(freezes.candidate.bytes), source_files: source.file_count,
  model_calls: 0, claim_ceiling: definition.claim_ceiling}));
