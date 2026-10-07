// Source-only G01 24-task index preflight. No model or evaluator access.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-cross-branch-preflight.${reason}`); };
const fields = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
const root = "/opt/are-harness-benchmark";
const prior = "/opt/are/evolution-runtime";
const cached = {
  "cli/cli": `${prior}/g01-terminal-shortlist-fresh-r1/repositories/contextbench-full`,
  "sveltejs/svelte": `${prior}/g01-shortlist-cap12-svelte-r1/repositories/contextbench-full`,
  "sharkdp/fd": `${prior}/g01-product-replication-fd-cache-r4/repositories/contextbench-full`
};

export function sourcePath(task) {
  if (cached[task.repo]) return cached[task.repo];
  if (task.repo === "tokio-rs/tracing" && task.instance_id.endsWith("2e0110cd"))
    return `${root}/g01-source-cache-preflight-20260929/tracing`;
  if (task.repo === "grpc/grpc" && task.instance_id.endsWith("b64d0325"))
    return `${root}/g01-source-cache-preflight-20260929-r2/grpc`;
  if (task.repo === "serverless/serverless" && task.instance_id.endsWith("bdc85da2"))
    return `${root}/g01-source-cache-preflight-20260929-r2/serverless`;
  const names = {"ponylang/ponyc": "ponyc", "grpc/grpc": "grpc",
    "serverless/serverless": "serverless", "tokio-rs/tracing": "tracing"};
  need(names[task.repo] && /^[a-f0-9]{8}$/.test(task.instance_id.slice(-8)), "repository-path");
  return `${root}/g01-source-cache-preflight-20260929-r3/${names[task.repo]}-${task.instance_id.slice(-8)}`;
}

export async function preflightCandidate({candidate, runSourceIndex, paths = sourcePath, concurrency = 2,
  expectedIdDigest = "ce6775a4a613e7da24c1dba4682b8a65e9b574b209c7957e3271aebdbc1e61bc"}) {
  need(candidate?.schema_version === "are.g01-source-only-cohort-candidate/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.source_commit_join_verified === true &&
    candidate.task_id_set_sha256 === expectedIdDigest &&
    candidate.source_parquet_sha256 === "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8" &&
    Array.isArray(candidate.ordered_tasks) && candidate.ordered_tasks.length === 24 && concurrency === 2, "candidate");
  const tasks = candidate.ordered_tasks;
  need(new Set(tasks.map(task => task.instance_id)).size === 24 &&
    sha([...tasks.map(task => task.instance_id)].sort().join("\n") + "\n") === candidate.task_id_set_sha256 &&
    tasks.every(task => Object.keys(task).sort().join() === [...fields].sort().join() &&
      fields.every(key => typeof task[key] === "string" && task[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(task.base_commit)), "source-only-rows");
  const results = Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++, task = tasks[index], started = Date.now();
      const query = Buffer.from(task.problem_statement).subarray(0, 1024).toString("utf8").replace(/\uFFFD$/, "").trim();
      try {
        const result = await runSourceIndex({repository: paths(task), base_commit: task.base_commit,
          query, signal: new AbortController().signal});
        need(result.value.model_calls === 0 && result.settlement.local_settled === true &&
          result.settlement.process_group_absent === true && result.settlement.forced === false, "settlement");
        results[index] = {instance_id: task.instance_id, repo: task.repo, base_commit: task.base_commit,
          repository_path: paths(task), status: "passed", index_digest: result.value.index_digest,
          admitted_files: result.value.manifest.admitted_files,
          excluded_files: result.value.manifest.entries.length - result.value.manifest.admitted_files,
          partial_index: result.value.manifest.partial, model_calls: 0,
          local_settled: true, process_group_absent: true, forced: false, elapsed_ms: Date.now() - started};
      } catch (error) {
        results[index] = {instance_id: task.instance_id, repo: task.repo, base_commit: task.base_commit,
          repository_path: paths(task), status: "failed", error: String(error.message),
          detail: error.result?.error ?? null, elapsed_ms: Date.now() - started};
      }
    }
  }
  await Promise.all(Array.from({length: concurrency}, worker));
  return {schema_version: "are.g01-cross-branch-source-index-preflight/v1",
    status: results.every(row => row.status === "passed") ? "passed" : "failed",
    candidate_id_set_sha256: candidate.task_id_set_sha256,
    candidate_source_parquet_sha256: candidate.source_parquet_sha256,
    candidate_eligibility_receipt_sha256: candidate.eligibility_receipt_sha256,
    concurrency, model_calls: 0, gold_loaded: false, results,
    claim_ceiling: "Task-specific source-only index preflight; not cohort freeze, model quality, or superiority evidence.",
    open_questions: ["Can this candidate be run within the disk and token budget?",
      "Is the prospective quality/cost candidate stable enough to dispatch on untouched tasks?"]};
}

if (process.argv[1] === import.meta.filename) {
  const [candidatePath, outputDirectory, servicePath] = process.argv.slice(2);
  need(candidatePath?.startsWith("/opt/are-harness-benchmark/") &&
    outputDirectory?.startsWith("/opt/are/evolution-runtime/") &&
    servicePath?.startsWith("/opt/are/evolution-runtime/"), "paths");
  const candidateBytes = readFileSync(candidatePath);
  const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
  const result = await preflightCandidate({candidate: JSON.parse(candidateBytes), runSourceIndex});
  const output = {...result, candidate_path: candidatePath, candidate_sha256: sha(candidateBytes),
    service_path: servicePath, service_sha256: sha(readFileSync(servicePath))};
  mkdirSync(outputDirectory, {recursive: false, mode: 0o700});
  const outputPath = join(outputDirectory, "SOURCE-INDEX-PREFLIGHT.json");
  const bytes = Buffer.from(JSON.stringify(output, null, 2) + "\n");
  writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: output.status, passed: output.results.filter(row => row.status === "passed").length,
    count: output.results.length, output_path: outputPath, output_sha256: sha(bytes)}));
  if (output.status !== "passed") process.exitCode = 2;
}
