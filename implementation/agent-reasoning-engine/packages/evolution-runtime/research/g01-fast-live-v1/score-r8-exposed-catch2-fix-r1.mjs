// Seal then natively score the old exposed control and a separately frozen fix.
// Never changes the frozen r8 pair result or its campaign denominator.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r8-exposed-score.${reason}`);};
const read = path => JSON.parse(readFileSync(path));
const fileSha = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx", mode: 0o600});
const f1 = value => value.coverage + value.precision > 0 ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const base = "/opt/are/evolution-runtime";
const oldRoot = `${base}/g01-product-replication-r8/cpp--atch2-83e00afd`;
const newRoot = `${base}/g01-r8-exposed-catch2-fix-r1`;
const freezePath = join(newRoot, "CANDIDATE-FREEZE.json");
const freezeSha = "16f8cdd0269832afbee5545c2a8bb31e96f1532c69ae785fc16218d4265d2396";
const oldPairSha = "64c99e37b0201f4245761e61deff76cefdffe0920b898a31d75550203d139033";
const sealPath = join(newRoot, "PRE-SCORE-SEAL.json");
const resultPath = join(newRoot, "DIAGNOSTIC-RESULT.json");
const paths = {control: join(oldRoot, "control", "runs", "00"), repaired_candidate: join(newRoot, "candidate", "runs", "00")};
try {
  const mode = process.argv[2];
  need(["prepare", "score"].includes(mode) && process.argv.length === 3, "arguments");
  need(fileSha(freezePath) === freezeSha && fileSha(join(oldRoot, "PAIR-RESULT.json")) === oldPairSha, "lineage-drift");
  const freeze = read(freezePath), oldPair = read(join(oldRoot, "PAIR-RESULT.json")), plan = read(join(oldRoot, "PAIR-PLAN.json"));
  need(freeze.task_sha256 === oldPair.task_sha256 && oldPair.status === "unscored" && oldPair.arms.control.status === "final_context_selected" && oldPair.arms.candidate.error === "intent-anchor-episode.non-tool-corrections-exhausted" && plan.scorer.image === "are-contextbench-scorer:g01-r1", "lineage-shape");
  const predictions = Object.fromEntries(Object.entries(paths).map(([arm, out]) => [arm, fileSha(join(out, "prediction.json"))]));
  for (const out of Object.values(paths)) need(read(join(out, "result.json")).status === "final_context_selected", "missing-final-context");
  if (mode === "prepare") {
    need(!existsSync(sealPath) && !existsSync(resultPath) && Object.values(paths).every(out => !existsSync(join(out, "native-score.json"))), "already-scored-or-sealed");
    save(sealPath, {schema_version: "are.g01-r8-exposed-fix-pre-score-seal/v1", status: "sealed-before-native-scoring", freeze_sha256: freezeSha, old_pair_result_sha256: oldPairSha, task_sha256: freeze.task_sha256, prediction_sha256: predictions, scoring_status_at_seal: "not-started", claim_ceiling: freeze.claim_ceiling});
    console.log(JSON.stringify({status: "sealed", seal_sha256: fileSha(sealPath), predictions}));
  } else {
    need(!existsSync(resultPath), "result-exists");
    const seal = read(sealPath);
    need(seal.status === "sealed-before-native-scoring" && seal.scoring_status_at_seal === "not-started" && seal.freeze_sha256 === freezeSha && seal.old_pair_result_sha256 === oldPairSha && JSON.stringify(seal.prediction_sha256) === JSON.stringify(predictions), "seal-drift");
    const rows = {};
    for (const [arm, out] of Object.entries(paths)) {
      const scorePath = join(out, "native-score.json");
      if (!existsSync(scorePath)) {
        const scorer = plan.scorer;
        const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`, "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`, "-v", `${out}:/work`, scorer.image, "python", "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py", "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet", "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
        const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
        need(!run.error && run.status === 0 && existsSync(scorePath), `native-score-failed:${arm}`);
      }
      need(fileSha(join(out, "prediction.json")) === predictions[arm] && statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, `post-seal-drift:${arm}`);
      const native = read(scorePath), result = read(join(out, "result.json"));
      const models = result.receipts.filter(x => x.kind === "model");
      rows[arm] = {span_f1: f1(native.native.final.span), file_f1: f1(native.native.final.file), known_model_tokens: models.reduce((n, x) => n + x.input_tokens + x.output_tokens, 0), model_calls: models.length, duration_seconds: (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000, native_score_sha256: fileSha(scorePath)};
    }
    save(resultPath, {schema_version: "are.g01-r8-exposed-fix-diagnostic/v1", status: "scored-development-only", freeze_sha256: freezeSha, seal_sha256: fileSha(sealPath), old_pair_result_sha256: oldPairSha, task_sha256: freeze.task_sha256, rows, claim_ceiling: freeze.claim_ceiling, open_questions: ["Will the repair preserve completeness, quality, and efficiency on a newly frozen unexposed cohort?"]});
    console.log(JSON.stringify({status: "scored-development-only", path: resultPath, sha256: fileSha(resultPath), rows}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "score-failed", error: String(error.message)}));
  process.exitCode = 2;
}
