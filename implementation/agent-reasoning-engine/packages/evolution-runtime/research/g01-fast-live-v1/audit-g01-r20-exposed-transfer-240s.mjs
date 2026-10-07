// Independent terminal audit of the frozen exposed five-language transfer.
// --check is read-only; --write creates one immutable private audit receipt.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r20-audit.${why}`);};
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r20-exposed-transfer-160k-240s-r1`;
const freezeSha = "d367899f14444bdd9c3edb3c5b1a0e31eb8c51624c99744af22fd5783de77d73";
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const sha = b => createHash("sha256").update(b).digest("hex");
const bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const freezePath = join(root, "TRANSFER-FREEZE.json");
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
need(sha(bytes(freezePath)) === freezeSha && sha(bytes(sourceReceiptPath)) === sourceReceiptSha,
  "pinned-input-drift");
const freeze = read(freezePath), source = read(sourceReceiptPath);
need(freeze.status === "frozen-before-dispatch" && freeze.tasks.length === 5 &&
  freeze.tasks.map(t => t.language).join(",") === "cpp,java,javascript,typescript,python" &&
  freeze.source_tree_sha256 === source.source_tree_sha256 &&
  freeze.budget.context_tokens_per_request === 8000 &&
  freeze.budget.total_tokens_per_arm === 160000 &&
  freeze.budget.model_timeout_ms === 240000 &&
  freeze.budget.automatic_retries === 0, "freeze-shape");
const coordinatorPath = join(root, "COORDINATOR-RESULT.json");
need(existsSync(coordinatorPath), "coordinator-not-terminal");
const coordinator = read(coordinatorPath);
need(coordinator.freeze_sha256 === freezeSha && coordinator.planned_attempts === 10 &&
  coordinator.terminal_attempts === 10 && coordinator.unattempted === 0 &&
  coordinator.status === "all-attempts-terminal" && coordinator.results.length === 10,
  "coordinator-incomplete");
const f1 = m => m.coverage + m.precision > 0 ?
  2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
const rows = [];
for (const [taskIndex, task] of freeze.tasks.entries()) {
  need(sha(bytes(task.config_path)) === task.config_sha256 &&
    task.order.join(",") === "control,candidate", `task-${taskIndex}-drift`);
  const arms = {};
  for (const [armIndex, arm] of task.arms.entries()) {
    const index = taskIndex * 2 + armIndex + 1;
    const attemptPath = join(root, `ATTEMPT-${String(index).padStart(2, "0")}.json`);
    const attempt = read(attemptPath), armFreeze = read(arm.freeze_path);
    const out = join(arm.output_root, "runs", "00");
    const resultPath = join(out, "result.json"), result = read(resultPath);
    const models = result.receipts?.filter(r => r.kind === "model" && r.dispatched !== false) ?? [];
    const known = models.every(r => Number.isSafeInteger(r.input_tokens) &&
      Number.isSafeInteger(r.output_tokens) && r.input_tokens >= 0 && r.output_tokens >= 0);
    const tokens = known ? models.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0) : null;
    need(sha(bytes(arm.freeze_path)) === arm.freeze_sha256 &&
      armFreeze.output_root === arm.output_root && armFreeze.task_sha256 === task.task_sha256 &&
      armFreeze.config_path === task.config_path && armFreeze.config_sha256 === task.config_sha256 &&
      attempt.attempt === index && attempt.slug === task.slug && attempt.language === task.language &&
      attempt.arm === arm.name && attempt.freeze_sha256 === arm.freeze_sha256 &&
      attempt.result_sha256 === sha(bytes(resultPath)) &&
      attempt.terminal_status === result.status && attempt.model_calls === models.length &&
      attempt.known_model_tokens === tokens && attempt.unknown_usage === !known &&
      result.task_sha256 === task.task_sha256 &&
      coordinator.results[index - 1].terminal_status === result.status &&
      coordinator.results[index - 1].known_model_tokens === tokens,
      `attempt-${index}-drift`);
    const sealPath = join(root, task.slug, `${arm.name.toUpperCase()}-PREDICTION-SEAL.json`);
    const notePath = join(root, task.slug, `${arm.name.toUpperCase()}-SCORE.json`);
    const predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json");
    const scored = existsSync(notePath);
    need(!scored || (result.status === "final_context_selected" && known &&
      existsSync(sealPath) && existsSync(predictionPath) && existsSync(scorePath)),
      `attempt-${index}-invalid-score`);
    let score = null;
    if (scored) {
      const seal = read(sealPath), note = read(notePath), native = read(scorePath);
      const span = f1(native.native.final.span), file = f1(native.native.final.file);
      need(seal.status === "sealed-before-native-scoring" &&
        seal.transfer_freeze_sha256 === freezeSha && seal.arm_freeze_sha256 === arm.freeze_sha256 &&
        seal.task_sha256 === task.task_sha256 && seal.result_sha256 === sha(bytes(resultPath)) &&
        seal.prediction_sha256 === sha(bytes(predictionPath)) &&
        seal.known_model_tokens === tokens && seal.model_calls === models.length &&
        seal.scoring_status_at_seal === "not-started" &&
        note.status === "native-scored-exposed" && note.slug === task.slug && note.arm === arm.name &&
        note.transfer_freeze_sha256 === freezeSha && note.arm_freeze_sha256 === arm.freeze_sha256 &&
        note.prediction_seal_sha256 === sha(bytes(sealPath)) &&
        note.result_sha256 === seal.result_sha256 && note.prediction_sha256 === seal.prediction_sha256 &&
        note.native_score_sha256 === sha(bytes(scorePath)) &&
        note.known_model_tokens === tokens && note.model_calls === models.length &&
        Math.abs(note.span_f1 - span) < 1e-12 && Math.abs(note.file_f1 - file) < 1e-12 &&
        statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs,
        `attempt-${index}-score-drift`);
      score = {span_f1: span, file_f1: file, duration_seconds: note.duration_seconds,
        seal_sha256: sha(bytes(sealPath)), note_sha256: sha(bytes(notePath)),
        seal_mtime_ms: statSync(sealPath).mtimeMs, score_mtime_ms: statSync(scorePath).mtimeMs};
    } else {
      need(!existsSync(scorePath), `attempt-${index}-unsealed-score`);
    }
    arms[arm.name] = {attempt_sha256: sha(bytes(attemptPath)), result_sha256: sha(bytes(resultPath)),
      status: result.status, error: result.status === "run_error" ? result.error : null,
      known_model_tokens: tokens, model_calls: models.length, score};
  }
  const c = arms.control.score, t = arms.candidate.score;
  need(Boolean(c) === Boolean(t), `task-${task.slug}-partial-scoring`);
  if (c && t) need(Math.max(c.seal_mtime_ms, t.seal_mtime_ms) <=
    Math.min(c.score_mtime_ms, t.score_mtime_ms), `task-${task.slug}-score-before-both-seals`);
  for (const a of Object.values(arms)) if (a.score) {
    delete a.score.seal_mtime_ms; delete a.score.score_mtime_ms;
  }
  rows.push({language: task.language, slug: task.slug, paired_native_score: Boolean(c && t),
    control: arms.control, candidate: arms.candidate,
    delta: c && t ? {file_f1: t.file_f1 - c.file_f1, span_f1: t.span_f1 - c.span_f1,
      token_ratio: arms.candidate.known_model_tokens / arms.control.known_model_tokens,
      duration_ratio: t.duration_seconds / c.duration_seconds} : null});
}
const scored = rows.filter(r => r.paired_native_score);
const mean = key => scored.reduce((s, r) => s + r.delta[key], 0) / scored.length;
const audit = {schema_version: "are.g01-r20-exposed-transfer-independent-audit/v1",
  status: "terminal-attempts-and-paired-scores-verified", transfer_freeze_sha256: freezeSha,
  source_receipt_sha256: sourceReceiptSha, coordinator_sha256: sha(bytes(coordinatorPath)),
  planned_tasks: 5, terminal_attempts: 10, paired_native_scores: scored.length,
  rows, descriptive_valid_pair_mean: scored.length ?
    {file_f1_delta: mean("file_f1"), span_f1_delta: mean("span_f1"),
      token_ratio: mean("token_ratio"), duration_ratio: mean("duration_ratio")} : null,
  fresh_holdout: false, interval: null,
  claim_ceiling: "Exposed transfer diagnostic with invalid-pair accounting; no statistical or product superiority"};
if (mode === "--write") {
  const path = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(path), "already-written");
  writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, terminal_attempts: audit.terminal_attempts,
  paired_native_scores: audit.paired_native_scores, mean: audit.descriptive_valid_pair_mean,
  audit_sha256: mode === "--write" ? sha(bytes(join(root, "INDEPENDENT-AUDIT.json"))) : null}));
