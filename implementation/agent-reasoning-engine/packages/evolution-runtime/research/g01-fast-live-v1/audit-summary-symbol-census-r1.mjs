// Source-only exposed-development census. No native scores or gold labels.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const study = `${base}/g01-summary-symbol-census-r1`;
if (process.argv.length !== 2 || existsSync(study)) throw Error("summary-symbol.arguments-or-output-exists");
const ids = [
  "g01-r28-openlibrary-import-validation-r1",
  "g01-r29-ansible-import-validation-r1",
  "g01-r30-keras-import-validation-r1",
  "g01-r33-django-heading-pair-r1",
  "g01-r34-keras-heading-transfer-r1",
  "g01-r35-langchain-next-order-r1",
  "g01-r36-openlibrary-next-order-r1",
  "g01-r38-pytest-next-order-r1",
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const need = (ok, reason) => { if (!ok) throw Error(`summary-symbol.${reason}`); };
const rows = [];
for (const id of ids) {
  const root = `${base}/${id}`;
  const freeze = json(join(root, "CANDIDATE-FREEZE.json"));
  const out = join(freeze.output_root, "runs/00");
  const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
  const result = json(resultPath), prediction = json(predictionPath);
  need(result.status === "final_context_selected" && result.native_export?.selection?.summary &&
    Array.isArray(prediction.traj_data?.pred_files) && freeze.output_root.startsWith(`/tmp/are-${id}/`),
  `${id}-run-shape`);
  const files = prediction.traj_data.pred_files;
  const summary = result.native_export.selection.summary;
  const symbols = [...new Set([...summary.matchAll(/`([A-Za-z_]\w*)\s*\(/g)].map(x => x[1]))];
  const sourceRoot = join(freeze.output_root, "source/00/base");
  const candidates = [];
  if (files.length === 1) for (const symbol of symbols) {
    const pattern = `^def[[:space:]]+${symbol}[[:space:]]*\\(`;
    const search = spawnSync("git", ["-C", sourceRoot, "grep", "-n", "-E", pattern, "--", "*.py"],
      {encoding: "utf8", timeout: 30000, maxBuffer: 1024 * 1024});
    need(!search.error && [0, 1].includes(search.status), `${id}-source-search`);
    const hits = search.status === 0 ? search.stdout.trim().split("\n").map(line => {
      const match = line.match(/^([^:]+):(\d+):/);
      need(match && !match[1].startsWith("/") && !match[1].includes(".."), `${id}-search-hit`);
      return {path: match[1], line: Number(match[2])};
    }) : [];
    if (hits.length === 1 && !files.includes(hits[0].path))
      candidates.push({symbol, ...hits[0]});
  }
  rows.push({study_id: id, candidate_freeze_sha256: sha(read(join(root, "CANDIDATE-FREEZE.json"))),
    result_sha256: sha(read(resultPath)), prediction_sha256: sha(read(predictionPath)),
    selected_files: files.length, quoted_call_symbols: symbols, unique_unselected_declarations: candidates});
}
const result = {schema_version: "are.g01-summary-symbol-census/v1",
  status: "source-only-exposed-diagnostic", score_or_gold_access: false, model_calls: 0,
  rule: "single selected Python file; backticked function call in terminal summary; unique top-level Python def in an unselected tracked file",
  rows, triggered_tasks: rows.filter(x => x.unique_unselected_declarations.length > 0).length,
  claim_ceiling: "Post-hoc source-only trigger census; no scored projection, fresh cohort or superiority claim"};
mkdirSync(study, {mode: 0o700});
const path = join(study, "RESULT.json");
writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: result.status, result_sha256: sha(read(path)),
  rows: rows.length, triggered_tasks: result.triggered_tasks,
  triggers: rows.filter(x => x.unique_unselected_declarations.length > 0)
    .map(x => ({study_id: x.study_id, declarations: x.unique_unselected_declarations}))}));
