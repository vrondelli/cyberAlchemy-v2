// Pull one terminal G01 pair's source checkouts into private WSL cold storage.
// This tool never deletes or modifies the VPS pair, and does not dispatch a model.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, readFile, readdir, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const [host, campaign, slug] = process.argv.slice(2);
const need = (condition, reason) => { if (!condition) throw Error(`g01-pair-cold-copy.${reason}`); };
need(/^[A-Za-z0-9_.@-]+$/.test(host ?? ""), "host");
need(/^g01-product-replication-r[0-9]+$/.test(campaign ?? ""), "campaign");
need(/^[a-z0-9-]+$/.test(slug ?? ""), "slug");
need(process.argv.length === 5, "arguments");

const remoteRoot = `/opt/are/evolution-runtime/${campaign}/${slug}`;
const coldRoot = join("/home/vlad_/are-benchmark-archive", campaign, "pairs");
const sshArgs = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

async function remote(command, {binary = false} = {}) {
  const child = spawn("ssh", [...sshArgs, command], {stdio: ["ignore", "pipe", "pipe"]});
  const output = [], errors = [];
  child.stdout.on("data", chunk => output.push(chunk));
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  need(code === 0, `remote:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const bytes = Buffer.concat(output);
  return binary ? bytes : bytes.toString("utf8");
}

async function digestFile(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function checkArchive(path) {
  const tar = spawn("tar", ["-tf", "-"], {stdio: ["pipe", "pipe", "pipe"]});
  const settled = new Promise((resolve, reject) => {
    tar.on("error", reject);
    tar.on("close", resolve);
  });
  const entries = [];
  const errors = [];
  tar.stdout.on("data", chunk => entries.push(chunk));
  tar.stderr.on("data", chunk => errors.push(chunk));
  await pipeline(createReadStream(path), createZstdDecompress(), tar.stdin);
  const code = await settled;
  need(code === 0, `tar-read:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const listing = Buffer.concat(entries).toString("utf8");
  need(listing.includes("control/source/") && listing.includes("candidate/source/"), "missing-arm-source");
  return listing.split("\n").filter(Boolean).length;
}

async function checkRestore(path) {
  const restoreRoot = await mkdtemp(join(coldRoot, `.restore-${slug}-`));
  try {
    const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot], {stdio: ["pipe", "ignore", "pipe"]});
    const settled = new Promise((resolve, reject) => {
      tar.on("error", reject);
      tar.on("close", resolve);
    });
    const errors = [];
    tar.stderr.on("data", chunk => errors.push(chunk));
    await pipeline(createReadStream(path), createZstdDecompress(), tar.stdin);
    need((await settled) === 0, `tar-restore:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
    const checked = [];
    for (const arm of ["control", "candidate"]) {
      const relative = `${arm}/source/00/base/.git/HEAD`;
      const remoteHash = (await remote(`sha256sum '${remoteRoot}/${relative}'`)).slice(0, 64);
      const restoredHash = sha(await readFile(join(restoreRoot, relative)));
      need(remoteHash === restoredHash, `${arm}-restore-mismatch`);
      checked.push(relative);
      const compare = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
        "-e", "ssh -o BatchMode=yes -o ConnectTimeout=10",
        `${host}:${remoteRoot}/${arm}/source/`, `${restoreRoot}/${arm}/source/`],
      {stdio: ["ignore", "pipe", "pipe"]});
      const settledCompare = new Promise((resolve, reject) => {
        compare.on("error", reject);
        compare.on("close", resolve);
      });
      const differences = [], compareErrors = [];
      compare.stdout.on("data", chunk => differences.push(chunk));
      compare.stderr.on("data", chunk => compareErrors.push(chunk));
      const compareCode = await settledCompare;
      need(compareCode === 0, `${arm}-rsync:${Buffer.concat(compareErrors).toString("utf8").slice(-300)}`);
      need(Buffer.concat(differences).length === 0, `${arm}-source-tree-diff`);
    }
    return checked;
  } finally {
    await rm(restoreRoot, {recursive: true, force: true});
  }
}

const resultBytes = await remote(`cat '${remoteRoot}/PAIR-RESULT.json'`, {binary: true});
const result = JSON.parse(resultBytes);
need(["scored", "unscored", "scoring_error"].includes(result.status), "nonterminal-pair");
await remote(`test -d '${remoteRoot}/control/source/00' && test -d '${remoteRoot}/candidate/source/00'`);
await mkdir(coldRoot, {recursive: true, mode: 0o700});
need(!(await readdir(coldRoot)).some(name => name.startsWith(`${slug}-source-`) && name.endsWith(".json")), "already-archived");
const pending = join(coldRoot, `${slug}-source.pending.tar.zst`);
const pendingHandle = await open(pending, "wx", 0o600);
await pendingHandle.close();

const command = `tar -C '${remoteRoot}' -I 'zstd -T1 -3' -cf - control/source candidate/source`;
const child = spawn("ssh", [...sshArgs, command], {stdio: ["ignore", "pipe", "pipe"]});
const settled = new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("close", resolve);
});
const errors = [];
child.stderr.on("data", chunk => errors.push(chunk));
await pipeline(child.stdout, createWriteStream(pending, {flags: "r+"}));
const code = await settled;
need(code === 0, `archive-stream:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
const handle = await open(pending, "r");
await handle.sync();
await handle.close();
const memberCount = await checkArchive(pending);
const restoredSamples = await checkRestore(pending);
const archiveSha = await digestFile(pending);
const archive = join(coldRoot, `${slug}-source-${archiveSha}.tar.zst`);
await link(pending, archive); // Exclusive: never replace a prior content-addressed archive.
await unlink(pending);
const resultAgain = await remote(`cat '${remoteRoot}/PAIR-RESULT.json'`, {binary: true});
need(sha(resultAgain) === sha(resultBytes), "pair-result-drift");
const manifest = {
  schema_version: "are.g01-wsl-pair-source-cold-copy/v1",
  status: "verified-copy-source-retained",
  campaign, slug, remote_pair_root: remoteRoot,
  pair_result_sha256: sha(resultBytes), pair_status: result.status,
  archive_path: archive, archive_sha256: archiveSha,
  archive_bytes: (await stat(archive)).size, member_count: memberCount,
  verification: "full Node Zstandard decompression and tar listing; restored source trees matched VPS by rsync checksum, symlink and mode dry-run",
  restored_samples: restoredSamples,
  source_retained: true, deleted_vps_files: 0,
  claim_ceiling: "Private storage evidence only; no benchmark or publication result",
  open_questions: ["Exact future scratch-pruning policy and independent restore test remain separate."],
};
const manifestPath = join(coldRoot, `${slug}-source-${archiveSha}.json`);
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: manifest.status, archive_path: archive, archive_sha256: archiveSha,
  archive_bytes: manifest.archive_bytes, member_count: memberCount, manifest_path: manifestPath}));
