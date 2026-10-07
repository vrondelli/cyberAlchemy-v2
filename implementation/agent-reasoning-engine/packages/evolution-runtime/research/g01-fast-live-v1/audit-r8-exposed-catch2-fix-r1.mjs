// Independent hash and native-metric audit of one exposed development score.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r8-exposed-audit.${reason}`);};
const read = path => JSON.parse(readFileSync(path));
const fileSha = path => sha(readFileSync(path));
const f1 = value => value.coverage + value.precision > 0 ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-product-replication-r8/cpp--atch2-83e00afd`;
const root = `${base}/g01-r8-exposed-catch2-fix-r1`;
const freezePath = join(root, "CANDIDATE-FREEZE.json"), sealPath = join(root, "PRE-SCORE-SEAL.json"), resultPath = join(root, "DIAGNOSTIC-RESULT.json");
const pins = {freeze: "16f8cdd0269832afbee5545c2a8bb31e96f1532c69ae785fc16218d4265d2396", seal: "4f7706a563d157f46529c61fce756efbf73e32c19cbe0f2b6173cc63d4700515", result: "0df78c5abf9f5357f1f81e78b54828cf3010887688ad2cda983927165fec0f31", oldPair: "64c99e37b0201f4245761e61deff76cefdffe0920b898a31d75550203d139033"};
try {
  need(["--check", "--seal"].includes(process.argv[2]) && process.argv.length === 3, "arguments");
  need(fileSha(freezePath) === pins.freeze && fileSha(sealPath) === pins.seal && fileSha(resultPath) === pins.result && fileSha(join(oldRoot, "PAIR-RESULT.json")) === pins.oldPair, "lineage-drift");
  const freeze = read(freezePath), seal = read(sealPath), result = read(resultPath);
  need(freeze.claim_ceiling.includes("previously exposed Catch2") && freeze.development_parent_freeze_sha256 && result.status === "scored-development-only" && result.claim_ceiling === freeze.claim_ceiling && result.freeze_sha256 === pins.freeze && result.seal_sha256 === pins.seal && seal.freeze_sha256 === pins.freeze && seal.old_pair_result_sha256 === pins.oldPair && result.old_pair_result_sha256 === pins.oldPair && result.task_sha256 === freeze.task_sha256, "development-binding");
  for (const source of freeze.sources) need(fileSha(source.path) === source.sha256, `source-drift:${source.path}`);
  const outputs = {control: join(oldRoot, "control", "runs", "00"), repaired_candidate: join(root, "candidate", "runs", "00")};
  const rows = {};
  for (const [arm, out] of Object.entries(outputs)) {
    const predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json");
    need(fileSha(predictionPath) === seal.prediction_sha256[arm] && fileSha(scorePath) === result.rows[arm].native_score_sha256 && statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, `score-seal:${arm}`);
    const native = read(scorePath), run = read(join(out, "result.json")), models = run.receipts.filter(x => x.kind === "model");
    need(run.status === "final_context_selected" && models.length === result.rows[arm].model_calls && models.reduce((n, x) => n + x.input_tokens + x.output_tokens, 0) === result.rows[arm].known_model_tokens, `usage:${arm}`);
    need(Math.abs(f1(native.native.final.span) - result.rows[arm].span_f1) < 1e-12 && Math.abs(f1(native.native.final.file) - result.rows[arm].file_f1) < 1e-12 && Math.abs((statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000 - result.rows[arm].duration_seconds) < 1e-6, `metric:${arm}`);
    rows[arm] = {span_f1: result.rows[arm].span_f1, file_f1: result.rows[arm].file_f1, known_model_tokens: result.rows[arm].known_model_tokens, model_calls: models.length, prediction_sha256: seal.prediction_sha256[arm], native_score_sha256: fileSha(scorePath)};
  }
  const audit = {schema_version: "are.g01-r8-exposed-fix-audit/v1", status: "passed", freeze_sha256: pins.freeze, pre_score_seal_sha256: pins.seal, diagnostic_result_sha256: pins.result, old_pair_result_sha256: pins.oldPair, rows, claim_ceiling: "One exposed development task only; no r8 repair or superiority claim", authority_effect: "none"};
  if (process.argv[2] === "--check") console.log(JSON.stringify({status: "check-passed-not-sealed", rows: Object.keys(rows).length}));
  else {
    const path = join(root, "HASH-AUDIT.json");
    need(!existsSync(path), "audit-exists");
    writeFileSync(path, JSON.stringify(audit, null, 2) + "\n", {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "sealed", path, sha256: fileSha(path), rows: Object.keys(rows).length}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "audit-failed", error: String(error.message)}));
  process.exitCode = 2;
}
