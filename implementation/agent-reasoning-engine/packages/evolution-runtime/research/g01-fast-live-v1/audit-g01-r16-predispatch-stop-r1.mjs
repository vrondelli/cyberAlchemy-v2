// Verify the r16 frozen cohort never reached task dispatch after import failure.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-product-replication-r16`;
const freezePath = join(root, "CAMPAIGN-FREEZE.json");
const receiptRoot = `${base}/g01-r16-predispatch-stop-audit-r1`;
const freezeSha = "280ee747ed30bc95de56c3247616cab94026590ff94b4ff54c5225a37fca3b33";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r16-predispatch-audit.${reason}`);};

function main() {
  need(!existsSync(receiptRoot), "already-exists");
  const bytes = readFileSync(freezePath);
  need(sha(bytes) === freezeSha, "freeze-drift");
  const freeze = JSON.parse(bytes);
  need(freeze.status === "frozen-before-dispatch" && freeze.ordered_tasks?.length === 24 &&
    freeze.source_tree_sha256 === "7514c70d2d5c77209dc921671033f1d2cce2e8c7c9419fdcfe61d8490ff560fb",
  "freeze-shape");
  const rows = freeze.ordered_tasks.map(task => {
    const pair = join(root, task.slug);
    need(!existsSync(join(pair, "control")) && !existsSync(join(pair, "candidate")) &&
      !existsSync(join(pair, "PREDICTION-SEAL.json")) &&
      !existsSync(join(pair, "PAIR-RESULT.json")), `task-output:${task.slug}`);
    return {slug: task.slug, instance_id: task.instance_id,
      pair_plan_sha256: task.pair_plan_sha256, dispatch_outputs: 0};
  });
  need(!existsSync("/tmp/are-g01-product-replication-r16-source"), "source-scratch-present");
  const receipt = {schema_version: "are.g01-r16-predispatch-stop-audit/v1",
    status: "verified-no-campaign-dispatch", campaign_freeze_sha256: freezeSha,
    source_tree_sha256: freeze.source_tree_sha256, task_count: rows.length,
    rows, campaign_model_calls: 0, campaign_task_attempts: 0,
    readiness_probe_separate: true,
    reason: "frozen source lacked a statically imported module; coordinator stopped before pair execution",
    claim_ceiling: "R16 freeze abandoned before campaign dispatch; no score or superiority claim, and task IDs remain unexposed by r16",
    open_questions: ["Does the separately frozen r17 source pass full matched dispatch on the same still-unexposed cohort?"]};
  mkdirSync(receiptRoot, {mode: 0o700});
  const out = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "NO-DISPATCH-AUDIT.json"), out, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, task_count: rows.length,
    campaign_model_calls: 0, receipt_sha256: sha(out)}));
}

try {main();} catch (error) {
  console.error(JSON.stringify({status: "audit-error", error: String(error.message)}));
  process.exitCode = 2;
}
