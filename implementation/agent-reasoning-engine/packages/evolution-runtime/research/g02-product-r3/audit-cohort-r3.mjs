// Read-only receipt integrity audit for the terminal G02 r3 12-pair cohort.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g02-product-replication-r3";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => JSON.parse(readFileSync(path));
const need = (value, code) => {if (!value) throw Error(`g02-r3-audit.${code}`);};
const planPath = join(root,"EXECUTION-PLAN.json"), cohortPath = join(root,"COHORT.json"), driverPath = join(root,"DRIVER-RESULT.json");
const plan = read(planPath), cohort = read(cohortPath), driver = read(driverPath);
need(plan.ordered_pairs?.length === 12 && cohort.ordered_tasks?.length === 12 && driver.remaining_outcomes?.length === 12,"cohort-size");
need(sha(readFileSync(cohortPath)) === plan.cohort_sha256 && sha(readFileSync(planPath)) === driver.plan_sha256,"freeze-binding");
const rows = [];
for (const [index,pair] of plan.ordered_pairs.entries()) {
  const outcome = driver.remaining_outcomes.find(row => row.instance_id === pair.instance_id);
  need(outcome && outcome.repo === pair.repo && cohort.ordered_tasks[index].instance_id === pair.instance_id,"task-binding");
  const pairRoot = pair.root, decisionPath = join(pairRoot,"PAIR-DECISION.json");
  if (!existsSync(decisionPath)) {
    need(outcome.exit_code !== 0 && outcome.decision === null,"missing-decision-not-failure");
    const areSettlement = read(join(pairRoot,"ARE-SETTLEMENT.json"));
    const dshSettlement = read(join(pairRoot,"dsh-control/SETTLEMENT.json"));
    const transport = read(join(pairRoot,"dsh-control/transport/RESULTS.json"));
    need(areSettlement.status === "completed" && dshSettlement.exit_code !== 0 && transport.benchmark_cleared === false &&
      transport.cost_complete === true && transport.unknown_usage_dispatched_requests === 0 &&
      transport.known_total_tokens <= 1_000_000,"invalid-arm-binding");
    rows.push({instance_id:pair.instance_id,repo:pair.repo,status:"invalid-dsh-budget",known_dsh_tokens:transport.known_total_tokens,
      transport_sha256:sha(readFileSync(join(pairRoot,"dsh-control/transport/RESULTS.json")))});
    continue;
  }
  const decision = read(decisionPath), sealPath = join(pairRoot,"PAIR-PRE-SCORE-SEAL.json"), seal = read(sealPath);
  need(outcome.exit_code === 0 && decision.instance_id === pair.instance_id && seal.instance_id === pair.instance_id &&
    decision.pre_score_seal_sha256 === sha(readFileSync(sealPath)) && seal.status === "both-valid-predictions-and-costs-sealed-before-scoring" &&
    seal.freeze_sha256 === sha(readFileSync(join(pairRoot,"FREEZE.json"))),"sealed-pair-binding");
  const quality = decision.quality;
  need(quality?.are && quality?.dsh,"quality-missing");
  for (const [arm, work] of [["are","evidence/run"],["dsh","dsh-export"]]) {
    const prediction = join(pairRoot,seal.predictions[arm].path);
    const scorePath = join(pairRoot,work,"native-score.json"), native = read(scorePath);
    need(sha(readFileSync(prediction)) === seal.predictions[arm].sha256 &&
      sha(readFileSync(scorePath)) === quality[arm].score_sha256 &&
      statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs,"score-seal-binding");
    const f1 = value => value.coverage + value.precision > 0 ? 2*value.coverage*value.precision/(value.coverage+value.precision) : 0;
    need(Math.abs(f1(native.native.final.span)-quality[arm].span_f1)<1e-12 &&
      Math.abs(f1(native.native.final.file)-quality[arm].file_f1)<1e-12 &&
      seal.known_model_tokens[arm] === quality[arm].known_model_tokens &&
      Math.abs(seal.arm_seconds[arm]-quality[arm].arm_seconds)<1e-9,"metric-recompute");
  }
  rows.push({instance_id:pair.instance_id,repo:pair.repo,status:"valid-scored",decision_sha256:sha(readFileSync(decisionPath)),
    seal_sha256:sha(readFileSync(sealPath))});
}
need(rows.filter(row=>row.status === "valid-scored").length === 9 && rows.filter(row=>row.status === "invalid-dsh-budget").length === 3,"observed-count-drift");
const audit = {schema_version:"are.g02-r3-independent-receipt-audit/v1",status:"passed",plan_sha256:sha(readFileSync(planPath)),
  cohort_sha256:sha(readFileSync(cohortPath)),driver_sha256:sha(readFileSync(driverPath)),valid_pairs:9,invalid_pairs:3,rows,
  claim_ceiling:"Receipt, seal, score and metric integrity only; no product superiority claim",authority_effect:"none"};
const out = join(root,"HASH-AUDIT.json");
writeFileSync(out,`${JSON.stringify(audit,null,2)}\n`,{flag:"wx",mode:0o600});
process.stdout.write(`${JSON.stringify({status:audit.status,valid_pairs:9,invalid_pairs:3,audit_sha256:sha(readFileSync(out))})}\n`);
