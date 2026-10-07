// Seal a no-model adapter mount before returning the probe view to tmpfs.
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime";
const receiptRoot = `${root}/g01-r15-r2-overlay-adapter-probe-r1`;
const adapterPath = `${root}/overlay-source-layout-r1.mjs`;
const residencyPath = `${root}/g01-r15-r2-single-checkout-residency-r1/RESIDENCY-PROBE.json`;
const destination = "/tmp/are-g01-r15-r2-overlay-adapter-probe-r1/task-19/control/source/00/base";
const lower = "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1/task-19";
const upper = "/dev/shm/are-g01-r15-r2-overlay-uppers-r1/task-19/control/source/00/base/upper";
const work = "/dev/shm/are-g01-r15-r2-overlay-uppers-r1/task-19/control/source/00/base/work";
const adapterSha = "08b7eefa8f192c2173dcd3dfd967e6fcce0123f098ca3414da5f88612295abd2";
const residencySha = "6126f19bf4d9ed73dfd3589a0067d3e9fad99f0b515eb9b5652488207f776f57";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const run = (program, args) => execFileSync(program, args, {encoding: "utf8"}).trim();
const need = (condition, reason) => {if (!condition) throw Error(`g01-overlay-adapter-probe.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};

function main() {
  need(!existsSync(receiptRoot) && sha(readFileSync(adapterPath)) === adapterSha &&
    sha(readFileSync(residencyPath)) === residencySha, "pins");
  const residency = JSON.parse(readFileSync(residencyPath));
  const binding = residency.rows.find(row => row.ordinal === 19);
  need(binding?.destination === lower &&
    binding.base_commit === "375358b6f7d00342ad2a282c34950ebfb4b2cdc8" &&
    binding.tree === "81f471938244115c00dba0e648c73d88896f0de2", "binding");
  const mount = run("findmnt", ["-T", destination, "-n", "-o", "FSTYPE,TARGET"]);
  need(mount === `overlay ${destination}` && existsSync(upper) && existsSync(work), "mount");
  const revision = path => run("git", ["-C", path, "rev-parse", "HEAD", "HEAD^{tree}"]).split("\n");
  need(JSON.stringify(revision(destination)) === JSON.stringify([binding.base_commit, binding.tree]) &&
    JSON.stringify(revision(lower)) === JSON.stringify([binding.base_commit, binding.tree]) &&
    run("git", ["-C", destination, "status", "--porcelain"]) === "", "source-parity");
  const receipt = {schema_version: "are.g01-r15-r2-overlay-adapter-probe/v1",
    status: "passed-no-model", adapter_sha256: adapterSha,
    residency_receipt_sha256: residencySha, ordinal: 19,
    destination, lower, upper, work, mount,
    head: binding.base_commit, tree: binding.tree,
    shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp"),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "One opt-in adapter view mounts cleanly from pinned residency; no runner integration, model output, score or superiority",
    open_questions: ["Can the frozen G01 runner bind four views for every pair before dispatch?",
      "Can it archive effective source evidence and unmount without reclaiming retained scratch?"]};
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "ADAPTER-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes)}));
}

try {main();} catch (error) {
  console.error(JSON.stringify({status: "probe-error", error: String(error.message)}));
  process.exitCode = 2;
}
