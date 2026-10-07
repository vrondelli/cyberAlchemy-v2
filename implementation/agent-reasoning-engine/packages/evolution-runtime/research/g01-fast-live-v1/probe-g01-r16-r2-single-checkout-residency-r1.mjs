// Source-only residence: one retained exact checkout for each G01 r16 r2 task.
// No source reclaim, evaluator access, provider dispatch or scoring.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const checkoutRoot = "/dev/shm/are-g01-r16-r2-single-checkout-residency-r1";
const receiptRoot = `${base}/g01-r16-r2-single-checkout-residency-r1`;
const candidatePath = `${base}/g01-r16-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`;
const transferPath = `${base}/g01-r16-r2-cache-transfer-r1/VERIFY.json`;
const censusPath = `${base}/g01-r16-r2-storage-census-r1/STORAGE-CENSUS.json`;
const orchestratorPath = `${base}/g01-r14-r46-source-qualification-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`;
const pins = {
  candidate: "b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112",
  transfer: "cb20eb1799b71ae48296085647037d56829743f7d4c2002aebb8bdc008138a41",
  census: "88b9d5d8099b48b41039ceec00e3ac939406f234596a2d8cdb1aa7cccba2435e"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r16-r2-residency.${reason}`);};
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
    census.status === "source-only-lower-bound" && census.candidate_sha256 === pins.candidate &&
    census.caches_sha256 === pins.transfer && census.rows?.length === 24 &&
    census.provisional_one_copy_floor_pass === true, "input-shape");
  const byId = new Map(transfer.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24, "duplicate-binding");
  const lowerBound = census.rows.reduce((sum, row) => sum + row.one_copy_regular_block_bytes, 0);
  need(lowerBound === 1_505_611_776, "census-total");
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(orchestratorPath).href);
  const before = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  need(before.shm_free_bytes >= census.provisional_one_copy_floor_bytes, "shm-floor");
  mkdirSync(checkoutRoot, {mode: 0o700});
  const rows = [];
  for (const [index, task] of candidate.ordered_tasks.entries()) {
    const binding = byId.get(task.instance_id);
    need(binding && binding.origin === task.repo_url && binding.base_commit === task.base_commit &&
      /^[a-f0-9]{40}$/.test(binding.tree) &&
      ["/dev/shm/are-g01-r16-source-caches-r1/", "/dev/shm/are-g01-r16-r2-delta-caches-r1/"].some(prefix =>
        binding.repository_path.startsWith(prefix)), `binding:${index}`);
    const destination = join(checkoutRoot, `task-${String(index + 1).padStart(2, "0")}`);
    const result = prepareIsolatedShallowSourceCheckout({cache: binding.repository_path,
      destination, base_commit: task.base_commit});
    need(result.head === task.base_commit && result.tree === binding.tree, `checkout:${index}`);
    rows.push({ordinal: index + 1, instance_id: task.instance_id, destination,
      base_commit: result.head, tree: result.tree, shm_free_after_bytes: free("/dev/shm")});
    need(rows.at(-1).shm_free_after_bytes > 3 * 1024 ** 3, `runtime-reserve:${index}`);
  }
  const after = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  const receipt = {
    schema_version: "are.g01-r16-r2-single-checkout-residency/v1",
    status: "passed-retained-source-only",
    candidate_sha256: pins.candidate, transfer_sha256: pins.transfer,
    census_sha256: pins.census, orchestrator_sha256: sha(readFileSync(orchestratorPath)),
    checkout_root: checkoutRoot, task_count: rows.length, rows,
    one_copy_census_regular_block_bytes: lowerBound,
    before, after, shm_consumed_bytes: before.shm_free_bytes - after.shm_free_bytes,
    model_calls: 0, gold_loaded: false, retained: true,
    claim_ceiling: "All 24 exact one-copy checkouts fit with a 3 GiB runtime reserve; no four-view, output-peak, score or superiority proof",
    open_questions: ["Can four isolated overlays preserve source binding and write isolation?",
      "Can the runner use them without scratch reclaim and preserve native-score semantics?"]
  };
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "RESIDENCY-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, tasks: rows.length,
    shm_consumed_bytes: receipt.shm_consumed_bytes, shm_free_after_bytes: after.shm_free_bytes,
    receipt_sha256: sha(bytes)}));
}

main().catch(error => {console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2;});
