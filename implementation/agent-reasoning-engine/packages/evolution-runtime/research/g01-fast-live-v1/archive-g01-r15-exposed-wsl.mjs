// Cold-copy the exact terminal exposed r15 candidate output, including source
// and receipts. Fully restore/compare before writing a private manifest.
// This script never deletes VPS data.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, readFile, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const host = "root@187.77.163.194";
const remoteRoot = "/tmp/are-g01-r15-exposed-candidate-r1";
const remoteName = "are-g01-r15-exposed-candidate-r1";
const remoteFreeze = "/opt/are/evolution-runtime/g01-r15-exposed-qualification-r1/CANDIDATE-FREEZE.json";
const freezeSha = "e6855f203b1293c12b74ee65fc321d871d2aa414caa6489b9d3e3e56212d6aae";
const coldRoot = "/home/vlad_/are-benchmark-archive/g01-r15-exposed-qualification-r1";
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ClearAllForwardings=yes", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r15-archive.${reason}`);};
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
const freezeBytes = await command("ssh", [...sshArgs, `cat '${remoteFreeze}'`], {binary: true});
need(sha(freezeBytes) === freezeSha && JSON.parse(freezeBytes).output_root === remoteRoot,
  "freeze-drift");
const resultPath = `${remoteRoot}/runs/00/result.json`;
const resultBytes = await command("ssh", [...sshArgs,
  `test -d '${remoteRoot}/source/00' && test -f '${remoteRoot}/runs/00/completed.json' && test ! -L '${remoteRoot}' && cat '${resultPath}'`],
{binary: true});
const result = JSON.parse(resultBytes);
need(["final_context_selected", "run_error"].includes(result.status), "result-status");
await mkdir(coldRoot, {recursive: true, mode: 0o700});
const pending = join(coldRoot, "run.pending.tar.zst");
const handle = await open(pending, "wx", 0o600); await handle.close();
const child = spawn("ssh", [...sshArgs, `tar -C /tmp -I 'zstd -T1 -3' -cf - '${remoteName}'`],
{stdio: ["ignore", "pipe", "pipe"]});
const errors = [];
child.stderr.on("data", chunk => errors.push(chunk));
const settled = new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
await pipeline(child.stdout, createWriteStream(pending, {flags: "r+"}));
need((await settled) === 0, `stream:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
const sync = await open(pending, "r"); await sync.sync(); await sync.close();
const restoreRoot = await mkdtemp(join(coldRoot, ".restore-"));
try {
  const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot], {stdio: ["pipe", "ignore", "pipe"]});
  const tarErrors = [];
  tar.stderr.on("data", chunk => tarErrors.push(chunk));
  const tarSettled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
  await pipeline(createReadStream(pending), createZstdDecompress(), tar.stdin);
  need((await tarSettled) === 0, `restore:${Buffer.concat(tarErrors).toString("utf8").slice(-300)}`);
  const compare = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
    "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
    `${host}:${remoteRoot}/`, `${restoreRoot}/${remoteName}/`],
  {stdio: ["ignore", "pipe", "pipe"]});
  const differences = [], compareErrors = [];
  compare.stdout.on("data", chunk => differences.push(chunk));
  compare.stderr.on("data", chunk => compareErrors.push(chunk));
  const compared = new Promise((resolve, reject) => {compare.on("error", reject); compare.on("close", resolve);});
  need((await compared) === 0 && Buffer.concat(differences).length === 0,
    `compare:${Buffer.concat(compareErrors).toString("utf8").slice(-300)}`);
} finally {await rm(restoreRoot, {recursive: true, force: true});}
const digest = await fileSha(pending);
const archive = join(coldRoot, `run-${digest}.tar.zst`);
await link(pending, archive); await unlink(pending);
need(sha(await command("ssh", [...sshArgs, `cat '${resultPath}'`], {binary: true})) === sha(resultBytes),
  "result-drift");
const manifest = {schema_version: "are.g01-r15-exposed-cold-copy/v1",
  status: "verified-copy-source-retained", remote_root: remoteRoot,
  remote_freeze_sha256: freezeSha, remote_result_sha256: sha(resultBytes),
  result_status: result.status, archive_path: archive, archive_sha256: digest,
  archive_bytes: (await stat(archive)).size,
  verification: "Full Zstandard restore and whole-tree rsync checksum, mode and symlink dry-run",
  source_retained: true, deleted_vps_files: 0,
  claim_ceiling: "Private exposed-task storage only; not benchmark superiority"};
const manifestPath = join(coldRoot, `run-${digest}.json`);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: manifest.status, result_status: result.status,
  archive_sha256: digest, archive_bytes: manifest.archive_bytes, manifest_path: manifestPath}));
