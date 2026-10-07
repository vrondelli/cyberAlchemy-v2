// Seal the opt-in r16 r2 source snapshot after the no-model four-view probe.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r16-r2-overlay-latebind-source-r1`;
const output = `${base}/g01-r16-r2-overlay-latebind-source-receipt-r1`;
const prepare = `${source}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const probePath = `${base}/g01-r16-r2-overlay-fourview-probe-r1/FOURVIEW-PROBE.json`;
const probeSha = "514e767c42b65db7eb440703e71ddfc236717d7949f6fbc7805a06929b188af0";
const sourceTreeSha = "7514c70d2d5c77209dc921671033f1d2cce2e8c7c9419fdcfe61d8490ff560fb";
const files = [
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-terminal-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/late-bind-delivered-base-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/overlay-source-layout-r1.mjs"
];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r16-r2-source-seal.${reason}`);};

async function main() {
  need(!existsSync(output) && sha(readFileSync(probePath)) === probeSha, "pins");
  const probe = JSON.parse(readFileSync(probePath));
  need(probe.status === "passed-four-mounted-then-unmounted" &&
    probe.source_tree_sha256 === sourceTreeSha && probe.all_views_unmounted === true &&
    probe.marker_isolation === true && probe.model_calls === 0 && probe.gold_loaded === false,
  "probe-shape");
  const {bindSourceTree} = await import(pathToFileURL(prepare).href);
  const tree = bindSourceTree(source);
  need(tree.file_count === 414 && tree.tree_sha256 === sourceTreeSha, "source-tree-drift");
  const bindings = files.map(relative_path => ({relative_path,
    sha256: sha(readFileSync(join(source, relative_path)))}));
  const receipt = {schema_version: "are.g01-r16-r2-overlay-latebind-source-qualification/v1",
    status: "passed-no-model-source-only", source_root: source,
    source_file_count: tree.file_count, source_tree_sha256: tree.tree_sha256,
    changed_source_bindings: bindings, fourview_probe_sha256: probeSha,
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Versioned opt-in r16 overlay and late-binding source passes focused tests and four-view isolation; no campaign freeze, model run, score or superiority",
    open_questions: ["Does a no-reclaim serial coordinator preserve full pair evidence and all 24 task bindings?",
      "Can fresh readiness and 24/24 matched scoring clear quality and efficiency gates?"]};
  mkdirSync(output, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(output, "SOURCE-QUALIFICATION.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, receipt_sha256: sha(bytes),
    source_tree_sha256: tree.tree_sha256}));
}

main().catch(error => {console.error(JSON.stringify({status: "seal-error", error: String(error.message)})); process.exitCode = 2;});
