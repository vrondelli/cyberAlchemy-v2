// Reclaim only the exact no-model tmpfs probe after independent WSL archival.
// Never touches a campaign pair or historical source root.
import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";

const scratch = "/tmp/are-g01-post-r8-scratch-layout-probe-r1";
const root = "/opt/are/evolution-runtime/g01-post-r8-scratch-layout-probe-r1";
const probePath = `${root}/SCRATCH-PROBE.json`;
const reclaimPath = `${root}/SCRATCH-RECLAIM.json`;
const probeSha = "6da839ade2bde15fd8d3b99678ecd88164eea75a5e99cc4803f01febd57129c8";
const archiveSha = "5aea8cbabc1c3f3591758376c68a66867aba3fc946ea5b1231e1e7e623fda9cb";
const archiveManifestSha = "0f8cc8240573cdfa5b1e8a9df13268ccf57ed85474e1d07c8474f847fd35634c";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-scratch-reclaim.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};

try {
  need(!existsSync(reclaimPath) && existsSync(scratch) && lstatSync(scratch).isDirectory() &&
    !lstatSync(scratch).isSymbolicLink(), "targets");
  const bytes = readFileSync(probePath), probe = JSON.parse(bytes);
  need(sha(bytes) === probeSha && probe.status === "passed-source-retained" &&
    probe.scratch_root === scratch && probe.checkouts?.length === 4 &&
    probe.model_calls === 0 && probe.gold_loaded === false, "probe-drift");
  for (const row of probe.checkouts) need(row.destination.startsWith(`${scratch}/`) &&
    existsSync(row.destination) && lstatSync(row.destination).isDirectory() &&
    !lstatSync(row.destination).isSymbolicLink(), "checkout-drift");
  const before = free("/tmp");
  rmSync(scratch, {recursive: true, force: false});
  need(!existsSync(scratch), "reclaim-incomplete");
  const after = free("/tmp");
  const receipt = {schema_version: "are.g01-post-r8-scratch-reclaim/v1", status: "fresh-probe-scratch-reclaimed",
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
