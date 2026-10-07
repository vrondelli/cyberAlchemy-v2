// Gold-blind relationship census for the sealed r13 uncovered-term plans.
// This diagnoses whether a proposed read is linked to source already delivered
// in the first four discovery calls. It does not select, dispatch or score it.
import {readFileSync, writeFileSync} from "node:fs";
import {basename, dirname, isAbsolute, join, extname} from "node:path";

const [sourceRoot, campaignRoot, planPath, outputPath] = process.argv.slice(2);
if (process.argv.length !== 6 || ![sourceRoot, campaignRoot, planPath, outputPath].every(isAbsolute)) throw Error("relevance.absolute-inputs-required");
const context = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench";
const {bindCompactDelivery} = await import(join(sourceRoot, context, "bounded-archive-frontier-delivery-r1.mjs"));
const {sourceCandidate} = await import(join(sourceRoot, context, "intent-anchor-terminal-r3.mjs"));
const plan = JSON.parse(readFileSync(planPath));
if (plan.schema_version !== "are.g01-uncovered-plan-exposed-census/v1" || plan.gold_loaded !== false) throw Error("relevance.plan-invalid");
const rows = [];
for (const campaign of plan.summary) for (const row of campaign.rows) {
  const planned = (row.planned ?? []).filter(item => item.status === "readable");
  if (!planned.length) continue;
  const result = JSON.parse(readFileSync(join(campaignRoot, `g01-product-replication-${campaign.campaign}`, row.slug, "candidate/runs/00/result.json")));
  const branch = result.branches?.[0];
  const modelIndices = branch.receipt_indices.filter(index => result.receipts[index]?.kind === "model").slice(0, 4);
  if (modelIndices.length !== 4) throw Error(`relevance.prefix-incomplete:${campaign.campaign}/${row.slug}`);
  const receipts = branch.receipt_indices.filter(index => index <= modelIndices.at(-1)).map(index => result.receipts[index]);
  const bound = bindCompactDelivery({captures: branch.captures, receipts});
  if (bound.unmapped.length || bound.requests.some(request => request.posture !== "confirmed-successful-request")) throw Error(`relevance.delivery-unconfirmed:${campaign.campaign}/${row.slug}`);
  const delivered = bound.read_observations.filter(sourceCandidate);
  const proposals = planned.map(item => {
    const name = basename(item.path).toLowerCase();
    const stem = basename(item.path, extname(item.path)).toLowerCase();
    const links = delivered.map(read => {
      const path = read.path.toLowerCase(), body = typeof read.body === "string" ? read.body.toLowerCase() : "";
      const exact_file = path === item.path.toLowerCase();
      const same_directory = dirname(path) === dirname(item.path.toLowerCase());
      const name_mentioned = name.length >= 6 && body.includes(name);
      const stem_mentioned = stem.length >= 8 && body.includes(stem);
      return {path: read.path, exact_file, same_directory, name_mentioned, stem_mentioned};
    }).filter(link => link.exact_file || link.same_directory || link.name_mentioned || link.stem_mentioned);
    return {path: item.path, query: item.query, links};
  });
  rows.push({campaign: campaign.campaign, slug: row.slug, delivered_source_count: delivered.length, proposals});
}
const counts = {planned_rows: rows.length, planned_paths: rows.reduce((n, row) => n + row.proposals.length, 0),
  linked_rows: rows.filter(row => row.proposals.some(item => item.links.length)).length,
  linked_paths: rows.reduce((n, row) => n + row.proposals.filter(item => item.links.length).length, 0)};
const receipt = {schema_version: "are.g01-source-relevance-exposed-census/v1", status: "read-only", gold_loaded: false,
  model_calls: 0, plan_path: planPath, counts, rows,
  claim_ceiling: "Source-only relationship diagnostic on exposed tasks; not a selector, native quality or superiority result"};
writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({output_path: outputPath, counts}));
