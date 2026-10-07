// Guarded r15 coordinator: one matched pair at a time, verified WSL cold copy,
// no VPS source reclaim. --check is read-only and makes no provider request.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream} from "node:fs";
import {readFile, readdir, stat} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const [mode, host, freezeSha, readyPath, readySha] = process.argv.slice(2);
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-overlay-serial.${reason}`);};
need(["--check", "--run"].includes(mode) &&
  process.argv.length === (mode === "--run" ? 7 : 5) &&
  host === "root@187.77.163.194" && /^[a-f0-9]{64}$/.test(freezeSha ?? ""), "arguments");
const campaign = "g01-product-replication-r15";
const root = `/opt/are/evolution-runtime/${campaign}`;
const scratchParent = `/tmp/are-${campaign}-source`;
const coldRoot = `/home/vlad_/are-benchmark-archive/${campaign}/pairs`;
const nodePath = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
  "-o", "ClearAllForwardings=yes", "-o", "ConnectTimeout=10", host];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const rootFloor = 1_476_000_000, tmpFloor = 1_342_177_280,
  shmFloor = 3_221_225_472; // 3 GiB after pinned one-copy residence.
const safe = path => typeof path === "string" &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path) && !path.includes("/../");

async function command(name, args, limit = 4_000_000) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  let size = 0;
  child.stdout.on("data", chunk => {size += chunk.length; if (size <= limit) out.push(chunk);});
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  need(code === 0 && size <= limit, `${name}:${Buffer.concat(errors).toString("utf8").slice(-400)}`);
  return Buffer.concat(out);
}
const ssh = text => command("ssh", [...sshArgs, text]);
const remote = path => {need(safe(path), "remote-path"); return ssh(`cat '${path}'`);};
const exists = async path => {
  need(path.startsWith(`${root}/`) || path.startsWith(`${scratchParent}/`), "exists-scope");
  need(/^\/[A-Za-z0-9_./-]+$/.test(path) && !path.includes("/../"), "exists-shape");
  return (await ssh(`if test -e '${path}'; then printf yes; else printf no; fi`)).toString() === "yes";
};
const free = async path => {
  need([root, "/tmp", "/dev/shm"].includes(path), "free-scope");
  const bytes = (await ssh(`df -B1 --output=avail '${path}' | tail -n 1`)).toString().trim();
  need(/^\d+$/.test(bytes), "free-parse");
  return Number(bytes);
};
const fileSha = async path => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
};

const freezeBytes = await remote(`${root}/CAMPAIGN-FREEZE.json`);
need(sha(freezeBytes) === freezeSha, "freeze-drift");
const freeze = JSON.parse(freezeBytes);
need(freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.status === "frozen-before-dispatch" && freeze.model === "glm-5.3-flash" &&
  freeze.context_limit === 8000 && freeze.ordered_tasks?.length === 24 &&
  freeze.source_checkout_layout?.mode === "g01-r15-r2-single-lower-overlay-r1" &&
  /^[a-f0-9]{64}$/.test(freeze.source_checkout_layout.residency_receipt_sha256), "freeze-shape");
need(safe(freeze.definition_path) && /^[a-f0-9]{64}$/.test(freeze.definition_sha256), "definition-binding");
const definitionBytes = await remote(freeze.definition_path);
need(sha(definitionBytes) === freeze.definition_sha256, "definition-drift");
const definition = JSON.parse(definitionBytes);
need(definition.schema_version === "are.g01-campaign-definition/v1" &&
  definition.root === root && definition.source_scratch_root === scratchParent &&
  definition.source_checkout_layout?.mode === freeze.source_checkout_layout.mode &&
  definition.source_checkout_layout.residency_receipt_sha256 === freeze.source_checkout_layout.residency_receipt_sha256 &&
  safe(definition.source_root), "definition-shape");
const runner = `${definition.source_root}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs`;
const pin = freeze.sources?.find(row => row.path === runner);
need(safe(runner) && /^[a-f0-9]{64}$/.test(pin?.sha256 ?? "") &&
  sha(await remote(runner)) === pin.sha256, "runner-source-drift");
const slugs = new Set();
for (const task of freeze.ordered_tasks) {
  need(/^[a-z0-9-]+$/.test(task.slug) && !slugs.has(task.slug) &&
    task.pair_plan_path === `${root}/${task.slug}/PAIR-PLAN.json` &&
    /^[a-f0-9]{64}$/.test(task.pair_plan_sha256), "task-binding");
  slugs.add(task.slug);
}
const capacity = {root_free_bytes: await free(root), tmp_free_bytes: await free("/tmp"),
  shm_free_bytes: await free("/dev/shm")};
if (mode === "--check") {
  console.log(JSON.stringify({status: "read-only-r15-overlay-serial-preflight", campaign,
    freeze_sha256: freezeSha, tasks: freeze.ordered_tasks.length, capacity,
    floors: {rootFloor, tmpFloor, shmFloor},
    pass: capacity.root_free_bytes >= rootFloor &&
      capacity.tmp_free_bytes >= tmpFloor && capacity.shm_free_bytes >= shmFloor,
    model_calls: 0, source_reclaims: 0}));
  process.exit(0);
}
need(/^\/opt\/are\/evolution-runtime\/g01-r10-provider-readiness\/[A-Za-z0-9_-]+\/READY\.json$/.test(readyPath ?? "") &&
  /^[a-f0-9]{64}$/.test(readySha ?? ""), "readiness-path");
const readyBytes = await remote(readyPath), ready = JSON.parse(readyBytes);
need(sha(readyBytes) === readySha && ready.schema_version === "are.g01-provider-readiness/v1" &&
  ready.status === "ready" && ready.model === "glm-5.3-flash" &&
  ready.tokenizer?.status === 200 && ready.tiny_generation?.status === 200 &&
  ready.automatic_retries === 0 && Number.isFinite(Date.parse(ready.checked_at)) &&
  Date.now() >= Date.parse(ready.checked_at) && Date.now() - Date.parse(ready.checked_at) < 600_000,
"provider-not-ready");
need(capacity.root_free_bytes >= rootFloor && capacity.tmp_free_bytes >= tmpFloor &&
  capacity.shm_free_bytes >= shmFloor, "storage-floor");
const archiveTool = join(fileURLToPath(new URL(".", import.meta.url)), "archive-g01-r15-overlay-pair-wsl-r1.mjs");
let completed = 0;
for (const task of freeze.ordered_tasks) {
  const pairRoot = `${root}/${task.slug}`;
  const resultPath = `${pairRoot}/PAIR-RESULT.json`;
  const scratch = `${scratchParent}/${task.slug}`;
  if (!(await exists(resultPath))) {
    need(!(await exists(scratch)) && !(await exists(`${pairRoot}/control/runs`)) &&
      !(await exists(`${pairRoot}/candidate/runs`)), `partial-attempt:${task.slug}`);
    need((await free(root)) >= rootFloor && (await free("/tmp")) >= tmpFloor &&
      (await free("/dev/shm")) >= shmFloor, `storage-floor:${task.slug}`);
    await ssh(`'${nodePath}' '${runner}' '${task.pair_plan_path}' '${task.pair_plan_sha256}'`);
    need(await exists(resultPath), `pair-not-terminal:${task.slug}`);
  }
  const resultBytes = await remote(resultPath), result = JSON.parse(resultBytes);
  need(["scored", "unscored", "scoring_error"].includes(result.status), `result:${task.slug}`);
  let matches = [];
  try {matches = (await readdir(coldRoot)).filter(name =>
    name.startsWith(`${task.slug}-overlay-source-`) && name.endsWith(".json"));}
  catch (error) {if (error.code !== "ENOENT") throw error;}
  need(matches.length <= 1, `archive-duplicates:${task.slug}`);
  const output = await command(process.execPath, [archiveTool,
    matches.length ? "--check" : "--apply", host, task.slug]);
  const archive = JSON.parse(output);
  if (matches.length) {
    const manifest = JSON.parse(await readFile(join(coldRoot, matches[0])));
    need(manifest.archive_sha256 === archive.archive_sha256 &&
      (await stat(manifest.archive_path)).size === manifest.archive_bytes &&
      (await fileSha(manifest.archive_path)) === manifest.archive_sha256,
    `archive-drift:${task.slug}`);
  }
  completed++;
  console.log(JSON.stringify({completed, total: 24, slug: task.slug,
    pair_status: result.status, cold_archive_sha256: archive.archive_sha256}));
  if (result.status !== "scored") throw Error(`g01-r15-overlay-serial.stopped-after-unscored:${task.slug}`);
}
console.log(JSON.stringify({status: "all-24-pairs-scored-source-retained-and-archived",
  campaign, pairs: completed, source_reclaims: 0,
  claim_ceiling: "Dispatch and cold source storage only; independent score/interval audit remains separate"}));
