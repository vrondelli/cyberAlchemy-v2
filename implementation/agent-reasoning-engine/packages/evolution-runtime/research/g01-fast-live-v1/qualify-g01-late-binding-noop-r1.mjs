// Provider-free check that exposed successful arms do not enter the opt-in
// late-binding fallback. Emits hashes and counts only, not model or tool text.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {bindInvestigationEvidence} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-evidence-join-r1.mjs";
import {mapConfirmedTerminalReads} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-integration-r3.mjs";

const archive = "/home/vlad_/are-benchmark-archive";
const r14 = `${archive}/g01-r14-terminal-run-20261002/campaign`;
const r15 = `${archive}/g01-product-replication-r15/terminal`;
const out = `${archive}/g01-late-binding-noop-r1`;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => JSON.parse(readFileSync(path));
const need = (value, reason) => {if (!value) throw Error(`g01-late-binding-noop.${reason}`);};

function checkPair(root, slug) {
  const pairPath = join(root, slug, "PAIR-RESULT.json");
  const pairBytes = readFileSync(pairPath), pair = JSON.parse(pairBytes);
  need(pair.status === "scored", `pair-not-scored:${slug}`);
  const arms = {};
  for (const arm of ["control", "candidate"]) {
    const bytes = readFileSync(join(root, slug, arm, "runs", "00", "result.json"));
    const result = JSON.parse(bytes);
    need(result.status === "final_context_selected", `arm-not-selected:${slug}:${arm}`);
    const joined = bindInvestigationEvidence({branches: result.branches,
      receipts: result.receipts});
    const mapped = mapConfirmedTerminalReads(result.convergence_state,
      joined.read_observations, result.origin_bindings, {omit_undelivered: true});
    need(mapped.mappings.length > 0, `no-normal-mapping:${slug}:${arm}`);
    arms[arm] = {result_sha256: sha(bytes), delivered_reads: joined.read_observations.length,
      normal_mapped_reads: mapped.mappings.length, late_binding_fallback_required: false};
  }
  return {slug, pair_result_sha256: sha(pairBytes), arms};
}

function main() {
  const freeze14Path = join(r14, "CAMPAIGN-FREEZE.json");
  const freeze15Path = join(r15, "CAMPAIGN-FREEZE.json");
  const freeze14Bytes = readFileSync(freeze14Path), freeze15Bytes = readFileSync(freeze15Path);
  need(sha(freeze14Bytes) === "9dedcda5586e059bda95adfd08decd9c452006d1c53b64361fb8150a6a827754" &&
    sha(freeze15Bytes) === "d68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda",
  "freeze-drift");
  const frozen14 = JSON.parse(freeze14Bytes), frozen15 = JSON.parse(freeze15Bytes);
  need(frozen14.ordered_tasks.length === 24 && frozen15.ordered_tasks.length === 24 &&
    frozen15.ordered_tasks[0].slug === "task-01", "task-order-drift");
  const rows = [...frozen14.ordered_tasks.slice(0, 12).map(row => checkPair(r14, row.slug)),
    checkPair(r15, "task-01")];
  const receipt = {schema_version: "are.g01-late-binding-noop-qualification/v1",
    status: "exposed-successful-arm-noop-check-passed", r14_freeze_sha256: sha(freeze14Bytes),
    r15_freeze_sha256: sha(freeze15Bytes), scored_pairs: rows.length,
    normally_mapped_arms: rows.length * 2, rows, model_calls: 0, gold_loaded: false,
    claim_ceiling: "Normal terminal mapping succeeds on exposed scored arms, so the opt-in no-delivered fallback is not triggered; this does not prove fresh-task quality or reliability",
    open_questions: ["Will the fallback transfer to another genuinely undelivered supported read?",
      "Will a fresh fully scored matched cohort pass its accuracy and efficiency gates?"]};
  mkdirSync(out, {mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(out, "NOOP-CHECK.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, scored_pairs: rows.length,
    normally_mapped_arms: rows.length * 2, receipt_sha256: sha(bytes)}));
}

try {main();} catch (error) {console.error(JSON.stringify({status: "qualification-error",
  error: String(error.message)})); process.exitCode = 2;}
