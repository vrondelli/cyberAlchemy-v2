// Archive one terminal G01 r10 pair's tmpfs source trees to private WSL storage,
// fully restore/compare them, then reclaim only that exact fresh scratch root.
// All VPS pair receipts, scores, and historical campaigns remain untouched.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, readFile, readdir, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const [mode, host, campaign, slug] = process.argv.slice(2);
const need = (value, reason) => {if (!value) throw Error(`g01-r10-source-archive.${reason}`);};
need(["--check", "--apply"].includes(mode) && process.argv.length === 6, "arguments");
need(host === "root@187.77.163.194" && campaign === "g01-product-replication-r10" &&
  /^[a-z0-9-]+$/.test(slug), "scope");
const campaignRoot = `/opt/are/evolution-runtime/${campaign}`;
const pairRoot = `${campaignRoot}/${slug}`;
const scratchParent = `/tmp/are-${campaign}-source`;
const scratchRoot = `${scratchParent}/${slug}`;
const coldRoot = `/home/vlad_/are-benchmark-archive/${campaign}/pairs`;
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ClearAllForwardings=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const hex = value => /^[a-f0-9]{64}$/.test(value ?? "");

async function command(name, args, {limit = 4_000_000} = {}) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  let size = 0;
  child.stdout.on("data", chunk => {size += chunk.length; if (size <= limit) out.push(chunk);});
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  need(code === 0 && size <= limit, `${name}:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  return Buffer.concat(out);
}
const remote = commandText => command("ssh", [...sshArgs, commandText]);
const readRemote = path => remote(`cat '${path}'`);
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
async function restoreAndCompare(archive) {
  const restoreRoot = await mkdtemp(join(coldRoot, `.restore-${slug}-`));
  try {
    const tar = spawn("tar", ["-xf", "-", "-C", restoreRoot], {stdio: ["pipe", "ignore", "pipe"]});
    const errors = [];
    tar.stderr.on("data", chunk => errors.push(chunk));
    const settled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
    await pipeline(createReadStream(archive), createZstdDecompress(), tar.stdin);
    need((await settled) === 0, `restore:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
    for (const arm of ["control", "candidate"]) {
      const restored = join(restoreRoot, slug, arm, "source", "00");
      need((await stat(restored)).isDirectory(), `restored-arm:${arm}`);
      const rsync = spawn("rsync", ["-rclpn", "--delete", "--itemize-changes",
        "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
        `${host}:${scratchRoot}/${arm}/source/00/`, `${restored}/`],
      {stdio: ["ignore", "pipe", "pipe"]});
      const differences = [], compareErrors = [];
      rsync.stdout.on("data", chunk => differences.push(chunk));
      rsync.stderr.on("data", chunk => compareErrors.push(chunk));
      const compared = new Promise((resolve, reject) => {rsync.on("error", reject); rsync.on("close", resolve);});
      need((await compared) === 0, `compare:${arm}:${Buffer.concat(compareErrors).toString("utf8").slice(-300)}`);
      need(Buffer.concat(differences).length === 0, `source-drift:${arm}`);
    }
  } finally {await rm(restoreRoot, {recursive: true, force: true});}
}

const freezeBytes = await readRemote(`${campaignRoot}/CAMPAIGN-FREEZE.json`);
const freeze = JSON.parse(freezeBytes);
need(freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.status === "frozen-before-dispatch" && freeze.ordered_tasks?.some(row => row.slug === slug), "frozen-task");
const planBytes = await readRemote(`${pairRoot}/PAIR-PLAN.json`);
const plan = JSON.parse(planBytes);
need(plan.schema_version === "are.g01-fast-live-pair-plan/v1" && plan.root === pairRoot, "pair-plan");
for (const arm of ["control", "candidate"]) {
  const path = `${pairRoot}/${arm.toUpperCase()}-FREEZE.json`;
  need(plan.arms?.[arm]?.freeze_path === path && hex(plan.arms[arm].freeze_sha256), `arm-binding:${arm}`);
  const bytes = await readRemote(path);
  need(sha(bytes) === plan.arms[arm].freeze_sha256 &&
    JSON.parse(bytes).source_out === `${scratchRoot}/${arm}/source/00`, `scratch-binding:${arm}`);
}
const resultBytes = await readRemote(`${pairRoot}/PAIR-RESULT.json`);
const result = JSON.parse(resultBytes);
need(["scored", "unscored", "scoring_error"].includes(result.status), "terminal-pair");
await remote(`test -d '${scratchRoot}/control/source/00' && test -d '${scratchRoot}/candidate/source/00' && test ! -L '${scratchRoot}'`);
await mkdir(coldRoot, {recursive: true, mode: 0o700});
const existing = (await readdir(coldRoot)).filter(name => name.startsWith(`${slug}-source-`) && name.endsWith(".json") &&
  !name.endsWith(".reclaim.json") && !name.endsWith(".reclaim-intent.json"));
need(existing.length <= 1, "multiple-archives");
let archive, manifest, manifestPath;
if (existing.length === 0) {
  need(mode === "--apply", "archive-not-created");
  const pending = join(coldRoot, `${slug}-source.pending.tar.zst`);
  const handle = await open(pending, "wx", 0o600); await handle.close();
  const child = spawn("ssh", [...sshArgs, `tar -C '${scratchParent}' -I 'zstd -T1 -3' -cf - '${slug}'`],
  {stdio: ["ignore", "pipe", "pipe"]});
  const errors = [];
  child.stderr.on("data", chunk => errors.push(chunk));
  const settled = new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  await pipeline(child.stdout, createWriteStream(pending, {flags: "r+"}));
  need((await settled) === 0, `archive-stream:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const sync = await open(pending, "r"); await sync.sync(); await sync.close();
  await restoreAndCompare(pending);
  const digest = await fileSha(pending);
  archive = join(coldRoot, `${slug}-source-${digest}.tar.zst`);
  await link(pending, archive); await unlink(pending);
  need(sha(await readRemote(`${pairRoot}/PAIR-RESULT.json`)) === sha(resultBytes), "result-drift");
  manifest = {schema_version: "are.g01-r10-pair-source-cold-copy/v1", status: "verified-copy-source-retained",
    campaign, slug, pair_root: pairRoot, scratch_root: scratchRoot,
    campaign_freeze_sha256: sha(freezeBytes), pair_plan_sha256: sha(planBytes),
    pair_result_sha256: sha(resultBytes), pair_status: result.status,
    archive_path: archive, archive_sha256: digest, archive_bytes: (await stat(archive)).size,
    verification: "Full Zstandard restore; both restored source trees match VPS by rsync checksum, mode and symlink dry-run",
    source_retained_at_copy: true, historical_source_roots_removed: 0,
    claim_ceiling: "Private terminal-pair source storage only; not benchmark quality or superiority"};
  manifestPath = join(coldRoot, `${slug}-source-${digest}.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {flag: "wx", mode: 0o600});
} else {
  manifestPath = join(coldRoot, existing[0]);
  manifest = JSON.parse(await readFile(manifestPath));
  archive = manifest.archive_path;
  need(manifest.schema_version === "are.g01-r10-pair-source-cold-copy/v1" &&
    manifest.status === "verified-copy-source-retained" && manifest.campaign === campaign &&
    manifest.slug === slug && manifest.pair_root === pairRoot && manifest.scratch_root === scratchRoot &&
    manifest.campaign_freeze_sha256 === sha(freezeBytes) && manifest.pair_plan_sha256 === sha(planBytes) &&
    manifest.pair_result_sha256 === sha(resultBytes) && manifest.pair_status === result.status &&
    archive === join(coldRoot, `${slug}-source-${manifest.archive_sha256}.tar.zst`), "manifest-drift");
  need((await stat(archive)).size === manifest.archive_bytes &&
    (await fileSha(archive)) === manifest.archive_sha256, "archive-drift");
  await restoreAndCompare(archive);
}
const digest = manifest.archive_sha256;
const reclaimPath = join(coldRoot, `${slug}-source-${digest}.reclaim.json`);
const reclaimIntent = join(coldRoot, `${slug}-source-${digest}.reclaim-intent.json`);
if (mode === "--check") {
  console.log(JSON.stringify({status: "verified-source-copy-no-deletion", campaign, slug,
    archive_sha256: digest, pair_result_sha256: sha(resultBytes)}));
} else {
  need(!(await readdir(coldRoot)).includes(`${slug}-source-${digest}.reclaim.json`) &&
    !(await readdir(coldRoot)).includes(`${slug}-source-${digest}.reclaim-intent.json`), "already-reclaimed-or-intent-pending");
  const intent = {schema_version: "are.g01-r10-source-reclaim-intent/v1", status: "verified-before-removal",
    campaign, slug, exact_target: scratchRoot, archive_sha256: digest,
    pair_result_sha256: sha(resultBytes), manifest_sha256: await fileSha(manifestPath),
    created_at: new Date().toISOString()};
  await writeFile(reclaimIntent, `${JSON.stringify(intent, null, 2)}\n`, {flag: "wx", mode: 0o600});
  await remote(`test -f '${pairRoot}/PAIR-RESULT.json' && test -d '${scratchRoot}/control/source/00' && test -d '${scratchRoot}/candidate/source/00' && test ! -L '${scratchRoot}' && rm -r -- '${scratchRoot}' && test ! -e '${scratchRoot}' && test -f '${pairRoot}/PAIR-RESULT.json'`);
  need(sha(await readRemote(`${pairRoot}/PAIR-RESULT.json`)) === sha(resultBytes), "result-changed-after-reclaim");
  const receipt = {schema_version: "are.g01-r10-source-reclaim/v1", status: "fresh-pair-source-scratch-reclaimed",
    campaign, slug, removed_path: scratchRoot, preserved_pair_root: pairRoot,
    archive_path: archive, archive_sha256: digest, pair_result_sha256: sha(resultBytes),
    reclaim_intent_path: reclaimIntent,
    verification: "Archive SHA-256 and full restored-tree comparison before exact scratch-only removal",
    historical_source_roots_removed: 0, created_at: new Date().toISOString(),
    claim_ceiling: "Storage operation only; not benchmark or publication evidence"};
  await writeFile(reclaimPath, `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, campaign, slug, archive_sha256: digest,
    archive_bytes: manifest.archive_bytes, reclaim_receipt: reclaimPath}));
}
