// Score-free join of the exact frozen G01 r17 cohort to pre-dispatch
// positional-label screens and native-reference admission. No gold content.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const campaign = join(base, "g01-product-replication-r17");
const pins = {
  definition: ["g01-product-replication-input-r17-r16cohort/DEFINITION.json", "b08037525f086b21043cb545be99ee23c8c0db93fb50f6016f4541c9243c822c"],
  freeze: ["g01-product-replication-r17/CAMPAIGN-FREEZE.json", "31c9b1e0c1bbe533852e9577b17f9308a78a104dd1814b33a98af030145558b7"],
  candidate: ["g01-r16-clean-cohort-candidate-r2/COHORT-CANDIDATE.json", "b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112"],
  native: ["g01-r16-r2-native-reference-audit-r1/NATIVE-REFERENCE-AUDIT.json", "9a6281ebb60f07cffd92e49f0bc8541ecf30f444d73cb09d8c6a742ea2f78c57"],
  r12: ["g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json", "8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f"],
  r13: ["g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json", "67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc"],
  r14: ["g01-r14-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json", "182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd"],
  r15: ["g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json", "dbc20b1c2462395326ad508d8c08e6855a7e81c6c8aa20d1e19ea9e446016eaf"],
  r16: ["g01-r16-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json", "646c3d367332531c8d7bd82d225ded47edadccc08230e395e00c965515aea5f0"]
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r17-label-coverage.${reason}`);};
const readPinned = ([relative, digest]) => {
  const bytes = readFileSync(join(base, relative));
  need(sha(bytes) === digest, `pin:${relative}`);
  return JSON.parse(bytes);
};
const mode = process.argv[2];
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const definition = readPinned(pins.definition);
const freeze = readPinned(pins.freeze);
const candidate = readPinned(pins.candidate);
const native = readPinned(pins.native);
const r12 = readPinned(pins.r12);
need(freeze.status === "frozen-before-dispatch" &&
  freeze.definition_sha256 === pins.definition[1] &&
  definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
  candidate.ordered_tasks?.length === 24 &&
  native.status === "passed" && native.candidate_sha256 === pins.candidate[1] &&
  native.summary?.tasks === 24 && native.summary?.audited === 24 &&
  native.summary?.admitted === native.summary?.gold_files &&
  native.summary?.gold_files === 52 && native.summary?.excluded === 0 &&
  native.summary?.absent === 0 && native.rows?.length === 24,
"frozen-cohort-or-native-admission");

const screens = r12.screened_receipts.map(item => {
  need(typeof item.path === "string" && item.path.startsWith(`${base}/`) &&
    /^[a-f0-9]{64}$/.test(item.sha256), "prior-screen-ref");
  const bytes = readFileSync(item.path);
  need(sha(bytes) === item.sha256, `prior-screen-drift:${item.path}`);
  return {path: item.path, sha256: item.sha256, receipt: JSON.parse(bytes)};
});
for (const key of ["r13", "r14", "r15", "r16"]) {
  screens.push({path: join(base, pins[key][0]), sha256: pins[key][1],
    receipt: readPinned(pins[key])});
}
const eligible = new Map();
for (const screen of screens) {
  need(screen.receipt.gold_paths_or_content_exported === false &&
    Array.isArray(screen.receipt.tasks) &&
    (screen.receipt.source_parquet_sha256 ?? screen.receipt.gold_parquet_sha256) ===
      candidate.source_parquet_sha256,
  `screen-shape:${screen.path}`);
  for (const task of screen.receipt.tasks) {
    need(!eligible.has(task.instance_id), `duplicate-screen-id:${task.instance_id}`);
    eligible.set(task.instance_id, {task, screen});
  }
}
const nativeById = new Map(native.rows.map(row => [row.instance_id, row]));
need(nativeById.size === 24, "duplicate-native-id");
const rows = [];
for (const [i, task] of definition.ordered_tasks.entries()) {
  const frozen = freeze.ordered_tasks[i];
  const selected = candidate.ordered_tasks[i];
  const label = eligible.get(task.instance_id);
  const reference = nativeById.get(task.instance_id);
  need(frozen.slug === task.slug && frozen.instance_id === task.instance_id &&
    frozen.repo === task.repo && frozen.base_commit === task.base_commit &&
    frozen.source_only_task_sha256 === sha(readFileSync(task.task_path)) &&
    selected.instance_id === task.instance_id && selected.repo === task.repo &&
    selected.base_commit === task.base_commit &&
    label?.task?.repo === task.repo && label.task.gold_lineage_clean === true &&
    label.task.language === selected.language &&
    reference?.repo === task.repo && reference.language === selected.language &&
    reference.status === "audited" && reference.index_digest_matches === true &&
    reference.gold_file_count > 0 &&
    reference.admitted_gold_files === reference.gold_file_count &&
    reference.excluded_gold_files === 0 && reference.absent_gold_files === 0,
  `task-binding-or-eligibility:${task.slug}`);
  const counts = label.task.classification_counts;
  need(Number.isInteger(label.task.annotation_count) && label.task.annotation_count > 0 &&
    Object.keys(counts ?? {}).length > 0 &&
    Object.entries(counts).every(([key, count]) => key.startsWith("verified-") &&
      Number.isInteger(count) && count > 0) &&
    Object.values(counts).reduce((sum, count) => sum + count, 0) === label.task.annotation_count,
  `clean-annotations:${task.slug}`);
  rows.push({slug: task.slug, instance_id: task.instance_id, repo: task.repo,
    language: selected.language, annotation_count: label.task.annotation_count,
    admitted_gold_files: reference.admitted_gold_files,
    screen_sha256: label.screen.sha256});
}
need(new Set(rows.map(row => row.instance_id)).size === 24 &&
  rows.reduce((sum, row) => sum + row.admitted_gold_files, 0) === 52,
"selected-set-or-native-total");
const receipt = {schema_version: "are.g01-r17-label-coverage-join/v1",
  status: "all-frozen-tasks-clean-and-native-admitted",
  posture: "independent-score-free-pre-dispatch-evidence-join",
  definition_sha256: pins.definition[1], campaign_freeze_sha256: pins.freeze[1],
  candidate_sha256: pins.candidate[1], native_reference_audit_sha256: pins.native[1],
  screen_receipts: screens.map(({path, sha256}) => ({path, sha256})),
  selected_tasks: 24, selected_annotations: rows.reduce((sum, row) => sum + row.annotation_count, 0),
  admitted_gold_files: 52, rows, gold_paths_or_content_exported: false,
  model_outputs_or_scores_read: false,
  claim_ceiling: "Exact frozen cohort has clean positional-label verdicts and 52/52 native-reference file admission. Semantic correctness and performance remain separate; no superiority or publication effect.",
  authority_effect: "none"};
if (mode === "--write") writeFileSync(join(campaign, "LABEL-COVERAGE-AUDIT.json"),
  `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, selected_tasks: receipt.selected_tasks,
  selected_annotations: receipt.selected_annotations,
  admitted_gold_files: receipt.admitted_gold_files,
  screen_receipts: receipt.screen_receipts.length}));
