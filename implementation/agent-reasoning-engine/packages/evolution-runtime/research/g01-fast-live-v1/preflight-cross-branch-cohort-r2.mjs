// Runner-identity, exact shallow-checkout, then source-index admission for a
// fresh G01 cohort. No model calls or evaluator references are permitted.
import {createHash} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {preflightCandidate} from "./preflight-cross-branch-cohort-r1.mjs";
import {verifyRunnerCaches} from "./verify-runner-cache-r2.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-cross-branch-preflight-r2.${reason}`); };

export async function preflight({candidate, candidateSha, caches, cachesSha, runSourceIndex, prepareCheckout}) {
  need(candidate?.status === "preflight-only-not-frozen" && candidate.source_commit_join_verified === true &&
    candidate.ordered_tasks?.length === 24 && caches?.status === "passed" &&
    caches.candidate_sha256 === candidateSha && caches.model_calls === 0 && caches.gold_loaded === false &&
    Array.isArray(caches.repositories), "inputs");
  const byRepo = new Map(caches.repositories.map(row => [row.repo, row]));
  need(byRepo.size === caches.repositories.length, "duplicate-cache");
  const virtualIndex = {results: candidate.ordered_tasks.map(task => {
    const row = byRepo.get(task.repo);
    need(row && row.origin === task.repo_url && row.commits.includes(task.base_commit), `cache-binding:${task.instance_id}`);
    return {instance_id: task.instance_id, repo: task.repo, base_commit: task.base_commit,
      repository_path: row.repository_path, status: "passed"};
  })};
  const cacheCheck = verifyRunnerCaches({candidate, index: virtualIndex});
  const probes = [];
  if (cacheCheck.status === "passed") {
    for (const [position, task] of candidate.ordered_tasks.entries()) {
      const directory = mkdtempSync("/opt/are-harness-benchmark/g01-runner-probe-r2-");
      try {
        const result = prepareCheckout({cache: virtualIndex.results[position].repository_path,
          destination: join(directory, "source"), base_commit: task.base_commit});
        need(result.head === task.base_commit && /^[a-f0-9]{40}$/.test(result.tree), "checkout-binding");
        probes.push({instance_id: task.instance_id, status: "passed", tree: result.tree});
      } catch (error) { probes.push({instance_id: task.instance_id, status: "failed", error: String(error.message)}); }
      finally { rmSync(directory, {recursive: true, force: false}); }
    }
  }
  const admitted = cacheCheck.status === "passed" && probes.length === 24 && probes.every(row => row.status === "passed");
  const indexed = admitted ? await preflightCandidate({candidate, runSourceIndex,
    paths: task => byRepo.get(task.repo).repository_path, expectedIdDigest: candidate.task_id_set_sha256}) : null;
  return {schema_version: "are.g01-cross-branch-runner-index-preflight/v2",
    status: admitted && indexed.status === "passed" ? "passed" : "failed",
    candidate_sha256: candidateSha, caches_sha256: cachesSha,
    cache_check: cacheCheck, checkout_probes: probes, source_index: indexed,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Source-only cache/checkout/index readiness; not a cohort freeze, model quality, or superiority result.",
    open_questions: ["Will this candidate fit the full four-checkout campaign and archive space?",
      "Will a separately frozen campaign pass all validity, quality, and cost gates?"]};
}

if (process.argv[1] === import.meta.filename) {
  try {
    const [candidatePath, candidateSha, cachesPath, cachesSha, servicePath, orchestratorPath, outputDirectory] = process.argv.slice(2);
    need([candidatePath, cachesPath, servicePath, orchestratorPath].every(path => path?.startsWith("/opt/")) &&
      outputDirectory?.startsWith("/opt/are/evolution-runtime/") &&
      [candidateSha, cachesSha].every(value => /^[a-f0-9]{64}$/.test(value)), "arguments");
    const candidateBytes = readFileSync(candidatePath), cachesBytes = readFileSync(cachesPath);
    need(sha(candidateBytes) === candidateSha && sha(cachesBytes) === cachesSha, "input-drift");
    const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
    const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(orchestratorPath).href);
    const result = await preflight({candidate: JSON.parse(candidateBytes), candidateSha,
      caches: JSON.parse(cachesBytes), cachesSha, runSourceIndex,
      prepareCheckout: prepareIsolatedShallowSourceCheckout});
    mkdirSync(outputDirectory, {recursive: false, mode: 0o700});
    const path = join(outputDirectory, "RUNNER-INDEX-PREFLIGHT.json");
    const bytes = Buffer.from(JSON.stringify({...result, candidate_path: candidatePath, caches_path: cachesPath,
      service_path: servicePath, service_sha256: sha(readFileSync(servicePath)),
      orchestrator_path: orchestratorPath, orchestrator_sha256: sha(readFileSync(orchestratorPath))}, null, 2) + "\n");
    writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: result.status, cache_passed: result.cache_check.passed,
      checkout_passed: result.checkout_probes.filter(row => row.status === "passed").length,
      index_passed: result.source_index?.results.filter(row => row.status === "passed").length ?? 0,
      count: 24, output_path: path, output_sha256: sha(bytes)}));
    if (result.status !== "passed") process.exitCode = 2;
  } catch (error) { console.error(JSON.stringify({status: "preflight-error", error: String(error.message)})); process.exitCode = 2; }
}
