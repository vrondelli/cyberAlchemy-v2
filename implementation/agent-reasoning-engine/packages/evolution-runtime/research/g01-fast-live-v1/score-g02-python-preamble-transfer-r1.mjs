// Native-score only the already sealed, exposed source-only projections.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-python-g02-score.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-python-preamble-g02-exposed-transfer-r1";
const sealPath = join(root, "SOURCE-SEAL.json");
const sealSha = "0bea69bd2513e87da2e196dc5c845e76926b443fe712161aa7a322456d84ca37";
const upstream = "/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream";
const repo = "/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/repo";
const cache = "/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache";
need(process.argv.length === 2 && sha(readFileSync(sealPath)) === sealSha &&
  !existsSync(join(root, "SCORE-EXECUTION.json")), "arguments-or-seal");
const seal = JSON.parse(readFileSync(sealPath));
need(seal.denominator === 12 && seal.changed_predictions === 11 &&
  seal.gold_loaded === false && seal.model_calls === 0, "source-seal-shape");
const rows = [];
for (const row of seal.rows) {
  if (!row.changed) {
    rows.push({suffix: row.suffix, status: "unchanged-not-rescored"});
    continue;
  }
  const cell = join(root, row.suffix), prediction = join(cell, "prediction.json");
  const score = join(cell, "native-score.json");
  need(sha(readFileSync(prediction)) === row.projected_prediction_sha256 &&
    !existsSync(score), `prediction-or-score-drift:${row.suffix}`);
  const args = ["run", "--rm", "--network", "none", "-v", `${repo}:/repo:ro`,
    "-v", `${upstream}:/upstream:ro`, "-v", `${cache}:/cache`,
    "-v", `${cell}:/work`, "are-contextbench-scorer:g01-r1", "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache",
    "--out", "/work/native-score.json"];
  const result = spawnSync("docker", args, {encoding: "utf8", timeout: 180000,
    maxBuffer: 2 * 1024 * 1024});
  rows.push({suffix: row.suffix,
    status: !result.error && result.status === 0 && existsSync(score) ? "scored" : "score-error",
    native_score_sha256: existsSync(score) ? sha(readFileSync(score)) : null,
    exit_code: result.status,
    failure_class: result.error ? "spawn-or-timeout" : result.status === 0 ? null : "nonzero-exit"});
  if (rows.at(-1).status !== "scored") break;
}
const complete = rows.length === 12 && rows.filter(row => row.status === "scored").length === 11;
const execution = {schema_version: "are.g01-python-preamble-g02-exposed-score-execution/v1",
  posture: "native-scoring-after-source-seal; exposed G02 predictions; no GLM calls",
  source_seal_sha256: sealSha, rows, complete,
  claim_ceiling: "Operational scoring receipt only; quality and claim status require independent evaluator summary"};
const path = join(root, "SCORE-EXECUTION.json");
writeFileSync(path, `${JSON.stringify(execution, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: complete ? "scored" : "incomplete", denominator: 12,
  changed_predictions: 11, scored: rows.filter(row => row.status === "scored").length,
  execution_sha256: sha(readFileSync(path))}));
if (!complete) process.exitCode = 2;
