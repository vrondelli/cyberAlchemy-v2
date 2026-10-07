// Four-view no-model overlay and import-closure rehearsal for the r17 retry.
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r17-r16cohort-overlay-latebind-source-r1`;
const adapterPath = `${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/overlay-source-layout-r1.mjs`;
const preparePath = `${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const receiptRoot = `${base}/g01-r17-r16cohort-overlay-fourview-probe-r1`;
const residencyPath = `${base}/g01-r16-r2-single-checkout-residency-r1/RESIDENCY-PROBE.json`;
const transferPath = `${base}/g01-r16-r2-cache-transfer-r1/VERIFY.json`;
const censusPath = `${base}/g01-r16-r2-storage-census-r1/STORAGE-CENSUS.json`;
const prefix = "/tmp/are-g01-r17-r16cohort-overlay-fourview-probe-r1/task-12";
const marker = ".are-g01-r17-fourview-marker-r1";
const pins = {
  residency: "8e5a178b26278f9daccc0c8899c1bf6b05406e5f7678135e9232edff087f2e8a",
  transfer: "cb20eb1799b71ae48296085647037d56829743f7d4c2002aebb8bdc008138a41",
  census: "88b9d5d8099b48b41039ceec00e3ac939406f234596a2d8cdb1aa7cccba2435e",
  sourceTree: "742352c5178404016e0b068d07825116faad67fc883b24fcbb0b7c49f4ae0143"
};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const run = (program, args) => execFileSync(program, args, {encoding: "utf8", timeout: 30000}).trim();
const need = (condition, reason) => {if (!condition) throw Error(`g01-r16-r2-fourview.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const pinned = (path, digest) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `input-drift:${path}`);
  return JSON.parse(bytes);
};

async function main() {
  need(!existsSync(receiptRoot) && !existsSync(prefix), "fresh-output-required");
  const residency = pinned(residencyPath, pins.residency);
  const transfer = pinned(transferPath, pins.transfer);
  const census = pinned(censusPath, pins.census);
  const row = residency.rows[11];
  need(residency.status === "passed-retained-source-only" && row.ordinal === 12 &&
    row.instance_id === census.worst_task_id &&
    row.destination === "/dev/shm/are-g01-r16-r2-single-checkout-residency-r1/task-12" &&
    census.maximum_four_copy_regular_block_bytes === 787_791_872, "worst-task-binding");
  const cache = transfer.verified_task_bindings.find(binding => binding.instance_id === row.instance_id);
  need(cache && cache.base_commit === row.base_commit && cache.tree === row.tree &&
    cache.repository_path.startsWith("/dev/shm/are-g01-r16-source-caches-r1/"), "cache-binding");
  const {bindSourceTree} = await import(pathToFileURL(preparePath).href);
  const tree = bindSourceTree(source);
  need(tree.file_count === 415 && tree.tree_sha256 === pins.sourceTree, "source-tree-drift");
  await import(pathToFileURL(`${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs`).href);
  const {prepareOverlaySourceCheckout} = await import(pathToFileURL(adapterPath).href);
  const bindings = [];
  for (const arm of ["control", "candidate"]) for (const name of ["base", "work"])
    bindings.push({mode: "g01-r16-r2-single-lower-overlay-r1", ordinal: 12,
      destination: `${prefix}/${arm}/source/00/${name}`,
      cache: cache.repository_path, base_commit: row.base_commit});
  const mounted = [];
  const before = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  try {
    for (const binding of bindings) mounted.push(prepareOverlaySourceCheckout(binding));
    const marked = mounted[0].destination;
    writeFileSync(join(marked, marker), "probe\n", {flag: "wx", mode: 0o600});
    need(!existsSync(join(row.destination, marker)) &&
      mounted.slice(1).every(view => !existsSync(join(view.destination, marker))), "write-isolation");
  } finally {
    for (const view of mounted.reverse()) run("umount", [view.destination]);
  }
  need(!existsSync(join(row.destination, marker)), "lower-mutated");
  for (const binding of bindings)
    need(run("findmnt", ["-T", binding.destination, "-n", "-o", "FSTYPE,TARGET"]).startsWith("tmpfs "), "unmount");
  const after = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  need(after.shm_free_bytes > 3 * 1024 ** 3, "runtime-reserve");
  const receipt = {schema_version: "are.g01-r17-r16cohort-overlay-fourview-probe/v1",
    status: "passed-four-mounted-then-unmounted", source_tree_sha256: tree.tree_sha256,
    adapter_sha256: sha(readFileSync(adapterPath)), residency_receipt_sha256: pins.residency,
    transfer_sha256: pins.transfer, census_sha256: pins.census,
    lower: row.destination, ordinal: 12, head: row.base_commit, tree: row.tree,
    views: bindings.map(({destination}) => destination), before, after,
    marker_isolation: true, all_views_unmounted: true, runner_import_closure: "passed",
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Four opt-in views and runner import closure on the largest exact r16 r2 task; no complete runner, output peak, score or superiority proof",
    open_questions: ["Can the serial coordinator archive effective source after each terminal pair?",
      "Does a fresh freeze and live run complete all 24 matched scores?"]};
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "FOURVIEW-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes), after}));
}

main().catch(error => {console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2;});
