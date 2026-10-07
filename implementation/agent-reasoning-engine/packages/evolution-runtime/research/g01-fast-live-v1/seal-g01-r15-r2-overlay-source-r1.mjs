// Seal the opt-in G01 r15 r2 source snapshot after no-model overlay checks.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r15-r2-overlay-source-qualification-r1`;
const output = `${base}/g01-r15-r2-overlay-source-qualification-receipt-r1`;
const prepare = `${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const probePath = `${base}/g01-r15-r2-overlay-fourview-probe-r1/FOURVIEW-PROBE.json`;
const probeSha = "c9e810e51bafa74096e1e837b81ff02be5ece300db644cb6495cef66150d4b4c";
const sourceTreeSha = "27e101482c86019378d458bba586c6806b7922d6bcb69727466eeab47518ee8e";
const files = [
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/overlay-source-layout-r1.mjs"
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-overlay-source-seal.${reason}`);};

async function main() {
  need(!existsSync(output) && sha(readFileSync(probePath)) === probeSha, "pins");
  const probe = JSON.parse(readFileSync(probePath));
  need(probe.status === "passed-four-mounted-then-unmounted" &&
    probe.source_tree_sha256 === sourceTreeSha && probe.all_views_unmounted === true &&
    probe.marker_isolation === true && probe.model_calls === 0 && probe.gold_loaded === false,
  "probe-shape");
  const {bindSourceTree} = await import(pathToFileURL(prepare).href);
  const tree = bindSourceTree(source);
  need(tree.file_count === 413 && tree.tree_sha256 === sourceTreeSha, "source-tree-drift");
  const bindings = files.map(relative_path => ({relative_path,
    sha256: sha(readFileSync(join(source, relative_path)))}));
  const receipt = {schema_version: "are.g01-r15-r2-overlay-source-qualification/v1",
    status: "passed-no-model-source-only", source_root: source,
    source_file_count: tree.file_count, source_tree_sha256: tree.tree_sha256,
    changed_source_bindings: bindings, fourview_probe_sha256: probeSha,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Versioned opt-in overlay source compiles and mounts four isolated views for one task; not full campaign freeze, model run, score or superiority",
    open_questions: ["Does a no-reclaim serial coordinator preserve full pair evidence and all 24 task bindings?",
      "Can a fresh readiness check and 24/24 matched run pass completeness, quality and efficiency gates?"]};
  mkdirSync(output, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(output, "SOURCE-QUALIFICATION.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes),
    source_tree_sha256: tree.tree_sha256}));
}

main().catch(error => {console.error(JSON.stringify({status: "seal-error", error: String(error.message)})); process.exitCode = 2;});
