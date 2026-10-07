// No-model runner cache, isolated-checkout, and source-index preflight for G01 r7.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {preflight} from "./preflight-cross-branch-cohort-r2.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-r7-preflight.${reason}`); };
const candidatePath = "/opt/are-harness-benchmark/g01-r7-cohort-candidate-r1/COHORT-CANDIDATE.json";
const candidateSha = "3a347d0e32c5b9705ac48408b703eb09eb1be23db6100f8f816bcf6d11b90a35";
const cachesPath = "/opt/are-harness-benchmark/g01-r7-runner-caches-r1/SOURCE-CACHES.json";
const cachesSha = "95f70dc2d9ee5015e34d1d437900a5457581e7ae622920f82e5eb659a83a7b82";
const servicePath = "/opt/are/evolution-runtime/g01-shared-reliability-source-r4-shallow-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs";
const serviceSha = "773c659bd6d6aed4377e43443c48cddec0190cc24d3092ad2c054014102f49c1";
const orchestratorPath = "/opt/are/evolution-runtime/g01-source-combined-candidate-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs";
const orchestratorSha = "51e9714f03cdd42833cde6715deddb4d201b0807738b63a49422bd528b0a31ab";
const outputRoot = "/opt/are/evolution-runtime/g01-r7-runner-index-preflight-r1";

async function main() {
  const candidateBytes = readFileSync(candidatePath), cachesBytes = readFileSync(cachesPath);
  need(sha(candidateBytes) === candidateSha && sha(cachesBytes) === cachesSha, "input-drift");
  need(sha(readFileSync(servicePath)) === serviceSha &&
    sha(readFileSync(orchestratorPath)) === orchestratorSha, "source-drift");
  const candidate = JSON.parse(candidateBytes), caches = JSON.parse(cachesBytes);
  need(candidate.schema_version === "are.g01-r7-source-only-cohort-candidate/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.gold_values_or_paths_used === false &&
    candidate.ordered_tasks?.length === 24 && candidate.model_calls === 0, "candidate");
  // The tested r2 preflight accepts the same eight source fields under its v1 candidate tag.
  // This in-memory compatibility projection changes no task, commit, cache, or result field.
  const projected = {...candidate, schema_version: "are.g01-source-only-cohort-candidate/v1",
    eligibility_receipt_sha256: candidate.file_presence_sha256};
  const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(orchestratorPath).href);
  const result = await preflight({candidate: projected, candidateSha, caches, cachesSha,
    runSourceIndex, prepareCheckout: prepareIsolatedShallowSourceCheckout});
  mkdirSync(outputRoot, {recursive: false, mode: 0o700});
  const outputPath = join(outputRoot, "RUNNER-INDEX-PREFLIGHT.json");
  const payload = {...result, candidate_path: candidatePath, caches_path: cachesPath,
    service_path: servicePath, service_sha256: serviceSha, orchestrator_path: orchestratorPath,
    orchestrator_sha256: orchestratorSha, original_candidate_schema: candidate.schema_version,
    compatibility_projection: "candidate schema tag plus file-presence receipt alias only",
    lineage_receipt_sha256: candidate.lineage_receipt_sha256,
    script_sha256: sha(readFileSync(import.meta.filename))};
  const bytes = Buffer.from(JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: result.status, cache_passed: result.cache_check.passed,
    checkout_passed: result.checkout_probes.filter(row => row.status === "passed").length,
    index_passed: result.source_index?.results.filter(row => row.status === "passed").length ?? 0,
    count: 24, output_sha256: sha(bytes)}));
  if (result.status !== "passed") process.exitCode = 2;
}

main().catch(error => { console.error(JSON.stringify({status: "preflight-error", error: String(error.message)})); process.exitCode = 2; });
