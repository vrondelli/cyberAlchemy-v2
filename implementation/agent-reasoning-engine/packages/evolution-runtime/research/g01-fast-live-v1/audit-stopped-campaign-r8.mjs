// Independent, no-model audit of the stopped two-attempt r8 campaign.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, code) => {if (!value) throw Error(`g01-r8-stopped-audit.${code}`);};
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-product-replication-r8`;
const definitionPath = `${base}/g01-product-replication-input-r11/DEFINITION.json`;
const definitionSha = "8e80eb77b277289b20b48a5677e07c338280d4d1c9e85e65dbbbf360f90a10af";
const freezePath = join(root, "CAMPAIGN-FREEZE.json");
const freezeSha = "2bbea55c5ad67535ad706ee85ddb741bf949322f5799d961cf0c9d88f60e6e60";
const resultPins = ["968ff17a77532dd153c4a9b361cc260953a42beb34a0f143ba0fb0afc115c6e0", "64c99e37b0201f4245761e61deff76cefdffe0920b898a31d75550203d139033"];
const read = path => JSON.parse(readFileSync(path));
const fileSha = path => sha(readFileSync(path));
const f1 = value => value.coverage + value.precision > 0 ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
try {
  need(["--check", "--seal"].includes(process.argv[2]) && process.argv.length === 3, "arguments");
  need(fileSha(definitionPath) === definitionSha && fileSha(freezePath) === freezeSha, "root-drift");
  const definition = read(definitionPath), freeze = read(freezePath);
  need(freeze.definition_sha256 === definitionSha && freeze.ordered_tasks.length === 24 && definition.ordered_tasks.length === 24 && freeze.context_limit === 8000 && freeze.model === "glm-5.3-flash", "campaign-binding");
  for (const source of freeze.sources) need(fileSha(source.path) === source.sha256, `source-drift:${source.path}`);
  const rows = [];
  for (const [index, task] of freeze.ordered_tasks.entries()) {
    const spec = definition.ordered_tasks[index];
    need(task.slug === spec.slug && task.instance_id === spec.instance_id && task.repo === spec.repo && fileSha(spec.task_path) === task.source_only_task_sha256 && fileSha(task.pair_plan_path) === task.pair_plan_sha256, `task-binding:${index}`);
    const pairRoot = dirname(task.pair_plan_path), resultPath = join(pairRoot, "PAIR-RESULT.json");
    const plan = read(task.pair_plan_path);
    for (const arm of ["control", "candidate"]) {
      need(fileSha(plan.arms[arm].freeze_path) === plan.arms[arm].freeze_sha256, `arm-freeze:${index}:${arm}`);
      const armFreeze = read(plan.arms[arm].freeze_path);
      need(armFreeze.task_sha256 === task.source_only_task_sha256 && fileSha(armFreeze.config_path) === armFreeze.config_sha256, `arm-binding:${index}:${arm}`);
    }
    if (index >= 2) {
      need(!existsSync(resultPath) && !existsSync(join(pairRoot, "control")) && !existsSync(join(pairRoot, "candidate")), `unexpected-dispatch:${index}`);
      rows.push({slug: task.slug, status: "unattempted"});
      continue;
    }
    need(fileSha(resultPath) === resultPins[index], `pair-result-drift:${index}`);
    const result = read(resultPath);
    need(result.task_sha256 === task.source_only_task_sha256 && result.schema === "are.g01-fast-live-pair-result/v1", `pair-result-binding:${index}`);
    if (index === 0) {
      need(result.status === "scored", "first-not-scored");
      const sealPath = join(pairRoot, "PREDICTION-SEAL.json"), seal = read(sealPath);
      need(seal.status === "sealed-before-native-scoring" && seal.scoring_status_at_seal === "not-started" && seal.task_sha256 === task.source_only_task_sha256, "prediction-seal");
      for (const arm of ["control", "candidate"]) {
        const out = join(pairRoot, arm, "runs", "00"), row = result[arm], scorePath = join(out, "native-score.json"), native = read(scorePath);
        need(row.scoring_basis === "pinned-native" && fileSha(join(out, "prediction.json")) === seal[`${arm}_prediction_sha256`] && row.prediction_sha256 === seal[`${arm}_prediction_sha256`] && fileSha(scorePath) === row.native_score_sha256 && statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, `native-seal:${arm}`);
        need(Math.abs(f1(native.native.final.span) - row.span_f1) < 1e-12 && Math.abs(f1(native.native.final.file) - row.file_f1) < 1e-12, `native-metric:${arm}`);
      }
      rows.push({slug: task.slug, status: "scored", result_sha256: resultPins[index], seal_sha256: fileSha(sealPath)});
    } else {
      need(result.status === "unscored" && result.arms.control.status === "final_context_selected" && result.arms.candidate.status === "run_error" && result.arms.candidate.error === "intent-anchor-episode.non-tool-corrections-exhausted" && !existsSync(join(pairRoot, "PREDICTION-SEAL.json")), "second-outcome");
      const candidate = read(join(pairRoot, "candidate", "runs", "00", "result.json"));
      const completed = read(join(pairRoot, "candidate", "runs", "00", "completed.json"));
      const models = candidate.receipts.filter(x => x.kind === "model");
      need(candidate.status === "run_error" && completed.status === "run_error" && candidate.error === result.arms.candidate.error && models.length === 11 && models.reduce((sum, x) => sum + x.input_tokens + x.output_tokens, 0) === 35021, "candidate-failure-receipts");
      rows.push({slug: task.slug, status: "unscored", result_sha256: resultPins[index], candidate_result_sha256: fileSha(join(pairRoot, "candidate", "runs", "00", "result.json")), failure: candidate.error});
    }
  }
  const audit = {schema_version: "are.g01-r8-stopped-independent-audit/v1", status: "passed", definition_sha256: definitionSha, campaign_freeze_sha256: freezeSha, planned_pairs: 24, attempted_pairs: 2, scored_pairs: 1, unscored_pairs: 1, unattempted_pairs: 22, rows,
    claim_ceiling: "Integrity of a stopped two-attempt private campaign only; the 24/24 superiority gate failed", authority_effect: "none"};
  if (process.argv[2] === "--check") console.log(JSON.stringify({status: "check-passed-not-sealed", planned: 24, attempted: 2, scored: 1}));
  else {
    const path = join(root, "STOPPED-HASH-AUDIT.json");
    need(!existsSync(path), "audit-exists");
    writeFileSync(path, JSON.stringify(audit, null, 2) + "\n", {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "sealed", path, sha256: fileSha(path), planned: 24, attempted: 2, scored: 1}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "audit-failed", error: String(error.message)}));
  process.exitCode = 2;
}
