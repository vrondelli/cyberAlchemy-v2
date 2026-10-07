// Gold-blind diagnostic of explicit include/import links from receipt-confirmed
// source to the sealed r13 uncovered-term plans. No model calls or scoring.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {basename, extname, isAbsolute, join} from "node:path";

const [sourceRoot, campaignRoot, planPath, outputPath] = process.argv.slice(2);
if (process.argv.length !== 6 || ![sourceRoot, campaignRoot, planPath, outputPath].every(isAbsolute)) throw Error("edge.absolute-inputs-required");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const expectedPlanSha = "6885d63257d161bc2647d4e225f2326c5037f6e18d4b61646ef03048495cfc04";
const planBytes = readFileSync(planPath);
if (sha(planBytes) !== expectedPlanSha) throw Error("edge.plan-drift");
const plan = JSON.parse(planBytes);
if (plan.schema_version !== "are.g01-uncovered-plan-exposed-census/v1" || plan.gold_loaded !== false) throw Error("edge.plan-invalid");
const context = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench";
const {bindCompactDelivery} = await import(join(sourceRoot, context, "bounded-archive-frontier-delivery-r1.mjs"));
const {sourceCandidate} = await import(join(sourceRoot, context, "intent-anchor-terminal-r3.mjs"));
const references = text => {
  const values = [];
  for (const match of text.matchAll(/^\s*#\s*include\s*[<"]([^>"]+)[>"]/gm)) values.push({kind: "include", specifier: match[1]});
  for (const match of text.matchAll(/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["']([^"'\n]+)["']/g)) values.push({kind: "module", specifier: match[1]});
  for (const match of text.matchAll(/\brequire\s*\(\s*["']([^"'\n]+)["']\s*\)/g)) values.push({kind: "module", specifier: match[1]});
  return values;
};
const stem = path => basename(path, extname(path)).toLowerCase();
const rows = [];
for (const campaign of plan.summary) for (const row of campaign.rows) {
  const planned = (row.planned ?? []).filter(item => item.status === "readable");
  if (!planned.length) continue;
  const resultPath = join(campaignRoot, `g01-product-replication-${campaign.campaign}`, row.slug, "candidate/runs/00/result.json");
  const result = JSON.parse(readFileSync(resultPath));
  const branch = result.branches?.[0];
  const modelIndices = branch.receipt_indices.filter(index => result.receipts[index]?.kind === "model").slice(0, 4);
  if (modelIndices.length !== 4) throw Error(`edge.prefix-incomplete:${campaign.campaign}/${row.slug}`);
  const receipts = branch.receipt_indices.filter(index => index <= modelIndices.at(-1)).map(index => result.receipts[index]);
  const bound = bindCompactDelivery({captures: branch.captures, receipts});
  if (bound.unmapped.length || bound.requests.some(request => request.posture !== "confirmed-successful-request")) throw Error(`edge.delivery-unconfirmed:${campaign.campaign}/${row.slug}`);
  const delivered = bound.read_observations.filter(sourceCandidate);
  const edges = delivered.flatMap(read => references(read.body).map(ref => ({source_path: read.path, ...ref})));
  const proposals = planned.map(item => {
    const targetStem = stem(item.path);
    const links = edges.filter(edge => {
      const name = basename(edge.specifier).toLowerCase();
      if (edge.kind === "include") return stem(name) === targetStem;
      return name === targetStem || name === basename(item.path).toLowerCase();
    });
    return {path: item.path, query: item.query, links};
  });
  rows.push({campaign: campaign.campaign, slug: row.slug, delivered_source_count: delivered.length,
    explicit_reference_count: edges.length, proposals});
}
const counts = {planned_rows: rows.length, planned_paths: rows.reduce((n, row) => n + row.proposals.length, 0),
  linked_rows: rows.filter(row => row.proposals.some(item => item.links.length)).length,
  linked_paths: rows.reduce((n, row) => n + row.proposals.filter(item => item.links.length).length, 0)};
const receipt = {schema_version: "are.g01-include-edge-exposed-census/v1", status: "read-only", gold_loaded: false,
  model_calls: 0, plan_sha256: expectedPlanSha, counts, rows,
  claim_ceiling: "Gold-blind explicit-reference diagnostic on exposed tasks; not a selector, quality result or superiority claim"};
writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({output_path: outputPath, counts}));
