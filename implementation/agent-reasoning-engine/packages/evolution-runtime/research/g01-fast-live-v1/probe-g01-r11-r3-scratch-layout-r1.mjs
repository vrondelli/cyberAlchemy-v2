// No-model storage probe for the largest selected G01 r11 r3 task.
// Fresh tmpfs checkouts remain intact for independent cold-copy verification.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const scratch = "/tmp/are-g01-r11-r3-scratch-layout-probe-r1";
const receiptRoot = `${base}/g01-r11-r3-scratch-layout-probe-r1`;
const cacheReceipt = `${base}/g01-r11-r3-cache-binding-r1/VERIFY.json`;
const cacheReceiptSha = "6f0e9a31382fe5ecc7a28d01e2ff704f1c2e92e1c0634574aae63b7c110fb3f7";
const orchestrator = `${base}/g01-source-combined-candidate-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`;
const orchestratorSha = "51e9714f03cdd42833cde6715deddb4d201b0807738b63a49422bd528b0a31ab";
const storageCensus = `${base}/g01-r11-r3-storage-census-r1/STORAGE-CENSUS.json`;
const storageCensusSha = "4ef1cab9098e780f6073cf83ecf17f13441e7b5052d56b671fd19e91389e0218";
const instanceId = "Multi-SWE-Bench__typescript__maintenance__bugfix__8d36ca39";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-scratch-probe.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};

async function main() {
  need(!existsSync(scratch) && !existsSync(receiptRoot), "already-exists");
  need(free(base) > 500_000_000, "root-headroom");
  need(sha(readFileSync(cacheReceipt)) === cacheReceiptSha &&
    sha(readFileSync(orchestrator)) === orchestratorSha &&
    sha(readFileSync(storageCensus)) === storageCensusSha, "source-drift");
  const census = JSON.parse(readFileSync(storageCensus));
  const largest = [...census.rows].sort((a, b) => b.four_copy_regular_block_bytes - a.four_copy_regular_block_bytes)[0];
  need(census.tmpfs_floor_pass === true && largest?.instance_id === instanceId &&
    free("/tmp") >= census.provisional_tmpfs_floor_bytes, "worst-task-or-tmpfs-drift");
  const cache = JSON.parse(readFileSync(cacheReceipt));
  const row = cache.verified_task_bindings.find(item => item.instance_id === instanceId);
  need(row && row.base_commit === "b00bdc767032fd008e5e3ec3133d6dc51264b1de" &&
    row.tree === "297eec7c8e3542eaa593d5e83c2c9e97df265423" &&
    row.repository_path === "/tmp/are-g01-r11-remaining-typescript-cache-r1/mui--material-ui.git", "task-drift");
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(orchestrator).href);
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
      need(free("/tmp") > 1_342_177_280, "tmpfs-reserve");
    }
  }
  const after = {root_free_bytes: free(base), tmp_free_bytes: free("/tmp")};
  const receipt = {schema_version: "are.g01-r11-r3-scratch-layout-probe/v1", status: "passed-source-retained",
    instance_id: instanceId, cache_receipt_sha256: cacheReceiptSha, storage_census_sha256: storageCensusSha,
    orchestrator_sha256: orchestratorSha,
    scratch_root: scratch, receipt_root: receiptRoot, checkouts, before, after,
    tmp_consumed_bytes: before.tmp_free_bytes - after.tmp_free_bytes,
    root_consumed_before_receipt_bytes: before.root_free_bytes - after.root_free_bytes,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "No-model four-checkout storage layout only; not live campaign peak, archival proof, quality or superiority",
    open_questions: ["Can an exact source cold copy be restored and compared before scratch cleanup?", "What is the live receipt and log peak under a frozen pair?"]};
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(join(receiptRoot, "SCRATCH-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, tmp_consumed_bytes: receipt.tmp_consumed_bytes,
    root_consumed_before_receipt_bytes: receipt.root_consumed_before_receipt_bytes,
    receipt_sha256: sha(bytes), scratch_root: scratch}));
}

main().catch(error => {console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2;});
