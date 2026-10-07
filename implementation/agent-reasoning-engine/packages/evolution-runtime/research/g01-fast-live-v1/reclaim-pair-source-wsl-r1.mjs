// Verify a terminal G01 pair's WSL source archive before reclaiming only its
// fresh r8 source scratch. All plans, seals, scores, receipts and old campaigns
// remain on the VPS. Default mode is read-only; --apply is r8-only.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream} from "node:fs";
import {mkdtemp, readFile, rm, stat, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const [mode, host, campaign, slug, archiveSha] = process.argv.slice(2);
const need = (condition, reason) => { if (!condition) throw Error(`g01-source-reclaim.${reason}`); };
need(["--check", "--apply"].includes(mode) && process.argv.length === 7, "arguments");
need(/^[A-Za-z0-9_.@-]+$/.test(host ?? ""), "host");
need(/^g01-product-replication-r[0-9]+$/.test(campaign ?? ""), "campaign");
need(/^[a-z0-9-]+$/.test(slug ?? ""), "slug");
need(/^[a-f0-9]{64}$/.test(archiveSha ?? ""), "archive-sha");
need(mode !== "--apply" || campaign === "g01-product-replication-r8", "apply-only-fresh-r8");

const remoteRoot = `/opt/are/evolution-runtime/${campaign}`;
const pairRoot = `${remoteRoot}/${slug}`;
const coldRoot = join("/home/vlad_/are-benchmark-archive", campaign, "pairs");
const stem = `${slug}-source-${archiveSha}`;
const archivePath = join(coldRoot, `${stem}.tar.zst`);
const manifestPath = join(coldRoot, `${stem}.json`);
const receiptPath = join(coldRoot, `${stem}.reclaim.json`);
const intentPath = join(coldRoot, `${stem}.reclaim-intent.json`);
const sshArgs = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

async function remote(command) {
  const child = spawn("ssh", [...sshArgs, command], {stdio: ["ignore", "pipe", "pipe"]});
  const chunks = [], errors = [];
  child.stdout.on("data", chunk => chunks.push(chunk));
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  need(code === 0, `remote:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  return Buffer.concat(chunks);
}

async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function compareTree(arm, restoreRoot) {
  const compare = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
    "-e", "ssh -o BatchMode=yes -o ConnectTimeout=10",
    `${host}:${pairRoot}/${arm}/source/`, `${restoreRoot}/${arm}/source/`],
  {stdio: ["ignore", "pipe", "pipe"]});
  const settled = new Promise((resolve, reject) => {
    compare.on("error", reject);
    compare.on("close", resolve);
  });
  const differences = [], errors = [];
  compare.stdout.on("data", chunk => differences.push(chunk));
  compare.stderr.on("data", chunk => errors.push(chunk));
  need((await settled) === 0, `rsync:${arm}:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  need(Buffer.concat(differences).length === 0, `source-drift:${arm}`);
}

const manifest = JSON.parse(await readFile(manifestPath));
need(manifest.schema_version === "are.g01-wsl-pair-source-cold-copy/v1" &&
  manifest.status === "verified-copy-source-retained" && manifest.campaign === campaign &&
  manifest.slug === slug && manifest.remote_pair_root === pairRoot &&
  manifest.archive_path === archivePath && manifest.archive_sha256 === archiveSha &&
  manifest.source_retained === true && manifest.deleted_vps_files === 0, "manifest-binding");
need((await stat(archivePath)).size === manifest.archive_bytes &&
  (await fileSha(archivePath)) === archiveSha, "archive-integrity");
const freeze = JSON.parse(await remote(`cat '${remoteRoot}/CAMPAIGN-FREEZE.json'`));
need(freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.ordered_tasks?.some(task => task.slug === slug), "frozen-task-binding");
const resultBytes = await remote(`cat '${pairRoot}/PAIR-RESULT.json'`);
const result = JSON.parse(resultBytes);
need(["scored", "unscored", "scoring_error"].includes(result.status) &&
  result.status === manifest.pair_status && sha(resultBytes) === manifest.pair_result_sha256,
  "terminal-result-binding");
for (const arm of ["control", "candidate"])
  await remote(`test -d '${pairRoot}/${arm}/source/00' && test ! -L '${pairRoot}/${arm}/source'`);

const restoreRoot = await mkdtemp(join(coldRoot, `.reclaim-check-${slug}-`));
try {
  const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot], {stdio: ["pipe", "ignore", "pipe"]});
  const settled = new Promise((resolve, reject) => {
    tar.on("error", reject);
    tar.on("close", resolve);
  });
  const errors = [];
  tar.stderr.on("data", chunk => errors.push(chunk));
  await pipeline(createReadStream(archivePath), createZstdDecompress(), tar.stdin);
  need((await settled) === 0, `restore:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  await compareTree("control", restoreRoot);
  await compareTree("candidate", restoreRoot);
} finally {
  await rm(restoreRoot, {recursive: true, force: true});
}

if (mode === "--check") {
  console.log(JSON.stringify({status: "reclaim-preflight-passed-no-deletion", campaign, slug,
    archive_sha256: archiveSha, pair_result_sha256: sha(resultBytes)}));
} else {
  // Both exact targets are under the future frozen r8 pair. No wildcard, old
  // campaign path, or enclosing pair root can be supplied by the caller.
  const targets = ["control", "candidate"].map(arm => `${pairRoot}/${arm}/source`);
  const intent = {schema_version: "are.g01-r8-source-scratch-reclaim-intent/v1", status: "verified-before-removal",
    campaign, slug, archive_sha256: archiveSha, pair_result_sha256: sha(resultBytes),
    exact_targets: targets, archive_path: archivePath, created_at: new Date().toISOString()};
  // An existing intent or receipt requires inspection, never an implicit retry.
  await writeFile(intentPath, JSON.stringify(intent, null, 2) + "\n", {flag: "wx", mode: 0o600});
  await remote(`test -f '${pairRoot}/PAIR-RESULT.json' && test ! -L '${targets[0]}' && test ! -L '${targets[1]}' && rm -r -- '${targets[0]}' '${targets[1]}' && test ! -e '${targets[0]}' && test ! -e '${targets[1]}' && test -f '${pairRoot}/PAIR-RESULT.json'`);
  const resultAgain = await remote(`cat '${pairRoot}/PAIR-RESULT.json'`);
  need(sha(resultAgain) === sha(resultBytes), "result-changed-after-reclaim");
  const receipt = {schema_version: "are.g01-r8-source-scratch-reclaim/v1", status: "fresh-source-scratch-reclaimed",
    campaign, slug, archive_sha256: archiveSha, archive_path: archivePath,
    pair_result_sha256: sha(resultBytes), reclaim_intent_path: intentPath, removed_paths: targets,
    preserved_paths: [pairRoot, `${pairRoot}/PAIR-RESULT.json`],
    verification: "archive SHA-256 and full restored-tree checksum/symlink/mode comparison before exact source-only removal",
    created_at: new Date().toISOString(), claim_ceiling: "Storage operation only; not benchmark or publication evidence"};
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n", {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, campaign, slug, receipt_path: receiptPath}));
}
