// Provider-free diagnosis on exposed r15 task 02. Emits counts and hashes only;
// never exports model text, source bytes, tool outputs, gold, or credentials.
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r15-r2-overlay-source-qualification-r1`;
const pair = `${base}/g01-product-replication-r15/task-02`;
const lower = "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1/task-02";
const out = `${base}/g01-r15-delivered-read-diagnosis-r1`;
const freezeSha = "d68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-delivered-read.${reason}`);};
const read = path => JSON.parse(readFileSync(path));
const safePath = path => typeof path === "string" && path.length > 0 &&
  !path.startsWith("/") && !path.includes("\\") &&
  path.split("/").every(piece => piece && piece !== "." && piece !== "..");

async function main() {
  need(sha(readFileSync(`${base}/g01-product-replication-r15/CAMPAIGN-FREEZE.json`)) === freezeSha,
    "freeze-drift");
  const task = read(`${base}/g01-product-replication-input-r15-overlay-r2/tasks/SWE-Bench-Pro__python__maintenance__bugfix__e579f2f0.json`);
  need(task.base_commit === "709484969c8a4ffd74b839a673431a8c5caa6457" &&
    execFileSync("git", ["-C", lower, "rev-parse", "HEAD"], {encoding: "utf8"}).trim() === task.base_commit,
    "task-binding");
  const pairBytes = readFileSync(join(pair, "PAIR-RESULT.json"));
  const pairResult = JSON.parse(pairBytes);
  need(pairResult.status === "unscored" &&
    ["control", "candidate"].every(arm =>
      pairResult.arms[arm].error === "intent-anchor-integration.no-delivered-confirmed-read"),
    "pair-result");
  const prefix = `${source}/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
  const {bindInvestigationEvidence} = await import(pathToFileURL(`${prefix}/bounded-archive-frontier-evidence-join-r1.mjs`).href);
  const {confirmBaseRead} = await import(pathToFileURL(`${prefix}/intent-anchor-convergence-r3.mjs`).href);
  const {bindConfirmedBaseRead, mapConfirmedTerminalReads} = await import(pathToFileURL(`${prefix}/intent-anchor-integration-r3.mjs`).href);
  const arms = {};
  for (const arm of ["control", "candidate"]) {
    const resultBytes = readFileSync(join(pair, arm, "runs", "00", "result.json"));
    const result = JSON.parse(resultBytes), joined = bindInvestigationEvidence({
      branches: result.branches, receipts: result.receipts});
    need(result.status === "run_error" && result.error === pairResult.arms[arm].error,
      `arm:${arm}`);
    const originalDeliveredBindings = result.origin_bindings.filter(binding =>
      joined.read_observations.some(read => read.id === binding.native_read_id));
    let next = result.convergence_state, bindings = [...result.origin_bindings];
    let supportCovered = 0, baseHashMatched = 0, rebound = 0;
    for (const observation of joined.read_observations) {
      const supported = next.support.some(row => row.path === observation.path &&
        row.content_sha256 === observation.source_sha256 &&
        row.start_line <= observation.start_line && row.end_line >= observation.end_line);
      if (!supported) continue;
      supportCovered++;
      need(safePath(observation.path) && /^[a-f0-9]{64}$/.test(observation.source_sha256),
        `observation-path:${arm}`);
      const sourceBytes = execFileSync("git", ["-C", lower, "show",
        `${task.base_commit}:${observation.path}`], {maxBuffer: 4_000_000});
      if (sha(sourceBytes) !== observation.source_sha256) continue;
      baseHashMatched++;
      const updated = confirmBaseRead(next, {path: observation.path,
        start_line: observation.start_line, end_line: observation.end_line,
        content_sha256: observation.source_sha256, base_revision_confirmed: true});
      const confirmed = updated.confirmed_base_reads.find(row =>
        row.path === observation.path && row.start_line === observation.start_line &&
        row.end_line === observation.end_line && row.content_sha256 === observation.source_sha256);
      need(confirmed, `confirmed:${arm}`);
      if (!bindings.some(binding => binding.convergence_read_id === confirmed.read_id)) {
        bindings.push(bindConfirmedBaseRead(updated, {convergence_read_id: confirmed.read_id,
          native_read_id: observation.id, source_revision: "base",
          path: observation.path, start_line: observation.start_line,
          end_line: observation.end_line, source_sha256: observation.source_sha256}));
        rebound++;
      }
      next = updated;
    }
    const mapped = mapConfirmedTerminalReads(next, joined.read_observations, bindings,
      {maximum_reads: 8, omit_undelivered: true});
    arms[arm] = {result_sha256: sha(resultBytes),
      original_confirmed: result.convergence_state.confirmed_base_reads.length,
      original_bindings: result.origin_bindings.length,
      original_delivered_confirmed_bindings: originalDeliveredBindings.length,
      delivered_reads: joined.read_observations.length,
      support_covered_delivered_reads: supportCovered,
      base_hash_matched_delivered_reads: baseHashMatched,
      newly_bound_delivered_reads: rebound,
      mapped_after_late_binding: mapped.mappings.length};
  }
  const receipt = {schema_version: "are.g01-r15-delivered-read-diagnosis/v1",
    status: "provider-free-exposed-failure-replay", campaign_freeze_sha256: freezeSha,
    pair_result_sha256: sha(pairBytes), arms,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Read-delivery mechanism diagnostic on one exposed failed task; no native score, frozen-result repair, transfer or superiority",
    open_questions: ["Does a prospective late-binding policy preserve quality and cost on other exposed tasks?",
      "Can a fresh cohort and complete matched campaign independently confirm reliability and superiority?"]};
  mkdirSync(out, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(out, "DIAGNOSIS.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, arms,
    receipt_sha256: sha(bytes)}));
}

main().catch(error => {console.error(JSON.stringify({status: "diagnosis-error", error: String(error.message)})); process.exitCode = 2;});
