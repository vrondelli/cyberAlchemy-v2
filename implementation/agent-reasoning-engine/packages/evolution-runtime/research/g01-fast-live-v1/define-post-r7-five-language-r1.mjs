// Check-only binding for the prospective post-r7 five-language G01 campaign.
// It writes no task manifest or freeze and makes no model or scoring call.
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, code) => { if (!value) throw Error(`g01-five-language-definition.${code}`); };
const base = "/opt/are/evolution-runtime";
const pins = Object.freeze({
  candidate: [`${base}/g01-post-r7-multilang-cohort-candidate-r2/COHORT-CANDIDATE.json`, "9364dcb5978c89b16c5b84c0f964e93bac4a332f562f2b73365fecb745b498c6"],
  caches: [`${base}/g01-post-r7-source-caches-r2/SOURCE-CACHES.json`, "4715d97c477a3a091ae7bbd384f7c1545cc6d4944e90cf9e9f7234ae3a2f941e"],
  preflight: [`${base}/g01-post-r7-runner-index-preflight-r2/RUNNER-INDEX-PREFLIGHT.json`, "562f4b65ca68be26affcf1125fc7ff87a3be14f5778054b0409bfc6d7ff39764"],
  coverage: [`${base}/g01-post-r7-r2-gold-index-coverage-r2/GOLD-INDEX-COVERAGE.json`, "8096e6e8bc3d3e3ba9c9aac99a067308e1941248412f78a5c9ec0715314b1732"],
  prior: [`${base}/g01-product-replication-input-r10/DEFINITION.json`, "d0d02594dfac39104d4f3afbc0242414b5e84ea30b82ab766b438548a0594a59"]
});
const sourceRoot = `${base}/g01-source-combined-candidate-r9`;
const inputRoot = `${base}/g01-product-replication-input-r11`;
const campaignRoot = `${base}/g01-product-replication-r8`;
const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const sourcePins = Object.freeze({
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/source-neighborhood-live-r1.mjs": "a3d76abe4974fc860f9b372398000288d84926a933da67bfcb6f283cb9593257",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/distinctive-source-acquisition-r1.mjs": "f76eecacaa00a6780f2ac73561d2538ec5745ba3c2c8b6110bc6b888b70c2d7a",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-terminal-r3.mjs": "1d7b2fe6a412e06c343b016303f613f5837f6f08c4a0a65fc7fd5d993802a2cf",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs": "9a87df3f4db88a4125256c7cdde5d5852f135ebaeb49482d8c00d1f359edf92c"
});
const quota = {cpp: 5, java: 5, javascript: 5, python: 4, typescript: 5};
const readPinned = ([path, digest]) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `receipt-drift:${path}`);
  return JSON.parse(bytes);
};

export function buildDefinition({candidate, caches, preflight, coverage, prior}) {
  need(candidate?.schema_version === "are.g01-post-r7-multilang-source-only-candidate/v2" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.source_commit_join_verified === true &&
    candidate.seed === "are-g01-post-r7-five-language-score-blind-24-20260929" &&
    candidate.task_id_set_sha256 === "a8fe7dbe7da56859a88daaabd20c3b49f340236e1340544e3dc88b258fb526b3" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.exposure_set_sha256 === "6e6610069179c525f30a6a66cfd5e6a3324e32c929e07ac30b0dc0a5c9622d2b" &&
    candidate.source_supply_sha256 === "8e25f74d198ab76489676c3bbdd5f00d8e1efd5ccb68738ab4b48ef72ef54f09" &&
    candidate.max_tasks_per_repo === 2 && JSON.stringify(candidate.language_quota) === JSON.stringify(quota) &&
    candidate.source_index_exclusion?.reason === "source-index.inventory-entry-limit" &&
    candidate.ordered_tasks?.length === 24, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...taskFields].sort().join() &&
      taskFields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  const counts = Object.fromEntries(Object.keys(quota).map(language => [language, 0]));
  const repoCounts = new Map();
  for (const task of tasks) {
    need(Object.hasOwn(counts, task.language), "unexpected-language");
    counts[task.language]++;
    const repoKey = `${task.language}/${task.repo}`;
    repoCounts.set(repoKey, (repoCounts.get(repoKey) ?? 0) + 1);
  }
  need(JSON.stringify(counts) === JSON.stringify(quota) && [...repoCounts.values()].every(count => count <= 2) && repoCounts.size === 15, "allocation");
  need(caches?.status === "passed" && caches.candidate_sha256 === pins.candidate[1] &&
    caches.repositories?.length === 15 && caches.model_calls === 0 && caches.gold_loaded === false, "caches");
  need(preflight?.status === "passed" && preflight.candidate_sha256 === pins.candidate[1] &&
    preflight.caches_sha256 === pins.caches[1] && preflight.cache_check?.passed === 24 &&
    preflight.checkout_probes?.length === 24 && preflight.checkout_probes.every((row, index) =>
      row.status === "passed" && row.instance_id === tasks[index].instance_id) &&
    preflight.source_index?.status === "passed" && preflight.source_index.results?.length === 24 &&
    preflight.source_index.results.every((row, index) => row.status === "passed" &&
      row.instance_id === tasks[index].instance_id && row.repo === tasks[index].repo &&
      row.base_commit === tasks[index].base_commit && row.model_calls === 0 &&
      row.local_settled === true && row.process_group_absent === true && row.forced === false &&
      existsSync(row.repository_path)) && preflight.model_calls === 0 && preflight.gold_loaded === false, "preflight");
  need(coverage?.candidate_sha256 === pins.candidate[1] && coverage.caches_sha256 === pins.caches[1] &&
    coverage.preflight_sha256 === pins.preflight[1] && coverage.posture === "evaluator-only-no-model-no-scores" &&
    coverage.gold_paths_or_content_exported === false && coverage.model_calls === 0 &&
    coverage.summary?.audited === 24 && coverage.summary.admitted === 81 &&
    coverage.summary.absent === 0 && coverage.summary.excluded === 0 &&
    coverage.rows?.length === 24 && coverage.rows.every((row, index) =>
      row.instance_id === tasks[index].instance_id && row.index_digest_matches === true &&
      row.absent_gold_files === 0 && row.excluded_gold_files === 0), "coverage");
  need(prior?.schema_version === "are.g01-campaign-definition/v1" && prior.status === "pre-dispatch" &&
    prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true &&
    prior.span_refinement_policy === "source-only-go-selected-subspan-r1" &&
    prior.ordered_tasks?.length === 24, "prior-definition");
  need(sha(readFileSync(prior.base_config_path)) === "de5a2a7f2dcece6b72e8131e688d70577ed62b55ccb69c72f54f480ea1c329ab", "base-config");
  const baseConfig = JSON.parse(readFileSync(prior.base_config_path));
  need(baseConfig.context_limit === 8000 && baseConfig.total_tokens_per_arm === 96000 &&
    baseConfig.tasks?.length >= 1 && prior.scorer?.image === "are-contextbench-scorer:g01-r1", "fixed-protocol");
  for (const [relative, digest] of Object.entries(sourcePins))
    need(sha(readFileSync(join(sourceRoot, relative))) === digest, `source-drift:${relative}`);
  need(!existsSync(inputRoot) && !existsSync(campaignRoot), "successor-roots-already-used");
  const orderedTasks = tasks.map((task, index) => ({
    slug: `${task.language}-${task.repo.split("/").at(-1).replace(/[^a-z0-9]+/g, "-")}-${task.instance_id.slice(-8)}`,
    instance_id: task.instance_id, repo: task.repo,
    task_path: join(inputRoot, "tasks", `${task.instance_id}.json`),
    repository_cache: preflight.source_index.results[index].repository_path
  }));
  need(new Set(orderedTasks.map(task => task.slug)).size === 24 &&
    orderedTasks.every(task => /^[a-z0-9-]+$/.test(task.slug)), "slugs");
  return {...prior, root: campaignRoot, source_root: sourceRoot,
    hypothesis: "On a fresh, positional-gold-screened five-language 24-task cohort, the Java/C++-capable ARE 8K candidate improves paired native Span-F1 and File-F1 while reducing known tokens and summed arm time against the unchanged native control.",
    ordered_tasks: orderedTasks,
    selection_rule: "Exclude all manifested G01/HEN/G02 IDs, screen gold-to-base positional integrity in evaluator-only isolation, exclude one pre-model source-index-ineligible task, and apply the fixed score-blind seed, 5/5/5/4/5 language quotas, and maximum two tasks per repository. Selector and arms see no gold paths, contents, or scores.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A G01 r8 quality-and-efficiency superiority headline requires 24/24 native-scored pairs, intact sealed predictions and independent receipt/metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both ARE/control known-token and summed-arm-time ratios. Otherwise report only qualified descriptive or metric-specific results.",
    preflight_refs: {source_supply_sha256: candidate.source_supply_sha256,
      exposure_set_sha256: candidate.exposure_set_sha256, positional_gold_lineage_sha256: candidate.eligibility_receipt_sha256,
      source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
      runner_index_preflight_sha256: pins.preflight[1], gold_index_coverage_sha256: pins.coverage[1],
      source_code_sha256_by_path: sourcePins},
    source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
    source_runner_index_preflight_sha256: pins.preflight[1], prior_definition_sha256: pins.prior[1],
    claim_ceiling: "G01 r8 paired GLM-5.3-flash 8K comparison against the native intent-anchor control on this frozen 24-task, 15-repository, five-language C++/Java/JavaScript/Python/TypeScript positional-gold-screened cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-POST-R7-MULTILANG-ELIGIBILITY-2026-09-29.md",
    open_questions: ["Will same-account GLM tokenizer and tiny generation preflight recover before a freeze?",
      "Can volatile exact-commit source caches and durable raw evidence be managed without deleting prior archives?",
      "Will all 24 paired native scores and four predeclared interval gates pass on the changed five-language population?"]};
}

if (process.argv[1] === import.meta.filename) {
  try {
    need(process.argv[2] === "--check" && process.argv.length === 3, "check-only");
    const input = Object.fromEntries(Object.entries(pins).map(([name, pin]) => [name, readPinned(pin)]));
    const definition = buildDefinition(input);
    console.log(JSON.stringify({status: "check-passed-not-frozen", task_count: definition.ordered_tasks.length,
      repository_count: 15, source_root: definition.source_root,
      candidate_sha256: pins.candidate[1], preflight_sha256: pins.preflight[1],
      coverage_sha256: pins.coverage[1], definition_projection_sha256: sha(JSON.stringify(definition)),
      model_calls: 0, manifests_written: 0, open_questions: definition.open_questions}));
  } catch (error) { console.error(JSON.stringify({status: "check-failed", error: String(error.message)})); process.exitCode = 2; }
}
