// Materialize a fresh source-only G01 r6 definition after runner/cache/index
// preflight. This does not freeze pair plans, call GLM, read gold, or score.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r6-definition.${reason}`); };
const base = "/opt/are/evolution-runtime";
const candidatePath = "/opt/are-harness-benchmark/g01-cross-branch-cohort-candidate-r2/COHORT-CANDIDATE.json";
const candidateSha = "d6d6a92b2c4191b09834053bbad60a42628291c3c0fd28ba00117138cc1a621f";
const cachesPath = "/opt/are-harness-benchmark/g01-source-cache-preflight-20260929-r6/SOURCE-CACHES.json";
const cachesSha = "18364ae4ce1194a0e34fb12e2112facecd5e2687d6e5a4d9764df73ccfc5c555";
const preflightPath = `${base}/g01-cross-branch-preflight-r2/RUNNER-INDEX-PREFLIGHT.json`;
const preflightSha = "3359323cbc9cf6d93cd1c432c34c4e289d92bc8f23ce62b89b29ba219f20c936";
const priorPath = `${base}/g01-product-replication-input-r7/DEFINITION.json`;
const priorSha = "9fa1749b4a2f6b8196871f7ddd3bb062cfe045f207c8d8ad553871ff4e12d67b";
const sourceRoot = `${base}/g01-source-combined-candidate-r8`;
const inputRoot = `${base}/g01-product-replication-input-r9`;
const campaignRoot = `${base}/g01-product-replication-r6`;
const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const changedSources = {
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs": "cc2120c74c9a276152521f5c33c96cf7d1c9056f622226d630575c3852e762b3",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs": "4e9723671085518f1f70986e4dd4ad8401c9fa4cfa1077dcff4a31a6b912c74c",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs": "f6384bca4d3c60766bd7e57a28dac77e36c058fe86af086302e21681bbbe26a4"
};
const readPinned = (path, digest) => {
  const bytes = readFileSync(path); need(sha(bytes) === digest, `digest:${path}`); return JSON.parse(bytes);
};

export function buildDefinition({candidate, caches, preflight, prior}) {
  need(candidate?.status === "preflight-only-not-frozen" && candidate.source_commit_join_verified === true &&
    candidate.task_id_set_sha256 === "d9d835131de78535b778307f56bc193a1402ea1ee47c8498e521d9596663f4be" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.ordered_tasks?.length === 24, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...taskFields].sort().join() &&
      taskFields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  need(caches?.status === "passed" && caches.candidate_sha256 === candidateSha &&
    caches.repositories?.length === 9 && caches.model_calls === 0 && caches.gold_loaded === false, "caches");
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
    prior.non_tool_terminal_after_convergence === true && prior.ordered_tasks?.length === 24,
    "prior-definition");
  const orderedTasks = tasks.map((task, i) => ({
    slug: `${task.language}-${task.repo.split("/").at(-1).replace(/[^a-z0-9]+/g, "-")}-${task.instance_id.slice(-8)}`,
    instance_id: task.instance_id, repo: task.repo,
    task_path: join(inputRoot, "tasks", `${task.instance_id}.json`),
    repository_cache: preflight.source_index.results[i].repository_path
  }));
  need(new Set(orderedTasks.map(task => task.slug)).size === 24 &&
    orderedTasks.every(task => /^[a-z0-9-]+$/.test(task.slug) && existsSync(task.repository_cache)), "task-cache-bindings");
  return {...prior, root: campaignRoot, source_root: sourceRoot,
    hypothesis: "On a fresh, cross-branch-unmanifested 24-task four-language cohort, the combined source-only span and module-manifest stopping candidate improves paired native 8K Span-F1 and File-F1 while reducing known tokens and summed arm time against the unchanged native control.",
    ordered_tasks: orderedTasks, span_refinement_policy: "source-only-go-selected-subspan-r1",
    source_only_candidate_sha256: candidateSha, source_caches_sha256: cachesSha,
    source_runner_index_preflight_sha256: preflightSha, prior_definition_sha256: priorSha,
    claim_ceiling: "G01 r6 paired GLM-5.3-flash 8K comparison on the frozen 24-task, nine-repository PonyC/cli/grpc/zeromicro/Svelte/serverless/bytes/ripgrep/bat cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R6-PROTOCOL-CANDIDATE.md",
    open_questions: ["Will all 24 pairs have valid native scores with intact seals?",
      "Do all four frozen quality/cost interval gates pass without outcome-based task substitution?",
      "Do partial source indexes cause task-specific omissions or reliability failures?"]};
}

if (process.argv[1] === import.meta.filename) {
  try {
    need(!existsSync(inputRoot) && !existsSync(campaignRoot), "fresh-roots");
    const candidate = readPinned(candidatePath, candidateSha), caches = readPinned(cachesPath, cachesSha);
    const preflight = readPinned(preflightPath, preflightSha), prior = readPinned(priorPath, priorSha);
    for (const [relative, digest] of Object.entries(changedSources))
      need(sha(readFileSync(join(sourceRoot, relative))) === digest, `source:${relative}`);
    need(sha(readFileSync(prior.base_config_path)) === "de5a2a7f2dcece6b72e8131e688d70577ed62b55ccb69c72f54f480ea1c329ab", "base-config");
    const definition = buildDefinition({candidate, caches, preflight, prior});
    mkdirSync(inputRoot, {mode: 0o700}); mkdirSync(join(inputRoot, "tasks"), {mode: 0o700});
    for (const task of candidate.ordered_tasks)
      writeFileSync(join(inputRoot, "tasks", `${task.instance_id}.json`), JSON.stringify(task, null, 2) + "\n", {flag: "wx", mode: 0o600});
    const path = join(inputRoot, "DEFINITION.json");
    const bytes = Buffer.from(JSON.stringify({...definition, builder_sha256: sha(readFileSync(import.meta.filename))}, null, 2) + "\n");
    writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "pre-dispatch", definition_path: path, definition_sha256: sha(bytes),
      task_count: definition.ordered_tasks.length, candidate_sha256: candidateSha, preflight_sha256: preflightSha}));
  } catch (error) { console.error(JSON.stringify({status: "definition-error", error: String(error.message)})); process.exitCode = 2; }
}
