// Verified WSL cold copy of exact G01 r10 tmpfs Git caches; VPS source retained.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const host = "root@187.77.163.194";
const remoteRoot = "/tmp/are-g01-r10-source-caches-r4";
const remoteReceipt = "/opt/are/evolution-runtime/g01-r10-source-caches-r4/SOURCE-CACHES.json";
const receiptSha = "4f334f7ff8defa8f1741a984238ded4dea12b731077f19738041c2848eab1c07";
const coldRoot = "/home/vlad_/are-benchmark-archive/g01-r10-source-caches-r4-20260930";
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
  "-o", "ClearAllForwardings=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r10-cache-archive.${reason}`);};

async function command(name, args) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  child.stdout.on("data", chunk => out.push(chunk));
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject); child.on("close", resolve);
  });
  need(code === 0, `${name}:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  return Buffer.concat(out);
}
async function fileSha(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

const receiptBytes = await command("ssh", [...sshArgs, `cat '${remoteReceipt}'`]);
need(sha(receiptBytes) === receiptSha, "receipt-drift");
const receipt = JSON.parse(receiptBytes);
need(receipt.schema_version === "are.g01-r10-source-caches/v1" &&
  receipt.status === "passed" && receipt.volatile_root === remoteRoot &&
  receipt.origins?.length === 17 && receipt.task_bindings?.length === 24 &&
  receipt.fetches?.length === 1 && receipt.failed?.length === 0 &&
  receipt.model_calls === 0 && receipt.gold_loaded === false,
"receipt-shape");
await command("ssh", [...sshArgs, `test -d '${remoteRoot}'`]);
await mkdir(coldRoot, {recursive: true, mode: 0o700});
const pending = join(coldRoot, "source-caches.pending.tar.zst");
const handle = await open(pending, "wx", 0o600);
await handle.close();
const child = spawn("ssh", [...sshArgs,
  "tar -C /tmp -I 'zstd -T1 -3' -cf - are-g01-r10-source-caches-r4"],
{stdio: ["ignore", "pipe", "pipe"]});
const errors = [];
child.stderr.on("data", chunk => errors.push(chunk));
const settled = new Promise((resolve, reject) => {
  child.on("error", reject); child.on("close", resolve);
});
await pipeline(child.stdout, createWriteStream(pending, {flags: "r+"}));
need((await settled) === 0, `stream:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
const sync = await open(pending, "r");
await sync.sync();
await sync.close();
const restoreRoot = await mkdtemp(join(coldRoot, ".restore-"));
try {
  const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot],
    {stdio: ["pipe", "ignore", "pipe"]});
  const tarErrors = [];
  tar.stderr.on("data", chunk => tarErrors.push(chunk));
  const tarSettled = new Promise((resolve, reject) => {
    tar.on("error", reject); tar.on("close", resolve);
  });
  await pipeline(createReadStream(pending), createZstdDecompress(), tar.stdin);
  need((await tarSettled) === 0, `restore:${Buffer.concat(tarErrors).toString("utf8").slice(-300)}`);
  const compare = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
    "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
    `${host}:${remoteRoot}/`, `${restoreRoot}/are-g01-r10-source-caches-r4/`],
  {stdio: ["ignore", "pipe", "pipe"]});
  const differences = [], compareErrors = [];
  compare.stdout.on("data", chunk => differences.push(chunk));
  compare.stderr.on("data", chunk => compareErrors.push(chunk));
  const compareCode = await new Promise((resolve, reject) => {
    compare.on("error", reject); compare.on("close", resolve);
  });
  need(compareCode === 0 && Buffer.concat(differences).length === 0,
    `restored-tree-diff:${Buffer.concat(compareErrors).toString("utf8").slice(-300)}`);
} finally {
  await rm(restoreRoot, {recursive: true, force: true});
}
const digest = await fileSha(pending);
const archive = join(coldRoot, `source-caches-${digest}.tar.zst`);
await link(pending, archive);
await unlink(pending);
need(sha(await command("ssh", [...sshArgs, `cat '${remoteReceipt}'`])) === receiptSha,
  "receipt-changed-during-copy");
const manifest = {schema_version: "are.g01-r10-source-cache-archive/v1",
  status: "verified-copy-source-retained", campaign_candidate_sha256: receipt.candidate_sha256,
  remote_source_root: remoteRoot, remote_receipt: remoteReceipt,
  remote_receipt_sha256: receiptSha, archive_path: archive,
  archive_sha256: digest, archive_bytes: (await stat(archive)).size,
  verification: "Full Zstandard restore and whole-tree rsync checksum, mode and symlink dry-run against retained VPS source",
  source_retained: true, deleted_vps_files: 0,
  claim_ceiling: "Exact source-cache storage evidence only; not index, gold-file, model-quality or superiority proof.",
  open_questions: ["Can the selected isolated checkouts and bounded indexes pass without exceeding VPS capacity?"]};
const manifestPath = join(coldRoot, `source-caches-${digest}.json`);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`,
  {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: manifest.status, archive_path: archive,
  archive_sha256: digest, archive_bytes: manifest.archive_bytes,
  manifest_path: manifestPath}));
