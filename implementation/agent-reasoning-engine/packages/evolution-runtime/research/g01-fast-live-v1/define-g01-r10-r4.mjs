// Check-only prospective G01 r10 definition from source-only and evaluator receipts.
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r10-definition.${reason}`); };
const base = "/opt/are/evolution-runtime";
export const pins = Object.freeze({
  candidate: [`${base}/g01-r10-clean-cohort-candidate-r4/COHORT-CANDIDATE.json`, "653c7d558c66ce7d80b4246405e3606e4a8b2a42e1d84d76af7a0fbdabd3d26f"],
  caches: [`${base}/g01-r10-source-caches-r4/SOURCE-CACHES.json`, "4f334f7ff8defa8f1741a984238ded4dea12b731077f19738041c2848eab1c07"],
  preflight: [`${base}/g01-r10-runner-index-preflight-r4/RUNNER-INDEX-PREFLIGHT.json`, "43247cad96b2c5383aba87cde14c9c003795fb9883a7d2b432a94aa1c83e0be0"],
  coverage: [`${base}/g01-r10-index-gold-coverage-r4/GOLD-INDEX-COVERAGE.json`, "e2a3ef6db67ad2ea737fc9ef1be95b96bf2c4a678a0e922b9cb5d85910e97c1c"],
  source: [`${base}/g01-source-r10-candidate-r14-evidence/SOURCE-SNAPSHOT.json`, "43cd7ab98578dab3ff7c5a4fb7479efa629b16eaee7504eac81a7ae6c8ed9662"],
  prior: [`${base}/g01-product-replication-input-r12/DEFINITION.json`, "9780e1365055b3b9acd6634e3236b6e298cafceb1810fc911b06f5328e433ee2"]
});
const sourceRoot = `${base}/g01-source-r10-candidate-r14`;
const preparePath = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const inputRoot = `${base}/g01-product-replication-input-r13`;
const campaignRoot = `${base}/g01-product-replication-r10`;
const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const quota = {cpp: 4, java: 2, javascript: 4, typescript: 4, python: 10};
const expectedTree = {file_count: 405, tree_sha256: "5076bd31924e97aab04e8ded4f706882fc120ed5bd42c7e22511e37e7f88be12"};
export const readPinned = ([path, digest]) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `receipt-drift:${path}`);
  return JSON.parse(bytes);
};

export function buildDefinition({candidate, caches, preflight, coverage, source, prior, tree}) {
  need(candidate?.schema_version === "are.g01-r10-clean-source-only-candidate/v4" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.source_commit_join_verified === true &&
    candidate.seed === "are-g01-r10-r4-python-backfill-20260930" &&
    candidate.task_id_set_sha256 === "45abe89d466ab9e4c035cb7c8fdf0fb065e103e08451da22a23f7fe2ce4ba075" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.exposure_set_sha256 === "daf046ec707d74ef73bb04b50152f6777ef99c0c459ac22b94673a4be502a3f7" &&
    candidate.max_tasks_per_repository === 2 && candidate.max_tasks_per_git_origin === 2 &&
    Object.keys(candidate.language_quota ?? {}).length === Object.keys(quota).length &&
    Object.entries(quota).every(([language, count]) => candidate.language_quota[language] === count) &&
    candidate.ordered_tasks?.length === 24 && candidate.backfilled_ids?.length === 2 &&
    candidate.removed_pre_model_ineligible_ids?.length === 2, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...taskFields].sort().join() &&
      taskFields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  const counts = Object.fromEntries(Object.keys(quota).map(language => [language, 0]));
  const byRepo = new Map(), byOrigin = new Map();
  for (const task of tasks) {
    need(Object.hasOwn(counts, task.language), "unexpected-language");
    counts[task.language]++;
    byRepo.set(task.repo, (byRepo.get(task.repo) ?? 0) + 1);
    byOrigin.set(task.repo_url, (byOrigin.get(task.repo_url) ?? 0) + 1);
  }
  need(JSON.stringify(counts) === JSON.stringify(quota) && byRepo.size === 18 && byOrigin.size === 17 &&
    [...byRepo.values(), ...byOrigin.values()].every(count => count <= 2), "allocation");
  need(caches?.schema_version === "are.g01-r10-source-caches/v1" && caches.status === "passed" &&
    caches.candidate_sha256 === pins.candidate[1] && caches.task_bindings?.length === 24 &&
    caches.model_calls === 0 && caches.gold_loaded === false, "caches");
  const byId = new Map(caches.task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24 && tasks.every(task => {
    const row = byId.get(task.instance_id);
    return row && row.repo === task.repo && row.origin === task.repo_url &&
      row.base_commit === task.base_commit && /^[a-f0-9]{40}$/.test(row.tree) &&
      existsSync(row.repository_path);
  }), "cache-bindings");
  need(preflight?.schema_version === "are.g01-r10-runner-index-preflight/v4" &&
    preflight.status === "passed" && preflight.candidate_sha256 === pins.candidate[1] &&
    preflight.caches_sha256 === pins.caches[1] && preflight.cache_check?.passed === 24 &&
    preflight.checkout_probes?.length === 24 && preflight.source_index?.status === "passed" &&
    preflight.source_index.results?.length === 24 && preflight.model_calls === 0 &&
    preflight.gold_loaded === false, "preflight");
  need(tasks.every((task, index) => preflight.checkout_probes[index].instance_id === task.instance_id &&
    preflight.checkout_probes[index].status === "passed" &&
    preflight.source_index.results[index].instance_id === task.instance_id &&
    preflight.source_index.results[index].repository_path === byId.get(task.instance_id).repository_path &&
    preflight.source_index.results[index].status === "passed" &&
    preflight.source_index.results[index].local_settled === true &&
    preflight.source_index.results[index].process_group_absent === true &&
    preflight.source_index.results[index].forced === false &&
    preflight.source_index.results[index].model_calls === 0), "preflight-rows");
  need(coverage?.schema_version === "are.g01-r10-index-gold-coverage/v4" && coverage.status === "passed" &&
    coverage.candidate_sha256 === pins.candidate[1] && coverage.caches_sha256 === pins.caches[1] &&
    coverage.preflight_sha256 === pins.preflight[1] &&
    coverage.posture === "evaluator-only-no-model-no-scores" &&
    coverage.gold_paths_or_content_exported === false && coverage.model_calls === 0 &&
    coverage.summary?.audited === 24 && coverage.summary.gold_files === 86 &&
    coverage.summary.admitted === 86 && coverage.summary.absent === 0 &&
    coverage.summary.excluded === 0 && coverage.summary.worker_unavailable === 0 &&
    coverage.rows?.length === 24 && coverage.rows.every((row, index) =>
      row.instance_id === tasks[index].instance_id && row.status === "audited" &&
      row.index_digest_matches === true && row.absent_gold_files === 0 &&
      row.excluded_gold_files === 0), "coverage");
  need(source?.schema_version === "are.g01-r10-source-snapshot/v1" &&
    source.status === "tested-not-frozen" && source.source_root === sourceRoot &&
    source.source_tree_sha256 === expectedTree.tree_sha256 && source.file_count === 405 &&
    source.tests_run === 79 && source.passed === 79 && source.failed === 0 &&
    source.model_calls === 0 && source.gold_loaded === false &&
    tree?.file_count === expectedTree.file_count && tree.tree_sha256 === expectedTree.tree_sha256,
  "source-tree");
  need(prior?.schema_version === "are.g01-campaign-definition/v1" && prior.status === "pre-dispatch" &&
    prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true &&
    prior.span_refinement_policy === "source-only-go-selected-subspan-r1" &&
    prior.ordered_tasks?.length === 24 && prior.scorer?.image === "are-contextbench-scorer:g01-r1",
  "prior");
  need(sha(readFileSync(prior.base_config_path)) === "de5a2a7f2dcece6b72e8131e688d70577ed62b55ccb69c72f54f480ea1c329ab",
  "base-config");
  const config = JSON.parse(readFileSync(prior.base_config_path));
  need(config.context_limit === 8000 && config.total_tokens_per_arm === 96000 &&
    config.model === "glm-5.3-flash" && !existsSync(inputRoot) && !existsSync(campaignRoot),
  "fixed-protocol-or-successor-root-used");
  const orderedTasks = tasks.map(task => ({
    slug: `${task.language}-${task.repo.split("/").at(-1).replace(/[^a-z0-9]+/g, "-")}-${task.instance_id.slice(-8)}`,
    instance_id: task.instance_id, repo: task.repo,
    task_path: join(inputRoot, "tasks", `${task.instance_id}.json`),
    repository_cache: byId.get(task.instance_id).repository_path
  }));
  need(new Set(orderedTasks.map(task => task.slug)).size === 24 &&
    orderedTasks.every(task => /^[a-z0-9-]+$/.test(task.slug)), "slugs");
  const {builder_sha256: _builder, definition_projection_sha256: _projection,
    provider_readiness_sha256_at_freeze: _ready, ...basis} = prior;
  return {...basis, root: campaignRoot, source_root: sourceRoot,
    source_scratch_root: "/tmp/are-g01-product-replication-r10-source",
    source_tree_sha256: tree.tree_sha256, source_tree_file_count: tree.file_count,
    hypothesis: "On a new score-blind five-language 24-task cohort with clean positional labels, the ARE 8K source-context candidate improves native paired Span-F1 and File-F1 while reducing known tokens and summed arm time against the unchanged native intent-anchor control.",
    ordered_tasks: orderedTasks,
    selection_rule: "Exclude every manifested prior G01/HEN/G02 task; screen evaluator-only label-to-base and index admission; retain 22 previously admitted pre-model tasks and deterministically backfill two Python tasks, with 4 C++/2 Java/4 JavaScript/4 TypeScript/10 Python and at most two per repository and Git origin. No arm or source selector sees gold paths, content, or scores.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A G01 r10 quality-and-efficiency superiority headline requires 24/24 native-scored pairs, intact pre-score seals and independent receipt/metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both ARE/control known-token and summed-arm-time ratios. Otherwise report only qualified descriptive or metric-specific results.",
    preflight_refs: {source_supply_sha256: candidate.source_parquet_sha256,
      exposure_set_sha256: candidate.exposure_set_sha256,
      eligibility_receipt_sha256_by_group: candidate.eligibility_receipt_sha256,
      prior_candidate_sha256: candidate.prior_candidate_sha256,
      prior_index_admission_sha256: candidate.prior_index_admission_sha256,
      source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
      runner_index_preflight_sha256: pins.preflight[1], gold_index_coverage_sha256: pins.coverage[1],
      source_snapshot_receipt_sha256: pins.source[1], source_tree_sha256: tree.tree_sha256},
    source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
    source_runner_index_preflight_sha256: pins.preflight[1], prior_definition_sha256: pins.prior[1],
    claim_ceiling: "G01 r10 private paired GLM-5.3-flash 8K native comparison on the frozen 24-task, five-language clean-label cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R10-CLEAN-SUPPLY-CANDIDATE.md",
    open_questions: ["Will all 24 paired calls and exact terminal archivals finish under the guarded storage layout?",
      "Will native scores, label integrity and all four predeclared intervals qualify a narrow superiority statement?"]};
}

async function main() {
  need(process.argv[2] === "--check" && process.argv.length === 3, "check-only");
  const inputs = Object.fromEntries(Object.entries(pins).map(([name, pin]) => [name, readPinned(pin)]));
  const {bindSourceTree} = await import(pathToFileURL(preparePath).href);
  const tree = bindSourceTree(sourceRoot);
  const definition = buildDefinition({...inputs, tree});
  console.log(JSON.stringify({status: "check-passed-not-frozen", task_count: definition.ordered_tasks.length,
    origin_count: 17, source_tree_sha256: tree.tree_sha256, source_tree_file_count: tree.file_count,
    candidate_sha256: pins.candidate[1], preflight_sha256: pins.preflight[1],
    coverage_sha256: pins.coverage[1], definition_projection_sha256: sha(JSON.stringify(definition)),
    model_calls: 0, manifests_written: 0, open_questions: definition.open_questions}));
}
if (process.argv[1] === import.meta.filename)
  main().catch(error => { console.error(JSON.stringify({status: "check-failed", error: String(error.message)})); process.exitCode = 2; });
