// Gold-blind diagnostic of exact issue paths and earlier-step file mentions.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
if (!["--check", "--produce"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-path-cue.arguments");
const base = "/opt/are/evolution-runtime", root = `${base}/g01-path-cue-census-r1`;
const cases = [
  ["g01-r27-exposed-python-early-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r28-openlibrary-import-validation-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r29-ansible-import-validation-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r30-keras-import-validation-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r32-django-heading-repair-r1", "PREDICTION-SEAL.json"],
  ["g01-r33-django-heading-pair-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r34-keras-heading-transfer-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r35-langchain-next-order-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r36-openlibrary-next-order-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r37-transformers-next-order-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r38-pytest-next-order-r1", "CANDIDATE-PREDICTION-SEAL.json"]
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-path-cue.${reason}`);};
need(!existsSync(root), "output-exists");
const rows = [];
for (const [id, sealName] of cases) {
  const study = `${base}/${id}`, freezePath = join(study, "CANDIDATE-FREEZE.json");
  const freeze = json(freezePath);
  need(freeze.output_root.startsWith(`/tmp/are-${id}/`), `${id}-output-root`);
  const config = json(freeze.config_path), taskPath = config.tasks[0].task_path;
  const taskBytes = read(taskPath), task = JSON.parse(taskBytes);
  need(sha(taskBytes) === freeze.task_sha256 && typeof task.problem_statement === "string",
    `${id}-task-binding`);
  const resultPath = join(freeze.output_root, "runs/00/result.json");
  const predictionPath = join(freeze.output_root, "runs/00/prediction.json");
  const result = json(resultPath), predictionBytes = read(predictionPath), prediction = JSON.parse(predictionBytes);
  const sealPath = join(study, sealName), seal = json(sealPath);
  need(result.status === "final_context_selected" &&
    typeof result.native_export?.selection?.summary === "string" &&
    seal.status === "sealed-before-native-scoring" &&
    seal.prediction_sha256 === sha(predictionBytes) &&
    prediction.instance_id === task.instance_id, `${id}-sealed-prediction`);
  const sourceRoot = join(freeze.output_root, "source/00/base");
  const tracked = spawnSync("git", ["-C", sourceRoot, "ls-files", "-z", "--", "*.py"],
    {encoding: "utf8", timeout: 30000, maxBuffer: 8 * 1024 * 1024});
  need(!tracked.error && tracked.status === 0, `${id}-tracked-source`);
  const paths = new Set(tracked.stdout.split("\0").filter(Boolean));
  const selected = new Set(prediction.traj_data.pred_files);
  const exactIssuePaths = [...new Set(task.problem_statement.match(/[A-Za-z0-9_./-]+\.py\b/g) ?? [])]
    .filter(path => path.includes("/") && !path.startsWith("/") && !path.includes("..") && paths.has(path));
  const unselectedExactPaths = exactIssuePaths.filter(path => !selected.has(path));
  const summary = result.native_export.selection.summary;
  const earlier = new Map();
  for (const [step, value] of prediction.traj_data.pred_steps.entries())
    for (const path of value.files ?? []) if (!selected.has(path) && paths.has(path)) {
      const row = earlier.get(path) ?? {path, steps: 0, last_step: -1, last_spans: []};
      row.steps++; row.last_step = step; row.last_spans = value.spans?.[path] ?? [];
      earlier.set(path, row);
    }
  const summaryStemMatches = [...earlier.values()].filter(row => {
    const stem = row.path.split("/").at(-1).replace(/\.[^.]+$/, "");
    return stem.length >= 5 && summary.includes(stem);
  });
  rows.push({study: id, task_sha256: sha(taskBytes), freeze_sha256: sha(read(freezePath)),
    seal_sha256: sha(read(sealPath)), result_sha256: sha(read(resultPath)),
    prediction_sha256: sha(predictionBytes), final_selected_files: selected.size,
    tracked_issue_paths: exactIssuePaths.length, unselected_exact_issue_paths: unselectedExactPaths,
    prior_step_unselected_files: earlier.size, summary_stem_matches: summaryStemMatches});
}
const result = {schema_version: "are.g01-path-cue-census/v1",
  status: "gold-blind-exposed-diagnostic", denominator: rows.length,
  exact_path_triggered_outputs: rows.filter(row => row.unselected_exact_issue_paths.length).length,
  stem_triggered_outputs: rows.filter(row => row.summary_stem_matches.length).length,
  model_calls_added: 0, gold_loaded: false, rows,
  claim_ceiling: "Lexical source-only cue census, not a projection, native score, independent transfer or superiority claim"};
if (mode === "--produce") {
  mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "RESULT.json"), `${JSON.stringify(result, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--produce" ? result.status : "read-only-ready",
  denominator: result.denominator, exact_path_triggered_outputs: result.exact_path_triggered_outputs,
  stem_triggered_outputs: result.stem_triggered_outputs,
  result_sha256: mode === "--produce" ? sha(read(join(root, "RESULT.json"))) : null}));
