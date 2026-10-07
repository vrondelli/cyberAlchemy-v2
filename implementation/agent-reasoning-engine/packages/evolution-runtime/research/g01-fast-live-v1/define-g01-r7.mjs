// Bind the prospectively screened G01 r7 cohort to the unchanged r6 arms.
// Definition only: no model call, campaign freeze, gold access, or scoring.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r7-definition.${reason}`); };
const base = "/opt/are/evolution-runtime";
const candidatePath = "/opt/are-harness-benchmark/g01-r7-cohort-candidate-r1/COHORT-CANDIDATE.json";
const candidateSha = "3a347d0e32c5b9705ac48408b703eb09eb1be23db6100f8f816bcf6d11b90a35";
const cachesPath = "/opt/are-harness-benchmark/g01-r7-runner-caches-r1/SOURCE-CACHES.json";
const cachesSha = "95f70dc2d9ee5015e34d1d437900a5457581e7ae622920f82e5eb659a83a7b82";
const preflightPath = `${base}/g01-r7-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json`;
const preflightSha = "186d0100bc6070d41463ceffd0398629c633fedd59bd7fea71e28f82769a7ba3";
const priorPath = `${base}/g01-product-replication-input-r9/DEFINITION.json`;
const priorSha = "b8f43652066e037441f9dee0ddcdf1acbed849f63746c31595b07f1ea022a427";
const sourceRoot = `${base}/g01-source-combined-candidate-r8`;
const inputRoot = `${base}/g01-product-replication-input-r10`;
const campaignRoot = `${base}/g01-product-replication-r7`;
const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const readPinned = (path, digest) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `digest:${path}`);
  return JSON.parse(bytes);
};

export function buildDefinition({candidate, caches, preflight, prior}) {
  need(candidate?.schema_version === "are.g01-r7-source-only-cohort-candidate/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.source_commit_join_verified === true &&
    candidate.gold_values_or_paths_used === false && candidate.model_calls === 0 &&
    candidate.seed === "are-g01-r7-positional-label-screened-24-20260929" &&
    candidate.task_id_set_sha256 === "7b34c18c7b81100e78cf6a785d5fb8fccf392e7f3c79e11f8108a0e003704fe7" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.source_supply_sha256 === "57d26dc84226850d66eeb934ae2c347b038df946b0e9a86e1823ba1e9323a321" &&
    candidate.file_presence_sha256 === "386888a50e1010a87e5cd4b7c091f8072746e98292f62207690cb07a31779239" &&
    candidate.ordered_tasks?.length === 24, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...taskFields].sort().join() &&
      taskFields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  const expectedQuotas = {"c/ponylang/ponyc": 7, "go/cli/cli": 7,
    "javascript/iamkun/dayjs": 2, "javascript/prettier/prettier": 2,
    "javascript/serverless/serverless": 1, "javascript/sveltejs/svelte": 2,
    "rust/nushell/nushell": 2, "rust/rayon-rs/rayon": 1};
  const observed = Object.fromEntries(Object.keys(expectedQuotas).map(key => [key, 0]));
  for (const task of tasks) {
    const key = `${task.language}/${task.repo}`;
    need(Object.hasOwn(observed, key), `unexpected-stratum:${key}`);
    observed[key]++;
  }
  need(JSON.stringify(observed) === JSON.stringify(expectedQuotas) &&
    JSON.stringify(candidate.quota_by_language_repo) === JSON.stringify(expectedQuotas), "quotas");
  need(caches?.status === "passed" && caches.candidate_sha256 === candidateSha &&
    caches.repositories?.length === 8 && caches.model_calls === 0 && caches.gold_loaded === false, "caches");
  need(preflight?.status === "passed" && preflight.candidate_sha256 === candidateSha &&
    preflight.caches_sha256 === cachesSha && preflight.cache_check?.passed === 24 &&
    preflight.checkout_probes?.length === 24 && preflight.checkout_probes.every(row => row.status === "passed") &&
    preflight.source_index?.status === "passed" && preflight.source_index.results?.length === 24 &&
    preflight.source_index.results.every((row, i) => row.status === "passed" &&
      row.instance_id === tasks[i].instance_id && row.repo === tasks[i].repo &&
      row.base_commit === tasks[i].base_commit && row.model_calls === 0 &&
      row.local_settled === true && row.process_group_absent === true && row.forced === false) &&
    preflight.model_calls === 0 && preflight.gold_loaded === false, "preflight");
  need(prior?.schema_version === "are.g01-campaign-definition/v1" && prior.status === "pre-dispatch" &&
    prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true &&
    prior.span_refinement_policy === "source-only-go-selected-subspan-r1" &&
    prior.ordered_tasks?.length === 24, "prior-definition");
  const orderedTasks = tasks.map((task, i) => ({
    slug: `${task.language}-${task.repo.split("/").at(-1).replace(/[^a-z0-9]+/g, "-")}-${task.instance_id.slice(-8)}`,
    instance_id: task.instance_id, repo: task.repo,
    task_path: join(inputRoot, "tasks", `${task.instance_id}.json`),
    repository_cache: preflight.source_index.results[i].repository_path
  }));
  need(new Set(orderedTasks.map(task => task.slug)).size === 24 &&
    orderedTasks.every(task => /^[a-z0-9-]+$/.test(task.slug) && existsSync(task.repository_cache)), "task-cache-bindings");
  return {...prior, root: campaignRoot, source_root: sourceRoot,
    hypothesis: "On a fresh, positional-gold-screened 24-task cohort, the unchanged ARE 8K candidate improves paired native Span-F1 and File-F1 while reducing known tokens and summed arm time against its unchanged control.",
    ordered_tasks: orderedTasks,
    selection_rule: "Before model dispatch, exclude every manifested G01/HEN/G02 ID; apply evaluator-only positional-gold eligibility; select the 24 source-only task IDs with the fixed seed and eight repository quotas bound by the candidate receipt. No selector or running arm sees gold paths, content, or scores.",
    decision_rule: "Zero automatic model retries and zero replacement. Report all 24 attempts. A G01 r7 quality-and-efficiency superiority headline requires 24/24 native-scored pairs, intact sealed predictions and independent receipt/metric audit, no unresolved label or score-integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control Span-F1 and File-F1, and wholly below one for both ARE/control known-token and summed-arm-time ratios. Otherwise report only qualified descriptive or metric-specific results.",
    preflight_refs: {source_supply_sha256: candidate.source_supply_sha256,
      gold_file_presence_sha256: candidate.file_presence_sha256,
      positional_gold_lineage_sha256_by_repo: candidate.lineage_receipt_sha256,
      source_only_candidate_sha256: candidateSha, source_caches_sha256: cachesSha,
      runner_index_preflight_sha256: preflightSha},
    source_only_candidate_sha256: candidateSha, source_caches_sha256: cachesSha,
    source_runner_index_preflight_sha256: preflightSha, prior_definition_sha256: priorSha,
    claim_ceiling: "G01 r7 paired GLM-5.3-flash 8K comparison against the native intent-anchor control on the frozen 24-task, eight-repository positional-gold-screened PonyC/cli/Svelte/Day.js/Prettier/Serverless/Nushell/Rayon cohort only; not full ContextBench, language-balanced performance, or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R7-PROTOCOL-CANDIDATE.md",
    open_questions: ["Will all 24 pairs score with intact source, prediction, and score seals?",
      "Will any positional-gold or native-score integrity issue remain?",
      "Do the four frozen paired quality/cost intervals pass, given the disclosed 7/7/7/3 language mix and 19 partial source indexes?"]};
}

if (process.argv[1] === import.meta.filename) {
  try {
    need(!existsSync(inputRoot) && !existsSync(campaignRoot), "fresh-roots");
    const candidate = readPinned(candidatePath, candidateSha), caches = readPinned(cachesPath, cachesSha);
    const preflight = readPinned(preflightPath, preflightSha), prior = readPinned(priorPath, priorSha);
    need(sha(readFileSync(prior.base_config_path)) === "de5a2a7f2dcece6b72e8131e688d70577ed62b55ccb69c72f54f480ea1c329ab", "base-config");
    const definition = buildDefinition({candidate, caches, preflight, prior});
    mkdirSync(inputRoot, {mode: 0o700});
    mkdirSync(join(inputRoot, "tasks"), {mode: 0o700});
    for (const task of candidate.ordered_tasks)
      writeFileSync(join(inputRoot, "tasks", `${task.instance_id}.json`), JSON.stringify(task, null, 2) + "\n", {flag: "wx", mode: 0o600});
    const path = join(inputRoot, "DEFINITION.json");
    const bytes = Buffer.from(JSON.stringify({...definition, builder_sha256: sha(readFileSync(import.meta.filename))}, null, 2) + "\n");
    writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "pre-dispatch", definition_path: path, definition_sha256: sha(bytes),
      task_count: definition.ordered_tasks.length, candidate_sha256: candidateSha, preflight_sha256: preflightSha}));
  } catch (error) { console.error(JSON.stringify({status: "definition-error", error: String(error.message)})); process.exitCode = 2; }
}
