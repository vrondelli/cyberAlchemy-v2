// Reclaim only two exact historical G01 r10 tmpfs cache roots after fresh WSL verification.
import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";

const base = "/opt/are/evolution-runtime";
const preflightPath = `${base}/g01-r10-cold-cache-reclaim-for-r11-r1/PREFLIGHT.json`;
const currentPath = `${base}/g01-r11-r3-cache-binding-r1/VERIFY.json`;
const outputRoot = `${base}/g01-r10-cold-cache-reclaim-for-r11-r1`;
const preflightSha = "0910420733ddae1e5aa654605f517589eea6b7893b25fc5d7bf0d2bb9d8b5724";
const currentSha = "6f0e9a31382fe5ecc7a28d01e2ff704f1c2e92e1c0634574aae63b7c110fb3f7";
const rows = [
  {name: "r1", path: "/tmp/are-g01-r10-source-caches-r1",
   receipt: `${base}/g01-r10-source-caches-r1/SOURCE-CACHES.json`,
   receiptSha: "98663f95ef6eb75f1c478d2a5acec350ebbee0b13566e2aaea470ecf65102637",
   archiveSha: "76f66fd3429147d20b24bf2c89813ae89371d1e229ce080c19b93417d2e607de"},
  {name: "r3", path: "/tmp/are-g01-r10-source-caches-r3",
   receipt: `${base}/g01-r10-source-caches-r3/SOURCE-CACHES.json`,
   receiptSha: "794f82ac3df4e814845308e3eb0f943a043efefb5fe76906bd68b5ba066e21ec",
   archiveSha: "20ad7643ba33c1240387143420713a6c676a5086623737767d59f47534b769e6"}
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`r10-cold-cache-reclaim.${reason}`);};
const free = () => {const stat = statfsSync("/tmp"); return Number(stat.bavail) * Number(stat.bsize);};

try {
  const preflightBytes = readFileSync(preflightPath), currentBytes = readFileSync(currentPath);
  need(sha(preflightBytes) === preflightSha && sha(currentBytes) === currentSha, "input-drift");
  const preflight = JSON.parse(preflightBytes), current = JSON.parse(currentBytes);
  need(preflight.schema_version === "are.g01-r10-cold-caches-r11-reclaim-preflight/v1" &&
    preflight.status === "passed-source-retained" && preflight.deleted_vps_files === 0 &&
    preflight.rows?.length === 2 && current.status === "passed" &&
    current.verified_task_bindings?.length === 24, "input-shape");
  for (const row of rows) {
    const out = `${outputRoot}/${row.name.toUpperCase()}-RECLAIM.json`;
    const verified = preflight.rows.find(item => item.name === row.name);
    need(!existsSync(out) && verified?.remote_root === row.path &&
      verified.remote_receipt === row.receipt &&
      verified.remote_receipt_sha256 === row.receiptSha &&
      verified.cold_archive_sha256 === row.archiveSha &&
      verified.source_retained === true &&
      sha(readFileSync(row.receipt)) === row.receiptSha, `cold-binding:${row.name}`);
    need(current.verified_task_bindings.every(item =>
      !item.repository_path.startsWith(`${row.path}/`) && item.repository_path !== row.path),
    `current-dependency:${row.name}`);
    need(existsSync(row.path) && lstatSync(row.path).isDirectory() &&
      !lstatSync(row.path).isSymbolicLink(), `target-shape:${row.name}`);
    const before = free();
    rmSync(row.path, {recursive: true, force: false});
    need(!existsSync(row.path), `reclaim-incomplete:${row.name}`);
    const after = free();
    const receipt = {schema_version: "are.g01-r10-cold-cache-reclaim-for-r11/v1",
      status: "historical-cache-reclaimed-from-verified-cold-copy",
      exact_removed_path: row.path, cold_archive_sha256: row.archiveSha,
      cold_verification_sha256: preflightSha, historical_source_receipt_sha256: row.receiptSha,
      current_r11_cache_binding_sha256: currentSha,
      tmp_free_before_bytes: before, tmp_free_after_bytes: after, tmp_recovered_bytes: after - before,
      script_sha256: sha(readFileSync(import.meta.filename)),
      retained_wsl_archive: true, other_tmpfs_roots_removed: 0,
      claim_ceiling: "Exact historical cache reclaim only; not live-pair storage or benchmark superiority.",
      open_questions: ["Does the r11 guarded pair retain its required tmpfs and root reserves?"]};
    const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
    writeFileSync(out, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: receipt.status, name: row.name,
      removed_path: row.path, tmp_recovered_bytes: receipt.tmp_recovered_bytes,
      receipt_sha256: sha(bytes)}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "reclaim-error", error: String(error.message)}));
  process.exitCode = 2;
}
