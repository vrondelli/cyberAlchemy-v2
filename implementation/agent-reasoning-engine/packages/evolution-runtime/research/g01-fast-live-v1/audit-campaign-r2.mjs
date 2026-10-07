// Independent read-only bindings audit; run after all 24 G01 r2 pairs terminate.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-product-replication-r2";
const definitionPath = "/opt/are/evolution-runtime/g01-product-replication-input-r4/DEFINITION.json";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => JSON.parse(readFileSync(path));
const need = (value, code) => {if (!value) throw Error(`g01-r2-audit.${code}`);};
const definition = read(definitionPath), freezePath = join(root,"CAMPAIGN-FREEZE.json"), freeze = read(freezePath);
const campaignPath = join(root,"CAMPAIGN-RESULT.json"), campaign = read(campaignPath);
need(sha(readFileSync(definitionPath)) === "bb5cb1fb1414b694f966d0df3f0cdcae7f64f4e4316801cad0962f9b5c08574e" &&
  sha(readFileSync(freezePath)) === "b43f572ddd4a4d91e6315ed48f694ddc24a5f8a9e8da9266e2d39976fac181b6" &&
  freeze.definition_sha256 === sha(readFileSync(definitionPath)) && campaign.campaign_freeze_sha256 === sha(readFileSync(freezePath)) &&
  campaign.status === "complete" && freeze.ordered_tasks.length === 24 && campaign.rows.length === 24,"campaign-binding");
const rows = [];
for (const [index, spec] of definition.ordered_tasks.entries()) {
  const task = freeze.ordered_tasks[index], campaignRow = campaign.rows[index];
  need(task.slug === spec.slug && task.instance_id === spec.instance_id && task.repo === spec.repo &&
    task.source_only_task_sha256 === sha(readFileSync(spec.task_path)) &&
    task.pair_plan_sha256 === sha(readFileSync(task.pair_plan_path)),"task-binding");
  const pairRoot = dirname(task.pair_plan_path), resultPath = join(pairRoot,"PAIR-RESULT.json"), result = read(resultPath);
  need(result.task_sha256 === task.source_only_task_sha256 && result.schema === "are.g01-fast-live-pair-result/v1" &&
    campaignRow.slug === task.slug && campaignRow.status === result.status,"pair-result-binding");
  if (result.status !== "scored") {
    rows.push({slug:task.slug,instance_id:task.instance_id,status:result.status,result_sha256:sha(readFileSync(resultPath))});
    continue;
  }
  const sealPath = join(pairRoot,"PREDICTION-SEAL.json"), seal = read(sealPath);
  need(seal.status === "sealed-before-native-scoring" && seal.scoring_status_at_seal === "not-started" &&
    seal.task_sha256 === task.source_only_task_sha256,"seal-binding");
  for (const arm of ["control","candidate"]) {
    const armResult = result[arm], out = join(pairRoot,arm,"runs","00");
    if (armResult.scoring_basis === "pinned-native") {
      const predictionPath = join(out,"prediction.json"), scorePath = join(out,"native-score.json"), native = read(scorePath);
      need(sha(readFileSync(predictionPath)) === seal[`${arm}_prediction_sha256`] &&
        armResult.prediction_sha256 === seal[`${arm}_prediction_sha256`] &&
        sha(readFileSync(scorePath)) === armResult.native_score_sha256 &&
        statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs,"native-seal-binding");
      const f1 = value => value.coverage + value.precision > 0 ? 2*value.coverage*value.precision/(value.coverage+value.precision) : 0;
      need(Math.abs(f1(native.native.final.span)-armResult.span_f1)<1e-12 &&
        Math.abs(f1(native.native.final.file)-armResult.file_f1)<1e-12,"native-metric-recompute");
    } else {
      need(armResult.scoring_basis === "policy-abstention-zero" && armResult.span_f1 === 0 && armResult.file_f1 === 0 &&
        sha(readFileSync(join(out,"result.json"))) === seal[`${arm}_result_sha256`],"abstention-binding");
    }
    need(Number.isFinite(armResult.known_model_tokens) && armResult.known_model_tokens > 0 &&
      Number.isFinite(armResult.duration_seconds) && armResult.duration_seconds > 0,"cost-accounting");
  }
  rows.push({slug:task.slug,instance_id:task.instance_id,status:"scored",result_sha256:sha(readFileSync(resultPath)),
    seal_sha256:sha(readFileSync(sealPath))});
}
const scored = rows.filter(row=>row.status === "scored").length;
need(scored === campaign.scored_pairs,"campaign-score-count");
const audit = {schema_version:"are.g01-r2-independent-receipt-audit/v1",status:"passed",definition_sha256:sha(readFileSync(definitionPath)),
  campaign_freeze_sha256:sha(readFileSync(freezePath)),campaign_result_sha256:sha(readFileSync(campaignPath)),planned_pairs:24,
  scored_pairs:scored,invalid_pairs:24-scored,rows,claim_ceiling:"Receipt, seal and native metric integrity only; no product superiority claim",authority_effect:"none"};
const path = join(root,"HASH-AUDIT.json");
need(!existsSync(path),"already-audited");
writeFileSync(path,`${JSON.stringify(audit,null,2)}\n`,{flag:"wx",mode:0o600});
process.stdout.write(`${JSON.stringify({status:audit.status,planned_pairs:24,scored_pairs:scored,invalid_pairs:24-scored,audit_sha256:sha(readFileSync(path))})}\n`);
