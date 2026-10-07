// Bind a new G01 r3 cohort only after independent source, gold-bit, and transport preflights.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const prefix = "/opt/are/evolution-runtime";
const input = join(prefix, "g01-product-replication-input-r5");
const receiptRoot = join(prefix, "g01-product-replication-preflight-r3");
const indexBytes = readFileSync(join(receiptRoot, "SOURCE-INDEX-PREFLIGHT.json"));
const goldBytes = readFileSync(join(receiptRoot, "GOLD-ELIGIBILITY-PREFLIGHT.json"));
const transportBytes = readFileSync(join(receiptRoot, "TRANSPORT-PREFLIGHT.json"));
const index = JSON.parse(indexBytes), gold = JSON.parse(goldBytes), transport = JSON.parse(transportBytes);
if (index.schema_version !== "are.g01-r3-source-index-preflight/v1" || index.status !== "passed" || index.results?.length !== 24 ||
    index.model_calls !== 0 || index.gold_loaded !== false || !transport.passed ||
    gold.status !== "passed" || gold.rows?.length !== 24 ||
    gold.rows.some((row, ordinal) => row.instance_id !== index.results[ordinal].instance_id || !row.eligible) ||
    gold.source_index_preflight_sha256 !== sha(indexBytes)) throw Error("g01-r3-preflight-not-passed");

const caches = {
  "jqlang/jq": join(prefix, "g01-product-replication-jq-cache-r2/repositories/contextbench-full"),
  "cli/cli": join(prefix, "g01-terminal-shortlist-fresh-r1/repositories/contextbench-full"),
  "sveltejs/svelte": join(prefix, "g01-shortlist-cap12-svelte-r1/repositories/contextbench-full"),
  "clap-rs/clap": join(prefix, "g01-shortlist-cap12-rust-r1/repositories/contextbench-full")
};
const rows = index.results.map((record, ordinal) => {
  if (record.status !== "passed" || !record.local_settled || !record.process_group_absent || record.model_calls !== 0) throw Error("g01-r3-source-index-invalid");
  const taskPath = join(input, "tasks", `${record.instance_id}.json`);
  const task = JSON.parse(readFileSync(taskPath));
  if (task.repo !== record.repo || task.base_commit !== record.base_commit) throw Error("g01-r3-source-row-drift");
  return {task, spec: {slug: `${task.language}-${task.repo.split("/")[1]}-${task.instance_id.slice(-8)}-${String(ordinal).padStart(2,"0")}`,
    instance_id: task.instance_id, repo: task.repo, task_path: taskPath, repository_cache: caches[task.repo]}};
});
if (sha(JSON.stringify(rows.map(({task}) => task.instance_id))) !== index.source_only_ids_sha256 ||
    sha(JSON.stringify(rows.map(({task}) => task))) !== index.source_only_rows_sha256) throw Error("g01-r3-selector-drift");

const definition = {
  schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch",
  hypothesis: "ARE improves paired native ContextBench source-context quality and efficiency on fresh 8K tasks after a symmetric, receipt-backed convergence-terminal policy repairs non-tool prose stops in either arm.",
  root: join(prefix, "g01-product-replication-r3"), source_root: join(prefix, "g01-shared-reliability-source-r3"),
  base_config_path: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/CONFIG.json"),
  control_arm: "intent-anchor-convergence-r3", candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
  transport_reliability: "bounded-view-and-output-cap-r1", non_tool_terminal_after_convergence: true,
  abstention_policy: "explicit-no-final-context-zero-r1",
  scorer: {image: "are-contextbench-scorer:g01-r1", repo: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/repo"),
    upstream: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"), cache: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache")},
  ordered_tasks: rows.map(({spec}) => spec),
  selection_rule: "Pinned source-only eight-column hash order after excluding every prior G01 exposure; first 3 jq, 7 cli, 7 svelte, 7 clap. Gold existence is an isolated eligibility bit, never a path or score supplied to arms.",
  decision_rule: "Report all 24 paired outcomes. Validity requires 24/24 native-scored pairs, no provider/infrastructure failure, sealed predictions before scoring. Directional quality requires both Span-F1 and File-F1 paired stratified-bootstrap 95% intervals above zero; directional efficiency requires token and summed arm-time ratio intervals below one. A failed gate is not repaired by top-up or retrospective rule changes.",
  claim_ceiling: "Prospective G01 r3 8K jq/cli/svelte/clap comparison only; symmetric non-tool convergence-terminal policy disclosed; not full ContextBench or product superiority proof.",
  preflight_refs: {index_sha256: sha(indexBytes), gold_sha256: sha(goldBytes), transport_sha256: sha(transportBytes)},
  open_questions: ["Will every paired task yield a valid native score?", "Do quality and efficiency intervals pass the frozen directional gates?"]
};
const path = join(input, "DEFINITION.json");
const bytes = Buffer.from(`${JSON.stringify(definition, null, 2)}\n`);
writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({definition_path: path, definition_sha256: sha(bytes), count: rows.length}));
