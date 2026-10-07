// Exact no-model four-checkout storage rehearsal for the largest G01 r14 task.
// Retain scratch until checksum-verified WSL cold archival and restore comparison.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const scratch = "/tmp/are-g01-r14-scratch-layout-probe-r1";
const receiptRoot = `${base}/g01-r14-scratch-layout-probe-r1`;
const paths = Object.freeze({
  candidate: `${base}/g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`,
  transfer: `${base}/g01-r14-cache-transfer-r1/VERIFY.json`,
  census: `${base}/g01-r14-storage-census-r1/STORAGE-CENSUS.json`,
  native: `${base}/g01-r14-native-reference-audit-r1/NATIVE-REFERENCE-AUDIT.json`,
  orchestrator: `${base}/g01-source-r13-prospective-r45/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`
});
const pins = Object.freeze({
  candidate: "014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845",
  transfer: "be17912245ed314d2f405a11af7fdef6c200ba2d55d68d3996e0c300f8bd1703",
  census: "31952d38b7f875e2f5ee4501b99e7791c8f3c442837a252a209b7cb6baf19901",
  native: "6a71ed399b80fee998bb6145b57cac45bac55fdae11d432a356fb529cf2b1f6b"
});
const reserve = 1_342_177_280; // 1.25 GiB, unchanged from r13.
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r14-scratch-probe.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const readPinned = name => {
  const bytes = readFileSync(paths[name]);
  need(sha(bytes) === pins[name], `input-drift:${name}`);
  return JSON.parse(bytes);
};

async function main() {
  need(!existsSync(scratch) && !existsSync(receiptRoot), "already-exists");
  need(free(base) > 1_476_000_000, "root-headroom");
  const candidate = readPinned("candidate");
  const transfer = readPinned("transfer");
  const census = readPinned("census");
  const native = readPinned("native");
  need(candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && transfer.status === "passed" &&
    transfer.candidate_sha256 === pins.candidate && census.candidate_sha256 === pins.candidate &&
    census.caches_sha256 === pins.transfer && census.tmpfs_floor_pass === true &&
    native.status === "passed" && native.candidate_sha256 === pins.candidate &&
    native.summary.audited === 24 && native.summary.admitted === native.summary.gold_files &&
    native.summary.excluded === 0 && native.summary.absent === 0, "input-shape");
  const largest = [...census.rows].sort((a, b) => b.four_copy_regular_block_bytes - a.four_copy_regular_block_bytes)[0];
  need(largest.instance_id === "Multi-SWE-Bench__typescript__maintenance__bugfix__8fcb53e6" &&
    free("/tmp") >= census.provisional_tmpfs_floor_bytes, "storage-floor");
  const row = transfer.verified_task_bindings.find(item => item.instance_id === largest.instance_id);
  need(row && row.base_commit === "eb8e95bacf06f824f9e88e7cf1399be1fa23b48f" &&
    row.tree === "890db77bf496c882a1ba62cbc2420b784edc3cdd" &&
    row.repository_path === "/tmp/are-g01-r14-source-caches-r1/mui--material-ui.git", "worst-task-binding");
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(paths.orchestrator).href);
  const before = {root_free_bytes: free(base), tmp_free_bytes: free("/tmp")};
  mkdirSync(scratch, {mode: 0o700});
  const checkouts = [];
  for (const arm of ["control", "candidate"]) {
    const armRoot = join(scratch, arm);
    mkdirSync(armRoot, {mode: 0o700});
    for (const name of ["base", "work"]) {
      const destination = join(armRoot, name);
      const result = prepareIsolatedShallowSourceCheckout({cache: row.repository_path,
        destination, base_commit: row.base_commit});
      need(result.head === row.base_commit && result.tree === row.tree, "checkout-drift");
      checkouts.push({arm, name, destination, head: result.head, tree: result.tree});
      need(free("/tmp") > reserve, "tmpfs-reserve");
    }
  }
  const after = {root_free_bytes: free(base), tmp_free_bytes: free("/tmp")};
  const receipt = {schema_version: "are.g01-r14-scratch-layout-probe/v1",
    status: "passed-source-retained", instance_id: largest.instance_id,
    candidate_sha256: pins.candidate, cache_receipt_sha256: pins.transfer,
    storage_census_sha256: pins.census, native_reference_sha256: pins.native,
    orchestrator_sha256: sha(readFileSync(paths.orchestrator)), scratch_root: scratch,
    receipt_root: receiptRoot, checkouts, before, after,
    tmp_consumed_bytes: before.tmp_free_bytes - after.tmp_free_bytes,
    root_consumed_before_receipt_bytes: before.root_free_bytes - after.root_free_bytes,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "No-model exact worst-task four-checkout storage layout; not live output peak, freeze, score or superiority",
    open_questions: ["Can the retained scratch be cold-copied and restored before exact reclaim?",
      "Will guarded launch retain enough headroom for logs and model output?"]};
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "SCRATCH-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, tmp_consumed_bytes: receipt.tmp_consumed_bytes,
    tmp_free_after_bytes: after.tmp_free_bytes, root_free_after_bytes: after.root_free_bytes,
    receipt_sha256: sha(bytes), scratch_root: scratch}));
}

main().catch(error => {console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2;});
