// Cold-copy a terminal r16 overlay pair's effective source trees. VPS mounts,
// lower checkouts, upper deltas, pair evidence, and all old scratch are retained.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream, createWriteStream} from "node:fs";
import {link, mkdir, mkdtemp, open, readFile, readdir, rm, stat, unlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const [mode, host, slug] = process.argv.slice(2);
const need = (condition, reason) => {if (!condition) throw Error(`g01-r16-overlay-archive.${reason}`);};
need(["--check", "--apply"].includes(mode) && process.argv.length === 5 &&
  host === "root@187.77.163.194" && /^[a-z0-9-]+$/.test(slug ?? ""), "arguments");
const campaign = "g01-product-replication-r16";
const root = `/opt/are/evolution-runtime/${campaign}`;
const pairRoot = `${root}/${slug}`;
const scratch = `/tmp/are-${campaign}-source/${slug}`;
const coldRoot = `/home/vlad_/are-benchmark-archive/${campaign}/pairs`;
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
  "-o", "ClearAllForwardings=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const hex = value => /^[a-f0-9]{64}$/.test(value ?? "");

async function command(name, args, limit = 4_000_000) {
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
const fileSha = async path => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
};

async function restoreAndCompare(archive) {
  const restored = await mkdtemp(join(coldRoot, `.restore-${slug}-`));
  try {
    const tar = spawn("tar", ["-xf", "-", "-C", restored], {stdio: ["pipe", "ignore", "pipe"]});
    const errors = [];
    tar.stderr.on("data", chunk => errors.push(chunk));
    const settled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
    await pipeline(createReadStream(archive), createZstdDecompress(), tar.stdin);
    need((await settled) === 0, `restore:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
    for (const arm of ["control", "candidate"]) {
      const to = join(restored, slug, arm, "source", "00");
      need((await stat(to)).isDirectory(), `restored-arm:${arm}`);
      const compare = await command("rsync", ["-rclpn", "--delete", "--itemize-changes",
        "-e", "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes",
        `${host}:${scratch}/${arm}/source/00/`, `${to}/`], 1_000_000);
      need(compare.length === 0, `source-drift:${arm}`);
    }
  } finally {await rm(restored, {recursive: true, force: true});}
}

const freezeBytes = await remote(`cat '${root}/CAMPAIGN-FREEZE.json'`);
const freeze = JSON.parse(freezeBytes);
const task = freeze.ordered_tasks?.find(row => row.slug === slug);
need(freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.status === "frozen-before-dispatch" &&
  freeze.source_checkout_layout?.mode === "g01-r16-r2-single-lower-overlay-r1" && task,
"freeze");
const planBytes = await remote(`cat '${pairRoot}/PAIR-PLAN.json'`);
const plan = JSON.parse(planBytes);
need(plan.schema_version === "are.g01-fast-live-pair-plan/v1" && plan.root === pairRoot,
"pair-plan");
for (const arm of ["control", "candidate"]) {
  const path = `${pairRoot}/${arm.toUpperCase()}-FREEZE.json`;
  need(plan.arms?.[arm]?.freeze_path === path && hex(plan.arms[arm].freeze_sha256), `arm:${arm}`);
  const bytes = await remote(`cat '${path}'`), row = JSON.parse(bytes);
  need(sha(bytes) === plan.arms[arm].freeze_sha256 &&
    row.source_out === `${scratch}/${arm}/source/00` &&
    row.source_checkout_layout?.mode === freeze.source_checkout_layout.mode,
  `arm-binding:${arm}`);
  for (const name of ["base", "work"]) {
    const view = `${scratch}/${arm}/source/00/${name}`;
    const mount = (await remote(`findmnt -T '${view}' -n -o FSTYPE,TARGET`)).toString().trim();
    need(mount === `overlay ${view}`, `mount:${arm}:${name}`);
  }
}
const resultBytes = await remote(`cat '${pairRoot}/PAIR-RESULT.json'`);
const result = JSON.parse(resultBytes);
need(["scored", "unscored", "scoring_error"].includes(result.status), "terminal-pair");
await mkdir(coldRoot, {recursive: true, mode: 0o700});
const existing = (await readdir(coldRoot)).filter(name =>
  name.startsWith(`${slug}-overlay-source-`) && name.endsWith(".json"));
need(existing.length <= 1, "multiple-archives");
let manifest;
if (existing.length === 0) {
  need(mode === "--apply", "archive-not-created");
  const pending = join(coldRoot, `${slug}-overlay-source.pending.tar.zst`);
  const handle = await open(pending, "wx", 0o600); await handle.close();
  const parent = `/tmp/are-${campaign}-source`;
  const tar = spawn("ssh", [...sshArgs,
    `tar -C '${parent}' -I 'zstd -T1 -3' -cf - '${slug}'`],
  {stdio: ["ignore", "pipe", "pipe"]});
  const errors = [];
  tar.stderr.on("data", chunk => errors.push(chunk));
  const settled = new Promise((resolve, reject) => {tar.on("error", reject); tar.on("close", resolve);});
  await pipeline(tar.stdout, createWriteStream(pending, {flags: "r+"}));
  need((await settled) === 0, `archive:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  const sync = await open(pending, "r"); await sync.sync(); await sync.close();
  await restoreAndCompare(pending);
  const digest = await fileSha(pending);
  const archive = join(coldRoot, `${slug}-overlay-source-${digest}.tar.zst`);
  await link(pending, archive); await unlink(pending);
  need(sha(await remote(`cat '${pairRoot}/PAIR-RESULT.json'`)) === sha(resultBytes), "result-drift");
  manifest = {schema_version: "are.g01-r16-overlay-source-cold-copy/v1",
    status: "verified-copy-source-retained", campaign, slug,
    campaign_freeze_sha256: sha(freezeBytes), pair_plan_sha256: sha(planBytes),
    pair_result_sha256: sha(resultBytes), pair_status: result.status,
    archive_path: archive, archive_sha256: digest, archive_bytes: (await stat(archive)).size,
    verification: "Full Zstandard restore; both effective source trees match live VPS overlay views by rsync checksum, mode and symlink dry-run",
    source_retained: true, vps_deletions: 0,
    claim_ceiling: "Private terminal-pair source evidence only; not quality or superiority",
    open_questions: ["Will subsequent pairs stay within storage headroom?"]};
  await writeFile(join(coldRoot, `${slug}-overlay-source-${digest}.json`),
    JSON.stringify(manifest, null, 2) + "\n", {flag: "wx", mode: 0o600});
} else {
  manifest = JSON.parse(await readFile(join(coldRoot, existing[0])));
  need(manifest.schema_version === "are.g01-r16-overlay-source-cold-copy/v1" &&
    manifest.status === "verified-copy-source-retained" && manifest.campaign === campaign &&
    manifest.slug === slug && manifest.pair_result_sha256 === sha(resultBytes) &&
    manifest.campaign_freeze_sha256 === sha(freezeBytes) &&
    manifest.pair_plan_sha256 === sha(planBytes) &&
    manifest.archive_path === join(coldRoot, `${slug}-overlay-source-${manifest.archive_sha256}.tar.zst`),
  "manifest");
  need((await stat(manifest.archive_path)).size === manifest.archive_bytes &&
    (await fileSha(manifest.archive_path)) === manifest.archive_sha256, "archive-drift");
  await restoreAndCompare(manifest.archive_path);
}
console.log(JSON.stringify({status: "verified-overlay-source-copy-no-deletion", slug,
  archive_sha256: manifest.archive_sha256, archive_bytes: manifest.archive_bytes,
  pair_result_sha256: manifest.pair_result_sha256}));
