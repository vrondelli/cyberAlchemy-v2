// Check-only construction of the prospective G01 r9 clean-cohort definition.
// No task manifest, campaign freeze, model call, gold path, or score is written.
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r9-definition.${reason}`);};
const base = "/opt/are/evolution-runtime";
export const pins = Object.freeze({
  candidate: [`${base}/g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json`, "9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194"],
  caches: [`${base}/g01-post-r8-source-caches-r2/SOURCE-CACHES.json`, "5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9"],
  preflight: [`${base}/g01-post-r8-runner-index-preflight-r3/RUNNER-INDEX-PREFLIGHT.json`, "8480e86348eac8204de06e6eda743b778f08aba95213d38844a1a5d9184bdb91"],
  coverage: [`${base}/g01-post-r8-index-gold-coverage-r2/GOLD-INDEX-COVERAGE.json`, "eaa0b91c7acc64ae9c41125e55243632896a160df7ed84498d588a3c2e0000e5"],
  prior: [`${base}/g01-product-replication-input-r11/DEFINITION.json`, "8e80eb77b277289b20b48a5677e07c338280d4d1c9e85e65dbbbf360f90a10af"]
});
const sourceRoot = `${base}/g01-source-post-r8-candidate-r13`;
const preparePath = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const inputRoot = `${base}/g01-product-replication-input-r12`;
const campaignRoot = `${base}/g01-product-replication-r9`;
const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const quota = {cpp: 6, java: 6, javascript: 6, typescript: 6};
const expectedTree = {file_count: 404, tree_sha256: "8f6c4ba764bea79c6738c952053e6f88e58a6dfb6021d18d964fe43c520144d6"};
export const readPinned = ([path, digest]) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `receipt-drift:${path}`);
  return JSON.parse(bytes);
};

export function buildDefinition({candidate, caches, preflight, coverage, prior, tree}) {
  need(candidate?.schema_version === "are.g01-post-r8-clean-source-only-candidate/v2" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.source_commit_join_verified === true &&
    candidate.seed === "are-g01-post-r8-four-language-score-blind-24-20260930" &&
    candidate.task_id_set_sha256 === "f1e12289b56c0bc827d949fec0167230d94be1a940160853effda85464d8002b" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.current_exposure_set_sha256 === "9e77d358fc924541e8963528be6f4d7c8cc5f54af35176207faf3541035710cf" &&
    candidate.max_tasks_per_repository_and_origin === 2 &&
    JSON.stringify(candidate.language_quota) === JSON.stringify(quota) &&
    candidate.ordered_tasks?.length === 24, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...taskFields].sort().join() &&
      taskFields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  const counts = Object.fromEntries(Object.keys(quota).map(language => [language, 0]));
  const repoCounts = new Map(), originCounts = new Map();
  for (const task of tasks) {
    need(Object.hasOwn(counts, task.language), "unexpected-language");
    counts[task.language]++;
    repoCounts.set(task.repo, (repoCounts.get(task.repo) ?? 0) + 1);
    originCounts.set(task.repo_url, (originCounts.get(task.repo_url) ?? 0) + 1);
  }
  need(JSON.stringify(counts) === JSON.stringify(quota) && repoCounts.size === 17 &&
    originCounts.size === 17 && [...repoCounts.values(), ...originCounts.values()].every(count => count <= 2), "allocation");
  need(caches?.schema_version === "are.g01-post-r8-source-caches/v2" && caches.status === "passed" &&
    caches.candidate_sha256 === pins.candidate[1] && caches.task_bindings?.length === 24 &&
    caches.model_calls === 0 && caches.gold_loaded === false, "caches");
  const cacheById = new Map(caches.task_bindings.map(row => [row.instance_id, row]));
  need(cacheById.size === 24 && tasks.every(task => {
    const row = cacheById.get(task.instance_id);
    return row && row.repo === task.repo && row.origin === task.repo_url &&
      row.base_commit === task.base_commit && /^[a-f0-9]{40}$/.test(row.tree) &&
      existsSync(row.repository_path);
  }), "cache-bindings");
  need(preflight?.schema_version === "are.g01-post-r8-runner-index-preflight/v3" &&
    preflight.status === "passed" && preflight.candidate_sha256 === pins.candidate[1] &&
    preflight.caches_sha256 === pins.caches[1] && preflight.cache_check?.passed === 24 &&
    preflight.checkout_probes?.length === 24 && preflight.source_index?.status === "passed" &&
    preflight.source_index.results?.length === 24 && preflight.model_calls === 0 &&
    preflight.gold_loaded === false, "preflight");
  need(tasks.every((task, index) => preflight.checkout_probes[index].instance_id === task.instance_id &&
    preflight.checkout_probes[index].status === "passed" &&
    preflight.source_index.results[index].instance_id === task.instance_id &&
    preflight.source_index.results[index].repo === task.repo &&
    preflight.source_index.results[index].base_commit === task.base_commit &&
    preflight.source_index.results[index].repository_path === cacheById.get(task.instance_id).repository_path &&
    preflight.source_index.results[index].status === "passed" &&
    preflight.source_index.results[index].local_settled === true &&
    preflight.source_index.results[index].process_group_absent === true &&
    preflight.source_index.results[index].forced === false &&
    preflight.source_index.results[index].model_calls === 0), "preflight-rows");
  need(coverage?.schema_version === "are.g01-post-r8-index-gold-coverage/v2" &&
    coverage.candidate_sha256 === pins.candidate[1] && coverage.caches_sha256 === pins.caches[1] &&
    coverage.preflight_sha256 === pins.preflight[1] &&
    coverage.posture === "evaluator-only-no-model-no-scores" &&
    coverage.gold_paths_or_content_exported === false && coverage.model_calls === 0 &&
    coverage.summary?.audited === 24 && coverage.summary.admitted === 60 &&
    coverage.summary.absent === 0 && coverage.summary.excluded === 0 &&
    coverage.summary.worker_unavailable === 0 && coverage.rows?.length === 24 &&
    coverage.rows.every((row, index) => row.instance_id === tasks[index].instance_id &&
      row.status === "audited" && row.index_digest_matches === true &&
      row.absent_gold_files === 0 && row.excluded_gold_files === 0), "coverage");
  need(tree?.file_count === expectedTree.file_count && tree.tree_sha256 === expectedTree.tree_sha256,
    "source-tree");
  need(prior?.schema_version === "are.g01-campaign-definition/v1" && prior.status === "pre-dispatch" &&
    prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true &&
    prior.ordered_tasks?.length === 24 && prior.scorer?.image === "are-contextbench-scorer:g01-r1", "prior");
  need(sha(readFileSync(prior.base_config_path)) === "de5a2a7f2dcece6b72e8131e688d70577ed62b55ccb69c72f54f480ea1c329ab", "base-config");
  const config = JSON.parse(readFileSync(prior.base_config_path));
  need(config.context_limit === 8000 && config.total_tokens_per_arm === 96000 &&
    config.model === "glm-5.3-flash", "fixed-protocol");
  need(!existsSync(inputRoot) && !existsSync(campaignRoot), "successor-roots-used");
  const orderedTasks = tasks.map(task => ({
    slug: `${task.language}-${task.repo.split("/").at(-1).replace(/[^a-z0-9]+/g, "-")}-${task.instance_id.slice(-8)}`,
    instance_id: task.instance_id, repo: task.repo,
    task_path: join(inputRoot, "tasks", `${task.instance_id}.json`),
    repository_cache: cacheById.get(task.instance_id).repository_path
  }));
  need(new Set(orderedTasks.map(task => task.slug)).size === 24 &&
    orderedTasks.every(task => /^[a-z0-9-]+$/.test(task.slug)), "slugs");
  const {builder_sha256: _builder, definition_projection_sha256: _projection, ...basis} = prior;
  return {...basis, root: campaignRoot, source_root: sourceRoot,
    source_scratch_root: `/tmp/are-g01-product-replication-r9-source`,
    source_tree_sha256: expectedTree.tree_sha256, source_tree_file_count: expectedTree.file_count,
    hypothesis: "On a new score-blind four-language 24-task cohort with clean positional labels, the ARE 8K source-context candidate improves native paired Span-F1 and File-F1 while reducing known tokens and summed arm time against the unchanged native intent-anchor control.",
    ordered_tasks: orderedTasks,
    selection_rule: "Exclude every manifested prior G01/HEN/G02 task, screen evaluator-only positional gold-to-base integrity, exclude the one known source-index-ineligible task, then apply the fixed score-blind seed, six tasks per C++/Java/JavaScript/TypeScript language and at most two per repository and Git origin. No selector or arm sees gold paths, content, or scores.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A G01 r9 quality-and-efficiency superiority headline requires 24/24 native-scored pairs, intact pre-score seals and independent receipt/metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both ARE/control known-token and summed-arm-time ratios. Otherwise report only qualified descriptive or metric-specific results.",
    preflight_refs: {source_supply_sha256: candidate.source_parquet_sha256,
      exposure_set_sha256: candidate.current_exposure_set_sha256,
      eligibility_receipt_sha256_by_group: candidate.eligibility_receipt_sha256,
      source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
      runner_index_preflight_sha256: pins.preflight[1], gold_index_coverage_sha256: pins.coverage[1],
      source_tree_sha256: expectedTree.tree_sha256},
    source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
    source_runner_index_preflight_sha256: pins.preflight[1], prior_definition_sha256: pins.prior[1],
    claim_ceiling: "G01 r9 private paired GLM-5.3-flash 8K native comparison on the frozen 24-task, 17-origin, four-language clean-label C++/Java/JavaScript/TypeScript cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-POST-R8-CLEAN-COHORT-CANDIDATE.md",
    open_questions: ["Will live source-index queries and all 24 pairs finish under the guarded serial storage layout?",
      "Will native scores, label integrity, and all four predeclared intervals qualify a narrow superiority statement?"]};
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
  main().catch(error => {console.error(JSON.stringify({status: "check-failed", error: String(error.message)})); process.exitCode = 2;});
