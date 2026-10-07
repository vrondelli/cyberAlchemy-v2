// No-model checkout and source-index preflight keyed by task ID and Git origin.
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const pins = Object.freeze({
  candidate: [`${base}/g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json`, "9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194"],
  caches: [`${base}/g01-post-r8-source-caches-r2/SOURCE-CACHES.json`, "5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9"],
  index: [`${base}/g01-r7-cgojs-tools-r1/preflight-cross-branch-cohort-r1.mjs`, "d82be60118cb886ffc76cbc8e353db2fb04ab01c3f1a518aca18bbaed64014b8"],
  cacheCheck: [`${base}/g01-r7-cgojs-tools-r1/verify-runner-cache-r2.mjs`, "08912266beb5fc61c2036c7c3f7c4b150daa7094c305b383490e780fea32ecfd"],
  service: [`${base}/g01-shared-reliability-source-r4-shallow-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs`, "773c659bd6d6aed4377e43443c48cddec0190cc24d3092ad2c054014102f49c1"],
  orchestrator: [`${base}/g01-source-combined-candidate-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`, "51e9714f03cdd42833cde6715deddb4d201b0807738b63a49422bd528b0a31ab"]
});
const outputPath = `${base}/g01-post-r8-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json`;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw Error(`g01-post-r8-preflight.${reason}`); };
const free = path => { const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize); };
const readPinned = ([path, digest]) => { const bytes = readFileSync(path); need(sha(bytes) === digest, `source-drift:${path}`); return bytes; };

async function main() {
  need(free("/tmp") > 1_000_000_000 && free(base) > 1_500_000_000, "disk-headroom");
  const candidate = JSON.parse(readPinned(pins.candidate)), caches = JSON.parse(readPinned(pins.caches));
  for (const name of ["index", "cacheCheck", "service", "orchestrator"]) readPinned(pins[name]);
  need(candidate.schema_version === "are.g01-post-r8-clean-source-only-candidate/v2" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    caches.schema_version === "are.g01-post-r8-source-caches/v2" && caches.status === "passed" &&
    caches.candidate_sha256 === pins.candidate[1] && caches.task_bindings?.length === 24 &&
    caches.model_calls === 0 && caches.gold_loaded === false, "input-shape");
  const byId = new Map(caches.task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24, "duplicate-cache-binding");
  const virtualIndex = {results: candidate.ordered_tasks.map(task => {
    const row = byId.get(task.instance_id);
    need(row && row.repo === task.repo && row.origin === task.repo_url &&
      row.base_commit === task.base_commit && /^[a-f0-9]{40}$/.test(row.tree),
    `cache-binding:${task.instance_id}`);
    return {instance_id: task.instance_id, repo: task.repo, base_commit: task.base_commit,
      repository_path: row.repository_path, status: "passed"};
  })};
  const {verifyRunnerCaches} = await import(pathToFileURL(pins.cacheCheck[0]).href);
  const {preflightCandidate} = await import(pathToFileURL(pins.index[0]).href);
  const {runSourceIndex} = await import(pathToFileURL(pins.service[0]).href);
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(pins.orchestrator[0]).href);
  const cacheCheck = verifyRunnerCaches({candidate, index: virtualIndex});
  const checkouts = [];
  if (cacheCheck.status === "passed") for (const [position, task] of candidate.ordered_tasks.entries()) {
    const directory = mkdtempSync("/opt/are-harness-benchmark/g01-post-r8-runner-probe-");
    try {
      const result = prepareIsolatedShallowSourceCheckout({cache: virtualIndex.results[position].repository_path,
        destination: join(directory, "source"), base_commit: task.base_commit});
      need(result.head === task.base_commit && /^[a-f0-9]{40}$/.test(result.tree), "checkout-tree");
      checkouts.push({instance_id: task.instance_id, status: "passed", tree: result.tree});
    } catch (error) { checkouts.push({instance_id: task.instance_id, status: "failed", error: String(error.message)}); }
    finally { rmSync(directory, {recursive: true, force: false}); }
  }
  const admitted = cacheCheck.status === "passed" && checkouts.length === 24 && checkouts.every(row => row.status === "passed");
  const projected = {...candidate, schema_version: "are.g01-source-only-cohort-candidate/v1",
    eligibility_receipt_sha256: sha(Buffer.from(JSON.stringify(candidate.eligibility_receipt_sha256)))};
  const sourceIndex = admitted ? await preflightCandidate({candidate: projected, runSourceIndex,
    paths: task => byId.get(task.instance_id).repository_path, expectedIdDigest: candidate.task_id_set_sha256}) : null;
  const status = admitted && sourceIndex?.status === "passed" ? "passed" : "failed";
  const receipt = {schema_version: "are.g01-post-r8-runner-index-preflight/v1", status,
    candidate_sha256: pins.candidate[1], caches_sha256: pins.caches[1],
    source_bindings: Object.fromEntries(Object.entries(pins).map(([name, [path, digest]]) => [name, {path, sha256: digest}])),
    cache_check: cacheCheck, checkout_probes: checkouts, source_index: sourceIndex,
    model_calls: 0, gold_loaded: false, script_sha256: sha(readFileSync(import.meta.filename)),
    claim_ceiling: "Source-only cache/checkout/index preflight; no frozen campaign, model quality or superiority proof",
    open_questions: ["Are all native-gold files admitted by these bounded indexes?", "Will a separately frozen matched campaign pass all quality, cost and reliability gates?"]};
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status, cache_passed: cacheCheck.passed,
    checkout_passed: checkouts.filter(row => row.status === "passed").length,
    index_passed: sourceIndex?.results.filter(row => row.status === "passed").length ?? 0,
    output_sha256: sha(bytes)}));
  if (status !== "passed") process.exitCode = 2;
}

main().catch(error => { console.error(JSON.stringify({status: "preflight-error", error: String(error.message)})); process.exitCode = 2; });
