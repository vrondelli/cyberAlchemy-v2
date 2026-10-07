// WSL coordinator for one-at-a-time G01 r8 pairs. --check is read-only.
// --run requires a recent same-account tokenizer + tiny-generation receipt.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream} from "node:fs";
import {readdir, readFile, stat} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const [mode, host, campaign, freezeSha, readyPath, readySha] = process.argv.slice(2);
const need = (value, reason) => { if (!value) throw Error(`g01-serial.${reason}`); };
need(["--check", "--run"].includes(mode), "mode");
need(/^[A-Za-z0-9_.@-]+$/.test(host ?? ""), "host");
need(/^g01-product-replication-r[0-9]+$/.test(campaign ?? ""), "campaign");
need(/^[a-f0-9]{64}$/.test(freezeSha ?? ""), "freeze-sha");
need(mode !== "--run" || (campaign === "g01-product-replication-r8" &&
  /^\/opt\/are\/evolution-runtime\/g01-r8-provider-readiness\/[A-Za-z0-9_-]+\/READY\.json$/.test(readyPath ?? "") &&
  /^[a-f0-9]{64}$/.test(readySha ?? "")), "run-readiness-arguments");
need(process.argv.length === (mode === "--run" ? 8 : 6), "arguments");

const root = `/opt/are/evolution-runtime/${campaign}`;
const coldRoot = join("/home/vlad_/are-benchmark-archive", campaign, "pairs");
const sshArgs = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", host];
const nodePath = "/opt/are/evolution-runtime/g01-toolchain-r3/node";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
async function fileSha(path) {const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex");}
const safePath = path => typeof path === "string" && /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path) && !path.includes("/../");
// No-model four-checkout sample of the largest selected r8 task on the VPS root
// filesystem: 701,771,776 allocated bytes. Not a live-run peak bound.
// Retain 1 GiB on root plus 256 MiB for logs and measurement uncertainty.
const minFreeBytes = 1_073_741_824 + 701_771_776 + 268_435_456;

async function command(name, args, {maxBytes = 4_000_000} = {}) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], err = [];
  let outputBytes = 0;
  child.stdout.on("data", chunk => {outputBytes += chunk.length; if (outputBytes <= maxBytes) out.push(chunk);});
  child.stderr.on("data", chunk => err.push(chunk));
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  need(outputBytes <= maxBytes, `${name}-output-too-large`);
  need(code === 0, `${name}-failed:${Buffer.concat(err).toString("utf8").slice(-400)}`);
  return Buffer.concat(out);
}
const ssh = remoteCommand => command("ssh", [...sshArgs, remoteCommand]);
const readRemote = async path => {need(safePath(path), "remote-path"); return ssh(`cat '${path}'`);};
const existsRemote = async path => {need(safePath(path), "remote-path"); return (await ssh(`if test -f '${path}'; then printf yes; else printf no; fi`)).toString() === "yes";};
const freeRemote = async () => {
  const output = (await ssh("df -B1 --output=avail /opt/are/evolution-runtime | tail -n 1")).toString().trim();
  need(/^\d+$/.test(output), "disk-free-parse");
  return Number(output);
};

const freezeBytes = await readRemote(`${root}/CAMPAIGN-FREEZE.json`);
need(sha(freezeBytes) === freezeSha, "freeze-drift");
const freeze = JSON.parse(freezeBytes);
need(freeze.schema_version === "are.g01-campaign-freeze/v1" && freeze.status === "frozen-before-dispatch" &&
  freeze.model === "glm-5.3-flash" && freeze.context_limit === 8000 && freeze.ordered_tasks?.length === 24,
"freeze-shape");
need(safePath(freeze.definition_path) && /^[a-f0-9]{64}$/.test(freeze.definition_sha256), "definition-binding");
const definitionBytes = await readRemote(freeze.definition_path);
need(sha(definitionBytes) === freeze.definition_sha256, "definition-drift");
const definition = JSON.parse(definitionBytes);
need(definition.schema_version === "are.g01-campaign-definition/v1" && definition.root === root &&
  safePath(definition.source_root), "definition-shape");
const slugs = new Set();
for (const task of freeze.ordered_tasks) {
  need(/^[a-z0-9-]+$/.test(task.slug) && !slugs.has(task.slug), "task-slug");
  slugs.add(task.slug);
  need(task.pair_plan_path === `${root}/${task.slug}/PAIR-PLAN.json` &&
    /^[a-f0-9]{64}$/.test(task.pair_plan_sha256), "pair-plan-binding");
}

const free = await freeRemote();
if (mode === "--check") {
  console.log(JSON.stringify({status: "read-only-serial-preflight", campaign, freeze_sha256: freezeSha,
    tasks: freeze.ordered_tasks.length, free_bytes: free, minimum_before_new_pair_bytes: minFreeBytes,
    disk_floor_pass: free >= minFreeBytes, model_calls: 0, source_reclaims: 0}));
  process.exit(0);
}

// This fresh receipt is bound to both provider operations; the producer and
// exact status fields must be independently audited before using --run.
const readyBytes = await readRemote(readyPath);
need(sha(readyBytes) === readySha, "provider-receipt-drift");
const ready = JSON.parse(readyBytes);
need(ready.schema_version === "are.g01-provider-readiness/v1" && ready.status === "ready" &&
  ready.model === "glm-5.3-flash" && ready.tokenizer?.status === 200 &&
  Number.isSafeInteger(ready.tokenizer?.prompt_tokens) && ready.tokenizer.prompt_tokens > 0 &&
  ready.tiny_generation?.status === 200 && Number.isSafeInteger(ready.tiny_generation?.output_tokens) &&
  ready.tiny_generation.output_tokens > 0 && ready.automatic_retries === 0 &&
  ready.provider_host_fingerprint_sha256 === "bb6900a580e91ec8efa83d491ba9493cd8ae782c69bafaa94d12cfc856f27e2f" &&
  ready.gateway_container_image === "sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361" &&
  Number.isFinite(Date.parse(ready.checked_at)) && Date.now() - Date.parse(ready.checked_at) < 600_000 &&
  Date.now() >= Date.parse(ready.checked_at), "provider-not-ready");
need(free >= minFreeBytes, "disk-floor-before-first-pair");

const sourceScript = `${definition.source_root}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs`;
const sourcePin = freeze.sources?.find(source => source.path === sourceScript);
need(safePath(sourceScript) && /^[a-f0-9]{64}$/.test(sourcePin?.sha256 ?? "") &&
  sha(await readRemote(sourceScript)) === sourcePin.sha256, "runner-source-binding");
const here = fileURLToPath(new URL(".", import.meta.url));
const archiveTool = join(here, "archive-pair-source-wsl-r1.mjs");
const reclaimTool = join(here, "reclaim-pair-source-wsl-r1.mjs");
let processed = 0;
for (const task of freeze.ordered_tasks) {
  const resultPath = `${root}/${task.slug}/PAIR-RESULT.json`;
  if (!(await existsRemote(resultPath))) {
    need((await freeRemote()) >= minFreeBytes, `disk-floor:${task.slug}`);
    const output = await ssh(`'${nodePath}' '${sourceScript}' '${task.pair_plan_path}' '${task.pair_plan_sha256}'`);
    need(output.length > 0 && await existsRemote(resultPath), `pair-not-terminal:${task.slug}`);
  }
  const result = JSON.parse(await readRemote(resultPath));
  need(["scored", "unscored", "scoring_error"].includes(result.status), `pair-result:${task.slug}`);
  let archives = [];
  try {archives = (await readdir(coldRoot)).filter(name => name.startsWith(`${task.slug}-source-`) && name.endsWith(".json") && !name.endsWith(".reclaim.json") && !name.endsWith(".reclaim-intent.json"));}
  catch (error) {if (error.code !== "ENOENT") throw error;}
  need(archives.length <= 1, `multiple-cold-archives:${task.slug}`);
  let digest;
  if (archives.length === 0) {
    const output = await command(process.execPath, [archiveTool, host, campaign, task.slug]);
    digest = JSON.parse(output).archive_sha256;
  } else digest = archives[0].slice(`${task.slug}-source-`.length, -".json".length);
  need(/^[a-f0-9]{64}$/.test(digest), `cold-digest:${task.slug}`);
  const reclaimReceipt = join(coldRoot, `${task.slug}-source-${digest}.reclaim.json`);
  let reclaimed = false;
  try {const receipt = JSON.parse(await readFile(reclaimReceipt)); reclaimed = receipt.status === "fresh-source-scratch-reclaimed" &&
    receipt.campaign === campaign && receipt.slug === task.slug && receipt.archive_sha256 === digest &&
    receipt.pair_result_sha256 === sha(await readRemote(resultPath));}
  catch (error) {if (error.code !== "ENOENT") throw error;}
  if (reclaimed) {
    const archivePath = join(coldRoot, `${task.slug}-source-${digest}.tar.zst`);
    const manifest = JSON.parse(await readFile(join(coldRoot, archives[0])));
    need(manifest.archive_sha256 === digest && manifest.archive_bytes === (await stat(archivePath)).size &&
      (await fileSha(archivePath)) === digest, `reclaimed-archive-drift:${task.slug}`);
  }
  if (!reclaimed) await command(process.execPath, [reclaimTool, "--apply", host, campaign, task.slug, digest]);
  processed++;
  console.log(JSON.stringify({completed: processed, total: 24, slug: task.slug, pair_status: result.status, cold_archive_sha256: digest}));
  if (result.status !== "scored") throw Error(`g01-serial.stopped-after-unscored:${task.slug}`);
}
console.log(JSON.stringify({status: "all-pairs-scored-and-source-copied", campaign, pairs: processed,
  claim_ceiling: "Dispatch and cold-storage completion only; native analysis and independent audit remain separate"}));
