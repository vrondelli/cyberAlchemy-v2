// Independent audit of source-only mirror projection and native score.
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-json-mirror-audit.${reason}`);};
const read = path => JSON.parse(readFileSync(path));
const fileSha = path => sha(readFileSync(path));
const f1 = value => value.coverage + value.precision > 0 ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r8-exposed-json-mirror-r1`;
const oldRoot = `${base}/g01-product-replication-r8/cpp-json-20af1351`;
const pins = {sourcePrediction: "cc52107752ed1a9a8fca185eaadc688aa7123cbc7256f004b84d0f46b04a59ec", projection: "62710481cf8df5122932b5fd727b6925c2b0371d990331e6192ffd57e315c7bb", prediction: "9637e7131cdef68cc092a22aec435145a81d045779dae6ded94b3f5912225029", seal: "52ab3cfaac933f8911652f7f8f0477ff951cd20528ee61b4ff89689cd12e7a19", result: "f4ef3ea5be221b3cad3f39d7b0e0c6fd37b790e62cb4ab8abe6d3dde12d2524c", originalPair: "968ff17a77532dd153c4a9b361cc260953a42beb34a0f143ba0fb0afc115c6e0"};
try {
  need(["--check", "--seal"].includes(process.argv[2]) && process.argv.length === 3, "arguments");
  const predictionPath = join(root, "prediction.json"), projectionPath = join(root, "PROJECTION.json"), sealPath = join(root, "PRE-SCORE-SEAL.json"), scorePath = join(root, "native-score.json"), resultPath = join(root, "DIAGNOSTIC-RESULT.json");
  need(fileSha(join(oldRoot, "candidate", "runs", "00", "prediction.json")) === pins.sourcePrediction && fileSha(join(oldRoot, "PAIR-RESULT.json")) === pins.originalPair && fileSha(projectionPath) === pins.projection && fileSha(predictionPath) === pins.prediction && fileSha(sealPath) === pins.seal && fileSha(resultPath) === pins.result, "lineage-drift");
  const original = read(join(oldRoot, "candidate", "runs", "00", "prediction.json")), mapped = read(predictionPath), projection = read(projectionPath), seal = read(sealPath), result = read(resultPath), score = read(scorePath);
  need(projection.gold_loaded === false && projection.model_calls === 0 && projection.input_prediction_sha256 === pins.sourcePrediction && projection.output_prediction_sha256 === pins.prediction && seal.projection_sha256 === pins.projection && seal.prediction_sha256 === pins.prediction && seal.scoring_status_at_seal === "not-started" && result.pre_score_seal_sha256 === pins.seal && result.projection_sha256 === pins.projection && result.model_calls_added === 0 && result.status === "scored-development-only" && statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, "seal-and-projection");
  const addition = projection.additions[0];
  need(projection.additions.length === 1 && addition.source === "include/nlohmann/json.hpp" && addition.mirror === "single_include/nlohmann/json.hpp" && original.traj_data.pred_files.length === 1 && mapped.traj_data.pred_files.length === 2 && mapped.traj_data.pred_files.includes(addition.source) && mapped.traj_data.pred_files.includes(addition.mirror), "file-set");
  const source = execFileSync("git", ["-C", projection.repository_cache, "show", `${projection.base_commit}:${addition.source}`], {maxBuffer: 5_000_000}).toString();
  const mirror = execFileSync("git", ["-C", projection.repository_cache, "show", `${projection.base_commit}:${addition.mirror}`], {maxBuffer: 5_000_000}).toString();
  need(sha(source) === addition.source_sha256 && sha(mirror) === addition.mirror_sha256, "git-source-drift");
  const sourceLines = source.split("\n"), mirrorLines = mirror.split("\n");
  for (const [i, span] of addition.original_spans.entries()) {
    const projected = addition.projected_spans[i], needle = sourceLines.slice(span.start - 1, span.end).join("\n");
    need(needle === mirrorLines.slice(projected.start - 1, projected.end).join("\n") && JSON.stringify(mapped.traj_data.pred_spans[addition.mirror][i]) === JSON.stringify(projected), `exact-line-map:${i}`);
    let count = 0;
    for (let offset = 0; offset <= mirrorLines.length - (span.end - span.start + 1); offset++) if (mirrorLines.slice(offset, offset + span.end - span.start + 1).join("\n") === needle) count++;
    need(count === 1, `nonunique-map:${i}`);
  }
  need(fileSha(scorePath) === result.mapped_candidate.native_score_sha256 && Math.abs(f1(score.native.final.span) - result.mapped_candidate.span_f1) < 1e-12 && Math.abs(f1(score.native.final.file) - result.mapped_candidate.file_f1) < 1e-12, "native-metric");
  const audit = {schema_version: "are.g01-exposed-json-mirror-audit/v1", status: "passed", original_prediction_sha256: pins.sourcePrediction, mapped_prediction_sha256: pins.prediction, projection_sha256: pins.projection, pre_score_seal_sha256: pins.seal, result_sha256: pins.result, native_score_sha256: fileSha(scorePath), source_exact_line_mappings: addition.projected_spans.length, model_calls_added: 0, claim_ceiling: "One exposed task, source-only mapping and metric integrity; no prospective superiority claim", authority_effect: "none"};
  if (process.argv[2] === "--check") console.log(JSON.stringify({status: "check-passed-not-sealed", mappings: audit.source_exact_line_mappings}));
  else {
    const path = join(root, "HASH-AUDIT.json");
    need(!existsSync(path), "audit-exists");
    writeFileSync(path, JSON.stringify(audit, null, 2) + "\n", {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "sealed", path, sha256: fileSha(path), mappings: audit.source_exact_line_mappings}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "audit-failed", error: String(error.message)}));
  process.exitCode = 2;
}
