// Exposed development pair: existing early-stop arm versus a fresh native control.
// --check is read-only. No gold, score, credential, or model request is used here.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const mode = process.argv[2];
const need = (value, reason) => { if (!value) throw Error(`g01-r27-early.${reason}`); };
need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const sourceRoot = `${base}/g01-source-r10-prospective-r17`;
const oldRoot = `${base}/g01-r20-exposed-transfer-160k-240s-r1/python-requests-9cca0774`;
const root = `${base}/g01-r27-exposed-python-early-r1`;
const outputRoot = "/tmp/are-g01-r27-exposed-python-early-r1";
const oldHashes = {
  control: "66d645cdaacf383dd7f90023ba108669d129610c31aa3f4f4231045c84b51047",
  candidate: "d2142f4eb5d4be0a4244035ea68720da6819ebae83b78c22298890984e23012b",
  config: "736c5ca634a587d3df27b56756a04f3dc23ffa7e0f7e64c81d935a3c67f6a9f0"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
need(!existsSync(root) && !existsSync(outputRoot), "output-exists");
for (const [name, digest] of Object.entries(oldHashes)) {
  const path = join(oldRoot, name === "config" ? "CONFIG.json" : `${name.toUpperCase()}-FREEZE.json`);
  need(sha(read(path)) === digest, `${name}-source-drift`);
}
const oldControl = json(join(oldRoot, "CONTROL-FREEZE.json"));
const oldCandidate = json(join(oldRoot, "CANDIDATE-FREEZE.json"));
const config = json(join(oldRoot, "CONFIG.json"));
need(oldControl.arm === "intent-anchor-convergence-r3" &&
  oldCandidate.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
  oldControl.task_sha256 === oldCandidate.task_sha256 &&
  oldControl.config_sha256 === oldCandidate.config_sha256 &&
  oldControl.sources.length === 408 && oldCandidate.sources.length === 408 &&
  config.context_limit === 8000 && config.total_tokens_per_arm === 160000 &&
  config.tasks.length === 1 && config.tasks[0].cell_template.provider_profile.model_timeout_ms === 240000,
  "old-pair-shape");
need(oldControl.sources.every(binding => sha(read(binding.path)) === binding.sha256), "source-drift");
config.experiment_id = "g01-r27-exposed-python-early-r1";
const configPath = join(root, "CONFIG.json");
const configBytes = encode(config);
const {buildIntentAnchorCell} = await import(pathToFileURL(`${sourceRoot}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs`).href);
const earlyArm = "intent-anchor-terminal-shortlist-distinctive-early-r1";
for (const arm of [oldControl.arm, earlyArm]) {
  const cell = buildIntentAnchorCell({config, task_id: oldControl.task_id, arm});
  need(cell.context_limit === 8000 && cell.limits.total_tokens === 160000 &&
    cell.provider_profile.model_timeout_ms === 240000, `cell-${arm}`);
}
const freezes = {};
for (const [name, old, arm] of [["control", oldControl, oldControl.arm], ["candidate", oldCandidate, earlyArm]]) {
  const freeze = {...old, arm, config_path: configPath, config_sha256: sha(configBytes),
    output_root: join(outputRoot, name),
    claim_ceiling: "One already exposed Python task, fresh paired development only; no holdout or superiority claim",
    open_questions: ["Does early stopping retain Python source-context quality at lower known-token cost?"]};
  delete freeze.span_refinement_policy;
  need(freeze.sources.every(binding => sha(read(binding.path)) === binding.sha256), `${name}-source-drift`);
  freezes[name] = {path: join(root, `${name.toUpperCase()}-FREEZE.json`), bytes: encode(freeze)};
}
const definition = {schema_version: "are.g01-r27-exposed-python-early-definition/v1",
  status: "frozen-before-dispatch", source_root: sourceRoot,
  predecessor: {control_sha256: oldHashes.control, candidate_sha256: oldHashes.candidate,
    config_sha256: oldHashes.config}, task_sha256: oldControl.task_sha256,
  arms: {control: {arm: oldControl.arm, freeze_sha256: sha(freezes.control.bytes)},
    candidate: {arm: earlyArm, freeze_sha256: sha(freezes.candidate.bytes)}},
  order: ["control", "candidate"], context_window: 8000, total_tokens_per_arm: 160000,
  model_timeout_ms: 240000, automatic_retries: 0,
  analysis: "Seal both predictions before native scoring; report File-F1, Span-F1, known-token and arm-time ratios, and failures; no inferential claim",
  claim_ceiling: "One exposed development pair only; no fresh-cohort or product superiority claim"};
const definitionBytes = encode(definition);
if (mode === "--freeze") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
  for (const item of Object.values(freezes)) writeFileSync(item.path, item.bytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(root, "DEFINITION.json"), definitionBytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--freeze" ? "frozen-before-dispatch" : "read-only-ready",
  definition_sha256: sha(definitionBytes), control_sha256: definition.arms.control.freeze_sha256,
  candidate_sha256: definition.arms.candidate.freeze_sha256, source_files: oldControl.sources.length,
  model_calls: 0, claim_ceiling: definition.claim_ceiling}));
