// Full verified private cold copy of the terminal exposed r20 run; VPS data is retained.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const host = "root@187.77.163.194";
const remoteName = "are-g01-r20-exposed-transfer-160k-240s-r1";
const remoteRoot = `/tmp/${remoteName}`;
const evidenceRoot = "/opt/are/evolution-runtime/g01-r20-exposed-transfer-160k-240s-r1";
const freezeSha = "d367899f14444bdd9c3edb3c5b1a0e31eb8c51624c99744af22fd5783de77d73";
const auditSha = "8266d37ee8ae277ee47b4072284b035f490370febac48ccb0b283b9b12c5e01b";
const coldRoot = "/home/vlad_/are-benchmark-archive/g01-r20-exposed-transfer-160k-240s-r1";
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ClearAllForwardings=yes", host];
const sha = b => createHash("sha256").update(b).digest("hex");
const need = (v, why) => {if (!v) throw Error(`g01-r20-archive.${why}`);};
async function command(name, args, binary = false) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  child.stdout.on("data", c => out.push(c)); child.stderr.on("data", c => errors.push(c));
  const code = await new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  need(code === 0, `${name}:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const bytes = Buffer.concat(out); return binary ? bytes : bytes.toString("utf8");
}
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
const freezeBytes = await command("ssh", [...sshArgs, `cat '${evidenceRoot}/TRANSFER-FREEZE.json'`], true);
const auditBytes = await command("ssh", [...sshArgs, `cat '${evidenceRoot}/INDEPENDENT-AUDIT.json'`], true);
const freeze = JSON.parse(freezeBytes), audit = JSON.parse(auditBytes);
need(sha(freezeBytes) === freezeSha && freeze.output_root === remoteRoot &&
  sha(auditBytes) === auditSha && audit.status === "terminal-attempts-and-paired-scores-verified" &&
  audit.terminal_attempts === 10 && audit.paired_native_scores === 3, "evidence-drift");
const resultBytes = {};
for (const task of freeze.tasks) for (const arm of task.arms) {
  const key = `${task.slug}/${arm.name}`;
  const armRoot = `${remoteRoot}/${key}`;
  resultBytes[key] = await command("ssh", [...sshArgs,
    `test -d '${armRoot}/source/00' && test -f '${armRoot}/runs/00/completed.json' && test ! -L '${armRoot}' && cat '${armRoot}/runs/00/result.json'`], true);
  need(["final_context_selected", "run_error"].includes(JSON.parse(resultBytes[key]).status),
    `${key}-result-status`);
}
await mkdir(coldRoot, {recursive: true, mode: 0o700});
const pending = join(coldRoot, "run.pending.tar.zst");
const handle = await open(pending, "wx", 0o600); await handle.close();
const child = spawn("ssh", [...sshArgs, `tar -C /tmp -I 'zstd -T1 -3' -cf - '${remoteName}'`],
  {stdio: ["ignore", "pipe", "pipe"]});
const errors = []; child.stderr.on("data", c => errors.push(c));
const settled = new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
await pipeline(child.stdout, createWriteStream(pending, {flags: "r+"}));
need((await settled) === 0, `stream:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
const sync = await open(pending, "r"); await sync.sync(); await sync.close();
const restoreRoot = await mkdtemp(join(coldRoot, ".restore-"));
try {
  const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot], {stdio: ["pipe", "ignore", "pipe"]});
  const tarErrors = []; tar.stderr.on("data", c => tarErrors.push(c));
  const tarSettled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
  await pipeline(createReadStream(pending), createZstdDecompress(), tar.stdin);
  need((await tarSettled) === 0, `restore:${Buffer.concat(tarErrors).toString("utf8").slice(-300)}`);
  const compare = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
    "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
    `${host}:${remoteRoot}/`, `${restoreRoot}/${remoteName}/`], {stdio: ["ignore", "pipe", "pipe"]});
  const differences = [], compareErrors = [];
  compare.stdout.on("data", c => differences.push(c)); compare.stderr.on("data", c => compareErrors.push(c));
  const compared = new Promise((resolve, reject) => {compare.on("error", reject); compare.on("close", resolve);});
  need((await compared) === 0 && Buffer.concat(differences).length === 0,
    `compare:${Buffer.concat(compareErrors).toString("utf8").slice(-300)}`);
} finally {await rm(restoreRoot, {recursive: true, force: true});}
const digest = await fileSha(pending), archive = join(coldRoot, `run-${digest}.tar.zst`);
await link(pending, archive); await unlink(pending);
for (const [key, original] of Object.entries(resultBytes)) {
  need(sha(await command("ssh", [...sshArgs, `cat '${remoteRoot}/${key}/runs/00/result.json'`], true)) ===
    sha(original), `${key}-result-drift`);
}
const manifest = {schema_version: "are.g01-r20-exposed-transfer-cold-copy/v1",
  status: "verified-copy-source-retained", remote_root: remoteRoot,
  transfer_freeze_sha256: freezeSha, independent_audit_sha256: auditSha,
  result_sha256: Object.fromEntries(Object.entries(resultBytes).map(([key, b]) => [key, sha(b)])),
  archive_path: archive, archive_sha256: digest, archive_bytes: (await stat(archive)).size,
  verification: "Full Zstandard restore and whole-tree rsync checksum, mode and symlink dry-run",
  source_retained: true, deleted_vps_files: 0,
  claim_ceiling: "Private exposed five-language transfer only; not benchmark superiority"};
const manifestPath = join(coldRoot, `run-${digest}.json`);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: manifest.status, archive_sha256: digest,
  archive_bytes: manifest.archive_bytes, manifest_path: manifestPath}));
