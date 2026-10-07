// Independent receipt and metric audit of the exposed r21 TypeScript control.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r21-audit.${why}`);};
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r21-exposed-typescript-control-r1`;
const out = "/tmp/are-g01-r21-exposed-typescript-control-r1/runs/00";
const freezeSha = "2b8a925f237a6bf0fdf04b879eb41f19e5ffc23b538e1bdbd0c2bd6dd892e0d5";
const sourceReceiptSha = "b566988148bc8fa93fadc3eaf8d8643e32aab70f121a6fd439c285ae0d9ed21d";
const noteSha = "92b2365817d98c1733e1f3f00966e7190ea5b4d863c8eda7647099b336ade1f8";
const replaySha = "ab842ca10bc9a6a40d3a70b5af4b41ae2a421a028f7a71ae323568fc3068d60a";
const sha = b => createHash("sha256").update(b).digest("hex");
const bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const freezePath = join(root, "CONTROL-FREEZE.json");
const sourcePath = `${base}/g01-source-r10-prospective-r21-evidence/SOURCE-SNAPSHOT.json`;
const notePath = join(root, "EXPOSED-SCORE.json"), replayPath = join(root, "EXACT-FAILURE-REPLAY.json");
need(sha(bytes(freezePath)) === freezeSha && sha(bytes(sourcePath)) === sourceReceiptSha &&
  sha(bytes(notePath)) === noteSha && sha(bytes(replayPath)) === replaySha, "pinned-input-drift");
const freeze = read(freezePath), source = read(sourcePath), note = read(notePath), replay = read(replayPath);
need(freeze.output_root === "/tmp/are-g01-r21-exposed-typescript-control-r1" &&
  freeze.sources.length === 409 && freeze.sources.every(b => sha(bytes(b.path)) === b.sha256) &&
  sha(bytes(freeze.config_path)) === freeze.config_sha256 &&
  source.source_tree_sha256 === "889070a6fc78561ce74eab530afb87f904d65bb0b2a6bbf0e3c36bd40ad7cdf0" &&
  source.passed === 92 && replay.status === "old-failure-reproduced-new-admission-passed" &&
  replay.old_error === "aggregate-admission.read-binding" && replay.model_calls === 0,
  "source-or-replay-drift");
const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
const sealPath = join(root, "PREDICTION-SEAL.json"), scorePath = join(out, "native-score.json");
need([resultPath, predictionPath, sealPath, scorePath, join(out, "started.json"),
  join(out, "completed.json")].every(existsSync), "missing-output");
const result = read(resultPath), seal = read(sealPath), score = read(scorePath);
const models = result.receipts.filter(r => r.kind === "model");
const tokens = models.reduce((sum, r) => {
  need(Number.isSafeInteger(r.input_tokens) && Number.isSafeInteger(r.output_tokens) &&
    r.input_tokens >= 0 && r.output_tokens >= 0, "unknown-cost");
  return sum + r.input_tokens + r.output_tokens;
}, 0);
const f1 = m => m.coverage + m.precision > 0 ?
  2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
const span = f1(score.native.final.span), file = f1(score.native.final.file);
need(result.status === "final_context_selected" && result.task_sha256 === freeze.task_sha256 &&
  seal.status === "sealed-before-native-scoring" && seal.freeze_sha256 === freezeSha &&
  seal.source_receipt_sha256 === sourceReceiptSha && seal.result_sha256 === sha(bytes(resultPath)) &&
  seal.prediction_sha256 === sha(bytes(predictionPath)) && seal.scoring_status_at_seal === "not-started" &&
  statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs && models.length === 20 && tokens === 81751 &&
  note.status === "native-scored-exposed" && note.result_sha256 === seal.result_sha256 &&
  note.prediction_sha256 === seal.prediction_sha256 && note.prediction_seal_sha256 === sha(bytes(sealPath)) &&
  note.native_score_sha256 === sha(bytes(scorePath)) && note.span_f1 === span && note.file_f1 === file &&
  note.known_model_tokens === tokens && note.model_calls === models.length,
  "outcome-drift");
const audit = {schema_version: "are.g01-r21-exposed-typescript-control-independent-audit/v1",
  status: "exposed-native-receipts-and-replay-verified", freeze_sha256: freezeSha,
  source_receipt_sha256: sourceReceiptSha, exact_failure_replay_sha256: replaySha,
  source_files_verified: freeze.sources.length, result_sha256: sha(bytes(resultPath)),
  prediction_seal_sha256: sha(bytes(sealPath)), prediction_sha256: sha(bytes(predictionPath)),
  native_score_sha256: sha(bytes(scorePath)), note_sha256: noteSha,
  span_f1: span, file_f1: file, model_calls: models.length, known_model_tokens: tokens,
  claim_ceiling: "One exposed control completion plus provider-free failure replay; no pair, holdout or superiority"};
if (mode === "--write") {
  const path = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(path), "already-written");
  writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, model_calls: audit.model_calls,
  known_model_tokens: audit.known_model_tokens, span_f1: span, file_f1: file,
  audit_sha256: mode === "--write" ? sha(bytes(join(root, "INDEPENDENT-AUDIT.json"))) : null}));
