// Source-only residence test: one retained checkout for every r15 r2 task.
// Deliberately performs no reclaim, model dispatch, or evaluator access.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const checkoutRoot = "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1";
const receiptRoot = `${base}/g01-r15-r2-single-checkout-residency-r1`;
const candidatePath = `${base}/g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`;
const transferPath = `${base}/g01-r15-r2-cache-transfer-r1/VERIFY.json`;
const censusPath = `${base}/g01-r15-r2-storage-census-r1/STORAGE-CENSUS.json`;
const orchestratorPath = `${base}/g01-r14-r46-source-qualification-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`;
const pins = {
  candidate: "0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496",
  transfer: "1588b6230631a24462315a33f7df06efeaa7ec1ad6ad734c9dfc45e50a0e6e38",
  census: "aa4017e344e90e66f6207a174ebd618ca95e2a046c77387909285f9cc3f1c148"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-r2-residency.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const readPinned = (path, digest, name) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `input-drift:${name}`);
  return JSON.parse(bytes);
};

async function main() {
  need(!existsSync(checkoutRoot) && !existsSync(receiptRoot), "already-exists");
  const candidate = readPinned(candidatePath, pins.candidate, "candidate");
  const transfer = readPinned(transferPath, pins.transfer, "transfer");
  const census = readPinned(censusPath, pins.census, "census");
  need(candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    transfer.status === "passed" && transfer.candidate_sha256 === pins.candidate &&
    transfer.verified_task_bindings?.length === 24 &&
    census.candidate_sha256 === pins.candidate && census.caches_sha256 === pins.transfer &&
    census.rows?.length === 24, "input-shape");
  const byId = new Map(transfer.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24, "duplicate-binding");
  const oneCopyCensusBytes = census.rows.reduce((sum, row) => sum + row.one_copy_regular_block_bytes, 0);
  need(oneCopyCensusBytes === 1_547_821_056, "census-total");
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(orchestratorPath).href);
  const before = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  need(before.shm_free_bytes > oneCopyCensusBytes + 4_294_967_296, "shm-floor");
  mkdirSync(checkoutRoot, {mode: 0o700});
  const rows = [];
  for (const [index, task] of candidate.ordered_tasks.entries()) {
    const binding = byId.get(task.instance_id);
    need(binding && binding.origin === task.repo_url && binding.base_commit === task.base_commit &&
      /^[a-f0-9]{40}$/.test(binding.tree) &&
      ["/tmp/are-g01-r15-source-caches-r1/", "/tmp/are-g01-r15-r2-delta-caches-r1/"].some(prefix =>
        binding.repository_path.startsWith(prefix)),
    `binding:${index}`);
    const destination = join(checkoutRoot, `task-${String(index + 1).padStart(2, "0")}`);
    const result = prepareIsolatedShallowSourceCheckout({cache: binding.repository_path,
      destination, base_commit: task.base_commit});
    need(result.head === task.base_commit && result.tree === binding.tree, `checkout:${index}`);
    rows.push({ordinal: index + 1, instance_id: task.instance_id, destination,
      base_commit: result.head, tree: result.tree, shm_free_after_bytes: free("/dev/shm")});
    need(rows.at(-1).shm_free_after_bytes > 4_294_967_296, `runtime-reserve:${index}`);
  }
  const after = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  const receipt = {
    schema_version: "are.g01-r15-r2-single-checkout-residency/v1",
    status: "passed-retained-source-only",
    candidate_sha256: pins.candidate, transfer_sha256: pins.transfer,
    census_sha256: pins.census, orchestrator_sha256: sha(readFileSync(orchestratorPath)),
    checkout_root: checkoutRoot, task_count: rows.length, rows,
    one_copy_census_regular_block_bytes: oneCopyCensusBytes,
    before, after, shm_consumed_bytes: before.shm_free_bytes - after.shm_free_bytes,
    model_calls: 0, gold_loaded: false, retained: true,
    claim_ceiling: "All 24 pinned one-copy source checkouts fit on /dev/shm with a 4 GiB reserve; no four-view runtime, output peak, score, or superiority claim",
    open_questions: ["Can four isolated views per task stay within runtime headroom?",
      "Can the runner use them without scratch reclaim and preserve source/native-score semantics?"]
  };
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "RESIDENCY-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, tasks: rows.length,
    shm_consumed_bytes: receipt.shm_consumed_bytes, shm_free_after_bytes: after.shm_free_bytes,
    receipt_sha256: sha(bytes)}));
}

main().catch(error => {console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2;});
