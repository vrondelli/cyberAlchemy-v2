// Exposed candidate-only reliability qualification after r31's heading anchor.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const mode = process.argv[2];
if (!["--check", "--freeze"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-r32-django.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const need = (ok, reason) => {if (!ok) throw Error(`g01-r32-django.${reason}`);};
const base = "/opt/are/evolution-runtime";
const priorRoot = `${base}/g01-r31-django-import-validation-r1`;
const root = `${base}/g01-r32-django-heading-repair-r1`;
const oldSource = `${base}/g01-source-r10-prospective-r17`;
const newSource = `${base}/g01-source-r10-prospective-r32`;
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r32-evidence/SOURCE-SNAPSHOT.json`;
need(!existsSync(root) && !existsSync(`/tmp/are-g01-r32-django-heading-repair-r1`) &&
  sha(read(join(priorRoot, "DEFINITION.json"))) === "39d61860ee3a6be8fd1496f14219d05aed9fb3c88692766492e7e71ae1b9961e" &&
  sha(read(join(priorRoot, "CANDIDATE-FREEZE.json"))) === "fe010c1d623e5009d09c3665f6336e74321ca314f34a56cd91f662508701c02c" &&
  sha(read(sourceReceiptPath)) === "d6d4c3e2471c81ca2beb62e8d6f85bec230e7d30bb727bcf7a747e8e8602fb86",
  "pinned-input-or-output-drift");
const receipt = json(sourceReceiptPath);
need(receipt.file_count === 407 && receipt.tests.passed === 48 &&
  receipt.changed_files.length === 2, "source-receipt-shape");
const {bindSourceTree} = await import(pathToFileURL(join(newSource,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
const source = bindSourceTree(newSource);
need(source.tree_sha256 === receipt.source_tree_sha256, "source-tree-drift");
const remap = value => JSON.parse(JSON.stringify(value).replaceAll(`${oldSource}/`, `${newSource}/`));
const priorFreeze = json(join(priorRoot, "CANDIDATE-FREEZE.json"));
const config = remap(json(join(priorRoot, "CONFIG.json")));
config.experiment_id = "g01-r32-django-heading-repair-r1";
const configPath = join(root, "CONFIG.json"), configBytes = encode(config);
const freeze = remap(priorFreeze);
freeze.config_path = configPath;
freeze.config_sha256 = sha(configBytes);
freeze.output_root = "/tmp/are-g01-r32-django-heading-repair-r1/candidate";
delete freeze.source_out;
freeze.sources = [...source.sources, {path: config.tasks[0].task_path, sha256: priorFreeze.task_sha256}];
freeze.claim_ceiling = "One already-exposed candidate-only reliability qualification; no paired comparison, fresh cohort, or superiority claim";
need(freeze.sources.length === 408 && freeze.sources.every(item => sha(read(item.path)) === item.sha256) &&
  config.context_limit === 8000 && config.total_tokens_per_arm === 160000 &&
  config.tasks[0].cell_template.provider_profile.model_timeout_ms === 240000 &&
  config.tasks[0].task_sha256 === priorFreeze.task_sha256, "candidate-binding");
const freezeBytes = encode(freeze);
const definition = {schema_version: "are.g01-r32-django-heading-repair-definition/v1",
  status: "frozen-before-dispatch", study_id: config.experiment_id,
  prior_failed_definition_sha256: "39d61860ee3a6be8fd1496f14219d05aed9fb3c88692766492e7e71ae1b9961e",
  source_receipt_sha256: sha(read(sourceReceiptPath)), source_tree_sha256: source.tree_sha256,
  task_sha256: freeze.task_sha256, config_sha256: sha(configBytes),
  candidate_freeze_sha256: sha(freezeBytes), arm: freeze.arm,
  context_window: 8000, total_tokens_per_arm: 160000,
  model_timeout_ms: 240000, automatic_retries: 0,
  analysis: "Check candidate completion after source-only heading repair; seal prediction before any native score. This is not a matched pair against r31 control.",
  claim_ceiling: freeze.claim_ceiling};
const definitionBytes = encode(definition);
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "CANDIDATE-FREEZE.json"), freezeBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "DEFINITION.json"), definitionBytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--freeze" ? definition.status : "read-only-ready",
  definition_sha256: sha(definitionBytes), candidate_freeze_sha256: sha(freezeBytes),
  source_tree_sha256: source.tree_sha256, source_files: source.file_count,
  model_calls: 0, claim_ceiling: definition.claim_ceiling}));
