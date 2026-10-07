import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g02-product-replication-r3";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const planPath = join(root, "EXECUTION-PLAN.json"), plan = JSON.parse(readFileSync(planPath));
const cohortPath = join(root, "COHORT.json"), cohort = JSON.parse(readFileSync(cohortPath));
const resultPath = join(root, "DRIVER-RESULT.json");
const tools = plan.tools_root, node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
if (plan.schema_version !== "are.g02-product-replication-execution/v1" || plan.ordered_pairs?.length !== 12 ||
    cohort.ordered_tasks?.length !== 12 || sha(readFileSync(cohortPath)) !== plan.cohort_sha256 ||
    sha(readFileSync(join(tools,"prepare-prospective.mjs"))) !== plan.tool_bindings.prepare_prospective_sha256 ||
    sha(readFileSync(join(tools,"run-and-score-pair.mjs"))) !== plan.tool_bindings.run_and_score_pair_sha256 ||
    existsSync(resultPath)) throw Error("g02-r3-plan-drift-or-existing-result");
let cursor = 0;
const outcomes = Array(12);
async function worker() {
  while (cursor < 12) {
    const index = cursor++, pair = plan.ordered_pairs[index];
    if (pair.instance_id !== cohort.ordered_tasks[index].instance_id || pair.repo !== cohort.ordered_tasks[index].repo || existsSync(pair.root))
      throw Error(`g02-r3-pair-binding:${index}`);
    const env = {...process.env, ...plan.env_policy, G02_TOOLS_ROOT:tools, G02_REPO:pair.repo,
      G02_INSTANCE:pair.instance_id, G02_PAIR_SUFFIX:pair.suffix};
    const started = new Date().toISOString();
    const status = await new Promise(resolve => {
      const child = spawn(node,[join(tools,"run-and-score-pair.mjs"),pair.suffix,pair.instance_id],{env,stdio:["ignore","pipe","pipe"]});
      let stdout = "", stderr = "";
      child.stdout.on("data", chunk => {stdout=(stdout+chunk).slice(-16384);});
      child.stderr.on("data", chunk => {stderr=(stderr+chunk).slice(-16384);});
      child.on("error", error => resolve({exit_code:null,error:String(error),stdout,stderr}));
      child.on("exit", code => resolve({exit_code:code,stdout,stderr}));
    });
    const decisionPath = join(pair.root,"PAIR-DECISION.json");
    const decision = existsSync(decisionPath) ? JSON.parse(readFileSync(decisionPath)) : null;
    outcomes[index] = {instance_id:pair.instance_id, repo:pair.repo, suffix:pair.suffix, started_at:started,
      ended_at:new Date().toISOString(), ...status, decision:decision?.strict_four_gate_decision??null,
      decision_sha256:decision?sha(readFileSync(decisionPath)):null};
    process.stdout.write(`${JSON.stringify({index, instance_id:pair.instance_id, exit_code:status.exit_code, decision:outcomes[index].decision})}\n`);
  }
}
await Promise.all([worker(),worker()]);
const receipt = {schema_version:"are.g02-product-replication-driver/v1",status:"completed-dispatch",plan_sha256:sha(readFileSync(planPath)),
  cohort_sha256:sha(readFileSync(cohortPath)),first_task:null,remaining_outcomes:outcomes,
  claim_ceiling:"Fresh 12-pair execution receipt only; independent eligibility, score and cost audit required."};
writeFileSync(resultPath,`${JSON.stringify(receipt,null,2)}\n`,{flag:"wx",mode:0o600});
process.stdout.write(`${JSON.stringify({status:receipt.status, terminal:outcomes.length})}\n`);
