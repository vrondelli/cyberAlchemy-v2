// Provider-free qualification on the already exposed r15 task 02. Emits only
// hashes and counts; never emits model text, tool outputs, gold, or credentials.
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r15-late-binding-qualification-r1`;
const pair = `${base}/g01-product-replication-r15/task-02`;
const lower = "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1/task-02";
const out = `${source}/LATE-BINDING-REPLAY.json`;
const freezeSha = "d68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-late-binding.${reason}`);};
const read = path => JSON.parse(readFileSync(path));

async function main() {
  need(sha(readFileSync(`${base}/g01-product-replication-r15/CAMPAIGN-FREEZE.json`)) === freezeSha,
    "freeze-drift");
  const task = read(`${base}/g01-product-replication-input-r15-overlay-r2/tasks/SWE-Bench-Pro__python__maintenance__bugfix__e579f2f0.json`);
  need(execFileSync("git", ["-C", lower, "rev-parse", "HEAD"], {encoding: "utf8"}).trim() === task.base_commit,
    "base-commit-drift");
  const pairBytes = readFileSync(join(pair, "PAIR-RESULT.json"));
  const result = JSON.parse(pairBytes);
  need(result.status === "unscored" && ["control", "candidate"].every(arm =>
    result.arms[arm].error === "intent-anchor-integration.no-delivered-confirmed-read"),
  "exposed-pair-shape");
  const prefix = `${source}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
  const {bindInvestigationEvidence} = await import(pathToFileURL(`${prefix}/bounded-archive-frontier-evidence-join-r1.mjs`).href);
  const {mapConfirmedTerminalReads} = await import(pathToFileURL(`${prefix}/intent-anchor-integration-r3.mjs`).href);
  const {lateBindDeliveredBaseReads} = await import(pathToFileURL(`${prefix}/late-bind-delivered-base-r1.mjs`).href);
  const arms = {};
  for (const arm of ["control", "candidate"]) {
    const bytes = readFileSync(join(pair, arm, "runs", "00", "result.json"));
    const original = JSON.parse(bytes);
    need(original.status === "run_error" && original.error === result.arms[arm].error,
      `arm:${arm}`);
    const joined = bindInvestigationEvidence({branches: original.branches,
      receipts: original.receipts});
    let originalFailure = false;
    try {mapConfirmedTerminalReads(original.convergence_state, joined.read_observations,
      original.origin_bindings, {omit_undelivered: true});}
    catch (error) {originalFailure = error.message === "intent-anchor-integration.no-delivered-confirmed-read";}
    need(originalFailure, `original-failure:${arm}`);
    const rebound = lateBindDeliveredBaseReads({state: original.convergence_state,
      origin_bindings: original.origin_bindings, native_reads: joined.read_observations,
      repoRoot: lower, base_commit: task.base_commit});
    const mapped = mapConfirmedTerminalReads(rebound.state, joined.read_observations,
      rebound.origin_bindings, {omit_undelivered: true});
    need(mapped.mappings.length > 0, `unmapped:${arm}`);
    arms[arm] = {result_sha256: sha(bytes), ...rebound.counts,
      mapped_after_late_binding: mapped.mappings.length};
  }
  const helper = readFileSync(join(prefix, "late-bind-delivered-base-r1.mjs"));
  const receipt = {schema_version: "are.g01-r15-late-binding-qualification/v1",
    status: "provider-free-exposed-task-replay-passed", campaign_freeze_sha256: freezeSha,
    pair_result_sha256: sha(pairBytes), helper_sha256: sha(helper), arms,
    model_calls: 0, gold_loaded: false, historical_result_modified: false,
    claim_ceiling: "One exposed failed task validates the late-binding mechanism only; no native score, frozen-result repair, transfer, or superiority",
    open_questions: ["Does the opt-in mechanism preserve accuracy on a fresh matched cohort?",
      "Can a new cohort finish its full predeclared validity gate?"]};
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(out, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, arms,
    receipt_sha256: sha(bytes)}));
}

main().catch(error => {console.error(JSON.stringify({status: "qualification-error",
  error: String(error.message)})); process.exitCode = 2;});
