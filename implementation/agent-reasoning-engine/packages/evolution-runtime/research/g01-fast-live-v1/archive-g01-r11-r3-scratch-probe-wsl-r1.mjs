// Cold-copy and full-restore verification for the exact no-model tmpfs probe.
// This tool never removes or alters VPS scratch or historical evidence.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, readFile, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const host = "root@187.77.163.194";
const remoteRoot = "/tmp/are-g01-r11-r3-scratch-layout-probe-r1";
const remoteReceipt = "/opt/are/evolution-runtime/g01-r11-r3-scratch-layout-probe-r1/SCRATCH-PROBE.json";
const coldRoot = "/home/vlad_/are-benchmark-archive/g01-r11-r3-scratch-layout-probe-r1-20261001";
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ClearAllForwardings=yes", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-scratch-archive.${reason}`);};

async function command(name, args, {binary = false} = {}) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  child.stdout.on("data", chunk => out.push(chunk));
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  need(code === 0, `${name}:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const bytes = Buffer.concat(out);
  return binary ? bytes : bytes.toString("utf8");
}
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
async function verifyTar(path, restoreRoot) {
  const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot], {stdio: ["pipe", "ignore", "pipe"]});
  const errors = [];
  tar.stderr.on("data", chunk => errors.push(chunk));
  const settled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
  await pipeline(createReadStream(path), createZstdDecompress(), tar.stdin);
  need((await settled) === 0, `restore:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
}
async function compareTree(restoreRoot) {
  const compare = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
    "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
    `${host}:${remoteRoot}/`, `${restoreRoot}/are-g01-r11-r3-scratch-layout-probe-r1/`],
  {stdio: ["ignore", "pipe", "pipe"]});
  const differences = [], errors = [];
  compare.stdout.on("data", chunk => differences.push(chunk));
  compare.stderr.on("data", chunk => errors.push(chunk));
  const settled = new Promise((resolve, reject) => {compare.on("error", reject); compare.on("close", resolve);});
  need((await settled) === 0, `rsync:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  need(Buffer.concat(differences).length === 0, "restored-tree-diff");
}

async function main() {
  const receiptBytes = await command("ssh", [...sshArgs, `cat '${remoteReceipt}'`], {binary: true});
  const receipt = JSON.parse(receiptBytes);
  need(sha(receiptBytes) === "910f1ad7471d4c6ac9af27e7c88b2ef45dc75c194c9fc7ad0b29cd664e5af8b1" &&
    receipt.schema_version === "are.g01-r11-r3-scratch-layout-probe/v1" &&
    receipt.status === "passed-source-retained" && receipt.scratch_root === remoteRoot &&
    receipt.checkouts?.length === 4 && receipt.model_calls === 0 && receipt.gold_loaded === false,
  "receipt-shape");
  await command("ssh", [...sshArgs, `test -d '${remoteRoot}/control/base' && test -d '${remoteRoot}/control/work' && test -d '${remoteRoot}/candidate/base' && test -d '${remoteRoot}/candidate/work'`]);
  await mkdir(coldRoot, {recursive: true, mode: 0o700});
  const pending = join(coldRoot, "scratch-source.pending.tar.zst");
  const handle = await open(pending, "wx", 0o600); await handle.close();
  const child = spawn("ssh", [...sshArgs,
    "tar -C /tmp -I 'zstd -T1 -3' -cf - are-g01-r11-r3-scratch-layout-probe-r1"],
  {stdio: ["ignore", "pipe", "pipe"]});
  const errors = [];
  child.stderr.on("data", chunk => errors.push(chunk));
  const settled = new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  await pipeline(child.stdout, createWriteStream(pending, {flags: "r+"}));
  need((await settled) === 0, `stream:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const sync = await open(pending, "r"); await sync.sync(); await sync.close();
  const restoreRoot = await mkdtemp(join(coldRoot, ".restore-"));
  try {await verifyTar(pending, restoreRoot); await compareTree(restoreRoot);}
  finally {await rm(restoreRoot, {recursive: true, force: true});}
  const digest = await fileSha(pending);
  const archive = join(coldRoot, `scratch-source-${digest}.tar.zst`);
  await link(pending, archive); await unlink(pending);
  need(sha(await command("ssh", [...sshArgs, `cat '${remoteReceipt}'`], {binary: true})) === sha(receiptBytes), "receipt-drift");
  const manifest = {schema_version: "are.g01-r11-r3-scratch-probe-archive/v1", status: "verified-copy-source-retained",
    remote_scratch_root: remoteRoot, remote_receipt: remoteReceipt, remote_receipt_sha256: sha(receiptBytes),
    archive_path: archive, archive_sha256: digest, archive_bytes: (await stat(archive)).size,
    verification: "Full Zstandard decompression and tar restore; whole restored tree matched VPS by rsync checksum, mode and symlink dry-run",
    source_retained: true, deleted_vps_files: 0,
    claim_ceiling: "No-model scratch archival and restore evidence only; not a live campaign or superiority result",
    open_questions: ["Qualify equivalent per-pair archival and exact scratch reclaim after terminal model dispatch."]};
  const manifestPath = join(coldRoot, `scratch-source-${digest}.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: manifest.status, archive_path: archive,
    archive_sha256: digest, archive_bytes: manifest.archive_bytes, manifest_path: manifestPath}));
}

main().catch(error => {console.error(JSON.stringify({status: "archive-error", error: String(error.message)})); process.exitCode = 2;});
