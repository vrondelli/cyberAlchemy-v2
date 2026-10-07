// Bind the prospective G01 r4 definition; this does not freeze or dispatch a run.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => { if (!condition) throw Error(`g01-r4.${reason}`); };
const prefix = "/opt/are/evolution-runtime";
const input = join(prefix, "g01-product-replication-input-r6");
const receiptRoot = join(prefix, "g01-product-replication-preflight-r4");
const indexBytes = readFileSync(join(receiptRoot, "SOURCE-INDEX-PREFLIGHT-FULL-BLOBS.json"));
const goldBytes = readFileSync(join(receiptRoot, "GOLD-ELIGIBILITY-PREFLIGHT.json"));
const transportBytes = readFileSync(join(receiptRoot, "TRANSPORT-PREFLIGHT.json"));
const index = JSON.parse(indexBytes), gold = JSON.parse(goldBytes), transport = JSON.parse(transportBytes);
need(index.schema_version === "are.g01-r4-source-index-preflight/v1" && index.status === "passed" && index.results?.length === 24 &&
  index.model_calls === 0 && index.gold_loaded === false, "source-index-preflight");
need(gold.schema_version === "are.g01-r4-native-gold-eligibility/v1" && gold.status === "passed" && gold.rows?.length === 24 &&
  gold.rows.every((row, ordinal) => row.instance_id === index.results[ordinal].instance_id && row.eligible) &&
  gold.source_index_preflight_sha256 === sha(indexBytes), "gold-preflight");
need(transport.schema_version === "are.g01-r4-transport-preflight/v1" && transport.passed === true &&
  transport.generation_calls === 0 && transport.results?.length === 2 &&
  transport.results.every(row => row.status === 200 && row.settled && row.automatic_retries === 0 && row.prompt_tokens > 0), "transport-preflight");

const caches = {
  "jqlang/jq": join(prefix, "g01-product-replication-jq-cache-r2/repositories/contextbench-full"),
  "cli/cli": join(prefix, "g01-terminal-shortlist-fresh-r1/repositories/contextbench-full"),
  "sveltejs/svelte": join(prefix, "g01-shortlist-cap12-svelte-r1/repositories/contextbench-full"),
  "clap-rs/clap": join(prefix, "g01-shortlist-cap12-rust-r1/repositories/contextbench-full"),
  "sharkdp/fd": join(prefix, "g01-product-replication-fd-cache-r4/repositories/contextbench-full")
};
const quotas = {"jqlang/jq": 3, "cli/cli": 7, "sveltejs/svelte": 7, "clap-rs/clap": 4, "sharkdp/fd": 3};
const counts = Object.fromEntries(Object.keys(quotas).map(repo => [repo, 0]));
const rows = index.results.map((record, ordinal) => {
  need(record.status === "passed" && record.local_settled && record.process_group_absent && record.model_calls === 0, "source-index-row");
  need(Object.hasOwn(caches, record.repo), "unknown-repository");
  counts[record.repo]++;
  const taskPath = join(input, "tasks", `${record.instance_id}.json`);
  const task = JSON.parse(readFileSync(taskPath));
  need(task.repo === record.repo && task.base_commit === record.base_commit, "source-row-drift");
  return {task, spec: {slug: `${task.language}-${task.repo.split("/")[1]}-${task.instance_id.slice(-8)}-${String(ordinal).padStart(2,"0")}`,
    instance_id: task.instance_id, repo: task.repo, task_path: taskPath, repository_cache: caches[task.repo]}};
});
need(Object.keys(quotas).every(repo => counts[repo] === quotas[repo]), "population-drift");
need(sha(JSON.stringify(rows.map(({task}) => task.instance_id))) === index.source_only_ids_sha256 &&
  sha(JSON.stringify(rows.map(({task}) => task))) === index.source_only_rows_sha256, "selector-drift");

const episodePath = join(prefix, "g01-shared-reliability-source-r4/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs");
need(sha(readFileSync(episodePath)) === "15e9c6feddf1a1d16865054123fb38ac246b74447732be5eb76c3190957032f0", "episode-drift");
const definition = {
  schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch",
  hypothesis: "With the prospective retained-reasoning repair, ARE improves paired native ContextBench source-context quality and efficiency on a fresh five-repository 8K cohort while all failures remain visible.",
  root: join(prefix, "g01-product-replication-r4"), source_root: join(prefix, "g01-shared-reliability-source-r4"),
  base_config_path: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/CONFIG.json"),
  control_arm: "intent-anchor-convergence-r3", candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
  transport_reliability: "bounded-view-and-output-cap-r1", non_tool_terminal_after_convergence: true,
  abstention_policy: "explicit-no-final-context-zero-r1",
  scorer: {image: "are-contextbench-scorer:g01-r1", repo: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/repo"),
    upstream: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"), cache: join(prefix, "hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache")},
  ordered_tasks: rows.map(({spec}) => spec),
  selection_rule: "Pinned source-only per-repository SHA-256 order after excluding prior G01/G02 exposure; first 3 jq, 7 cli, 7 svelte, 4 clap, 3 fd. Gold existence is an isolated eligibility bit; no gold path or score reaches either arm.",
  decision_rule: "Zero automatic model retries, zero replacement. Report all 24 outcomes and paired completion categories. A superiority headline requires 24/24 native-scored pairs with intact sealed predictions, both Span-F1 and File-F1 paired repository-stratified 20,000-resample 95% intervals above zero, and known model-token and summed arm-time ratio intervals below one. An incomplete campaign fails the headline gate; valid-pair estimates and reliability are qualified separately.",
  claim_ceiling: "Prospective G01 r4 8K jq/cli/svelte/clap/fd paired comparison only; not full ContextBench or general product superiority proof.",
  preflight_refs: {index_sha256: sha(indexBytes), gold_sha256: sha(goldBytes), transport_sha256: sha(transportBytes)},
  protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R4-PROTOCOL-CANDIDATE.md",
  open_questions: ["Will every paired task yield a valid native score?", "Do quality and efficiency intervals pass the frozen directional gates?"]
};
const path = join(input, "DEFINITION.json");
const bytes = Buffer.from(`${JSON.stringify(definition, null, 2)}\n`);
writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({definition_path: path, definition_sha256: sha(bytes), count: rows.length}));
