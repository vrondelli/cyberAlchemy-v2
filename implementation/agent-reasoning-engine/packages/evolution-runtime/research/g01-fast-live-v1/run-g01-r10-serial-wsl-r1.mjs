// Guarded WSL coordinator for exact G01 r10: one matched pair at a time.
// Terminal pair scratch is cold-copied, fully compared, and reclaimed before
// the next pair. --check is read-only and never calls GLM.
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {createReadStream} from "node:fs";
import {readdir, readFile, stat} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const [mode, host, campaign, freezeSha, readyPath, readySha] = process.argv.slice(2);
const need = (value, reason) => {if (!value) throw Error(`g01-r10-serial.${reason}`);};
need(["--check", "--run"].includes(mode) &&
  process.argv.length === (mode === "--run" ? 8 : 6), "arguments");
need(host === "root@187.77.163.194" && campaign === "g01-product-replication-r10" &&
  /^[a-f0-9]{64}$/.test(freezeSha ?? ""), "scope");
need(mode !== "--run" || (
  /^\/opt\/are\/evolution-runtime\/g01-r10-provider-readiness\/[A-Za-z0-9_-]+\/READY\.json$/.test(readyPath ?? "") &&
  /^[a-f0-9]{64}$/.test(readySha ?? "")), "readiness-arguments");
const root = `/opt/are/evolution-runtime/${campaign}`;
const scratchParent = `/tmp/are-${campaign}-source`;
const coldRoot = `/home/vlad_/are-benchmark-archive/${campaign}/pairs`;
const sshArgs = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ClearAllForwardings=yes", "-o", "ConnectTimeout=10", host];
const nodePath = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const rootFloor = 1_073_741_824 + 268_435_456 + 134_217_728;
const tmpFloor = 1_563_164_672 + 1_073_741_824 + 536_870_912;
const safePath = path => typeof path === "string" &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path) && !path.includes("/../");

async function command(name, args, {limit = 4_000_000} = {}) {
  const child = spawn(name, args, {stdio: ["ignore", "pipe", "pipe"]});
  const out = [], errors = [];
  let size = 0;
  child.stdout.on("data", chunk => {size += chunk.length; if (size <= limit) out.push(chunk);});
  child.stderr.on("data", chunk => errors.push(chunk));
  const code = await new Promise((resolve, reject) => {child.on("error", reject); child.on("close", resolve);});
  need(code === 0 && size <= limit, `${name}:${Buffer.concat(errors).toString("utf8").slice(-400)}`);
  return Buffer.concat(out);
}
const ssh = commandText => command("ssh", [...sshArgs, commandText]);
const readRemote = path => {need(safePath(path), "remote-path"); return ssh(`cat '${path}'`);};
const remoteExists = async path => {
  need(/^\/((opt\/are\/evolution-runtime)|(tmp\/are-g01-product-replication-r10-source))\/[A-Za-z0-9_./-]+$/.test(path), "exists-path");
  return (await ssh(`if test -e '${path}'; then printf yes; else printf no; fi`)).toString() === "yes";
};
async function freeRemote(path) {
  need([root, "/tmp"].includes(path), "free-path");
  const out = (await ssh(`df -B1 --output=avail '${path}' | tail -n 1`)).toString().trim();
  need(/^\d+$/.test(out), "free-parse");
  return Number(out);
}
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

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
  definition.source_scratch_root === scratchParent && safePath(definition.source_root), "definition-shape");
const slugs = new Set();
for (const task of freeze.ordered_tasks) {
  need(/^[a-z0-9-]+$/.test(task.slug) && !slugs.has(task.slug) &&
    task.pair_plan_path === `${root}/${task.slug}/PAIR-PLAN.json` &&
    /^[a-f0-9]{64}$/.test(task.pair_plan_sha256), "task-binding");
  slugs.add(task.slug);
}
const sourceScript = `${definition.source_root}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs`;
const sourcePin = freeze.sources?.find(row => row.path === sourceScript);
need(safePath(sourceScript) && /^[a-f0-9]{64}$/.test(sourcePin?.sha256 ?? "") &&
  sha(await readRemote(sourceScript)) === sourcePin.sha256, "runner-source-binding");
const rootFree = await freeRemote(root), tmpFree = await freeRemote("/tmp");
if (mode === "--check") {
  console.log(JSON.stringify({status: "read-only-r10-serial-preflight", campaign, freeze_sha256: freezeSha,
    tasks: freeze.ordered_tasks.length, root_free_bytes: rootFree, root_floor_bytes: rootFloor,
    tmp_free_bytes: tmpFree, tmp_floor_bytes: tmpFloor,
    root_floor_pass: rootFree >= rootFloor, tmp_floor_pass: tmpFree >= tmpFloor,
    model_calls: 0, source_reclaims: 0}));
  process.exit(0);
}

const readyBytes = await readRemote(readyPath);
need(sha(readyBytes) === readySha, "readiness-drift");
const ready = JSON.parse(readyBytes);
need(ready.schema_version === "are.g01-provider-readiness/v1" && ready.status === "ready" &&
  ready.model === "glm-5.3-flash" && ready.tokenizer?.status === 200 &&
  Number.isSafeInteger(ready.tokenizer.prompt_tokens) && ready.tokenizer.prompt_tokens > 0 &&
  ready.tiny_generation?.status === 200 && Number.isSafeInteger(ready.tiny_generation.output_tokens) &&
  ready.tiny_generation.output_tokens > 0 && ready.automatic_retries === 0 &&
  ready.provider_host_fingerprint_sha256 === "bb6900a580e91ec8efa83d491ba9493cd8ae782c69bafaa94d12cfc856f27e2f" &&
  ready.gateway_container_image === "sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361" &&
  Number.isFinite(Date.parse(ready.checked_at)) && Date.now() >= Date.parse(ready.checked_at) &&
  Date.now() - Date.parse(ready.checked_at) < 600_000, "provider-not-ready");
need(rootFree >= rootFloor && tmpFree >= tmpFloor, "storage-floor-before-first-pair");
const archiveTool = join(fileURLToPath(new URL(".", import.meta.url)), "archive-reclaim-r10-pair-wsl-r1.mjs");
let completed = 0;
for (const task of freeze.ordered_tasks) {
  const pairRoot = `${root}/${task.slug}`;
  const resultPath = `${pairRoot}/PAIR-RESULT.json`;
  const scratchRoot = `${scratchParent}/${task.slug}`;
  if (!(await remoteExists(resultPath))) {
    need(!(await remoteExists(scratchRoot)) &&
      !(await remoteExists(`${pairRoot}/control/runs`)) &&
      !(await remoteExists(`${pairRoot}/candidate/runs`)), `partial-attempt:${task.slug}`);
    need((await freeRemote(root)) >= rootFloor && (await freeRemote("/tmp")) >= tmpFloor,
      `storage-floor:${task.slug}`);
    const output = await ssh(`'${nodePath}' '${sourceScript}' '${task.pair_plan_path}' '${task.pair_plan_sha256}'`);
    need(output.length > 0 && await remoteExists(resultPath), `pair-not-terminal:${task.slug}`);
  }
  const resultBytes = await readRemote(resultPath), result = JSON.parse(resultBytes);
  need(["scored", "unscored", "scoring_error"].includes(result.status), `result-status:${task.slug}`);
  let reclaimed = [];
  try {reclaimed = (await readdir(coldRoot)).filter(name => name.startsWith(`${task.slug}-source-`) && name.endsWith(".reclaim.json"));}
  catch (error) {if (error.code !== "ENOENT") throw error;}
  need(reclaimed.length <= 1, `multiple-reclaims:${task.slug}`);
  let archiveSha;
  if (reclaimed.length === 0) {
    need(await remoteExists(scratchRoot), `missing-unarchived-source:${task.slug}`);
    const output = await command(process.execPath, [archiveTool, "--apply", host, campaign, task.slug]);
    archiveSha = JSON.parse(output).archive_sha256;
  } else {
    const row = JSON.parse(await readFile(join(coldRoot, reclaimed[0])));
    archiveSha = row.archive_sha256;
    need(row.status === "fresh-pair-source-scratch-reclaimed" && row.campaign === campaign &&
      row.slug === task.slug && row.pair_result_sha256 === sha(resultBytes) &&
      row.removed_path === scratchRoot && /^[a-f0-9]{64}$/.test(archiveSha) &&
      !(await remoteExists(scratchRoot)), `reclaim-drift:${task.slug}`);
    const archive = join(coldRoot, `${task.slug}-source-${archiveSha}.tar.zst`);
    const manifest = JSON.parse(await readFile(join(coldRoot, `${task.slug}-source-${archiveSha}.json`)));
    need(manifest.archive_sha256 === archiveSha && manifest.archive_bytes === (await stat(archive)).size &&
      (await fileSha(archive)) === archiveSha, `archive-drift:${task.slug}`);
  }
  completed++;
  console.log(JSON.stringify({completed, total: 24, slug: task.slug, pair_status: result.status,
    cold_archive_sha256: archiveSha}));
  if (result.status !== "scored") throw Error(`g01-r10-serial.stopped-after-unscored:${task.slug}`);
}
console.log(JSON.stringify({status: "all-24-pairs-scored-and-source-archived", campaign, pairs: completed,
  claim_ceiling: "Dispatch and verified source storage only; independent audit and interval analysis remain separate"}));
