// Check-only G01 r12 r2 campaign definition. No gold, freeze, or model request.
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const sourceRoot = `${base}/g01-source-r12-prospective-r41`;
const inputRoot = `${base}/g01-product-replication-input-r15`;
const campaignRoot = `${base}/g01-product-replication-r12`;
const baseConfigPath = `${base}/g01-r38-pytest-next-order-r1/CONFIG.json`;
const baseConfigSha = "1d5cfadeb370863a98441c4fe1f5d5bc813e6474fd90ce16671f6c57669b0ee7";
const expectedTree = "bac9fcdf9d485b6bec42eb9372261dab9fc58797145e17917542f197b5ef13de";
const sha = value => createHash("sha256").update(value).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g01-r12-definition.${reason}`);};
export const pins = Object.freeze({
  candidate: [`${base}/g01-r12-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`, "427a3dbdc746f9260ad705a9599041f69572cdb9d79e5efb19fa63190c91cbbd"],
  caches: [`${base}/g01-r12-r2-cache-binding-r1/VERIFY.json`, "924154f3dcee88baa9393decb7e8408e37c06b67298632c76689189c98afbd2c"],
  preflight: [`${base}/g01-r12-r2-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json`, "41e00a91e5456c90a5920a24c3dffec1036b8bc13c80c8339b8a8db2e27dd47b"],
  coverage: [`${base}/g01-r12-r2-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json`, "d6442bb34d2240fb2f903ef442284efa3974a768a5d06603e1511e7d2901d406"],
  source: [`${base}/g01-r12-r41-source-qualification-r1/SOURCE-QUALIFICATION.json`, "310e2703d06b95a193eeeb25d4888f2b5d011d9e2c1cbde36355fa81dd17b6d4"],
  scratch: [`${base}/g01-r12-r2-scratch-layout-probe-r2/SCRATCH-PROBE.json`, "66ddcc5c87b1d9ac70ca18ec90eb5507536ab5d3c5c422280d0b6a9fdd8ad16e"],
  prior: [`${base}/g01-product-replication-input-r14/DEFINITION.json`, "adbaaf8355c8887a18e31360858780fd395a5dfd1cd8838c6a83a5ae10a0e89f"]
});
export function readPinned([path, digest]) {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `receipt-drift:${path}`);
  return JSON.parse(bytes);
}

export function buildDefinition({candidate, caches, preflight, coverage, source, scratch, prior, tree}) {
  const quota = {cpp: 3, javascript: 2, python: 17, typescript: 2};
  const fields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
  need(candidate.schema_version === "are.g01-r12-clean-source-only-candidate/v2" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.changed_population_from_r11 === true &&
    candidate.r41_source_qualification_sha256 === pins.source[1] &&
    candidate.task_id_set_sha256 === "f12a9e256e429e45e8cda907593a976a1855c52d394f80632dd5c1edf66c19fc" &&
    candidate.selected_repositories === 16 && candidate.selected_git_origins === 16 &&
    candidate.max_tasks_per_repository === 2 && candidate.max_tasks_per_git_origin === 2 &&
    Object.keys(candidate.language_quota).sort().join() === Object.keys(quota).sort().join() &&
    Object.entries(quota).every(([key, count]) => candidate.language_quota[key] === count) &&
    candidate.ordered_tasks?.length === 24, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha(tasks.map(task => task.instance_id).sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === fields.sort().join() &&
      fields.every(field => typeof task[field] === "string" && task[field].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  const counts = Object.fromEntries(Object.keys(quota).map(key => [key, 0]));
  const repos = new Map(), origins = new Map();
  for (const task of tasks) {
    need(Object.hasOwn(counts, task.language), "unexpected-language");
    counts[task.language]++;
    repos.set(task.repo, (repos.get(task.repo) ?? 0) + 1);
    origins.set(task.repo_url, (origins.get(task.repo_url) ?? 0) + 1);
  }
  need(Object.entries(quota).every(([key, count]) => counts[key] === count) &&
    repos.size === 16 && origins.size === 16 &&
    [...repos.values(), ...origins.values()].every(count => count <= 2), "allocation");
  need(caches.schema_version === "are.g01-r12-r2-vps-cache-binding/v1" &&
    caches.status === "passed" && caches.candidate_sha256 === pins.candidate[1] &&
    caches.verified_tasks === 24 && caches.verified_origins === 16 &&
    caches.verified_task_bindings?.length === 24 && caches.model_calls === 0 &&
    caches.gold_loaded === false, "caches");
  const byId = new Map(caches.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24 && tasks.every(task => {
    const row = byId.get(task.instance_id);
    return row?.origin === task.repo_url && row.base_commit === task.base_commit &&
      /^[a-f0-9]{40}$/.test(row.tree) && existsSync(row.repository_path);
  }), "cache-bindings");
  need(preflight.schema_version === "are.g01-r12-r2-runner-index-preflight/v1" &&
    preflight.status === "passed" && preflight.candidate_sha256 === pins.candidate[1] &&
    preflight.transfer_sha256 === pins.caches[1] && preflight.cache_check?.passed === 24 &&
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
  need(coverage.schema_version === "are.g01-r12-r2-index-gold-coverage/v1" &&
    coverage.status === "passed" && coverage.candidate_sha256 === pins.candidate[1] &&
    coverage.transfer_sha256 === pins.caches[1] && coverage.preflight_sha256 === pins.preflight[1] &&
    coverage.posture === "evaluator-only-no-model-no-scores" &&
    coverage.gold_paths_or_content_exported === false && coverage.model_calls === 0 &&
    coverage.summary?.audited === 24 && coverage.summary.gold_files === 49 &&
    coverage.summary.admitted === 49 && coverage.summary.absent === 0 &&
    coverage.summary.excluded === 0 && coverage.summary.worker_unavailable === 0 &&
    coverage.rows?.length === 24 && coverage.rows.every((row, index) =>
      row.instance_id === tasks[index].instance_id && row.status === "audited" &&
      row.index_digest_matches === true && row.absent_gold_files === 0 &&
      row.excluded_gold_files === 0), "coverage");
  need(source.schema_version === "are.g01-r12-r41-source-qualification/v1" &&
    source.status === "source-qualified-not-campaign-frozen" && source.source_root === sourceRoot &&
    source.source_tree_sha256 === expectedTree && source.file_count === 408 &&
    source.tests_run === 95 && source.passed === 95 && source.failed === 0 &&
    source.model_calls === 0 && source.gold_loaded === false &&
    tree.file_count === 408 && tree.tree_sha256 === expectedTree, "source-tree");
  need(scratch.schema_version === "are.g01-r12-r2-scratch-layout-probe/v2" &&
    scratch.status === "passed-source-retained" && scratch.model_calls === 0 &&
    scratch.gold_loaded === false && scratch.cache_receipt_sha256 === pins.caches[1] &&
    scratch.tmp_consumed_bytes === 1606123520, "scratch");
  need(prior.schema_version === "are.g01-campaign-definition/v1" &&
    prior.status === "pre-dispatch" && prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true &&
    prior.span_refinement_policy === "source-only-go-selected-subspan-r1" &&
    prior.scorer?.image === "are-contextbench-scorer:g01-r1", "prior");
  const configBytes = readFileSync(baseConfigPath), config = JSON.parse(configBytes);
  need(sha(configBytes) === baseConfigSha && config.context_limit === 8000 &&
    config.total_tokens_per_arm === 160000 && config.model === "glm-5.3-flash" &&
    config.tasks?.length === 1 &&
    config.tasks[0].cell_template?.limits?.total_tokens === 160000 &&
    config.tasks[0].cell_template?.provider_profile?.model_timeout_ms === 240000 &&
    !existsSync(inputRoot) && !existsSync(campaignRoot), "protocol-or-successor-root");
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
    source_scratch_root: "/tmp/are-g01-product-replication-r12-source",
    base_config_path: baseConfigPath, source_tree_sha256: tree.tree_sha256,
    source_tree_file_count: tree.file_count, ordered_tasks: orderedTasks,
    hypothesis: "On a score-blind four-language 24-task clean-label cohort at paired 8K windows, symmetric 160K total-token arm caps and 240-second request timeouts, the ARE source-context candidate improves paired native Span-F1 and File-F1 while lowering known tokens and summed arm time against the unchanged intent-anchor control.",
    selection_rule: "Exclude every r11 frozen ID. Keep 22 pre-model admitted r12 r1 tasks and deterministically replace the two index-ineligible TypeScript tasks with the first native-index-admitted ordered MUI alternatives. Fixed mix 3 C++/2 JavaScript/17 Python/2 TypeScript; at most two per repository and origin. No arm or selector sees gold paths, content or scores.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A narrow G01 r12 quality-and-efficiency superiority claim requires 24/24 terminal scored pairs (native predictions or only the predeclared explicit-no-final-context zero abstention), intact pre-score seals and independent receipt/native-metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for ARE-minus-control Span-F1 and File-F1 and wholly below one for ARE/control known-token and summed-arm-time ratios. Report abstentions separately; any other unscored/scoring-error pair defeats the strict claim gate. Otherwise report qualified descriptive or metric-specific results only.",
    preflight_refs: {source_supply_sha256: candidate.source_parquet_sha256,
      exposure_set_sha256: candidate.exposure_set_sha256,
      eligibility_receipt_sha256_by_group: candidate.eligibility_receipt_sha256,
      source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
      runner_index_preflight_sha256: pins.preflight[1], gold_index_coverage_sha256: pins.coverage[1],
      source_verification_receipt_sha256: pins.source[1], scratch_probe_sha256: pins.scratch[1],
      source_tree_sha256: tree.tree_sha256, base_config_sha256: baseConfigSha},
    source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
    source_runner_index_preflight_sha256: pins.preflight[1], prior_definition_sha256: pins.prior[1],
    claim_ceiling: "Private G01 r12 paired GLM-5.3-flash 8K native comparison on the frozen 24-task four-language changed-population cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R12-CLEAN-COHORT-CANDIDATE.md",
    open_questions: ["Will all 24 pairs finish with native scores or only predeclared zero abstentions?",
      "Will archival, label integrity, all four intervals and independent audit qualify the narrow claim?"]};
}

async function main() {
  need(process.argv[2] === "--check" && process.argv.length === 3, "check-only");
  const inputs = Object.fromEntries(Object.entries(pins).map(([key, pin]) => [key, readPinned(pin)]));
  const {bindSourceTree} = await import(pathToFileURL(join(sourceRoot,
    "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
  const tree = bindSourceTree(sourceRoot);
  const definition = buildDefinition({...inputs, tree});
  console.log(JSON.stringify({status: "check-passed-not-frozen", task_count: 24,
    origin_count: 16, source_tree_sha256: tree.tree_sha256,
    definition_projection_sha256: sha(JSON.stringify(definition)), model_calls: 0,
    manifests_written: 0, open_questions: definition.open_questions}));
}
if (process.argv[1] === import.meta.filename)
  main().catch(error => {console.error(JSON.stringify({status: "check-failed", error: String(error.message)})); process.exitCode = 2;});
