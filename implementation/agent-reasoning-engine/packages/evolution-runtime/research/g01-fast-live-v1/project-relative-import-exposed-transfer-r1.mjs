// Seal a fixed, already-exposed 13-prediction transfer before native scoring.
// Source-only: never opens gold, native scores, or provider credentials.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {addPythonRelativeImportTargets} from "./python-relative-import-target-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-relative-transfer.${reason}`);};
const mode = process.argv[2];
need(["--check", "--produce"].includes(mode) && process.argv.length === 3, "arguments");
const root = "/opt/are/evolution-runtime/g01-relative-import-exposed-transfer-r1";
const planPath = "/opt/are/evolution-runtime/g01-python-preamble-g02-transfer-tools-r1/EXECUTION-PLAN.json";
const planSha = "bfc92b5a331fc462834d5dd2bb1d93643a5dfaa5dc0817558c0a2c80bf8db808";
const r27Root = "/tmp/are-g01-r27-exposed-python-early-r1/candidate";
const r27PredictionSha = "db8416fcc021e643b72e72639c81f29c24f3d0ce454b9ead53083cdc8b24176d";
const rulePath = fileURLToPath(new URL("./python-relative-import-target-r1.mjs", import.meta.url));
need(!existsSync(root) && sha(readFileSync(planPath)) === planSha &&
  sha(readFileSync(join(r27Root, "runs/00/prediction.json"))) === r27PredictionSha,
  "pinned-input-or-output-drift");
const plan = JSON.parse(readFileSync(planPath));
const pythonPairs = plan.ordered_pairs.filter(pair => pair.instance_id.includes("__python__"));
need(plan.ordered_pairs.length === 24 && pythonPairs.length === 12, "denominator");
const tasks = [{cohort: "g01-r27", suffix: "r27-python-requests-candidate",
  instance_id: "SWE-Bench-Verified__python__maintenance__bugfix__9cca0774",
  prediction_path: join(r27Root, "runs/00/prediction.json"),
  base: realpathSync(join(r27Root, "source/00/base"))},
  ...pythonPairs.map(pair => {
    need(/^pr2-(?:open|qut)-[a-f0-9]{8}$/.test(pair.suffix) &&
      pair.root === `/opt/are-benchmark-runs/g02-cross-layer-${pair.suffix}`, "pair-identity");
    return {cohort: "g02-r2", suffix: pair.suffix, instance_id: pair.instance_id,
      prediction_path: join(pair.root, "evidence/run/prediction.json"),
      base: realpathSync(join(pair.root, "sources/session/base"))};
  })];
const rows = [];
for (const task of tasks) {
  const originalBytes = readFileSync(task.prediction_path), original = JSON.parse(originalBytes);
  need(original.instance_id === task.instance_id, `prediction-identity:${task.suffix}`);
  const projected = addPythonRelativeImportTargets(original, path => {
    const candidate = resolve(task.base, path);
    if (!candidate.startsWith(task.base + sep) || !existsSync(candidate) ||
      realpathSync(candidate) !== candidate) return null;
    return readFileSync(candidate, "utf8");
  });
  const outputBytes = Buffer.from(`${JSON.stringify(projected.prediction, null, 2)}\n`);
  const row = {cohort: task.cohort, suffix: task.suffix, instance_id: task.instance_id,
    input_prediction_sha256: sha(originalBytes), projected_prediction_sha256: sha(outputBytes),
    changed: projected.additions.length > 0, additions: projected.additions,
    selected_files_before: original.traj_data.pred_files.length,
    selected_files_after: projected.prediction.traj_data.pred_files.length};
  rows.push(row);
  if (mode === "--produce" && row.changed) {
    if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
    const cell = join(root, task.suffix);
    mkdirSync(cell, {mode: 0o700});
    writeFileSync(join(cell, "prediction.json"), outputBytes, {flag: "wx", mode: 0o600});
  }
}
const seal = {schema_version: "are.g01-relative-import-exposed-transfer-seal/v1",
  status: "source-sealed-before-native-scoring", plan_sha256: planSha,
  rule_sha256: sha(readFileSync(rulePath)), denominator: tasks.length,
  changed_predictions: rows.filter(row => row.changed).length, rows,
  model_calls_added: 0, gold_loaded: false,
  claim_ceiling: "13 already-exposed predictions across two nonexchangeable benchmarks; no G01 superiority or fresh holdout"};
if (mode === "--produce") {
  if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "SOURCE-SEAL.json"), `${JSON.stringify(seal, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--produce" ? seal.status : "read-only-ready",
  denominator: seal.denominator, changed_predictions: seal.changed_predictions,
  changes_by_cohort: Object.fromEntries(["g01-r27", "g02-r2"].map(cohort =>
    [cohort, rows.filter(row => row.cohort === cohort && row.changed).length])),
  seal_sha256: mode === "--produce" ? sha(readFileSync(join(root, "SOURCE-SEAL.json"))) : null,
  model_calls_added: 0}));
