// No-model storage probe for the largest selected post-r8 G01 task.
// Fresh tmpfs checkouts remain intact for independent cold-copy verification.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const scratch = "/tmp/are-g01-post-r8-scratch-layout-probe-r1";
const receiptRoot = `${base}/g01-post-r8-scratch-layout-probe-r1`;
const cacheReceipt = `${base}/g01-post-r8-source-caches-r2/SOURCE-CACHES.json`;
const cacheReceiptSha = "5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9";
const orchestrator = `${base}/g01-source-combined-candidate-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs`;
const orchestratorSha = "51e9714f03cdd42833cde6715deddb4d201b0807738b63a49422bd528b0a31ab";
const instanceId = "Multi-SWE-Bench__cpp__maintenance__bugfix__5a3de72a";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-scratch-probe.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};

async function main() {
  need(!existsSync(scratch) && !existsSync(receiptRoot), "already-exists");
  need(free("/tmp") > 3_000_000_000 && free(base) > 1_500_000_000, "headroom");
  need(sha(readFileSync(cacheReceipt)) === cacheReceiptSha &&
    sha(readFileSync(orchestrator)) === orchestratorSha, "source-drift");
  const cache = JSON.parse(readFileSync(cacheReceipt));
  const row = cache.task_bindings.find(item => item.instance_id === instanceId);
  need(row && row.base_commit === "9294e25c98f9c09a1874842dbcaae7a91336a57e" &&
    row.tree === "665fcfdec520c98baa00034db3519f5c566622e1" &&
    row.repository_path === "/tmp/are-g01-post-r8-source-caches-r1/nlohmann--json.git", "task-drift");
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
    }
  }
  const after = {root_free_bytes: free(base), tmp_free_bytes: free("/tmp")};
  const receipt = {schema_version: "are.g01-post-r8-scratch-layout-probe/v1", status: "passed-source-retained",
    instance_id: instanceId, cache_receipt_sha256: cacheReceiptSha, orchestrator_sha256: orchestratorSha,
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
