// No-model, no-gold plan census over receipt-confirmed four-call prefixes.
// Exact repository-tool searches are attempted only on retained base checkouts;
// missing checkouts and broad terms remain explicit indeterminate rows.
import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {isAbsolute, join} from "node:path";

const [sourceRoot, campaignRoot, queryScript, capText] = process.argv.slice(2);
if (![sourceRoot, campaignRoot, queryScript].every(value => isAbsolute(value ?? "")) || process.argv.length > 6) throw Error("census.absolute-inputs-required");
const cap = capText === undefined ? Infinity : Number(capText);
if (!(cap === Infinity || Number.isSafeInteger(cap) && cap > 0)) throw Error("census.invalid-cap");
const context = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench";
const {planUncoveredRequirementReads} = await import(join(sourceRoot, context, "uncovered-requirement-search-r1.mjs"));
const {createRepositoryTools} = await import(join(sourceRoot, "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs"));
const queryCensus = JSON.parse(execFileSync(process.execPath, [queryScript, sourceRoot, campaignRoot], {encoding: "utf8", maxBuffer: 5_000_000, timeout: 120_000}));
if (queryCensus.schema_version !== "are.g01-uncovered-query-exposed-census/v1" || queryCensus.gold_loaded !== false) throw Error("census.query-source-invalid");
const read = path => JSON.parse(readFileSync(path));
const summary = []; let visited = 0;
for (const campaign of queryCensus.summary) {
  const rows = [];
  for (const row of campaign.rows) {
    if (row.status !== "confirmed-prefix" || !row.queries.length) continue;
    if (visited++ >= cap) break;
    const pair = join(campaignRoot, `g01-product-replication-${campaign.campaign}`, row.slug);
    const config = read(join(pair, "CONFIG.json")), task = config.tasks[0];
    const repo = join(pair, "candidate", "source", "00", "base");
    if (!existsSync(repo)) { rows.push({slug: row.slug, status: "source-checkout-unavailable", queries: row.queries}); continue; }
    try {
      const execute = createRepositoryTools({root: repo, base_commit: task.base_commit});
      const searches = [], skipped = [];
      for (const query of row.queries) {
        const args = ["-c", `safe.directory=${repo}`, "-C", repo, "grep", "-F", "-l", "-z", "--", query, task.base_commit];
        let files;
        try { files = execFileSync("git", args, {timeout: 15_000, maxBuffer: 2_000_000, stdio: ["ignore", "pipe", "ignore"]}).toString().split("\0").filter(Boolean).length; }
        catch (error) { if (error.status === 1) files = 0; else { skipped.push({query, reason: "source-grep-failed"}); continue; } }
        if (files > 100) { skipped.push({query, reason: "more-than-100-matching-files", matching_files: files}); continue; }
        const result = await execute("search", {query, path_prefix: "", offset: 0, limit: 30, revision: "base"});
        if (result?.ok !== true) { skipped.push({query, reason: "repository-search-failed"}); continue; }
        searches.push({query, result});
      }
      const plans = planUncoveredRequirementReads(searches);
      const planned = [];
      for (const plan of plans) {
        const result = await execute("read_file", plan.args);
        if (result?.ok !== true) { planned.push({query: plan.query, path: plan.args.path, status: "read-failed"}); continue; }
        planned.push({query: plan.query, path: plan.args.path, start_line: plan.args.start_line,
          line_count: plan.args.line_count, byte_count: result.output.byte_count, status: "readable"});
      }
      rows.push({slug: row.slug, status: skipped.length ? "partial-search" : "searched", queries: row.queries,
        searches: searches.map(({query, result}) => ({query, total: result.output.total, scanned_matching_files: result.output.scanned_matching_files})),
        skipped, planned});
    } catch (error) { rows.push({slug: row.slug, status: "indeterminate", reason: String(error.message), queries: row.queries}); }
  }
  summary.push({campaign: campaign.campaign, confirmed_prefixes: campaign.confirmed_prefixes, with_uncovered_queries: campaign.with_uncovered_queries,
    evaluated: rows.length, planned_rows: rows.filter(row => row.planned?.some(plan => plan.status === "readable")).length,
    indeterminate: rows.filter(row => ["source-checkout-unavailable", "indeterminate"].includes(row.status)).length, rows});
  if (visited >= cap) break;
}
console.log(JSON.stringify({schema_version: "are.g01-uncovered-plan-exposed-census/v1", status: "read-only", gold_loaded: false,
  model_calls: 0, source_root: sourceRoot, maximum_matching_files_per_query: 100, summary,
  claim_ceiling: "Exposed source-only search/read plans; no model delivery, native quality, cost, or superiority inference"}));
