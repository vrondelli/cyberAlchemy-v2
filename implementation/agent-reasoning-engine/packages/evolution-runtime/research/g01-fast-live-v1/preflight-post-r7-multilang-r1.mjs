// No-model runner cache, isolated checkout, and source-index preflight for the
// score-blind five-language G01 candidate. Volatile cache paths are explicit.
import {createHash} from "node:crypto";
import {statfsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-post-r7-preflight.${reason}`); };
const candidatePath = "/opt/are/evolution-runtime/g01-post-r7-multilang-cohort-candidate-r1/COHORT-CANDIDATE.json";
const candidateSha = "1e43240ce5246d55e04b2eae117fa14ef40d04598f6da27c967af090f6d7cb39";
const cachesPath = "/opt/are/evolution-runtime/g01-post-r7-source-caches-r1/SOURCE-CACHES.json";
const cachesSha = "998d53a850e7e38f858797847070b77094e4f2b569b20a87bfb7f4808d42b2e4";
const genericPath = "/opt/are/evolution-runtime/g01-r7-cgojs-tools-r1/preflight-cross-branch-cohort-r2.mjs";
const genericSha = "9dd77afc2a774b80f81fc524f6a88c4765375b51d953e49ca83fcc8c3b39fa70";
const servicePath = "/opt/are/evolution-runtime/g01-shared-reliability-source-r4-shallow-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs";
const serviceSha = "773c659bd6d6aed4377e43443c48cddec0190cc24d3092ad2c054014102f49c1";
const orchestratorPath = "/opt/are/evolution-runtime/g01-source-combined-candidate-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs";
const orchestratorSha = "51e9714f03cdd42833cde6715deddb4d201b0807738b63a49422bd528b0a31ab";
const outputRoot = "/opt/are/evolution-runtime/g01-post-r7-runner-index-preflight-r1";

function freeBytes(path) {
  const stat = statfsSync(path);
  return Number(stat.bavail) * Number(stat.bsize);
}

async function main() {
  need(freeBytes("/tmp") > 1_000_000_000 &&
    freeBytes("/opt/are/evolution-runtime") > 1_500_000_000, "disk-headroom");
  const candidateBytes = readFileSync(candidatePath), cachesBytes = readFileSync(cachesPath);
  need(sha(candidateBytes) === candidateSha && sha(cachesBytes) === cachesSha, "input-drift");
  need(sha(readFileSync(genericPath)) === genericSha &&
    sha(readFileSync(servicePath)) === serviceSha &&
    sha(readFileSync(orchestratorPath)) === orchestratorSha, "source-drift");
  const candidate = JSON.parse(candidateBytes), caches = JSON.parse(cachesBytes);
  need(candidate.schema_version === "are.g01-post-r7-multilang-source-only-candidate/v1" &&
    candidate.status === "preflight-only-not-frozen" &&
    candidate.gold_values_or_paths_used === false && candidate.model_calls === 0 &&
    candidate.ordered_tasks?.length === 24 &&
    caches.schema_version === "are.g01-post-r7-source-caches/v1" &&
    caches.status === "passed" && caches.repositories?.length === 15 &&
    caches.volatile_root === "/tmp/are-g01-post-r7-source-caches-r1", "input-shape");
  const eligibilityMap = candidate.eligibility_receipt_sha256;
  const projected = {...candidate,
    schema_version: "are.g01-source-only-cohort-candidate/v1",
    eligibility_receipt_sha256: sha(Buffer.from(JSON.stringify(eligibilityMap)))};
  const {preflight} = await import(pathToFileURL(genericPath).href);
  const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(orchestratorPath).href);
  const result = await preflight({candidate: projected, candidateSha, caches, cachesSha,
    runSourceIndex, prepareCheckout: prepareIsolatedShallowSourceCheckout});
  const payload = {...result, candidate_path: candidatePath, caches_path: cachesPath,
    generic_path: genericPath, generic_sha256: genericSha,
    service_path: servicePath, service_sha256: serviceSha,
    orchestrator_path: orchestratorPath, orchestrator_sha256: orchestratorSha,
    original_candidate_schema: candidate.schema_version,
    compatibility_projection: "candidate schema tag and aggregate eligibility-map digest only",
    eligibility_receipt_sha256: eligibilityMap,
    volatile_cache_warning: "New source caches are under /tmp and must be rehydrated and reverified after reboot.",
    script_sha256: sha(readFileSync(import.meta.filename))};
  const bytes = Buffer.from(JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(join(outputRoot, "RUNNER-INDEX-PREFLIGHT.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: result.status, cache_passed: result.cache_check.passed,
    checkout_passed: result.checkout_probes.filter(row => row.status === "passed").length,
    index_passed: result.source_index?.results.filter(row => row.status === "passed").length ?? 0,
    count: 24, output_sha256: sha(bytes)}));
  if (result.status !== "passed") process.exitCode = 2;
}

main().catch(error => { console.error(JSON.stringify({status: "preflight-error", error: String(error.message)})); process.exitCode = 2; });
