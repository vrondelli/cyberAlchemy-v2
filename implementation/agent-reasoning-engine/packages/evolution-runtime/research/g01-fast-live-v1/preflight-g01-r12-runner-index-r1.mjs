// Exact-cache, isolated-checkout, and bounded-index admission for G01 r12.
// No model or evaluator access; this does not freeze a campaign.
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const pins = Object.freeze({
  candidate: [`${base}/g01-r12-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`, "3b6ac88cc20c565817a023e58735b7d83624a31e80897b7b1acea54a3cdfa23f"],
  transfer: [`${base}/g01-r12-cache-transfer-r1/VERIFY.json`, "a7aa8be8c6ba9e31c01c41d0c9126e165e1faf038248a48190354aa258b46443"],
  index: [`${base}/g01-r7-cgojs-tools-r1/preflight-cross-branch-cohort-r1.mjs`, "d82be60118cb886ffc76cbc8e353db2fb04ab01c3f1a518aca18bbaed64014b8"],
  cacheCheck: [`${base}/g01-r7-cgojs-tools-r1/verify-runner-cache-r2.mjs`, "08912266beb5fc61c2036c7c3f7c4b150daa7094c305b383490e780fea32ecfd"],
  service: [`${base}/g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs`, "659593ce0d76b45058fc4b539a2921d1f2877db0db85aaf5703675017aca2b28"],
  hints: [`${base}/g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_hints_r3.py`, "7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a"],
  worker: [`${base}/g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py`, "c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b"],
  supervisor: [`${base}/g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_supervisor_r1.py`, "fe9ebe1104a040aec808190417bdf720d1b458c56033e928173f87ba3847d6fb"],
  nodeWorker: [`${base}/g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-worker-r1.mjs`, "fddccd2dc265d3f5cdb6d6e2617c7939e15c37f1da60d303c6bba9dc8b76964c"],
  process: [`${base}/g01-source-index-capacity-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/recovery-generation-process.mjs`, "8955e02fbcf81737d646a29046bcf5c68857089161a97b6e95f0e09a7d54dabe"],
  orchestrator: [`${base}/g01-source-combined-candidate-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`, "51e9714f03cdd42833cde6715deddb4d201b0807738b63a49422bd528b0a31ab"]
});
const outputPath = `${base}/g01-r12-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json`;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r12-preflight.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const readPinned = ([path, digest]) => {const bytes = readFileSync(path); need(sha(bytes) === digest, `source-drift:${path}`); return bytes;};

async function main() {
  need(free("/tmp") > 2_500_000_000 && free(base) > 300_000_000, "disk-headroom");
  const candidate = JSON.parse(readPinned(pins.candidate));
  const transfer = JSON.parse(readPinned(pins.transfer));
  for (const name of ["index", "cacheCheck", "service", "hints", "worker", "supervisor", "nodeWorker", "process", "orchestrator"]) readPinned(pins[name]);
  need(candidate.schema_version === "are.g01-r12-clean-source-only-candidate/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    candidate.task_id_set_sha256 === "58544fee18b29e9b3f41b857344c9f2c0163e951f43719ac8423779bc3d0036f" &&
    transfer.schema_version === "are.g01-r12-vps-cache-transfer-verify/v1" && transfer.status === "passed" &&
    transfer.candidate_sha256 === pins.candidate[1] && transfer.verified_task_bindings?.length === 24 &&
    transfer.model_calls === 0 && transfer.gold_loaded === false, "input-shape");
  const byId = new Map(transfer.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24, "duplicate-cache-binding");
  const virtualIndex = {results: candidate.ordered_tasks.map(task => {
    const row = byId.get(task.instance_id);
    need(row && row.origin === task.repo_url && row.base_commit === task.base_commit &&
      /^[a-f0-9]{40}$/.test(row.tree), `cache-binding:${task.instance_id}`);
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
    const directory = mkdtempSync("/tmp/are-g01-r12-runner-probe-");
    try {
      const result = prepareIsolatedShallowSourceCheckout({cache: virtualIndex.results[position].repository_path,
        destination: join(directory, "source"), base_commit: task.base_commit});
      need(result.head === task.base_commit && /^[a-f0-9]{40}$/.test(result.tree), "checkout-tree");
      checkouts.push({instance_id: task.instance_id, status: "passed", tree: result.tree});
    } catch (error) {checkouts.push({instance_id: task.instance_id, status: "failed", error: String(error.message)});}
    finally {rmSync(directory, {recursive: true, force: false});}
  }
  const admitted = cacheCheck.status === "passed" && checkouts.length === 24 && checkouts.every(row => row.status === "passed");
  const projected = {...candidate, schema_version: "are.g01-source-only-cohort-candidate/v1",
    source_commit_join_verified: true,
    eligibility_receipt_sha256: sha(Buffer.from(JSON.stringify(candidate.eligibility_receipt_sha256)))};
  const sourceIndex = admitted ? await preflightCandidate({candidate: projected, runSourceIndex,
    paths: task => byId.get(task.instance_id).repository_path,
    expectedIdDigest: candidate.task_id_set_sha256}) : null;
  const status = admitted && sourceIndex?.status === "passed" ? "passed" : "failed";
  const receipt = {schema_version: "are.g01-r12-runner-index-preflight/v1", status,
    candidate_sha256: pins.candidate[1], transfer_sha256: pins.transfer[1],
    source_bindings: Object.fromEntries(Object.entries(pins).map(([name, [path, digest]]) => [name, {path, sha256: digest}])),
    cache_check: cacheCheck, checkout_probes: checkouts, source_index: sourceIndex,
    model_calls: 0, gold_loaded: false, script_sha256: sha(readFileSync(import.meta.filename)),
    claim_ceiling: "Source-only cache, checkout and index preflight; no frozen campaign, native-gold admission, model quality or superiority proof",
    open_questions: ["Are all native reference files admitted by these bounded indexes?", "Can a separately frozen matched campaign pass all quality, cost and reliability gates?"]};
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status, cache_passed: cacheCheck.passed,
    checkout_passed: checkouts.filter(row => row.status === "passed").length,
    index_passed: sourceIndex?.results.filter(row => row.status === "passed").length ?? 0,
    output_sha256: sha(bytes)}));
  if (status !== "passed") process.exitCode = 2;
}

main().catch(error => {console.error(JSON.stringify({status: "preflight-error", error: String(error.message)})); process.exitCode = 2;});
