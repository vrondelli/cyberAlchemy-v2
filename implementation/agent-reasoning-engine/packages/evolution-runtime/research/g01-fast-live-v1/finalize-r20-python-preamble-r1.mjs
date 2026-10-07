// Receipt-bound exposed native-score summary; never modifies frozen r20 data.
import {createHash} from "node:crypto";
import {readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-r20-python-preamble-exposed-r1";
const oldRoot = "/tmp/are-g01-r20-exposed-transfer-160k-240s-r1/python-requests-9cca0774";
const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r20-python-preamble-finalize.${reason}`);};
const bytes = path => readFileSync(path), read = path => JSON.parse(bytes(path));
need(process.argv.length === 2, "arguments");
const projectionPath = join(root, "PROJECTION.json");
const projectedPath = join(root, "prediction.json");
const projectedScorePath = join(root, "native-score.json");
const controlScorePath = join(oldRoot, "control/runs/00/native-score.json");
const candidateScorePath = join(oldRoot, "candidate/runs/00/native-score.json");
const expected = {
  projection: "3bff10919da86e5cc92d3ec5728b0e00a1698014aebab79c7683dc99f994637e",
  projected_prediction: "a8d341b3f1a34ea84a8747db98a193d972bfa960f01b9643d45aba6150bc749b",
  projected_score: "ba74eefbfc8aadc10d3c79666de5bab18fba7ac6aee875ff02ad1a5cfdcd7d50",
  control_score: "8184938c2c7c815de91b0773657e9b0789d92ff3fdd33bc2d72f3aa3b742a365",
  candidate_score: "79e25618e51b0e1ab614fa724f67e7dbb16c1eb53d279d9445ea812b593fe3cf",
};
need(sha(bytes(projectionPath)) === expected.projection &&
  sha(bytes(projectedPath)) === expected.projected_prediction &&
  sha(bytes(projectedScorePath)) === expected.projected_score &&
  sha(bytes(controlScorePath)) === expected.control_score &&
  sha(bytes(candidateScorePath)) === expected.candidate_score,
"receipt-drift");
need(statSync(projectionPath).mtimeMs <= statSync(projectedScorePath).mtimeMs &&
  statSync(projectedPath).mtimeMs <= statSync(projectedScorePath).mtimeMs,
"score-before-seal");
const projection = read(projectionPath), projected = read(projectedScorePath);
const control = read(controlScorePath), candidate = read(candidateScorePath);
need(projection.gold_loaded === false && projection.model_calls === 0 &&
  projection.output_prediction_sha256 === expected.projected_prediction &&
  projection.additions.length === 1 &&
  projection.additions[0].path === "requests/sessions.py" &&
  projection.additions[0].span.start === 1 && projection.additions[0].span.end === 38,
"projection-shape");
const f1 = metric => metric.coverage + metric.precision > 0 ?
  2 * metric.coverage * metric.precision / (metric.coverage + metric.precision) : 0;
const metrics = score => ({file_f1: f1(score.native.final.file),
  span_f1: f1(score.native.final.span), line_f1: f1(score.native.final.line)});
const note = {schema_version: "are.g01-r20-python-import-preamble-exposed-score/v1",
  status: "native-scored-exposed", source_prediction: "frozen-r20-control",
  receipts_sha256: expected, original_control: metrics(control),
  source_only_projection: metrics(projected), original_r20_candidate: metrics(candidate),
  projection_model_calls: 0,
  claim_ceiling: "One previously exposed Python task; no transfer estimate, fresh holdout, interval, or superiority claim",
  open_questions: ["Does the same source-only rule avoid regressions across other exposed Python predictions?",
    "Can a frozen paired candidate preserve the quality and efficiency effect on an independent population?"]};
const path = join(root, "EXPOSED-SCORE.json");
writeFileSync(path, `${JSON.stringify(note, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: note.status, score_note_sha256: sha(bytes(path)),
  original_control: note.original_control, source_only_projection: note.source_only_projection,
  original_r20_candidate: note.original_r20_candidate}));
