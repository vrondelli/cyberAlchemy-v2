// Evaluator-only, score-independent join of the frozen G01 r9 task set to
// pre-dispatch exact-base positional-gold eligibility receipts. No gold paths,
// gold text, model output, or benchmark scores are read or exported here.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
const need = (value, reason) => {if (!value) throw Error(`g01-r9-label-join.${reason}`);};
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const root = "/opt/are/evolution-runtime";
const campaignRoot = join(root, "g01-product-replication-r9");
const definitionPath = join(root, "g01-product-replication-input-r12/DEFINITION.json");
const freezePath = join(campaignRoot, "CAMPAIGN-FREEZE.json");
const definitionSha = "9780e1365055b3b9acd6634e3236b6e298cafceb1810fc911b06f5328e433ee2";
const freezeSha = "4851c65ab0c129b50d080cf416574c35eeba4a0b074f89497cee96a798c65c47";
const parquetSha = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8";
const screens = [
  ["g01-cpp-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json", "a34f63dcc2244882285d922170da5b0e9deabd00e7a3d4dbba3fbd623ee8a780"],
  ["g01-multilang-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json", "5800babd4ccb6757ca9f1128807d6990fbbc9eea46157d875a0477a8f5d1afdb"],
  ["g01-r7-cgojs-gold-lineage-r1/sveltejs--svelte-GOLD-LINEAGE-ELIGIBILITY.json", "efd767a6871b45c807a15ee1aab2baba77d2d2064d84429787ba673c53018854"],
  ["g01-r7-cgojs-gold-lineage-r1/serverless--serverless-GOLD-LINEAGE-ELIGIBILITY.json", "8fb2d5fb1b935fae26bb8cf061781e14f38f03f815c23252aebd87c463bb3ae1"],
  ["g01-r7-cgojs-gold-lineage-r1/iamkun--dayjs-GOLD-LINEAGE-ELIGIBILITY.json", "fb496d3d455ea1218e4bbfadefaeef3171e8e25f6717f58843654da05daa0373"],
  ["g01-r7-cgojs-gold-lineage-r1/prettier--prettier-GOLD-LINEAGE-ELIGIBILITY.json", "35c12edbe30fe51ccd1bd8ecb3d5c6288079c069f90173974cd3af9b87283b1a"],
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const file = path => readFileSync(path);
const read = path => JSON.parse(file(path));
need(sha(file(definitionPath)) === definitionSha && sha(file(freezePath)) === freezeSha,
  "frozen-input-drift");
const definition = read(definitionPath), freeze = read(freezePath);
need(definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
  freeze.definition_sha256 === definitionSha && freeze.status === "frozen-before-dispatch",
  "frozen-cohort-shape");

const eligible = new Map();
for (const [relative, digest] of screens) {
  const path = join(root, relative);
  need(sha(file(path)) === digest, `screen-drift:${relative}`);
  const screen = read(path);
  need(screen.gold_paths_or_content_exported === false &&
    (screen.source_parquet_sha256 ?? screen.gold_parquet_sha256) === parquetSha &&
    Array.isArray(screen.tasks), `screen-shape:${relative}`);
  for (const task of screen.tasks) {
    need(!eligible.has(task.instance_id), `duplicate-task:${task.instance_id}`);
    eligible.set(task.instance_id, {task, screen_path: path, screen_sha256: digest});
  }
}
const rows = [];
for (const [index, spec] of definition.ordered_tasks.entries()) {
  const frozen = freeze.ordered_tasks[index];
  need(frozen.instance_id === spec.instance_id && frozen.slug === spec.slug &&
    frozen.repo === spec.repo && frozen.source_only_task_sha256 === sha(file(spec.task_path)),
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
const receipt = {schema_version: "are.g01-r9-selected-label-lineage-join/v1",
  status: "all-selected-mechanically-clean", posture: "evaluator-only-no-model-no-scores",
  definition_sha256: definitionSha, campaign_freeze_sha256: freezeSha,
  source_parquet_sha256: parquetSha,
  screened_receipts: screens.map(([relative, digest]) => ({path: join(root, relative), sha256: digest})),
  selected_tasks: rows.length,
  selected_annotations: rows.reduce((total, row) => total + row.annotation_count, 0),
  rows, gold_paths_or_content_exported: false,
  claim_ceiling: "All 24 frozen tasks have clean positional-gold verdicts in pinned pre-dispatch exact-base screens; semantic label correctness and performance still require separate evidence",
  script_sha256: sha(file(import.meta.filename)), authority_effect: "none"};
if (mode === "--write") writeFileSync(join(campaignRoot, "LABEL-LINEAGE-AUDIT.json"),
  `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, selected_tasks: rows.length,
  selected_annotations: receipt.selected_annotations, screen_receipts: screens.length}));
