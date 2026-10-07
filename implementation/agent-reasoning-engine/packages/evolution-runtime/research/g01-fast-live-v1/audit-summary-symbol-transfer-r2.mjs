// Fixed-rule transfer census over three other sealed Python candidate outputs.
// Neither scores nor native gold are opened.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {addSummarySymbolClosure} from "./summary-symbol-closure-r1.mjs";

const mode = process.argv[2];
if (!["--check", "--produce"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-summary-symbol-transfer.arguments");
const base = "/opt/are/evolution-runtime", root = `${base}/g01-summary-symbol-transfer-r2`;
const cases = [
  ["g01-r27-exposed-python-early-r1", "CANDIDATE-PREDICTION-SEAL.json"],
  ["g01-r32-django-heading-repair-r1", "PREDICTION-SEAL.json"],
  ["g01-r37-transformers-next-order-r1", "CANDIDATE-PREDICTION-SEAL.json"]
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-summary-symbol-transfer.${reason}`);};
need(!existsSync(root), "output-exists");
const rulePath = `${base}/summary-symbol-closure-r1.mjs`;
const ruleSha = "fd6087dc4738ba218844c3408c70bf0e0b4930ea139bbf1c3d7acabea7996641";
need(sha(read(rulePath)) === ruleSha, "rule-drift");
const rows = [];
for (const [id, sealName] of cases) {
  const study = `${base}/${id}`, freezePath = join(study, "CANDIDATE-FREEZE.json");
  const freeze = json(freezePath);
  need(freeze.output_root.startsWith(`/tmp/are-${id}/`), `${id}-output-root`);
  const resultPath = join(freeze.output_root, "runs/00/result.json");
  const predictionPath = join(freeze.output_root, "runs/00/prediction.json");
  const result = json(resultPath), predictionBytes = read(predictionPath), prediction = JSON.parse(predictionBytes);
  const sealPath = join(study, sealName), prior = json(sealPath);
  need(result.status === "final_context_selected" &&
    typeof result.native_export?.selection?.summary === "string" &&
    prior.status === "sealed-before-native-scoring" &&
    prior.prediction_sha256 === sha(predictionBytes), `${id}-sealed-prediction`);
  const sourceRoot = realpathSync(join(freeze.output_root, "source/00/base"));
  const projected = addSummarySymbolClosure(prediction, result.native_export.selection.summary, symbol => {
    const search = spawnSync("git", ["-C", sourceRoot, "grep", "-n", "-E",
      `^def[[:space:]]+${symbol}[[:space:]]*\\(`, "--", "*.py"],
    {encoding: "utf8", timeout: 30000, maxBuffer: 1024 * 1024});
    need(!search.error && [0, 1].includes(search.status), `${id}-search`);
    if (search.status === 1) return [];
    return search.stdout.trim().split("\n").map(line => {
      const match = line.match(/^([^:]+):(\d+):/);
      need(match, `${id}-search-hit`);
      const path = match[1], target = resolve(sourceRoot, path);
      need(target.startsWith(sourceRoot + sep) && existsSync(target) &&
        realpathSync(target) === target, `${id}-source-boundary`);
      return {path, line: Number(match[2]), source: read(target).toString("utf8")};
    });
  });
  const bytes = Buffer.from(`${JSON.stringify(projected.prediction, null, 2)}\n`);
  rows.push({study: id, freeze_sha256: sha(read(freezePath)),
    prior_seal_sha256: sha(read(sealPath)), result_sha256: sha(read(resultPath)),
    original_prediction_sha256: sha(predictionBytes), projected_prediction_sha256: sha(bytes),
    selected_files: prediction.traj_data.pred_files.length,
    additions: projected.additions});
  if (mode === "--produce" && projected.additions.length) {
    if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
    const cell = join(root, id); mkdirSync(cell, {mode: 0o700});
    writeFileSync(join(cell, "prediction.json"), bytes, {flag: "wx", mode: 0o600});
  }
}
const receipt = {schema_version: "are.g01-summary-symbol-transfer-census/v1",
  status: "source-only-other-exposed-python-receipts", rule_sha256: ruleSha,
  denominator: rows.length, changed_predictions: rows.filter(row => row.additions.length).length,
  model_calls_added: 0, gold_loaded: false, rows,
  claim_ceiling: "Other exposed Python receipts only; trigger census, not a new cohort, quality validation or superiority"};
if (mode === "--produce") {
  if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "RESULT.json"), `${JSON.stringify(receipt, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--produce" ? receipt.status : "read-only-ready",
  denominator: receipt.denominator, changed_predictions: receipt.changed_predictions,
  result_sha256: mode === "--produce" ? sha(read(join(root, "RESULT.json"))) : null}));
