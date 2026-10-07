// Re-verify two exact historical VPS cache roots against existing WSL cold archives.
// No VPS deletion or mutation. Restored temporary copies are removed after comparison.
import {createHash} from "node:crypto";
import {execFile, spawn} from "node:child_process";
import {createReadStream} from "node:fs";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {promisify} from "node:util";
import {createZstdDecompress} from "node:zlib";

const run = promisify(execFile);
const host = "root@187.77.163.194";
const root = "/home/vlad_/are-benchmark-archive";
const output = join(root, "g01-r10-cold-caches-r11-reclaim-preflight-20261001.json");
const configs = [
  {name: "r1", directory: "g01-r10-source-caches-r1-20260930",
   archive_sha256: "76f66fd3429147d20b24bf2c89813ae89371d1e229ce080c19b93417d2e607de",
   manifest_sha256: "004fa4a0f0bfeb01c0433b65dd3d297f941ba2315428d2c27558fc2a47d55585",
   receipt_sha256: "98663f95ef6eb75f1c478d2a5acec350ebbee0b13566e2aaea470ecf65102637"},
  {name: "r3", directory: "g01-r10-source-caches-r3-20260930",
   archive_sha256: "20ad7643ba33c1240387143420713a6c676a5086623737767d59f47534b769e6",
   manifest_sha256: "ddcf1230ae24121f581bcf2420c2ac9c89741ee1435ebe8180f6c12a49b4008a",
   receipt_sha256: "794f82ac3df4e814845308e3eb0f943a043efefb5fe76906bd68b5ba066e21ec"},
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`r10-cold-reclaim-preflight.${reason}`);};
async function fileSha(path) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(path)) h.update(chunk);
  return h.digest("hex");
}
async function call(name, args) {
  const result = await run(name, args, {maxBuffer: 1024 * 1024, timeout: 900000});
  return result.stdout;
}
async function restoreArchive(archive, restored) {
  const tar = spawn("tar", ["-xf", "-", "-C", restored], {stdio: ["pipe", "ignore", "pipe"]});
  const errors = [];
  tar.stderr.on("data", chunk => errors.push(chunk));
  const settled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
  await pipeline(createReadStream(archive), createZstdDecompress(), tar.stdin);
  need((await settled) === 0, `restore:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
}
async function main() {
  const rows = [];
  for (const config of configs) {
    const cold = join(root, config.directory);
    const archive = join(cold, `source-caches-${config.archive_sha256}.tar.zst`);
    const manifestPath = join(cold, `source-caches-${config.archive_sha256}.json`);
    const manifestBytes = await readFile(manifestPath);
    need(sha(manifestBytes) === config.manifest_sha256, `manifest-sha:${config.name}`);
    const manifest = JSON.parse(manifestBytes);
    const remoteRoot = `/tmp/are-g01-r10-source-caches-${config.name}`;
    const remoteReceipt = `/opt/are/evolution-runtime/g01-r10-source-caches-${config.name}/SOURCE-CACHES.json`;
    need(manifest.status === "verified-copy-source-retained" &&
      manifest.remote_source_root === remoteRoot && manifest.remote_receipt === remoteReceipt &&
      manifest.remote_receipt_sha256 === config.receipt_sha256 &&
      manifest.archive_path === archive && manifest.archive_sha256 === config.archive_sha256,
    `manifest-shape:${config.name}`);
    need(await fileSha(archive) === config.archive_sha256, `archive-sha:${config.name}`);
    const receiptBytes = await call("ssh", ["-o", "BatchMode=yes", host, `cat '${remoteReceipt}'`]);
    need(sha(receiptBytes) === config.receipt_sha256, `receipt-sha:${config.name}`);
    const receipt = JSON.parse(receiptBytes);
    need(receipt.status === "passed" && receipt.model_calls === 0 && receipt.gold_loaded === false,
      `receipt-shape:${config.name}`);
    const restored = await mkdtemp(join(cold, ".reclaim-verify-"));
    try {
      await restoreArchive(archive, restored);
      const differences = await call("rsync", ["-rclpn", "--delete", "--itemize-changes",
        "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
        `${host}:${remoteRoot}/`, `${restored}/are-g01-r10-source-caches-${config.name}/`]);
      need(differences.length === 0, `current-tree-diff:${config.name}`);
    } finally {
      await rm(restored, {recursive: true, force: false});
    }
    rows.push({name: config.name, remote_root: remoteRoot,
      remote_receipt: remoteReceipt, remote_receipt_sha256: config.receipt_sha256,
      cold_manifest_sha256: config.manifest_sha256,
      cold_archive_sha256: config.archive_sha256,
      verification: "Full archive SHA, tar restore, and current VPS whole-tree rsync checksum/mode/symlink dry-run",
      source_retained: true});
    console.log(JSON.stringify({verified: config.name, remote_root: remoteRoot}));
  }
  const result = {schema_version: "are.g01-r10-cold-caches-r11-reclaim-preflight/v1",
    status: "passed-source-retained", rows,
    script_sha256: await fileSha(new URL(import.meta.url)),
    deleted_vps_files: 0,
    claim_ceiling: "Current cold-copy equivalence of two historical caches only; exact reclaim and r11 live storage remain separate.",
    open_questions: ["Can exact reclaim increase r11 live-pair headroom without disturbing current r11 caches?"]};
  const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
  await writeFile(output, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: result.status, receipt_path: output, receipt_sha256: sha(bytes)}));
}
main().catch(error => {console.error(JSON.stringify({status: "verify-error", error: String(error.message)})); process.exitCode = 2;});
