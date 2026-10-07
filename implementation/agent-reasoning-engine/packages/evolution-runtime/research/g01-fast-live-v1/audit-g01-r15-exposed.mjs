// Independent exposed-task r15 source, receipt, seal and native-score audit.
// --check is read-only; --write creates one immutable private audit receipt.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
const need = (value, reason) => {if (!value) throw Error(`g01-r15-audit.${reason}`);};
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const root = "/opt/are/evolution-runtime/g01-r15-exposed-qualification-r1";
const out = "/tmp/are-g01-r15-exposed-candidate-r1/runs/00";
const freezeSha = "e6855f203b1293c12b74ee65fc321d871d2aa414caa6489b9d3e3e56212d6aae";
const sourceReceiptSha = "092e7d0bbea6b2b1395d57d63a6ec244d3ad06821ccef83f7fbd7d6001860ef2";
const noteSha = "8e2e2ce45059f10fc70f7a5b693da5ec82df5f9db6d8c71ec84d5532103ccbdb";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = path => readFileSync(path);
const read = path => JSON.parse(bytes(path));
const freezePath = join(root, "CANDIDATE-FREEZE.json");
const sourceReceiptPath = "/opt/are/evolution-runtime/g01-source-r10-prospective-r15-evidence/SOURCE-SNAPSHOT.json";
const notePath = join(root, "EXPOSED-SCORE.json");
need(sha(bytes(freezePath)) === freezeSha &&
  sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(notePath)) === noteSha, "pinned-input-drift");
const freeze = read(freezePath), sourceReceipt = read(sourceReceiptPath), note = read(notePath);
need(freeze.status === "frozen-before-dispatch" &&
  freeze.output_root === "/tmp/are-g01-r15-exposed-candidate-r1" &&
  freeze.sources.length === 407 &&
  sourceReceipt.source_tree_sha256 === "81dcf4a4cf6e32d239de8641e4518de90d3bfcb3984131f6484a88be90a70edd" &&
  freeze.sources.every(binding => sha(bytes(binding.path)) === binding.sha256) &&
  sha(bytes(freeze.config_path)) === freeze.config_sha256, "source-or-config-drift");
const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
const sealPath = join(root, "PREDICTION-SEAL.json"), scorePath = join(out, "native-score.json");
need([resultPath, predictionPath, sealPath, scorePath,
  join(out, "started.json"), join(out, "completed.json")].every(existsSync), "missing-output");
const result = read(resultPath), seal = read(sealPath), score = read(scorePath);
const models = result.receipts.filter(receipt => receipt.kind === "model");
const tokens = models.reduce((sum, receipt) => {
  need(Number.isSafeInteger(receipt.input_tokens) && Number.isSafeInteger(receipt.output_tokens) &&
    receipt.input_tokens >= 0 && receipt.output_tokens >= 0, "unknown-cost");
  return sum + receipt.input_tokens + receipt.output_tokens;
}, 0);
const f1 = metric => metric.coverage + metric.precision > 0 ?
  2 * metric.coverage * metric.precision / (metric.coverage + metric.precision) : 0;
const span = f1(score.native.final.span), file = f1(score.native.final.file);
need(result.status === "final_context_selected" && result.task_sha256 === freeze.task_sha256 &&
  seal.status === "sealed-before-native-scoring" &&
  seal.freeze_sha256 === freezeSha && seal.source_receipt_sha256 === sourceReceiptSha &&
  seal.result_sha256 === sha(bytes(resultPath)) &&
  seal.prediction_sha256 === sha(bytes(predictionPath)) &&
  seal.scoring_status_at_seal === "not-started" &&
  statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs &&
  models.length === 17 && tokens === 69202 &&
  note.status === "native-scored-exposed" &&
  note.result_sha256 === seal.result_sha256 &&
  note.prediction_sha256 === seal.prediction_sha256 &&
  note.prediction_seal_sha256 === sha(bytes(sealPath)) &&
  note.native_score_sha256 === sha(bytes(scorePath)) &&
  note.span_f1 === span && note.file_f1 === file &&
  note.known_model_tokens === tokens && note.model_calls === models.length,
  "outcome-drift");
const audit = {schema_version: "are.g01-r15-exposed-independent-audit/v1",
  status: "exposed-native-receipts-verified", freeze_sha256: freezeSha,
  source_receipt_sha256: sourceReceiptSha, source_files_verified: freeze.sources.length,
  result_sha256: sha(bytes(resultPath)), prediction_seal_sha256: sha(bytes(sealPath)),
  prediction_sha256: sha(bytes(predictionPath)), native_score_sha256: sha(bytes(scorePath)),
  note_sha256: noteSha, span_f1: span, file_f1: file,
  model_calls: models.length, known_model_tokens: tokens,
  claim_ceiling: "One exposed candidate result; no paired control, fresh holdout, interval or superiority"};
if (mode === "--write") {
  const path = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(path), "already-written");
  writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, model_calls: audit.model_calls,
  known_model_tokens: audit.known_model_tokens, span_f1: span, file_f1: file,
  audit_sha256: mode === "--write" ? sha(bytes(join(root, "INDEPENDENT-AUDIT.json"))) : null}));
