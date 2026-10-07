// Evaluator-only score-independent join: frozen r12 IDs to exact-base clean-label screens.
// No gold path/text, model output, or native score is read or exported.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const campaignRoot = join(base, "g01-product-replication-r12");
const definitionPath = join(base, "g01-product-replication-input-r15/DEFINITION.json");
const freezePath = join(campaignRoot, "CAMPAIGN-FREEZE.json");
const candidatePath = join(base, "g01-r12-clean-cohort-candidate-r2/COHORT-CANDIDATE.json");
const pins = {
  definition: "d7410c9e5a8ad346f9c6a312d02bda6282b0893a79e0c3017304fa564c70c7c4",
  freeze: "b47ba1b2ea0a540f085758a84cc45599c9fdf6a124e18c144b6e9a8f2c4f6ee4",
  candidate: "427a3dbdc746f9260ad705a9599041f69572cdb9d79e5efb19fa63190c91cbbd",
  parquet: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
};
const screens = {
  cpp: "g01-cpp-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json",
  "java-python-typescript": "g01-multilang-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json",
  dayjs: "g01-r7-cgojs-gold-lineage-r1/iamkun--dayjs-GOLD-LINEAGE-ELIGIBILITY.json",
  prettier: "g01-r7-cgojs-gold-lineage-r1/prettier--prettier-GOLD-LINEAGE-ELIGIBILITY.json",
  serverless: "g01-r7-cgojs-gold-lineage-r1/serverless--serverless-GOLD-LINEAGE-ELIGIBILITY.json",
  svelte: "g01-r7-cgojs-gold-lineage-r1/sveltejs--svelte-GOLD-LINEAGE-ELIGIBILITY.json",
  "new-origin-tier1": "g01-r10-expansion-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json",
  "new-origin-tier2": "g01-r10-expansion-screen-r2/GOLD-LINEAGE-ELIGIBILITY.json",
  "g01-post-r10-new-origin-screen-r1": "g01-post-r10-new-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json",
  "g01-post-r10-small-origin-screen-r1": "g01-post-r10-small-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json",
  "g01-post-r10-prior-origin-screen-r1": "g01-post-r10-prior-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const file = path => readFileSync(path);
const read = path => JSON.parse(file(path));
const need = (value, reason) => {if (!value) throw Error(`g01-r12-label-lineage.${reason}`);};
const mode = process.argv[2];
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
need(sha(file(definitionPath)) === pins.definition &&
  sha(file(freezePath)) === pins.freeze &&
  sha(file(candidatePath)) === pins.candidate, "frozen-input-drift");
const definition = read(definitionPath), freeze = read(freezePath), candidate = read(candidatePath);
need(definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
  candidate.ordered_tasks?.length === 24 && freeze.definition_sha256 === pins.definition &&
  definition.source_only_candidate_sha256 === pins.candidate &&
  freeze.status === "frozen-before-dispatch" &&
  Object.keys(candidate.eligibility_receipt_sha256).sort().join() === Object.keys(screens).sort().join(),
  "frozen-cohort-shape");

const eligible = new Map(), screenedReceipts = [];
for (const [name, relative] of Object.entries(screens)) {
  const path = join(base, relative), digest = candidate.eligibility_receipt_sha256[name];
  need(/^[a-f0-9]{64}$/.test(digest) && sha(file(path)) === digest,
    `screen-drift:${name}`);
  const screen = read(path);
  need(screen.gold_paths_or_content_exported === false &&
    (screen.model_calls ?? 0) === 0 &&
    (screen.source_parquet_sha256 ?? screen.gold_parquet_sha256) === pins.parquet &&
    Array.isArray(screen.tasks), `screen-shape:${name}`);
  screenedReceipts.push({name, path, sha256: digest});
  for (const task of screen.tasks) {
    need(!eligible.has(task.instance_id), `duplicate-screened-id:${task.instance_id}`);
    eligible.set(task.instance_id, {task, screen_sha256: digest});
  }
}

const rows = [];
for (const [index, spec] of definition.ordered_tasks.entries()) {
  const frozen = freeze.ordered_tasks[index], sourceTask = candidate.ordered_tasks[index];
  need(frozen.instance_id === spec.instance_id && frozen.slug === spec.slug &&
    frozen.repo === spec.repo && sourceTask.instance_id === spec.instance_id &&
    sourceTask.repo === spec.repo && frozen.source_only_task_sha256 === sha(file(spec.task_path)),
    `frozen-task-drift:${spec.slug}`);
  const hit = eligible.get(spec.instance_id);
  need(hit && hit.task.repo === spec.repo && hit.task.gold_lineage_clean === true,
    `not-screened-clean:${spec.instance_id}`);
  const counts = hit.task.classification_counts;
  need(Number.isInteger(hit.task.annotation_count) && hit.task.annotation_count > 0 &&
    counts && Object.keys(counts).length > 0 &&
    Object.keys(counts).every(key => key.startsWith("verified-") &&
      Number.isInteger(counts[key]) && counts[key] > 0) &&
    Object.values(counts).reduce((a, b) => a + b, 0) === hit.task.annotation_count,
    `annotation-verdicts:${spec.instance_id}`);
  rows.push({slug: spec.slug, instance_id: spec.instance_id, repo: spec.repo,
    annotation_count: hit.task.annotation_count,
    classification_counts: counts, screen_sha256: hit.screen_sha256});
}
need(new Set(rows.map(row => row.instance_id)).size === 24, "duplicate-frozen-id");
const receipt = {schema_version: "are.g01-r12-selected-label-lineage-join/v1",
  status: "all-selected-mechanically-clean", posture: "evaluator-only-no-model-no-scores",
  definition_sha256: pins.definition, campaign_freeze_sha256: pins.freeze,
  source_parquet_sha256: pins.parquet, screened_receipts: screenedReceipts,
  selected_tasks: rows.length,
  selected_annotations: rows.reduce((total, row) => total + row.annotation_count, 0),
  rows, gold_paths_or_content_exported: false,
  claim_ceiling: "All 24 frozen r12 tasks have clean positional-gold verdicts in pinned pre-dispatch exact-base screens; semantic correctness and performance remain separate",
  script_sha256: sha(file(import.meta.filename)), authority_effect: "none",
  open_questions: ["Will all 24 frozen pairs terminate and pass independent metric audit?",
    "Are any semantic label limitations material to the final bounded claim?"]};
if (mode === "--write") writeFileSync(join(campaignRoot, "LABEL-LINEAGE-AUDIT.json"),
  `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, selected_tasks: rows.length,
  selected_annotations: receipt.selected_annotations, screen_receipts: screenedReceipts.length}));
