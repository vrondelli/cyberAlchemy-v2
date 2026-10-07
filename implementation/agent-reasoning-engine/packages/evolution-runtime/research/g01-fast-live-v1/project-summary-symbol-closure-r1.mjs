// Freeze all eight exposed predictions before opening any new native score.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {addSummarySymbolClosure} from "./summary-symbol-closure-r1.mjs";

const mode = process.argv[2];
if (!["--check", "--produce"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-summary-symbol-project.arguments");
const base = "/opt/are/evolution-runtime", root = `${base}/g01-summary-symbol-closure-r1`;
const ids = [
  "g01-r28-openlibrary-import-validation-r1", "g01-r29-ansible-import-validation-r1",
  "g01-r30-keras-import-validation-r1", "g01-r33-django-heading-pair-r1",
  "g01-r34-keras-heading-transfer-r1", "g01-r35-langchain-next-order-r1",
  "g01-r36-openlibrary-next-order-r1", "g01-r38-pytest-next-order-r1"
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-summary-symbol-project.${reason}`);};
need(!existsSync(root), "output-exists");
const rows = [];
for (const id of ids) {
  const studyRoot = `${base}/${id}`;
  const freezePath = join(studyRoot, "CANDIDATE-FREEZE.json");
  const freeze = json(freezePath);
  const output = freeze.output_root;
  need(output.startsWith(`/tmp/are-${id}/`), `${id}-output-root`);
  const resultPath = join(output, "runs/00/result.json");
  const predictionPath = join(output, "runs/00/prediction.json");
  const sealPath = join(studyRoot, "CANDIDATE-PREDICTION-SEAL.json");
  const result = json(resultPath), predictionBytes = read(predictionPath), prediction = JSON.parse(predictionBytes);
  const seal = json(sealPath), predictionSha = sha(predictionBytes);
  need(result.status === "final_context_selected" &&
    typeof result.native_export?.selection?.summary === "string" &&
    seal.status === "sealed-before-native-scoring" &&
    seal.prediction_sha256 === predictionSha, `${id}-sealed-prediction`);
  const sourceRoot = realpathSync(join(output, "source/00/base"));
  const projected = addSummarySymbolClosure(prediction, result.native_export.selection.summary, symbol => {
    const search = spawnSync("git", ["-C", sourceRoot, "grep", "-n", "-E",
      `^def[[:space:]]+${symbol}[[:space:]]*\\(`, "--", "*.py"],
    {encoding: "utf8", timeout: 30000, maxBuffer: 1024 * 1024});
    need(!search.error && [0, 1].includes(search.status), `${id}-source-search`);
    if (search.status === 1) return [];
    return search.stdout.trim().split("\n").map(line => {
      const match = line.match(/^([^:]+):(\d+):/);
      need(match, `${id}-source-hit`);
      const path = match[1], target = resolve(sourceRoot, path);
      need(target.startsWith(sourceRoot + sep) && existsSync(target) &&
        realpathSync(target) === target, `${id}-source-boundary`);
      return {path, line: Number(match[2]), source: read(target).toString("utf8")};
    });
  });
  const bytes = Buffer.from(`${JSON.stringify(projected.prediction, null, 2)}\n`);
  const row = {study: id, freeze_sha256: sha(read(freezePath)),
    original_prediction_sha256: predictionSha, projected_prediction_sha256: sha(bytes),
    result_sha256: sha(read(resultPath)), additions: projected.additions};
  rows.push(row);
  if (mode === "--produce" && projected.additions.length > 0) {
    if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
    const cell = join(root, id); mkdirSync(cell, {mode: 0o700});
    writeFileSync(join(cell, "prediction.json"), bytes, {flag: "wx", mode: 0o600});
  }
}
const rulePath = fileURLToPath(new URL("./summary-symbol-closure-r1.mjs", import.meta.url));
const seal = {schema_version: "are.g01-summary-symbol-closure-exposed-seal/v1",
  status: "source-only-sealed-before-native-scoring", denominator: rows.length,
  changed_predictions: rows.filter(row => row.additions.length > 0).length,
  model_calls_added: 0, gold_loaded: false, rule_sha256: sha(read(rulePath)), rows,
  claim_ceiling: "Eight exposed G01 predictions; post-hoc source-only development, not independent transfer, cost qualification or superiority"};
if (mode === "--produce") {
  if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "SOURCE-SEAL.json"), `${JSON.stringify(seal, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--produce" ? seal.status : "read-only-ready",
  denominator: seal.denominator, changed_predictions: seal.changed_predictions,
  additions: rows.filter(row => row.additions.length > 0)
    .map(row => ({study: row.study, additions: row.additions})),
  source_seal_sha256: mode === "--produce" ? sha(read(join(root, "SOURCE-SEAL.json"))) : null}));
