// Reclaim only the exact no-model tmpfs probe after independent WSL archival.
// Never touches a campaign pair or historical source root.
import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";

const scratch = "/tmp/are-g01-r11-r3-scratch-layout-probe-r1";
const root = "/opt/are/evolution-runtime/g01-r11-r3-scratch-layout-probe-r1";
const probePath = `${root}/SCRATCH-PROBE.json`;
const reclaimPath = `${root}/SCRATCH-RECLAIM.json`;
const probeSha = "910f1ad7471d4c6ac9af27e7c88b2ef45dc75c194c9fc7ad0b29cd664e5af8b1";
const archiveSha = "2399183be844affcc5374efdaf7f99f11456492b78b326ff40015351423d5afb";
const archiveManifestSha = "35dbbb5a026f23eb8452506c8cae3368d0cd19d2cd988ca3ea6f091455e9bfb4";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-scratch-reclaim.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};

try {
  need(!existsSync(reclaimPath) && existsSync(scratch) && lstatSync(scratch).isDirectory() &&
    !lstatSync(scratch).isSymbolicLink(), "targets");
  const bytes = readFileSync(probePath), probe = JSON.parse(bytes);
  need(sha(bytes) === probeSha && probe.schema_version === "are.g01-r11-r3-scratch-layout-probe/v1" && probe.status === "passed-source-retained" &&
    probe.scratch_root === scratch && probe.checkouts?.length === 4 &&
    probe.model_calls === 0 && probe.gold_loaded === false, "probe-drift");
  for (const row of probe.checkouts) need(row.destination.startsWith(`${scratch}/`) &&
    existsSync(row.destination) && lstatSync(row.destination).isDirectory() &&
    !lstatSync(row.destination).isSymbolicLink(), "checkout-drift");
  const before = free("/tmp");
  rmSync(scratch, {recursive: true, force: false});
  need(!existsSync(scratch), "reclaim-incomplete");
  const after = free("/tmp");
  const receipt = {schema_version: "are.g01-r11-r3-scratch-reclaim/v1", status: "fresh-probe-scratch-reclaimed",
    exact_removed_path: scratch, preserved_receipt_path: probePath, probe_sha256: probeSha,
    cold_archive_sha256: archiveSha, cold_manifest_sha256: archiveManifestSha,
    tmp_free_before_bytes: before, tmp_free_after_bytes: after, tmp_recovered_bytes: after - before,
    historical_source_roots_removed: 0, claim_ceiling: "No-model test scratch cleanup only; not campaign storage qualification or superiority",
    open_questions: ["Qualify per-pair terminal cold-copy and exact scratch reclaim before live dispatch."]};
  const out = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(reclaimPath, out, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, tmp_recovered_bytes: receipt.tmp_recovered_bytes,
    receipt_sha256: sha(out), removed_path: scratch}));
} catch (error) {console.error(JSON.stringify({status: "reclaim-error", error: String(error.message)})); process.exitCode = 2;}
