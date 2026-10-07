// Check-only prospective G01 r11 r3 definition. No freeze, gold or model call.
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const sourceRoot = `${base}/g01-source-r11-prospective-r40`;
const inputRoot = `${base}/g01-product-replication-input-r14`;
const campaignRoot = `${base}/g01-product-replication-r11`;
const expectedTree = "8b30437bb41bf68ca5385d05054bd9e60444599da7c522c866a54a1635d15faa";
const baseConfigPath = `${base}/g01-r38-pytest-next-order-r1/CONFIG.json`;
const baseConfigSha = "1d5cfadeb370863a98441c4fe1f5d5bc813e6474fd90ce16671f6c57669b0ee7";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g01-r11-definition.${reason}`);};
export const pins = Object.freeze({
  candidate: [`${base}/g01-r11-clean-cohort-candidate-r3/COHORT-CANDIDATE.json`, "4a880cebe939ab25e3c35431cef7396a95534c863547e74024bc5211991bdb66"],
  caches: [`${base}/g01-r11-r3-cache-binding-r1/VERIFY.json`, "6f0e9a31382fe5ecc7a28d01e2ff704f1c2e92e1c0634574aae63b7c110fb3f7"],
  preflight: [`${base}/g01-r11-r3-runner-index-preflight-r2/RUNNER-INDEX-PREFLIGHT.json`, "61ee7663a11af030975ec412953d32e552584a6ec80beae8594c4d11dea46c6c"],
  coverage: [`${base}/g01-r11-r3-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json`, "60ee6f3285418545b3370b969fc3f1e5265fe72cec03ae6b7c3e2cb110277e91"],
  source: [`${base}/g01-source-r11-prospective-r40-evidence/SOURCE-SNAPSHOT.json`, "d4f3136be2d3a0e5f9d56d0166fe3f2c724f8706d834adb32310b3d1c89ccf98"],
  prior: [`${base}/g01-product-replication-input-r13/DEFINITION.json`, "34e256f43260fd3bf56078c7f37d52d127cefec38d0a46faa5489811131c182b"]
});
export function readPinned([path, digest]) {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `receipt-drift:${path}`);
  return JSON.parse(bytes);
}

export function buildDefinition({candidate, caches, preflight, coverage, source, prior, tree}) {
  const quota = {cpp: 4, go: 1, java: 1, javascript: 2, python: 14, typescript: 2};
  const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
  need(candidate?.schema_version === "are.g01-r11-clean-source-only-candidate/v3" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.changed_population_from_r10 === true &&
    candidate.seed === "are-g01-r11-six-language-clean-source-only-20261001" &&
    candidate.task_id_set_sha256 === "8dfa00a758d30a1041c1f25913e00dc2d7cdfa5062b14d292dbe1966d21b3e62" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.exposure_set_sha256 === "fe2afba23efe8e69e228a56fe69299b9748a69e4f82d71651500068ef6d047dc" &&
    candidate.max_tasks_per_repository === 2 && candidate.max_tasks_per_git_origin === 2 &&
    candidate.selected_repositories === 16 && candidate.selected_git_origins === 15 &&
    Object.keys(candidate.language_quota ?? {}).sort().join() === Object.keys(quota).sort().join() &&
    Object.entries(quota).every(([language, count]) => candidate.language_quota[language] === count) &&
    candidate.ordered_tasks?.length === 24, "candidate");
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
  need(Object.entries(quota).every(([language, count]) => counts[language] === count) &&
    byRepo.size === 16 && byOrigin.size === 15 &&
    [...byRepo.values(), ...byOrigin.values()].every(count => count <= 2), "allocation");
  need(caches?.schema_version === "are.g01-r11-r3-vps-cache-binding/v1" &&
    caches.status === "passed" && caches.candidate_sha256 === pins.candidate[1] &&
    caches.verified_tasks === 24 && caches.verified_origins === 15 &&
    caches.verified_task_bindings?.length === 24 && caches.model_calls === 0 &&
    caches.gold_loaded === false, "caches");
  const byId = new Map(caches.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24 && tasks.every(task => {
    const row = byId.get(task.instance_id);
    return row?.origin === task.repo_url && row.base_commit === task.base_commit &&
      /^[a-f0-9]{40}$/.test(row.tree) && existsSync(row.repository_path);
  }), "cache-bindings");
  need(preflight?.schema_version === "are.g01-r11-r3-runner-index-preflight/v2" &&
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
  need(coverage?.schema_version === "are.g01-r11-r3-index-gold-coverage/v1" &&
    coverage.status === "passed" && coverage.candidate_sha256 === pins.candidate[1] &&
    coverage.transfer_sha256 === pins.caches[1] && coverage.preflight_sha256 === pins.preflight[1] &&
    coverage.posture === "evaluator-only-no-model-no-scores" &&
    coverage.gold_paths_or_content_exported === false && coverage.model_calls === 0 &&
    coverage.summary?.audited === 24 && coverage.summary.gold_files === 57 &&
    coverage.summary.admitted === 57 && coverage.summary.absent === 0 &&
    coverage.summary.excluded === 0 && coverage.summary.worker_unavailable === 0 &&
    coverage.rows?.length === 24 && coverage.rows.every((row, index) =>
      row.instance_id === tasks[index].instance_id && row.status === "audited" &&
      row.index_digest_matches === true && row.absent_gold_files === 0 &&
      row.excluded_gold_files === 0), "coverage");
  need(source?.schema_version === "are.g01-r11-r40-source-snapshot/v1" &&
    source.status === "tested-not-frozen" && source.source_root === sourceRoot &&
    source.source_tree_sha256 === expectedTree && source.file_count === 407 &&
    source.tests_run === 92 && source.passed === 92 && source.failed === 0 &&
    source.model_calls === 0 && source.gold_loaded === false &&
    tree?.file_count === 407 && tree.tree_sha256 === expectedTree, "source-tree");
  need(prior?.schema_version === "are.g01-campaign-definition/v1" &&
    prior.status === "pre-dispatch" && prior.root === `${base}/g01-product-replication-r10` &&
    prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true &&
    prior.span_refinement_policy === "source-only-go-selected-subspan-r1" &&
    prior.ordered_tasks?.length === 24 && prior.scorer?.image === "are-contextbench-scorer:g01-r1",
  "prior");
  const configBytes = readFileSync(baseConfigPath), config = JSON.parse(configBytes);
  need(sha(configBytes) === baseConfigSha && config.context_limit === 8000 &&
    config.total_tokens_per_arm === 160000 && config.model === "glm-5.3-flash" &&
    config.tasks?.length === 1 &&
    config.tasks[0].cell_template?.limits?.total_tokens === 160000 &&
    config.tasks[0].cell_template?.provider_profile?.model_timeout_ms === 240000 &&
    !existsSync(inputRoot) && !existsSync(campaignRoot),
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
    base_config_path: baseConfigPath,
    source_scratch_root: "/tmp/are-g01-product-replication-r11-source",
    source_tree_sha256: tree.tree_sha256, source_tree_file_count: tree.file_count,
    hypothesis: "On a new score-blind six-language 24-task clean-label cohort at symmetric 8K windows, 160K total-token arm caps and 240-second request timeouts, the ARE source-context candidate improves paired native Span-F1 and File-F1 while lowering known tokens and summed arm time against the unchanged intent-anchor control.",
    ordered_tasks: orderedTasks,
    selection_rule: "Exclude every manifested prior G01/HEN/G02 task; use evaluator-only exact-base label and index admission; retain 23 r11 r1 pre-model admitted tasks and deterministically replace one TypeScript index-ineligible task with the first ordered native-index-admitted MUI alternative. Fixed mix: 4 C++/1 Go/1 Java/2 JavaScript/14 Python/2 TypeScript, at most two per repository and Git origin. No arm or selector sees gold paths, content or scores.",
    decision_rule: "Zero automatic model retries and zero replacement. Account for all 24 attempts. A narrow G01 r11 quality-and-efficiency superiority claim requires 24/24 terminal scored pairs (native predictions or only the predeclared explicit-no-final-context zero abstention), intact pre-score seals and independent receipt/native-metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both ARE/control known-token and summed-arm-time ratios. Report candidate and control abstentions separately; any other unscored/scoring-error pair defeats the strict claim gate. Otherwise report qualified descriptive or metric-specific results only.",
    preflight_refs: {source_supply_sha256: candidate.source_parquet_sha256,
      exposure_set_sha256: candidate.exposure_set_sha256,
      eligibility_receipt_sha256_by_group: candidate.eligibility_receipt_sha256,
      source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
      runner_index_preflight_sha256: pins.preflight[1], gold_index_coverage_sha256: pins.coverage[1],
      source_verification_receipt_sha256: pins.source[1], source_tree_sha256: tree.tree_sha256,
      base_config_sha256: baseConfigSha},
    source_only_candidate_sha256: pins.candidate[1], source_caches_sha256: pins.caches[1],
    source_runner_index_preflight_sha256: pins.preflight[1], prior_definition_sha256: pins.prior[1],
    claim_ceiling: "Private G01 r11 paired GLM-5.3-flash 8K native comparison on the frozen 24-task six-language clean-label changed-population cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R11-CLEAN-COHORT-CANDIDATE.md",
    open_questions: ["Will all 24 pairs finish with native scores or only predeclared zero abstentions?",
      "Will exact archival, label integrity, all four intervals and independent audit qualify the narrow claim?"]};
}

async function main() {
  need(process.argv[2] === "--check" && process.argv.length === 3, "check-only");
  const inputs = Object.fromEntries(Object.entries(pins).map(([name, pin]) => [name, readPinned(pin)]));
  const {bindSourceTree} = await import(pathToFileURL(join(sourceRoot,
    "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
  const tree = bindSourceTree(sourceRoot);
  const definition = buildDefinition({...inputs, tree});
  console.log(JSON.stringify({status: "check-passed-not-frozen", task_count: definition.ordered_tasks.length,
    origin_count: 15, source_tree_sha256: tree.tree_sha256, source_tree_file_count: tree.file_count,
    candidate_sha256: pins.candidate[1], preflight_sha256: pins.preflight[1],
    coverage_sha256: pins.coverage[1], definition_projection_sha256: sha(JSON.stringify(definition)),
    model_calls: 0, manifests_written: 0, open_questions: definition.open_questions}));
}
if (process.argv[1] === import.meta.filename)
  main().catch(error => {console.error(JSON.stringify({status: "check-failed", error: String(error.message)})); process.exitCode = 2;});
