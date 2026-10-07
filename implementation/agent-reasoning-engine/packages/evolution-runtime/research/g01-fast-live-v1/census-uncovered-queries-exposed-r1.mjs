// Read-only, gold-blind census of uncovered issue terms at the four-call G01
// acquisition boundary. This is not a search-quality or model-score census.
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {isAbsolute, join} from "node:path";

const sourceRoot = process.argv[2], campaignRoot = process.argv[3];
if (process.argv.length !== 4 || !isAbsolute(sourceRoot ?? "") || !isAbsolute(campaignRoot ?? "")) throw Error("census.absolute-roots-required");
const context = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench";
const {bindCompactDelivery} = await import(join(sourceRoot, context, "bounded-archive-frontier-delivery-r1.mjs"));
const {sourceCandidate} = await import(join(sourceRoot, context, "intent-anchor-terminal-r3.mjs"));
const {uncoveredRequirementQueries} = await import(join(sourceRoot, context, "uncovered-requirement-search-r1.mjs"));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => JSON.parse(readFileSync(path));
const summary = [];
for (const revision of ["r6", "r7", "r8"]) {
  const root = join(campaignRoot, `g01-product-replication-${revision}`);
  const freezePath = join(root, "CAMPAIGN-FREEZE.json"), freeze = read(freezePath), rows = [];
  for (const task of freeze.ordered_tasks) {
    const pair = join(root, task.slug), resultPath = join(pair, "candidate", "runs", "00", "result.json");
    if (!existsSync(resultPath)) { rows.push({slug: task.slug, status: "no-candidate-result"}); continue; }
    try {
      const result = read(resultPath), branch = result.branches?.[0];
      if (!branch || !Array.isArray(branch.receipt_indices) || !Array.isArray(branch.captures)) throw Error("branch-missing");
      const modelIndices = branch.receipt_indices.filter(index => result.receipts[index]?.kind === "model").slice(0, 4);
      if (modelIndices.length < 4) throw Error("fewer-than-four-discovery-model-receipts");
      const prefix = branch.receipt_indices.filter(index => index <= modelIndices.at(-1)).map(index => result.receipts[index]);
      const bound = bindCompactDelivery({captures: branch.captures, receipts: prefix});
      if (bound.unmapped.length || bound.requests.some(request => request.posture !== "confirmed-successful-request")) throw Error("prefix-delivery-not-confirmed");
      const wide = bound.read_observations.filter(sourceCandidate);
      const config = read(join(pair, "CONFIG.json")), taskPath = config.tasks?.[0]?.task_path;
      if (typeof taskPath !== "string") throw Error("task-path-missing");
      const taskBytes = readFileSync(taskPath), issue = JSON.parse(taskBytes);
      if (sha(taskBytes) !== config.tasks[0].task_sha256) throw Error("task-hash-drift");
      const queries = uncoveredRequirementQueries(issue.problem_statement, wide);
      rows.push({slug: task.slug, status: "confirmed-prefix", candidate_result_sha256: sha(readFileSync(resultPath)),
        task_sha256: sha(taskBytes), repository: task.repo, language: issue.language, wide_read_count: wide.length,
        queries, query_count: queries.length});
    } catch (error) { rows.push({slug: task.slug, status: "indeterminate", reason: String(error.message)}); }
  }
  summary.push({campaign: revision, freeze_sha256: sha(readFileSync(freezePath)), frozen_tasks: freeze.ordered_tasks.length,
    confirmed_prefixes: rows.filter(row => row.status === "confirmed-prefix").length,
    with_uncovered_queries: rows.filter(row => row.status === "confirmed-prefix" && row.query_count > 0).length,
    rows});
}
console.log(JSON.stringify({schema_version: "are.g01-uncovered-query-exposed-census/v1", status: "read-only", model_calls: 0,
  gold_loaded: false, acquisition_boundary: "first-four-discovery-model-receipts", source_root: sourceRoot,
  summary, claim_ceiling: "Exposed issue-term coverage only; no source-hit, quality, cost or superiority inference"}));
