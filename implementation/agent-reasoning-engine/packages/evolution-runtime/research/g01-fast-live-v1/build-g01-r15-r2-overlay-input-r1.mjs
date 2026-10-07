// Freeze-adjacent source-only G01 r15 r2 input construction. No evaluator
// values, provider call, scoring, or campaign dispatch occurs here.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const input = `${base}/g01-product-replication-input-r15-overlay-r1`;
const campaign = `${base}/g01-product-replication-r15`;
const scratch = "/tmp/are-g01-product-replication-r15-source";
const source = `${base}/g01-r15-r2-overlay-source-qualification-r1`;
const pins = {
  candidate: "0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496",
  transfer: "1588b6230631a24462315a33f7df06efeaa7ec1ad6ad734c9dfc45e50a0e6e38",
  source: "8b3d778fc6201ebb8d7f052aa45a923d8bc167d98eb225e05e68935fdd137526",
  residency: "6126f19bf4d9ed73dfd3589a0067d3e9fad99f0b515eb9b5652488207f776f57",
  fourview: "c9e810e51bafa74096e1e837b81ff02be5ece300db644cb6495cef66150d4b4c",
  native: "05c7994b350c5853ec156b61864222123348a946093555799e9aa34fba3406b8",
  config: "1d5cfadeb370863a98441c4fe1f5d5bc813e6474fd90ce16671f6c57669b0ee7",
  sourceTree: "27e101482c86019378d458bba586c6806b7922d6bcb69727466eeab47518ee8e"
};
const paths = {
  candidate: `${base}/g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`,
  transfer: `${base}/g01-r15-r2-cache-transfer-r1/VERIFY.json`,
  source: `${base}/g01-r15-r2-overlay-source-qualification-receipt-r1/SOURCE-QUALIFICATION.json`,
  residency: `${base}/g01-r15-r2-single-checkout-residency-r1/RESIDENCY-PROBE.json`,
  fourview: `${base}/g01-r15-r2-overlay-fourview-probe-r1/FOURVIEW-PROBE.json`,
  config: `${base}/g01-r38-pytest-next-order-r1/CONFIG.json`
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-r2-input.${reason}`);};
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
  const candidate = pinned("candidate"), transfer = pinned("transfer"),
    sourceReceipt = pinned("source"), residency = pinned("residency"),
    fourview = pinned("fourview"), config = pinned("config");
  need(candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    candidate.task_id_set_sha256 === "9a520365e35cc5f22688d4a409cd63dfa8d4e8a0fd1ae88169024a6da4a2e06c" &&
    transfer.status === "passed" && transfer.candidate_sha256 === pins.candidate &&
    transfer.verified_task_bindings?.length === 24 &&
    sourceReceipt.status === "passed-no-model-source-only" &&
    sourceReceipt.source_file_count === 413 && sourceReceipt.source_tree_sha256 === pins.sourceTree &&
    residency.status === "passed-retained-source-only" && residency.task_count === 24 &&
    fourview.status === "passed-four-mounted-then-unmounted" && fourview.all_views_unmounted === true &&
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
      task_path, task_sha256, repository_cache: cache.repository_path,
      tree: cache.tree};
  });
  const definition = {
    schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch",
    hypothesis: "The already qualified r15 r2 ARE source selector outperforms its native control on an untouched, clean-label 24-task 8K ContextBench cohort while using fewer known tokens and less summed arm time.",
    root: campaign, source_root: source, source_scratch_root: scratch,
    source_checkout_layout: {mode: "g01-r15-r2-single-lower-overlay-r1",
      residency_receipt_sha256: pins.residency},
    base_config_path: paths.config, control_arm: "intent-anchor-convergence-r3",
    candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
    transport_reliability: "bounded-view-and-output-cap-r1",
    non_tool_terminal_after_convergence: true,
    abstention_policy: "explicit-no-final-context-zero-r1",
    scorer: {image: "are-contextbench-scorer:g01-r1",
      repo: `${base}/hen-11-contextbench-intent-anchor-r3-v22-dev/repo`,
      upstream: `${base}/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream`,
      cache: `${base}/hen-11-contextbench-intent-anchor-r3-v22-dev/scoring-cache`},
    ordered_tasks: rows.map(({slug, instance_id, repo, task_path, repository_cache}) =>
      ({slug, instance_id, repo, task_path, repository_cache})),
    selection_rule: "Preserve the source-only r15 r2 candidate order and all 24 exact task/cache/commit bindings; no score-based replacement.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A narrow G01 r15 quality-and-efficiency superiority claim requires 24/24 terminal scored pairs (native predictions or only the predeclared explicit-no-final-context zero abstention), intact pre-score seals and independent receipt/native-metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both ARE/control known-token and summed-arm-time ratios. Report candidate and control abstentions separately; any other unscored/scoring-error pair defeats the strict claim gate. Otherwise report qualified descriptive or metric-specific results only.",
    claim_ceiling: "Private G01 r15 paired GLM-5.3-flash 8K native comparison on the fixed r15 r2 24-task five-origin clean-label cohort only; not full ContextBench or general ARE superiority.",
    preflight_refs: {candidate_sha256: pins.candidate, cache_transfer_sha256: pins.transfer,
      native_reference_audit_sha256: pins.native, source_qualification_sha256: pins.source,
      fourview_probe_sha256: pins.fourview, residency_sha256: pins.residency},
    source_tree_sha256: pins.sourceTree, source_tree_file_count: 413,
    open_questions: ["Does the no-reclaim serial coordinator pass all 24 paired attempts with sufficient storage headroom?",
      "Do independent native scores and paired intervals clear the strict superiority gate?"]
  };
  const definition_sha256 = writeNew(join(input, "DEFINITION.json"), definition);
  const receipt = {schema_version: "are.g01-r15-r2-overlay-input/v1",
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
