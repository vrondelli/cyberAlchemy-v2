// No-model four-view adapter exercise on one pinned r15 r2 source checkout.
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r15-r2-overlay-source-qualification-r1`;
const adapterPath = `${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/overlay-source-layout-r1.mjs`;
const preparePath = `${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const receiptRoot = `${base}/g01-r15-r2-overlay-fourview-probe-r1`;
const residencyPath = `${base}/g01-r15-r2-single-checkout-residency-r1/RESIDENCY-PROBE.json`;
const prefix = "/tmp/are-g01-r15-r2-overlay-fourview-probe-r1/task-19";
const lower = "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1/task-19";
const marker = ".are-g01-overlay-fourview-marker-r1";
const pin = "6126f19bf4d9ed73dfd3589a0067d3e9fad99f0b515eb9b5652488207f776f57";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const run = (program, args) => execFileSync(program, args, {encoding: "utf8"}).trim();
const need = (condition, reason) => {if (!condition) throw Error(`g01-fourview-probe.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};

async function main() {
  need(!existsSync(receiptRoot) && !existsSync(prefix) &&
    sha(readFileSync(residencyPath)) === pin, "fresh-pins");
  const residency = JSON.parse(readFileSync(residencyPath)), row = residency.rows[18];
  need(row.ordinal === 19 && row.destination === lower &&
    row.base_commit === "375358b6f7d00342ad2a282c34950ebfb4b2cdc8" &&
    row.tree === "81f471938244115c00dba0e648c73d88896f0de2", "binding");
  const {bindSourceTree} = await import(pathToFileURL(preparePath).href);
  const sourceTree = bindSourceTree(source);
  need(sourceTree.file_count === 413 &&
    sourceTree.tree_sha256 === "27e101482c86019378d458bba586c6806b7922d6bcb69727466eeab47518ee8e", "source-tree");
  const {prepareOverlaySourceCheckout} = await import(pathToFileURL(adapterPath).href);
  const bindings = [];
  for (const arm of ["control", "candidate"]) for (const name of ["base", "work"])
    bindings.push({ordinal: 19, destination: `${prefix}/${arm}/source/00/${name}`,
      cache: "/tmp/are-g01-r15-source-caches-r1/mui--material-ui.git",
      base_commit: row.base_commit});
  const mounted = [], before = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  try {
    for (const binding of bindings) mounted.push(prepareOverlaySourceCheckout(binding));
    const marked = mounted[0].destination;
    writeFileSync(join(marked, marker), "probe\n", {flag: "wx", mode: 0o600});
    need(!existsSync(join(lower, marker)) &&
      mounted.slice(1).every(view => !existsSync(join(view.destination, marker))), "isolation");
  } finally {
    for (const view of mounted.reverse()) run("umount", [view.destination]);
  }
  need(!existsSync(join(lower, marker)), "lower-changed");
  for (const binding of bindings) need(run("findmnt", ["-T", binding.destination, "-n", "-o", "FSTYPE,TARGET"]).startsWith("tmpfs "), "unmount");
  const after = {shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp")};
  const receipt = {schema_version: "are.g01-r15-r2-overlay-fourview-probe/v1",
    status: "passed-four-mounted-then-unmounted", source_tree_sha256: sourceTree.tree_sha256,
    adapter_sha256: sha(readFileSync(adapterPath)), residency_receipt_sha256: pin,
    lower, ordinal: 19, head: row.base_commit, tree: row.tree,
    views: bindings.map(({destination}) => destination), before, after,
    marker_isolation: true, all_views_unmounted: true,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Four opt-in source views on one pinned task; not complete runner, output peak, scoring or superiority",
    open_questions: ["Can the campaign coordinator archive and preserve upper deltas after each terminal pair?",
      "Does the source-index and model episode preserve metrics with this source layout?"]};
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "FOURVIEW-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes), after}));
}

main().catch(error => {console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2;});
