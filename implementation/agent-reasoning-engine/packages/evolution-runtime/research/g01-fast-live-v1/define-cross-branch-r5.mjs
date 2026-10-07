// Materialize the prespecified G01 r5 source-only cohort and definition.
// This does not freeze pair plans, call GLM, open gold, or score predictions.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r5-definition.${reason}`); };
const root = "/opt/are/evolution-runtime";
const candidatePath = "/opt/are-harness-benchmark/g01-source-cache-preflight-20260929-r3/COHORT-CANDIDATE.json";
const candidateSha = "175a522753165672fb08aad794b731bfbce3b0bfbb3232c59581254074278b61";
const indexPath = `${root}/g01-cross-branch-preflight-r1/SOURCE-INDEX-PREFLIGHT.json`;
const indexSha = "38151e99f6a0d56a396606d5c74b2abc5fb1a7cb2ee028becf006572ea72241c";
const priorPath = `${root}/g01-product-replication-input-r7/DEFINITION.json`;
const priorSha = "9fa1749b4a2f6b8196871f7ddd3bb062cfe045f207c8d8ad553871ff4e12d67b";
const sourceRoot = `${root}/g01-source-combined-candidate-r8`;
const inputRoot = `${root}/g01-product-replication-input-r8`;
const campaignRoot = `${root}/g01-product-replication-r5`;
const taskFields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const changedSources = {
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs": "cc2120c74c9a276152521f5c33c96cf7d1c9056f622226d630575c3852e762b3",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs": "4e9723671085518f1f70986e4dd4ad8401c9fa4cfa1077dcff4a31a6b912c74c",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs": "f6384bca4d3c60766bd7e57a28dac77e36c058fe86af086302e21681bbbe26a4"
};

const readPinned = (path, digest) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `digest:${path}`);
  return JSON.parse(bytes);
};

export function buildDefinition({candidate, index, prior}) {
  need(candidate?.status === "preflight-only-not-frozen" && candidate.source_commit_join_verified === true &&
    candidate.task_id_set_sha256 === "ce6775a4a613e7da24c1dba4682b8a65e9b574b209c7957e3271aebdbc1e61bc" &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    candidate.ordered_tasks?.length === 24, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...taskFields].sort().join() &&
      taskFields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-tasks");
  need(index?.status === "passed" && index.model_calls === 0 && index.gold_loaded === false &&
    index.candidate_sha256 === candidateSha && index.candidate_id_set_sha256 === candidate.task_id_set_sha256 &&
    index.results?.length === 24 && index.results.every((row, position) =>
      row.status === "passed" && row.instance_id === tasks[position].instance_id &&
      row.base_commit === tasks[position].base_commit && row.repo === tasks[position].repo &&
      row.model_calls === 0 && row.local_settled === true && row.process_group_absent === true && row.forced === false &&
      typeof row.repository_path === "string" &&
      (row.repository_path.startsWith("/opt/are/") || row.repository_path.startsWith("/opt/are-harness-benchmark/"))), "index-preflight");
  need(prior?.schema_version === "are.g01-campaign-definition/v1" && prior.status === "pre-dispatch" &&
    prior.control_arm === "intent-anchor-convergence-r3" &&
    prior.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" &&
    prior.abstention_policy === "explicit-no-final-context-zero-r1" &&
    prior.transport_reliability === "bounded-view-and-output-cap-r1" &&
    prior.non_tool_terminal_after_convergence === true && prior.ordered_tasks?.length === 24,
    "prior-definition");
  const orderedTasks = tasks.map((task, position) => ({
    slug: `${task.language}-${task.repo.split("/").at(-1).replace(/[^a-z0-9]+/g, "-")}-${task.instance_id.slice(-8)}`,
    instance_id: task.instance_id, repo: task.repo,
    task_path: join(inputRoot, "tasks", `${task.instance_id}.json`),
    repository_cache: index.results[position].repository_path
  }));
  need(new Set(orderedTasks.map(task => task.slug)).size === 24 &&
    orderedTasks.every(task => /^[a-z0-9-]+$/.test(task.slug)), "slugs");
  return {...prior, root: campaignRoot, source_root: sourceRoot,
    hypothesis: "On a prospectively frozen, cross-branch-unmanifested 24-task four-language cohort, the combined source-only span and module-manifest stopping candidate improves paired native 8K Span-F1 and File-F1 while reducing known tokens and summed arm time against the unchanged native control.",
    ordered_tasks: orderedTasks, span_refinement_policy: "source-only-go-selected-subspan-r1",
    source_only_candidate_sha256: candidateSha, source_index_preflight_sha256: indexSha,
    prior_definition_sha256: priorSha,
    claim_ceiling: "G01 r5 paired GLM-5.3-flash 8K comparison on the frozen 24-task PonyC/cli/grpc/Svelte/serverless/tracing/fd cohort only; not full ContextBench or general ARE superiority.",
    protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R5-PROTOCOL-CANDIDATE.md",
    open_questions: ["Will all 24 pairs have valid native scores with intact seals?",
      "Do all four frozen quality/cost interval gates pass without outcome-based task substitution?",
      "Do partial source indexes cause task-specific omissions or reliability failures?"]};
}

if (process.argv[1] === import.meta.filename) {
  try {
    need(!existsSync(inputRoot) && !existsSync(campaignRoot), "fresh-roots");
    const candidate = readPinned(candidatePath, candidateSha);
    const index = readPinned(indexPath, indexSha);
    const prior = readPinned(priorPath, priorSha);
    for (const [relative, digest] of Object.entries(changedSources))
      need(sha(readFileSync(join(sourceRoot, relative))) === digest, `source:${relative}`);
    need(sha(readFileSync(prior.base_config_path)) === "de5a2a7f2dcece6b72e8131e688d70577ed62b55ccb69c72f54f480ea1c329ab", "base-config");
    const definition = buildDefinition({candidate, index, prior});
    need(definition.ordered_tasks.every(task => existsSync(task.repository_cache)), "source-caches");
    mkdirSync(inputRoot, {mode: 0o700});
    mkdirSync(join(inputRoot, "tasks"), {mode: 0o700});
    for (const task of candidate.ordered_tasks) {
      const path = join(inputRoot, "tasks", `${task.instance_id}.json`);
      writeFileSync(path, JSON.stringify(task, null, 2) + "\n", {flag: "wx", mode: 0o600});
    }
    const path = join(inputRoot, "DEFINITION.json");
    const bytes = Buffer.from(JSON.stringify({...definition, builder_sha256: sha(readFileSync(import.meta.filename))}, null, 2) + "\n");
    writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "pre-dispatch", definition_path: path, definition_sha256: sha(bytes),
      task_count: definition.ordered_tasks.length, candidate_sha256: candidateSha, preflight_sha256: indexSha}));
  } catch (error) {
    console.error(JSON.stringify({status: "definition-error", error: String(error.message)}));
    process.exitCode = 2;
  }
}
