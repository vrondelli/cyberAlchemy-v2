// Verify G01 r10's exact private WSL per-pair source archives and reclaim chain.
// --check reads current state; --write requires 24 verified cold copies and
// creates an immutable ARCHIVE-AUDIT.json. This never deletes source or receipts.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream} from "node:fs";
import {readFile, readdir, stat, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {Writable} from "node:stream";
import {pipeline} from "node:stream/promises";
import {createZstdDecompress} from "node:zlib";

const mode = process.argv[2];
const need = (value, reason) => {if (!value) throw Error(`g01-r10-cold-audit.${reason}`);};
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const campaign = "g01-product-replication-r10";
const campaignRoot = `/opt/are/evolution-runtime/${campaign}`;
const coldRoot = `/home/vlad_/are-benchmark-archive/${campaign}/pairs`;
const freezeSha = "44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c";
const host = "root@187.77.163.194";
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
  "-o", "ClearAllForwardings=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const hex = value => /^[a-f0-9]{64}$/.test(value ?? "");

async function remote(command) {
  const child = spawn("ssh", [...sshArgs, command], {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  child.stdout.on("data", chunk => out.push(chunk));
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject); child.on("close", resolve);
  });
  need(code === 0, `ssh:${Buffer.concat(errors).toString("utf8").slice(-300)}`);
  return Buffer.concat(out);
}
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
async function verifyZstd(path) {
  let decompressed = 0;
  await pipeline(createReadStream(path), createZstdDecompress(), new Writable({
    write(chunk, _encoding, done) {decompressed += chunk.length; done();}
  }));
  need(decompressed > 0, `empty-stream:${path}`);
  return decompressed;
}

const freezeBytes = await remote(`cat '${campaignRoot}/CAMPAIGN-FREEZE.json'`);
need(sha(freezeBytes) === freezeSha, "freeze-drift");
const freeze = JSON.parse(freezeBytes);
need(freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.status === "frozen-before-dispatch" && freeze.ordered_tasks?.length === 24,
  "freeze-shape");
const files = await readdir(coldRoot);
const rows = [];
for (const task of freeze.ordered_tasks) {
  const slug = task.slug;
  need(/^[a-z0-9-]+$/.test(slug), `slug:${slug}`);
  const manifests = files.filter(name => name.startsWith(`${slug}-source-`) &&
    /^[a-f0-9]{64}\.json$/.test(name.slice(`${slug}-source-`.length)));
  need(manifests.length <= 1, `multiple-manifests:${slug}`);
  if (!manifests.length) {
    rows.push({slug, status: "pending-archive"});
    continue;
  }
  const manifestPath = join(coldRoot, manifests[0]);
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  const digest = manifest.archive_sha256;
  const prefix = `${slug}-source-${digest}`;
  const archivePath = join(coldRoot, `${prefix}.tar.zst`);
  const intentPath = join(coldRoot, `${prefix}.reclaim-intent.json`);
  const reclaimPath = join(coldRoot, `${prefix}.reclaim.json`);
  need(hex(digest) && manifestPath === join(coldRoot, `${prefix}.json`) &&
    manifest.schema_version === "are.g01-r10-pair-source-cold-copy/v1" &&
    manifest.status === "verified-copy-source-retained" &&
    manifest.campaign === campaign && manifest.slug === slug &&
    manifest.pair_root === `${campaignRoot}/${slug}` &&
    manifest.scratch_root === `/tmp/are-${campaign}-source/${slug}` &&
    manifest.campaign_freeze_sha256 === freezeSha &&
    manifest.pair_plan_sha256 === task.pair_plan_sha256 &&
    hex(manifest.pair_result_sha256) &&
    ["scored", "unscored", "scoring_error"].includes(manifest.pair_status) &&
    manifest.archive_path === archivePath && manifest.historical_source_roots_removed === 0,
    `manifest:${slug}`);
  need((await stat(archivePath)).size === manifest.archive_bytes &&
    (await fileSha(archivePath)) === digest, `archive-sha:${slug}`);
  const decompressedBytes = await verifyZstd(archivePath);
  if (!files.includes(`${prefix}.reclaim-intent.json`) ||
      !files.includes(`${prefix}.reclaim.json`)) {
    rows.push({slug, status: "pending-reclaim", archive_sha256: digest});
    continue;
  }
  const intent = JSON.parse(await readFile(intentPath));
  const reclaim = JSON.parse(await readFile(reclaimPath));
  need(intent.schema_version === "are.g01-r10-source-reclaim-intent/v1" &&
    intent.status === "verified-before-removal" &&
    intent.campaign === campaign && intent.slug === slug &&
    intent.exact_target === manifest.scratch_root &&
    intent.archive_sha256 === digest &&
    intent.pair_result_sha256 === manifest.pair_result_sha256 &&
    intent.manifest_sha256 === sha(manifestBytes) &&
    reclaim.schema_version === "are.g01-r10-source-reclaim/v1" &&
    reclaim.status === "fresh-pair-source-scratch-reclaimed" &&
    reclaim.campaign === campaign && reclaim.slug === slug &&
    reclaim.removed_path === manifest.scratch_root &&
    reclaim.preserved_pair_root === manifest.pair_root &&
    reclaim.archive_path === archivePath && reclaim.archive_sha256 === digest &&
    reclaim.pair_result_sha256 === manifest.pair_result_sha256 &&
    reclaim.reclaim_intent_path === intentPath &&
    reclaim.historical_source_roots_removed === 0,
    `reclaim-chain:${slug}`);
  const remoteHashes = (await remote(`sha256sum '${task.pair_plan_path}' '${campaignRoot}/${slug}/PAIR-RESULT.json' && test ! -e '${manifest.scratch_root}'`))
    .toString("utf8").trim().split("\n").map(line => line.split(/\s+/)[0]);
  need(remoteHashes.length === 2 && remoteHashes[0] === manifest.pair_plan_sha256 &&
    remoteHashes[1] === manifest.pair_result_sha256, `vps-pair-drift:${slug}`);
  rows.push({slug, status: "verified", pair_status: manifest.pair_status,
    manifest_sha256: sha(manifestBytes), reclaim_sha256: sha(await readFile(reclaimPath)),
    archive_sha256: digest, archive_bytes: manifest.archive_bytes,
    decompressed_bytes: decompressedBytes});
}
const verified = rows.filter(row => row.status === "verified").length;
const audit = {schema_version: "are.g01-r10-wsl-source-archive-audit/v1",
  status: verified === 24 ? "complete" : "partial", campaign,
  campaign_freeze_sha256: freezeSha, planned_pairs: 24, verified_pairs: verified,
  pending_pairs: 24 - verified, rows,
  verification: "SHA-256, complete Zstandard stream, manifest/intent/reclaim chain, exact VPS plan/result hashes and absent reclaimed scratch",
  claim_ceiling: "Private source preservation/integrity only; benchmark quality and superiority require separate audits",
  authority_effect: "none"};
if (mode === "--write") {
  need(verified === 24, "campaign-archives-incomplete");
  await writeFile(join(coldRoot, "ARCHIVE-AUDIT.json"),
    `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, planned_pairs: 24,
  verified_pairs: verified, pending_pairs: audit.pending_pairs}));
