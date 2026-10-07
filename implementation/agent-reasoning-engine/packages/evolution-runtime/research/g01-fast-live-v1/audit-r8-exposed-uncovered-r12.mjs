// Independent receipt, seal, source and native-metric audit for the exposed
// Catch2 uncovered-requirement diagnostic. Not a cohort superiority audit.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {bindInvestigationEvidence} from "/opt/are/evolution-runtime/g01-source-uncovered-requirement-r12/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-evidence-join-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r12-audit.${reason}`); };
const fileSha = path => sha(readFileSync(path));
const read = path => JSON.parse(readFileSync(path));
const f1 = value => value.coverage + value.precision ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const root = "/opt/are/evolution-runtime/g01-r8-exposed-catch2-uncovered-r12";
const oldRoot = "/opt/are/evolution-runtime/g01-product-replication-r8/cpp--atch2-83e00afd";
const fixRoot = "/opt/are/evolution-runtime/g01-r8-exposed-catch2-fix-r1";
const pins = {
  freeze: "4d76757ad1f05b433db4c6c6764beec23db17d8dcb865e1d5ef53d52b168bf67",
  seal: "36dd633df896d05cac4210b88e711c2c3faade391aa87fcb4ccabde23688ecab",
  result: "3ba1c885a8029e933e7aab68921cf3a62f00ee5d3f38d2ba16cb9b924c21ddd7",
  oldPair: "64c99e37b0201f4245761e61deff76cefdffe0920b898a31d75550203d139033"
};
const paths = {freeze: join(root, "CANDIDATE-FREEZE.json"), seal: join(root, "PRE-SCORE-SEAL.json"), result: join(root, "DIAGNOSTIC-RESULT.json")};
try {
  need(["--check", "--seal"].includes(process.argv[2]) && process.argv.length === 3, "arguments");
  for (const [key, path] of Object.entries(paths)) need(fileSha(path) === pins[key], `${key}-drift`);
  need(fileSha(join(oldRoot, "PAIR-RESULT.json")) === pins.oldPair, "old-pair-drift");
  const freeze = read(paths.freeze), seal = read(paths.seal), result = read(paths.result);
  need(freeze.arm === "intent-anchor-terminal-shortlist-uncovered-requirement-r1" &&
    result.status === "scored-development-only" && result.claim_ceiling === freeze.claim_ceiling &&
    result.freeze_sha256 === pins.freeze && result.pre_score_seal_sha256 === pins.seal &&
    seal.freeze_sha256 === pins.freeze && seal.old_pair_result_sha256 === pins.oldPair &&
    result.old_pair_result_sha256 === pins.oldPair && result.task_sha256 === freeze.task_sha256 &&
    seal.scoring_status_at_seal === "not-started", "lineage");
  for (const source of freeze.sources) need(fileSha(source.path) === source.sha256, `source-drift:${source.path}`);
  const outputs = {
    r8_control: join(oldRoot, "control", "runs", "00"),
    r10_candidate: join(fixRoot, "candidate", "runs", "00"),
    r12_candidate: join(root, "candidate", "runs", "00")
  };
  const rows = {};
  for (const [name, out] of Object.entries(outputs)) {
    const row = result.rows[name], runPath = join(out, "result.json"), predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json");
    need(fileSha(runPath) === row.run_result_sha256 && fileSha(predictionPath) === row.prediction_sha256 &&
      fileSha(scorePath) === row.native_score_sha256, `output-hash:${name}`);
    const run = read(runPath), score = read(scorePath).native.final, models = run.receipts.filter(item => item.kind === "model");
    const tokens = models.reduce((sum, item) => sum + item.input_tokens + item.output_tokens, 0);
    const duration = (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000;
    need(run.status === "final_context_selected" && models.length === row.model_calls && tokens === row.known_model_tokens &&
      Math.abs(f1(score.span) - row.span_f1) < 1e-12 && Math.abs(f1(score.file) - row.file_f1) < 1e-12 &&
      Math.abs(duration - row.duration_seconds) < 0.002 &&
      JSON.stringify(run.exported.prediction.traj_data.pred_files) === JSON.stringify(row.pred_files), `metric:${name}`);
    rows[name] = {span_f1: row.span_f1, file_f1: row.file_f1, known_model_tokens: tokens, model_calls: models.length};
  }
  need(result.rows.r8_control.prediction_sha256 === seal.prediction_sha256.control &&
    result.rows.r12_candidate.prediction_sha256 === seal.prediction_sha256.candidate &&
    statSync(paths.seal).mtimeMs <= statSync(join(outputs.r12_candidate, "native-score.json")).mtimeMs, "pre-score-seal");
  const run = read(join(outputs.r12_candidate, "result.json"));
  const events = readFileSync(join(outputs.r12_candidate, "events.jsonl"), "utf8").trim().split("\n").map(line => JSON.parse(line));
  const acquisitions = events.filter(event => event.kind === "uncovered-requirement-acquisition" && event.output?.ok === true);
  need(acquisitions.length === 1 && acquisitions[0].query === "precision" &&
    acquisitions[0].output.output.path === "include/internal/catch_tostring.cpp", "source-acquisition");
  const readId = acquisitions[0].output.output.read_id;
  need(events.some(event => event.kind === "neighborhood-view-admission" && event.delivered_read_ids.includes(readId)), "read-admission");
  const joined = bindInvestigationEvidence({branches: run.branches, receipts: run.receipts});
  need(joined.read_observations.some(read => read.id === readId && read.path === acquisitions[0].output.output.path &&
    read.body.includes("precision") && read.confirmed_receipts.length > 0), "receipt-bound-source");
  need(result.rows.r12_candidate.pred_files.includes(acquisitions[0].output.output.path), "selected-source");
  const audit = {schema_version: "are.g01-r8-exposed-uncovered-audit/v1", status: "passed", freeze_sha256: pins.freeze,
    pre_score_seal_sha256: pins.seal, diagnostic_result_sha256: pins.result, old_pair_result_sha256: pins.oldPair,
    receipt_bound_read_id: readId, rows, claim_ceiling: "One exposed development task only; no r8 repair, holdout or superiority claim", authority_effect: "none"};
  if (process.argv[2] === "--check") console.log(JSON.stringify({status: "check-passed-not-sealed", rows}));
  else {
    const path = join(root, "HASH-AUDIT.json"); need(!existsSync(path), "audit-exists");
    writeFileSync(path, JSON.stringify(audit, null, 2) + "\n", {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "sealed", path, sha256: fileSha(path), rows}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "audit-failed", error: String(error.message)}));
  process.exitCode = 2;
}
