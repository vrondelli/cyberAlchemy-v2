// Reclaim only the source checkout copies of one terminal, exposed G02 pair.
// The complete source tree is cold-restored and checksum-compared first.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, readFile, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const host = "root@187.77.163.194";
const slug = "g02-cross-layer-pr3-elem-5c001746";
const remotePair = `/opt/are-benchmark-runs/${slug}`;
const remoteSources = `${remotePair}/sources`;
const decisionSha = "2d04425f5ae3b89669d316be842b253055b82507c839af94b3e23127d23d06b0";
const coldRoot = "/home/vlad_/are-benchmark-archive/g02-cross-layer-pr3-elem-5c001746-source-reclaim-20261001";
const sshArgs = ["-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
  "-o", "ClearAllForwardings=yes", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g02-source-reclaim.${reason}`);};

async function command(name, args, limit = 1_000_000) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const output = [], errors = [];
  let size = 0;
  child.stdout.on("data", chunk => {size += chunk.length; if (size <= limit) output.push(chunk);});
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  need(code === 0 && size <= limit,
    `${name}:${Buffer.concat(errors).toString("utf8").slice(-250)}`);
  return Buffer.concat(output);
}
const remote = text => command("ssh", [...sshArgs, text]);
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

const decisionPath = `${remotePair}/PAIR-DECISION.json`;
const decisionBytes = await remote(`cat '${decisionPath}'`);
const decision = JSON.parse(decisionBytes);
need(sha(decisionBytes) === decisionSha &&
  decision.schema_version === "are.g02-cross-layer-pair-decision/v1" &&
  decision.task_posture === "source-only development pair, not globally unseen" &&
  decision.instance_id === "SWE-Bench-Pro__javascript__maintenance__bugfix__5c001746" &&
  decision.quality?.are?.score_sha256 && decision.quality?.dsh?.score_sha256,
"terminal-pair-drift");
await remote(`test -d '${remoteSources}' && test ! -L '${remoteSources}' && test -d '${remoteSources}/session/base' && test -d '${remoteSources}/session/work'`);
const occupied = Number((await remote(`du -sx -B1 '${remoteSources}' | cut -f1`)).toString().trim());
need(Number.isSafeInteger(occupied) && occupied > 1_000_000_000, "unexpected-source-size");
const processes = (await remote(`ps -eo args= | grep -F '${slug}' | grep -v 'grep -F' || :`)).toString().trim();
need(processes === "", "live-process-references-target");
await mkdir(coldRoot, {recursive: true, mode: 0o700});
const pending = join(coldRoot, "sources.pending.tar.zst");
const handle = await open(pending, "wx", 0o600); await handle.close();
const source = spawn("ssh", [...sshArgs,
  `tar -C '${remotePair}' -I 'zstd -T1 -3' -cf - sources`],
{stdio: ["ignore", "pipe", "pipe"]});
const streamErrors = [];
source.stderr.on("data", chunk => streamErrors.push(chunk));
const sourceDone = new Promise((resolve, reject) => {source.on("error", reject); source.on("close", resolve);});
await pipeline(source.stdout, createWriteStream(pending, {flags: "r+"}));
need((await sourceDone) === 0,
  `archive-stream:${Buffer.concat(streamErrors).toString("utf8").slice(-250)}`);
const sync = await open(pending, "r"); await sync.sync(); await sync.close();
const restoreRoot = await mkdtemp(join(coldRoot, ".restore-"));
try {
  const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot],
    {stdio: ["pipe", "ignore", "pipe"]});
  const tarErrors = [];
  tar.stderr.on("data", chunk => tarErrors.push(chunk));
  const tarDone = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
  await pipeline(createReadStream(pending), createZstdDecompress(), tar.stdin);
  need((await tarDone) === 0,
    `restore:${Buffer.concat(tarErrors).toString("utf8").slice(-250)}`);
  const restored = join(restoreRoot, "sources");
  need((await stat(restored)).isDirectory(), "restore-missing");
  const compare = await command("rsync", ["-rclpn", "--delete", "--itemize-changes",
    "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
    `${host}:${remoteSources}/`, `${restored}/`]);
  need(compare.length === 0, "restore-source-difference");
} finally {await rm(restoreRoot, {recursive: true, force: true});}
const digest = await fileSha(pending);
const archive = join(coldRoot, `sources-${digest}.tar.zst`);
await link(pending, archive); await unlink(pending);
need(sha(await remote(`cat '${decisionPath}'`)) === decisionSha, "decision-changed");
const manifest = {schema_version: "are.g02-terminal-source-cold-copy/v1",
  status: "verified-copy-source-retained", exact_remote_target: remoteSources,
  preserved_pair_root: remotePair, decision_sha256: decisionSha,
  occupied_bytes_before: occupied, archive_path: archive, archive_sha256: digest,
  archive_bytes: (await stat(archive)).size,
  verification: "Complete tar+Zstandard restore and whole-tree rsync checksum, mode and symlink comparison",
  source_retained_at_copy: true, claim_ceiling: "Storage only; terminal G02 development score unchanged"};
const manifestPath = join(coldRoot, "ARCHIVE-MANIFEST.json");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {flag: "wx", mode: 0o600});
const manifestSha = await fileSha(manifestPath);
const intentPath = join(coldRoot, "RECLAIM-INTENT.json");
await writeFile(intentPath, `${JSON.stringify({schema_version: "are.g02-terminal-source-reclaim-intent/v1",
  exact_remote_target: remoteSources, decision_sha256: decisionSha,
  archive_sha256: digest, manifest_sha256: manifestSha}, null, 2)}\n`,
{flag: "wx", mode: 0o600});
await remote(`test "$(sha256sum '${decisionPath}' | cut -d ' ' -f1)" = '${decisionSha}' && test -d '${remoteSources}' && test ! -L '${remoteSources}' && rm -r -- '${remoteSources}' && test ! -e '${remoteSources}' && test -f '${decisionPath}'`);
need(sha(await remote(`cat '${decisionPath}'`)) === decisionSha, "decision-changed-after-reclaim");
const rootFree = Number((await remote("df -B1 --output=avail / | tail -n 1")).toString().trim());
const receipt = {schema_version: "are.g02-terminal-source-reclaim/v1", status: "exact-source-subtree-reclaimed",
  removed_path: remoteSources, preserved_pair_root: remotePair, recovered_bytes: occupied,
  decision_sha256: decisionSha, archive_sha256: digest, manifest_sha256: manifestSha,
  root_free_bytes_after: rootFree, recoverable_from: archive,
  claim_ceiling: "Storage operation only; no benchmark superiority claim"};
const receiptPath = join(coldRoot, "RECLAIM-RECEIPT.json");
const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
await writeFile(receiptPath, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, recovered_bytes: occupied,
  root_free_bytes_after: rootFree, archive_sha256: digest,
  archive_bytes: manifest.archive_bytes, receipt_sha256: sha(bytes)}));
