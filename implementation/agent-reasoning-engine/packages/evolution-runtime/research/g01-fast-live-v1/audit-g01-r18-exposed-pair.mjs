// Independent hash/metric audit of the separately frozen exposed matched pair.
// --check is read-only; --write emits one immutable private receipt.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
const [mode, controlNoteSha, candidateNoteSha] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r18-audit.${why}`);};
need(["--check", "--write"].includes(mode) &&
  [controlNoteSha, candidateNoteSha].every(v => /^[a-f0-9]{64}$/.test(v ?? "")) &&
  process.argv.length === 5, "arguments");
const base = "/opt/are/evolution-runtime", root = `${base}/g01-r18-exposed-pair-160k-r1`;
const pairSha = "f3afcab5eadc3c5098be3b2ff7184488d26fda677d39c8bc4a694089cd7a2d5a";
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const freezeShas = {control: "fd5cdee147c2cf9376061428f2c8640b6a08ebb0c57382b97f282ab1103c23a4",
  candidate: "932340c4b64d0b09e8137d59890557ee6fbf6b236b71a44d57c9b7d95996d871"};
const noteShas = {control: controlNoteSha, candidate: candidateNoteSha};
const sha = b => createHash("sha256").update(b).digest("hex"), bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const pairPath = join(root, "PAIR-FREEZE.json");
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
need(sha(bytes(pairPath)) === pairSha && sha(bytes(sourceReceiptPath)) === sourceReceiptSha, "pinned-input-drift");
const pair = read(pairPath), sourceReceipt = read(sourceReceiptPath);
need(pair.status === "frozen-before-dispatch" && pair.order.join(",") === "control,candidate" &&
  pair.budget.context_tokens_per_request === 8000 && pair.budget.total_tokens_per_arm === 160000 &&
  sourceReceipt.source_tree_sha256 === pair.source_tree_sha256 &&
  pair.source_tree_sha256 === "7bfe648f5d953ca805a9ec29923bfa69abfe354e475759e26dc149d472f4a3bb" &&
  sha(bytes(pair.config_path)) === pair.config_sha256, "pair-or-source-drift");
const f1 = m => m.coverage + m.precision > 0 ? 2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
const arms = {};
for (const name of pair.order) {
  const upper = name.toUpperCase();
  const freezePath = join(root, `${upper}-FREEZE.json`), notePath = join(root, `${upper}-SCORE.json`);
  const sealPath = join(root, `${upper}-PREDICTION-SEAL.json`);
  need(sha(bytes(freezePath)) === freezeShas[name] && sha(bytes(notePath)) === noteShas[name],
    `${name}-pinned-drift`);
  const freeze = read(freezePath), note = read(notePath), seal = read(sealPath);
  need(freeze.output_root === join(pair.output_root, name) &&
    freeze.config_path === pair.config_path && freeze.config_sha256 === pair.config_sha256 &&
    freeze.sources.length === 408 && freeze.sources.every(b => sha(bytes(b.path)) === b.sha256),
    `${name}-source-drift`);
  const out = join(freeze.output_root, "runs", "00"), resultPath = join(out, "result.json");
  const predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json");
  need([resultPath, predictionPath, scorePath, join(out, "started.json"), join(out, "completed.json")].every(existsSync),
    `${name}-missing-output`);
  const result = read(resultPath), score = read(scorePath), models = result.receipts?.filter(r => r.kind === "model") ?? [];
  const tokens = models.reduce((sum, r) => {
    need(Number.isSafeInteger(r.input_tokens) && Number.isSafeInteger(r.output_tokens) &&
      r.input_tokens >= 0 && r.output_tokens >= 0, `${name}-unknown-cost`);
    return sum + r.input_tokens + r.output_tokens;
  }, 0);
  const span = f1(score.native.final.span), file = f1(score.native.final.file);
  need(result.status === "final_context_selected" && result.task_sha256 === pair.task_sha256 &&
    models.length > 0 && seal.status === "sealed-before-native-scoring" &&
    seal.pair_sha256 === pairSha && seal.freeze_sha256 === freezeShas[name] &&
    seal.result_sha256 === sha(bytes(resultPath)) && seal.prediction_sha256 === sha(bytes(predictionPath)) &&
    seal.known_model_tokens === tokens && seal.model_calls === models.length &&
    seal.scoring_status_at_seal === "not-started" &&
    note.status === "native-scored-exposed" && note.arm === name && note.pair_sha256 === pairSha &&
    note.freeze_sha256 === freezeShas[name] && note.prediction_seal_sha256 === sha(bytes(sealPath)) &&
    note.result_sha256 === seal.result_sha256 && note.prediction_sha256 === seal.prediction_sha256 &&
    note.native_score_sha256 === sha(bytes(scorePath)) && note.span_f1 === span && note.file_f1 === file &&
    note.known_model_tokens === tokens && note.model_calls === models.length &&
    statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, `${name}-outcome-drift`);
  arms[name] = {freeze_sha256: freezeShas[name], score_note_sha256: noteShas[name],
    prediction_seal_sha256: sha(bytes(sealPath)), native_score_sha256: sha(bytes(scorePath)),
    result_sha256: sha(bytes(resultPath)), prediction_sha256: sha(bytes(predictionPath)),
    span_f1: span, file_f1: file, known_model_tokens: tokens, model_calls: models.length,
    duration_seconds: note.duration_seconds, seal_mtime_ms: statSync(sealPath).mtimeMs,
    score_mtime_ms: statSync(scorePath).mtimeMs};
}
need(Math.max(...Object.values(arms).map(a => a.seal_mtime_ms)) <=
  Math.min(...Object.values(arms).map(a => a.score_mtime_ms)), "both-seals-before-either-score");
const control = arms.control, candidate = arms.candidate;
const summary = {span_f1_delta: candidate.span_f1 - control.span_f1,
  file_f1_delta: candidate.file_f1 - control.file_f1,
  token_ratio: candidate.known_model_tokens / control.known_model_tokens,
  duration_ratio: candidate.duration_seconds / control.duration_seconds};
for (const a of Object.values(arms)) {delete a.seal_mtime_ms; delete a.score_mtime_ms;}
const audit = {schema_version: "are.g01-r18-exposed-pair-independent-audit/v1",
  status: "exposed-pair-receipts-verified", pair_sha256: pairSha,
  source_receipt_sha256: sourceReceiptSha, source_files_verified_per_arm: 408,
  arms, descriptive_summary: summary, interval: null, fresh_holdout: false,
  claim_ceiling: "One exposed matched-budget pair only; no statistical or product superiority"};
if (mode === "--write") {
  const path = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(path), "already-written");
  writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, descriptive_summary: summary,
  audit_sha256: mode === "--write" ? sha(bytes(join(root, "INDEPENDENT-AUDIT.json"))) : null}));
