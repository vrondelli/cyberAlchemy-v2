// Source-only G01 r16 r2 input construction. No model, gold or score access.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const input = `${base}/g01-product-replication-input-r16-r2`;
const campaign = `${base}/g01-product-replication-r16`;
const scratch = "/tmp/are-g01-product-replication-r16-source";
const source = `${base}/g01-r16-r2-overlay-latebind-source-r1`;
const pins = {
  candidate: "b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112",
  transfer: "cb20eb1799b71ae48296085647037d56829743f7d4c2002aebb8bdc008138a41",
  native: "9a6281ebb60f07cffd92e49f0bc8541ecf30f444d73cb09d8c6a742ea2f78c57",
  residency: "8e5a178b26278f9daccc0c8899c1bf6b05406e5f7678135e9232edff087f2e8a",
  fourview: "514e767c42b65db7eb440703e71ddfc236717d7949f6fbc7805a06929b188af0",
  source: "cde1cb61842a7607f7563eaee5c1c8998d6d7af9476075bf0e47df6d6972ef9d",
  config: "1d5cfadeb370863a98441c4fe1f5d5bc813e6474fd90ce16671f6c57669b0ee7",
  sourceTree: "7514c70d2d5c77209dc921671033f1d2cce2e8c7c9419fdcfe61d8490ff560fb",
  taskIds: "50860fd53e9a637ec434119707797f57cc5b0ee584fc6820fecb410fd0bd85ab"
};
const paths = {
  candidate: `${base}/g01-r16-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`,
  transfer: `${base}/g01-r16-r2-cache-transfer-r1/VERIFY.json`,
  native: `${base}/g01-r16-r2-native-reference-audit-r1/NATIVE-REFERENCE-AUDIT.json`,
  residency: `${base}/g01-r16-r2-single-checkout-residency-r1/RESIDENCY-PROBE.json`,
  fourview: `${base}/g01-r16-r2-overlay-fourview-probe-r1/FOURVIEW-PROBE.json`,
  source: `${base}/g01-r16-r2-overlay-latebind-source-receipt-r1/SOURCE-QUALIFICATION.json`,
  config: `${base}/g01-r38-pytest-next-order-r1/CONFIG.json`
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r16-r2-input.${reason}`);};
const pinned = name => {
  const bytes = readFileSync(paths[name]);
  need(sha(bytes) === pins[name], `input-drift:${name}`);
  return JSON.parse(bytes);
};
const writeNew = (path, value) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
  return sha(bytes);
};

function main() {
  need(!existsSync(input) && !existsSync(campaign) && !existsSync(scratch), "already-exists");
  const candidate = pinned("candidate"), transfer = pinned("transfer"), native = pinned("native"),
    residency = pinned("residency"), fourview = pinned("fourview"),
    sourceReceipt = pinned("source"), config = pinned("config");
  need(candidate.schema_version === "are.g01-r16-development-cap-eight-candidate-r2/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    candidate.task_id_set_sha256 === pins.taskIds &&
    transfer.status === "passed" && transfer.candidate_sha256 === pins.candidate &&
    transfer.verified_task_bindings?.length === 24 &&
    native.status === "passed" && native.candidate_sha256 === pins.candidate &&
    native.summary?.admitted === 52 && native.summary?.excluded === 0 && native.summary?.absent === 0 &&
    residency.status === "passed-retained-source-only" && residency.task_count === 24 &&
    residency.candidate_sha256 === pins.candidate && residency.rows?.length === 24 &&
    residency.after?.shm_free_bytes > 3 * 1024 ** 3 &&
    fourview.status === "passed-four-mounted-then-unmounted" && fourview.all_views_unmounted === true &&
    fourview.source_tree_sha256 === pins.sourceTree &&
    sourceReceipt.status === "passed-no-model-source-only" &&
    sourceReceipt.source_file_count === 414 && sourceReceipt.source_tree_sha256 === pins.sourceTree &&
    config.model === "glm-5.3-flash" && config.context_limit === 8000 &&
    config.total_tokens_per_arm === 160000, "input-shape");
  const byId = new Map(transfer.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24, "cache-duplicates");
  mkdirSync(input, {mode: 0o700});
  const taskDir = join(input, "tasks");
  mkdirSync(taskDir, {mode: 0o700});
  const rows = candidate.ordered_tasks.map((sourceTask, index) => {
    const allowed = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
    need(Object.keys(sourceTask).sort().join(",") === [...allowed].sort().join(",") &&
      allowed.every(key => typeof sourceTask[key] === "string" && sourceTask[key].length > 0), `task-shape:${index}`);
    const cache = byId.get(sourceTask.instance_id), resident = residency.rows[index];
    need(cache && cache.origin === sourceTask.repo_url && cache.base_commit === sourceTask.base_commit &&
      resident.ordinal === index + 1 && resident.instance_id === sourceTask.instance_id &&
      resident.base_commit === sourceTask.base_commit && resident.tree === cache.tree,
    `task-binding:${index}`);
    const task_path = join(taskDir, `${sourceTask.instance_id}.json`);
    const task_sha256 = writeNew(task_path, sourceTask);
    return {slug: `task-${String(index + 1).padStart(2, "0")}`,
      instance_id: sourceTask.instance_id, repo: sourceTask.repo,
      base_commit: sourceTask.base_commit, task_path, task_sha256,
      repository_cache: cache.repository_path, tree: cache.tree};
  });
  const definition = {
    schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch",
    hypothesis: "The opt-in delivered-read late binding helps the ARE source selector complete matched ContextBench work and outperform the native control on a previously unexposed clean-label 24-task development cohort while using fewer known tokens and less summed arm time.",
    root: campaign, source_root: source, source_scratch_root: scratch,
    source_checkout_layout: {mode: "g01-r16-r2-single-lower-overlay-r1",
      residency_receipt_sha256: pins.residency},
    base_config_path: paths.config, control_arm: "intent-anchor-convergence-r3",
    candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
    transport_reliability: "bounded-view-and-output-cap-r1",
    non_tool_terminal_after_convergence: true,
    late_bind_delivered_base: true,
    abstention_policy: "explicit-no-final-context-zero-r1",
    scorer: {image: "are-contextbench-scorer:g01-r1",
      repo: `${base}/hen-11-contextbench-intent-anchor-r3-v22-dev/repo`,
      upstream: `${base}/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream`,
      cache: `${base}/hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache`},
    ordered_tasks: rows.map(({slug, instance_id, repo, base_commit, task_path, repository_cache}) =>
      ({slug, instance_id, repo, base_commit, task_path, repository_cache})),
    selection_rule: "Preserve score-blind r16 r2 candidate order and all 24 exact task/cache/commit bindings; no score-based replacement.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A narrow G01 r16 quality-and-efficiency superiority claim requires 24/24 terminal scored pairs (native predictions or only predeclared explicit-no-final-context zero abstention), intact pre-score seals and independent receipt/native-metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both known-token and summed-arm-time ARE/control ratios. Report candidate and control abstentions separately; any other unscored/scoring-error pair defeats the strict claim gate. Otherwise report qualified descriptive or metric-specific results only.",
    claim_ceiling: "Private G01 r16 paired GLM-5.3-flash 8K native comparison on this fixed 24-task, five-origin clean-label development cohort only; not full ContextBench or general ARE superiority.",
    preflight_refs: {candidate_sha256: pins.candidate, cache_transfer_sha256: pins.transfer,
      native_reference_audit_sha256: pins.native, source_qualification_sha256: pins.source,
      fourview_probe_sha256: pins.fourview, residency_sha256: pins.residency},
    source_tree_sha256: pins.sourceTree, source_tree_file_count: 414,
    open_questions: ["Does the no-reclaim serial coordinator pass all 24 paired attempts with sufficient storage headroom?",
      "Do independent native scores and paired intervals clear the strict superiority gate?"]
  };
  const definition_sha256 = writeNew(join(input, "DEFINITION.json"), definition);
  const receipt = {schema_version: "are.g01-r16-r2-overlay-latebind-input/v1",
    status: "pre-dispatch-definition-only", definition_sha256,
    task_count: rows.length, task_bindings: rows.map(({slug, instance_id, task_sha256, tree}) =>
      ({slug, instance_id, task_sha256, tree})),
    source_tree_sha256: pins.sourceTree, candidate_sha256: pins.candidate,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Source-only definition; not campaign freeze, dispatch, score or superiority",
    open_questions: definition.open_questions};
  const receipt_sha256 = writeNew(join(input, "INPUT-RECEIPT.json"), receipt);
  console.log(JSON.stringify({status: receipt.status, definition_sha256,
    receipt_sha256, tasks: rows.length}));
}

try {main();} catch (error) {
  console.error(JSON.stringify({status: "input-error", error: String(error.message)}));
  process.exitCode = 2;
}
