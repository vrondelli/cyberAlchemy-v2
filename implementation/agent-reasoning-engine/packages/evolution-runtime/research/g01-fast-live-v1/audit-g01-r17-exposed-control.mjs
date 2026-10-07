// Independent, read-only hash/metric audit; --write adds one immutable receipt.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [mode, noteSha] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r17-control-audit.${why}`);};
need(["--check", "--write"].includes(mode) && /^[a-f0-9]{64}$/.test(noteSha ?? "") &&
  process.argv.length === 4, "arguments");
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r17-exposed-control-160k-r1`;
const out = "/tmp/are-g01-r17-exposed-control-160k-r1/runs/00";
const freezeSha = "a62ab37085190e2d0bf913dd5cdb7ca13644b6f71e4d0711fdfd84961a213451";
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const sha = b => createHash("sha256").update(b).digest("hex");
const bytes = p => readFileSync(p);
const read = p => JSON.parse(bytes(p));
const freezePath = join(root, "CONTROL-FREEZE.json");
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
const notePath = join(root, "EXPOSED-SCORE.json");
need(sha(bytes(freezePath)) === freezeSha && sha(bytes(sourceReceiptPath)) === sourceReceiptSha &&
  sha(bytes(notePath)) === noteSha, "pinned-input-drift");
const freeze = read(freezePath), sourceReceipt = read(sourceReceiptPath), note = read(notePath);
need(freeze.status === "frozen-before-dispatch" &&
  freeze.output_root === "/tmp/are-g01-r17-exposed-control-160k-r1" &&
  freeze.sources.length === 408 &&
  sourceReceipt.source_tree_sha256 === "7bfe648f5d953ca805a9ec29923bfa69abfe354e475759e26dc149d472f4a3bb" &&
  freeze.sources.every(b => sha(bytes(b.path)) === b.sha256) &&
  sha(bytes(freeze.config_path)) === freeze.config_sha256, "source-or-config-drift");
const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
const sealPath = join(root, "PREDICTION-SEAL.json"), scorePath = join(out, "native-score.json");
need([resultPath, predictionPath, sealPath, scorePath,
  join(out, "started.json"), join(out, "completed.json")].every(existsSync), "missing-output");
const result = read(resultPath), seal = read(sealPath), score = read(scorePath);
const models = result.receipts.filter(r => r.kind === "model");
const tokens = models.reduce((sum, r) => {
  need(Number.isSafeInteger(r.input_tokens) && Number.isSafeInteger(r.output_tokens) &&
    r.input_tokens >= 0 && r.output_tokens >= 0, "unknown-cost");
  return sum + r.input_tokens + r.output_tokens;
}, 0);
const f1 = m => m.coverage + m.precision > 0 ? 2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
const span = f1(score.native.final.span), file = f1(score.native.final.file);
need(result.status === "final_context_selected" && result.task_sha256 === freeze.task_sha256 &&
  seal.status === "sealed-before-native-scoring" && seal.freeze_sha256 === freezeSha &&
  seal.source_receipt_sha256 === sourceReceiptSha && seal.result_sha256 === sha(bytes(resultPath)) &&
  seal.prediction_sha256 === sha(bytes(predictionPath)) && seal.scoring_status_at_seal === "not-started" &&
  statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs && models.length > 0 && tokens > 0 &&
  note.status === "native-scored-exposed" && note.result_sha256 === seal.result_sha256 &&
  note.prediction_sha256 === seal.prediction_sha256 && note.prediction_seal_sha256 === sha(bytes(sealPath)) &&
  note.native_score_sha256 === sha(bytes(scorePath)) && note.span_f1 === span && note.file_f1 === file &&
  note.known_model_tokens === tokens && note.model_calls === models.length, "outcome-drift");
const audit = {schema_version: "are.g01-r17-exposed-control-independent-audit/v1",
  status: "exposed-native-receipts-verified", freeze_sha256: freezeSha,
  source_receipt_sha256: sourceReceiptSha, source_files_verified: freeze.sources.length,
  result_sha256: sha(bytes(resultPath)), prediction_seal_sha256: sha(bytes(sealPath)),
  prediction_sha256: sha(bytes(predictionPath)), native_score_sha256: sha(bytes(scorePath)),
  note_sha256: noteSha, span_f1: span, file_f1: file,
  model_calls: models.length, known_model_tokens: tokens,
  claim_ceiling: "One exposed control result; no matched prospective pair, fresh holdout, interval or superiority"};
if (mode === "--write") {
  const path = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(path), "already-written");
  writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, model_calls: audit.model_calls,
  known_model_tokens: audit.known_model_tokens, span_f1: span, file_f1: file,
  audit_sha256: mode === "--write" ? sha(bytes(join(root, "INDEPENDENT-AUDIT.json"))) : null}));
