// Evaluator-only summary of the previously sealed 12-case exposed screen.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-python-g02-finalize.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-python-preamble-g02-exposed-transfer-r1";
const sourcePath = join(root, "SOURCE-SEAL.json");
const executionPath = join(root, "SCORE-EXECUTION.json");
const sourceSha = "0bea69bd2513e87da2e196dc5c845e76926b443fe712161aa7a322456d84ca37";
const executionSha = "4589ca5bfe1560a29436717e564edbd7cb82f5a060b4dd53090019b43649d2d1";
need(process.argv.length === 2 && sha(readFileSync(sourcePath)) === sourceSha &&
  sha(readFileSync(executionPath)) === executionSha &&
  !existsSync(join(root, "TRANSFER-RESULT.json")), "arguments-or-binding");
const seal = JSON.parse(readFileSync(sourcePath));
const execution = JSON.parse(readFileSync(executionPath));
need(seal.denominator === 12 && seal.changed_predictions === 11 &&
  execution.complete === true && execution.rows.length === 12 &&
  seal.gold_loaded === false && seal.model_calls === 0,
"seal-shape");
const f1 = metric => metric.coverage + metric.precision > 0 ?
  2 * metric.coverage * metric.precision / (metric.coverage + metric.precision) : 0;
const scoreOf = value => ({file_f1: f1(value.native.final.file),
  span_f1: f1(value.native.final.span), line_f1: f1(value.native.final.line)});
const rows = [];
for (const [index, row] of seal.rows.entries()) {
  const recorded = execution.rows[index];
  need(recorded.suffix === row.suffix &&
    recorded.status === (row.changed ? "scored" : "unchanged-not-rescored"),
  "score-denominator");
  const originalPath = `/opt/are-benchmark-runs/g02-cross-layer-${row.suffix}/evidence/run/native-score.json`;
  const originalBytes = readFileSync(originalPath), originalScore = JSON.parse(originalBytes);
  let projectedScore = originalScore, projectedScoreSha = sha(originalBytes);
  if (row.changed) {
    const predictionPath = join(root, row.suffix, "prediction.json");
    const projectedPath = join(root, row.suffix, "native-score.json");
    need(sha(readFileSync(predictionPath)) === row.projected_prediction_sha256 &&
      statSync(sourcePath).mtimeMs <= statSync(projectedPath).mtimeMs &&
      statSync(predictionPath).mtimeMs <= statSync(projectedPath).mtimeMs,
    "projection-not-sealed-before-score");
    projectedScoreSha = sha(readFileSync(projectedPath));
    need(projectedScoreSha === recorded.native_score_sha256, "projected-score-drift");
    projectedScore = JSON.parse(readFileSync(projectedPath));
  }
  need(originalScore.native.instance_id === row.instance_id &&
    projectedScore.native.instance_id === row.instance_id,
  "score-instance-mismatch");
  const original = scoreOf(originalScore), projected = scoreOf(projectedScore);
  rows.push({suffix: row.suffix, instance_id: row.instance_id,
    changed: row.changed, additions: row.additions.length,
    original_native_score_sha256: sha(originalBytes),
    projected_native_score_sha256: projectedScoreSha,
    original, projected,
    file_f1_delta: projected.file_f1 - original.file_f1,
    span_f1_delta: projected.span_f1 - original.span_f1});
}
const mean = key => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
const tol = 1e-12;
const summary = {denominator: rows.length, changed_predictions: seal.changed_predictions,
  changed_files: seal.rows.reduce((sum, row) => sum + row.additions.length, 0),
  mean_file_f1_delta: mean("file_f1_delta"), mean_span_f1_delta: mean("span_f1_delta"),
  span_positive: rows.filter(row => row.span_f1_delta > tol).length,
  span_negative: rows.filter(row => row.span_f1_delta < -tol).length,
  span_unchanged: rows.filter(row => Math.abs(row.span_f1_delta) <= tol).length};
need(summary.denominator === 12 && summary.changed_files === 22 &&
  summary.span_positive + summary.span_negative + summary.span_unchanged === 12,
"summary-shape");
const result = {schema_version: "are.g01-python-preamble-g02-exposed-transfer-result/v1",
  posture: "evaluator-only-after-source-seal; exposed G02 predictions, no new GLM calls",
  source_seal_sha256: sourceSha, score_execution_sha256: executionSha,
  summary, rows,
  decision: "unconditional-python-import-preamble-rejected-for-transfer",
  claim_ceiling: "Cross-benchmark exposed regression screen, not a G01 pair or fresh holdout; no superiority claim",
  open_questions: ["Can a predeclared, score-blind condition retain the useful G01 exposed case while avoiding these G02 regressions?",
    "Can a separately frozen G01 candidate show positive quality and efficiency intervals on a clean complete cohort?"]};
const path = join(root, "TRANSFER-RESULT.json");
writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: "audited", result_sha256: sha(readFileSync(path)), summary}));
