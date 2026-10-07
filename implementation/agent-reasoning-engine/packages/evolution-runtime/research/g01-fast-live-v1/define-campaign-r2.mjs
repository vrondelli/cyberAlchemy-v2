import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = value => createHash("sha256").update(value).digest("hex");
const prefix = "/opt/are/evolution-runtime";
const input = join(prefix, "g01-product-replication-input-r4");
const receiptRoot = join(prefix, "g01-product-replication-preflight-r2");
const index = JSON.parse(readFileSync(join(receiptRoot, "SOURCE-INDEX-PREFLIGHT.json")));
const gold = JSON.parse(readFileSync(join(receiptRoot, "GOLD-ELIGIBILITY-PREFLIGHT.json")));
const transport = JSON.parse(readFileSync(join(receiptRoot, "TRANSPORT-PREFLIGHT.json")));
if (index.status !== "passed" || index.results.length !== 24 || !transport.passed || gold.status !== "passed" ||
    gold.rows?.length !== 24 || gold.rows.some((row, ordinal) => row.instance_id !== index.results[ordinal].instance_id || !row.eligible) ||
    gold.source_index_preflight_sha256 !== sha(readFileSync(join(receiptRoot, "SOURCE-INDEX-PREFLIGHT.json")))) throw Error("preflight-not-passed");
const caches = {
  "jqlang/jq": join(prefix, "g01-product-replication-jq-cache-r2/repositories/contextbench-full"),
  "cli/cli": join(prefix, "g01-terminal-shortlist-fresh-r1/repositories/contextbench-full"),
  "sveltejs/svelte": join(prefix, "g01-shortlist-cap12-svelte-r1/repositories/contextbench-full"),
  "clap-rs/clap": join(prefix, "g01-shortlist-cap12-rust-r1/repositories/contextbench-full")
};
const rows = index.results.map((record, ordinal) => {
  if (record.status !== "passed" || !record.local_settled || !record.process_group_absent || record.model_calls !== 0) throw Error("source-index-invalid");
  const taskPath = join(input, "tasks", `${record.instance_id}.json`);
  const task = JSON.parse(readFileSync(taskPath));
  if (task.repo !== record.repo || task.base_commit !== record.base_commit) throw Error("source-row-drift");
  return {task, spec: {slug: `${task.language}-${task.repo.split("/")[1]}-${task.instance_id.slice(-8)}-${String(ordinal).padStart(2,"0")}`,
    instance_id: task.instance_id, repo: task.repo, task_path: taskPath, repository_cache: caches[task.repo]}};
});
if (sha(JSON.stringify(rows.map(({task}) => task.instance_id))) !== index.source_only_ids_sha256 ||
    sha(JSON.stringify(rows.map(({task}) => task))) !== index.source_only_rows_sha256) throw Error("selector-drift");
const definition = {
  schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch",
  hypothesis: "The retained ARE candidate improves paired native ContextBench source-context quality and efficiency over native convergence on a fresh 8K 24-task cohort, with jq replacing exhausted zstd C slots.",
  root: join(prefix, "g01-product-replication-r2"), source_root: join(prefix, "g01-shared-reliability-source-r2"),
  base_config_path: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/CONFIG.json"),
  control_arm: "intent-anchor-convergence-r3", candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
  transport_reliability: "bounded-view-and-output-cap-r1", abstention_policy: "explicit-no-final-context-zero-r1",
  scorer: {image: "are-contextbench-scorer:g01-r1", repo: join(prefix,"hen-11-contextbench-intent-anchor-r3-v22-dev/repo"),
    upstream: join(prefix,"hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"), cache: join(prefix,"hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache")},
  ordered_tasks: rows.map(({spec}) => spec),
  selection_rule: "Pinned source-only eight-column hash order; exclude all exposed G01 IDs; take first 3 jq, 7 cli, 7 svelte, 7 clap; independent gold-eligibility bit only. Cohort and code frozen before model output.",
  decision_rule: "Report all 24 paired outcomes, including invalid and abstained tasks. Validity requires 24/24 native-scored pairs, no provider/infrastructure failure, sealed predictions before scoring. Report paired Span-F1 and File-F1, known tokens, summed arm time and stratified uncertainty; no product superiority claim from incomplete pairs.",
  claim_ceiling: "Prospective G01 r2 8K jq/cli/svelte/clap comparison only; changed C repository disclosed; not full ContextBench or product superiority proof.",
  preflight_refs: {index_sha256: sha(readFileSync(join(receiptRoot,"SOURCE-INDEX-PREFLIGHT.json"))),
    gold_sha256: sha(readFileSync(join(receiptRoot,"GOLD-ELIGIBILITY-PREFLIGHT.json"))),
    transport_sha256: sha(readFileSync(join(receiptRoot,"TRANSPORT-PREFLIGHT.json")))},
  open_questions: ["Will all 24 pairs yield native-scored predictions?", "Do paired quality and efficiency intervals support the research hypothesis?"]
};
const path = join(input, "DEFINITION.json");
const bytes = Buffer.from(`${JSON.stringify(definition, null, 2)}\n`);
writeFileSync(path, bytes, {flag:"wx", mode:0o600});
process.stdout.write(`${JSON.stringify({definition_path:path, definition_sha256:sha(bytes), count:rows.length})}\n`);
