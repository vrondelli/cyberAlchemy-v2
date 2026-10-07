// No-model four-view overlay feasibility probe on the retained worst-task checkout.
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/dev/shm/are-g01-r15-r2-overlay-probe-r1";
const lower = "/tmp/are-g01-r15-r2-scratch-layout-probe-r1/candidate/base";
const censusPath = "/opt/are/evolution-runtime/g01-r15-r2-storage-census-r1/STORAGE-CENSUS.json";
const receiptRoot = "/opt/are/evolution-runtime/g01-r15-r2-overlay-probe-r1";
const censusSha = "aa4017e344e90e66f6207a174ebd618ca95e2a046c77387909285f9cc3f1c148";
const head = "375358b6f7d00342ad2a282c34950ebfb4b2cdc8";
const tree = "81f471938244115c00dba0e648c73d88896f0de2";
const marker = ".are-overlay-probe-r1";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-r2-overlay-probe.${reason}`);};
const run = (program, args) => execFileSync(program, args, {encoding: "utf8"}).trim();
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const revision = path => run("git", ["-C", path, "rev-parse", "HEAD", "HEAD^{tree}"]).split("\n");

function main() {
  need(!existsSync(receiptRoot), "receipt-already-exists");
  const censusBytes = readFileSync(censusPath);
  need(sha(censusBytes) === censusSha, "census-drift");
  const census = JSON.parse(censusBytes);
  need(census.rows.length === 24 &&
    census.rows.reduce((total, row) => total + row.one_copy_regular_block_bytes, 0) === 1547821056,
    "census-shape");
  need(JSON.stringify(revision(lower)) === JSON.stringify([head, tree]), "lower-revision");
  need(!existsSync(join(lower, marker)), "lower-mutated");
  const lowerFileSha = sha(readFileSync(join(lower, "yarn.lock")));
  const views = [];
  for (const [index, name] of ["view", "view2", "view3", "view4"].entries()) {
    const path = join(root, name);
    const mount = run("findmnt", ["-T", path, "-n", "-o", "FSTYPE,TARGET"]);
    need(mount === `overlay ${path}`, `mount:${name}`);
    need(JSON.stringify(revision(path)) === JSON.stringify([head, tree]), `revision:${name}`);
    need(sha(readFileSync(join(path, "yarn.lock"))) === lowerFileSha, `file-parity:${name}`);
    need(existsSync(join(path, marker)) === (index === 0), `write-isolation:${name}`);
    views.push({name, path, mount, head, tree, yarn_lock_sha256: lowerFileSha,
      marker_visible: index === 0});
  }
  const receipt = {
    schema_version: "are.g01-r15-r2-overlay-storage-probe/v1",
    status: "passed-no-model-four-view-isolation",
    source_census_sha256: censusSha,
    source_one_copy_regular_block_bytes: 1547821056,
    lower, lower_head: head, lower_tree: tree, lower_marker_visible: false,
    views, shm_free_bytes: free("/dev/shm"), tmp_free_bytes: free("/tmp"),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "One retained worst-task checkout supports four isolated overlay views; not a 24-task residency test, runtime peak, live score, or superiority",
    open_questions: [
      "Can one lower checkout per task plus four overlays fit the whole 24-task cohort with output headroom?",
      "Can the runner use this layout without reclaiming retained scratch or changing source/score semantics?"
    ]
  };
  mkdirSync(receiptRoot, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(receiptRoot, "OVERLAY-PROBE.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes),
    shm_free_bytes: receipt.shm_free_bytes, tmp_free_bytes: receipt.tmp_free_bytes}));
}

try {main();} catch (error) {
  console.error(JSON.stringify({status: "probe-error", error: String(error.message)}));
  process.exitCode = 2;
}
