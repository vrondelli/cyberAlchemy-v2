// Native score of one already exposed, source-only mirror projection.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-json-mirror-score.${reason}`);};
const read = path => JSON.parse(readFileSync(path));
const fileSha = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx", mode: 0o600});
const f1 = value => value.coverage + value.precision > 0 ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r8-exposed-json-mirror-r1`;
const oldPair = `${base}/g01-product-replication-r8/cpp-json-20af1351`;
const projectionPath = join(root, "PROJECTION.json"), predictionPath = join(root, "prediction.json");
const projectionSha = "62710481cf8df5122932b5fd727b6925c2b0371d990331e6192ffd57e315c7bb";
const predictionSha = "9637e7131cdef68cc092a22aec435145a81d045779dae6ded94b3f5912225029";
const oldPairSha = "968ff17a77532dd153c4a9b361cc260953a42beb34a0f143ba0fb0afc115c6e0";
const sealPath = join(root, "PRE-SCORE-SEAL.json"), scorePath = join(root, "native-score.json"), resultPath = join(root, "DIAGNOSTIC-RESULT.json");
try {
  const mode = process.argv[2];
  need(["prepare", "score"].includes(mode) && process.argv.length === 3, "arguments");
  need(fileSha(projectionPath) === projectionSha && fileSha(predictionPath) === predictionSha && fileSha(join(oldPair, "PAIR-RESULT.json")) === oldPairSha, "input-drift");
  const projection = read(projectionPath), original = read(join(oldPair, "PAIR-RESULT.json")), plan = read(join(oldPair, "PAIR-PLAN.json"));
  need(projection.model_calls === 0 && projection.gold_loaded === false && projection.output_prediction_sha256 === predictionSha && projection.additions.length === 1 && original.status === "scored" && plan.scorer.image === "are-contextbench-scorer:g01-r1", "lineage");
  if (mode === "prepare") {
    need(!existsSync(sealPath) && !existsSync(scorePath) && !existsSync(resultPath), "already-scored");
    save(sealPath, {schema_version: "are.g01-exposed-mirror-pre-score-seal/v1", status: "sealed-before-native-scoring", projection_sha256: projectionSha, prediction_sha256: predictionSha, original_pair_result_sha256: oldPairSha, scoring_status_at_seal: "not-started", claim_ceiling: "One exposed source-only mapping; no r8 or product superiority claim"});
    console.log(JSON.stringify({status: "sealed", seal_sha256: fileSha(sealPath)}));
  } else {
    need(!existsSync(resultPath), "result-exists");
    const seal = read(sealPath);
    need(seal.status === "sealed-before-native-scoring" && seal.scoring_status_at_seal === "not-started" && seal.projection_sha256 === projectionSha && seal.prediction_sha256 === predictionSha, "seal-drift");
    if (!existsSync(scorePath)) {
      const scorer = plan.scorer;
      const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`, "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`, "-v", `${root}:/work`, scorer.image, "python", "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py", "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet", "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
      const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
      need(!run.error && run.status === 0 && existsSync(scorePath), "native-score-failed");
    }
    need(fileSha(predictionPath) === predictionSha && statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, "post-seal-drift");
    const score = read(scorePath);
    const row = {span_f1: f1(score.native.final.span), file_f1: f1(score.native.final.file), span: score.native.final.span, file: score.native.final.file, native_score_sha256: fileSha(scorePath)};
    save(resultPath, {schema_version: "are.g01-exposed-mirror-diagnostic/v1", status: "scored-development-only", projection_sha256: projectionSha, pre_score_seal_sha256: fileSha(sealPath), original_pair_result_sha256: oldPairSha, original_candidate: {span_f1: original.candidate.span_f1, file_f1: original.candidate.file_f1}, mapped_candidate: row, model_calls_added: 0, claim_ceiling: seal.claim_ceiling, open_questions: ["Can this exact source-only mirror rule improve new tasks without exceeding the 8K context and cost gates?"]});
    console.log(JSON.stringify({status: "scored-development-only", result_sha256: fileSha(resultPath), original_candidate: {span_f1: original.candidate.span_f1, file_f1: original.candidate.file_f1}, mapped_candidate: row}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "score-failed", error: String(error.message)}));
  process.exitCode = 2;
}
