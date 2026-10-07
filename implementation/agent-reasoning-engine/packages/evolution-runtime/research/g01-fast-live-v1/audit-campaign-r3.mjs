// Independent G01 r3 receipt, policy, seal, and native-metric audit after all 24 pairs settle.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-product-replication-r3";
const definitionPath = "/opt/are/evolution-runtime/g01-product-replication-input-r5/DEFINITION.json";
const definitionSha = "b5a29ece7386c037a9b2e5e36410179f93d80c52e42b20a6e75caa743a74e2bd";
const freezeSha = "7ddf069e96cb6cf1610da5f21efaf747de152cb1aa597286e5f3b4666555b4bb";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => JSON.parse(readFileSync(path));
const need = (value, code) => { if (!value) throw Error(`g01-r3-audit.${code}`); };
const definition = read(definitionPath), freezePath = join(root, "CAMPAIGN-FREEZE.json"), freeze = read(freezePath);
const campaignPath = join(root, "CAMPAIGN-RESULT.json"), campaign = read(campaignPath);
need(sha(readFileSync(definitionPath)) === definitionSha && sha(readFileSync(freezePath)) === freezeSha &&
  freeze.definition_sha256 === definitionSha && campaign.campaign_freeze_sha256 === freezeSha &&
  campaign.status === "complete" && freeze.ordered_tasks.length === 24 && campaign.rows.length === 24 &&
  definition.non_tool_terminal_after_convergence === true && freeze.non_tool_terminal_after_convergence === true,
  "campaign-binding");
for (const source of freeze.sources) need(sha(readFileSync(source.path)) === source.sha256, "source-drift");

const rows = [];
for (const [index, spec] of definition.ordered_tasks.entries()) {
  const task = freeze.ordered_tasks[index], campaignRow = campaign.rows[index];
  need(task.slug === spec.slug && task.instance_id === spec.instance_id && task.repo === spec.repo &&
    task.source_only_task_sha256 === sha(readFileSync(spec.task_path)) &&
    task.pair_plan_sha256 === sha(readFileSync(task.pair_plan_path)), "task-binding");
  const pairRoot = dirname(task.pair_plan_path), plan = read(task.pair_plan_path);
  need(plan.non_tool_terminal_after_convergence === true, "pair-policy");
  const resultPath = join(pairRoot, "PAIR-RESULT.json"), result = read(resultPath);
  need(result.task_sha256 === task.source_only_task_sha256 && result.schema === "are.g01-fast-live-pair-result/v1" &&
    campaignRow.slug === task.slug && campaignRow.status === result.status, "pair-result-binding");
  for (const arm of ["control", "candidate"]) {
    const binding = plan.arms[arm], armFreeze = read(binding.freeze_path);
    need(sha(readFileSync(binding.freeze_path)) === binding.freeze_sha256 &&
      armFreeze.non_tool_terminal_after_convergence === true &&
      sha(readFileSync(armFreeze.config_path)) === armFreeze.config_sha256 &&
      read(armFreeze.config_path).non_tool_terminal_after_convergence === true, "arm-policy-binding");
  }
  if (result.status !== "scored") {
    rows.push({slug: task.slug, instance_id: task.instance_id, status: result.status,
      result_sha256: sha(readFileSync(resultPath))});
    continue;
  }
  const sealPath = join(pairRoot, "PREDICTION-SEAL.json"), seal = read(sealPath);
  need(seal.status === "sealed-before-native-scoring" && seal.scoring_status_at_seal === "not-started" &&
    seal.task_sha256 === task.source_only_task_sha256, "seal-binding");
  for (const arm of ["control", "candidate"]) {
    const armResult = result[arm], out = join(pairRoot, arm, "runs", "00");
    if (armResult.scoring_basis === "pinned-native") {
      const predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json"), native = read(scorePath);
      need(sha(readFileSync(predictionPath)) === seal[`${arm}_prediction_sha256`] &&
        armResult.prediction_sha256 === seal[`${arm}_prediction_sha256`] &&
        sha(readFileSync(scorePath)) === armResult.native_score_sha256 &&
        statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, "native-seal-binding");
      const f1 = value => value.coverage + value.precision > 0 ? 2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
      need(Math.abs(f1(native.native.final.span) - armResult.span_f1) < 1e-12 &&
        Math.abs(f1(native.native.final.file) - armResult.file_f1) < 1e-12, "native-metric-recompute");
    } else {
      need(armResult.scoring_basis === "policy-abstention-zero" && armResult.span_f1 === 0 && armResult.file_f1 === 0 &&
        sha(readFileSync(join(out, "result.json"))) === seal[`${arm}_result_sha256`], "abstention-binding");
    }
    need(Number.isFinite(armResult.known_model_tokens) && armResult.known_model_tokens > 0 &&
      Number.isFinite(armResult.duration_seconds) && armResult.duration_seconds > 0, "cost-accounting");
  }
  rows.push({slug: task.slug, instance_id: task.instance_id, status: "scored",
    result_sha256: sha(readFileSync(resultPath)), seal_sha256: sha(readFileSync(sealPath))});
}
const scored = rows.filter(row => row.status === "scored").length;
need(scored === campaign.scored_pairs, "campaign-score-count");
const audit = {schema_version: "are.g01-r3-independent-receipt-audit/v1", status: "passed",
  definition_sha256: definitionSha, campaign_freeze_sha256: freezeSha,
  campaign_result_sha256: sha(readFileSync(campaignPath)), planned_pairs: 24,
  scored_pairs: scored, invalid_pairs: 24 - scored, rows,
  claim_ceiling: "Receipt, policy, seal, and native-metric integrity only; no product superiority claim",
  authority_effect: "none"};
const path = join(root, "HASH-AUDIT.json");
need(!existsSync(path), "already-audited");
writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: audit.status, planned_pairs: 24, scored_pairs: scored,
  invalid_pairs: 24 - scored, audit_sha256: sha(readFileSync(path))}));
