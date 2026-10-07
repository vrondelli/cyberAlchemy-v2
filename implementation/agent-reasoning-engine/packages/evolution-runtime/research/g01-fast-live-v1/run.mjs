// Single-task G01 development runner. Evidence is written by the existing
// receipt-bound episode runtime; this wrapper does not score or promote a run.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync} from "node:fs";
import {join, relative, resolve, sep} from "node:path";
import {INTENT_ANCHOR_ARM, SOURCE_NEIGHBORHOOD_ARM, SEARCH_FOLLOWTHROUGH_ARM, OBJECTIVE_SEARCH_ARM, API_SEARCH_ARM, API_SEARCH_R2_ARM, API_SEARCH_R3_ARM, TERMINAL_SHORTLIST_ARM, TERMINAL_SHORTLIST_CAP12_ARM, TERMINAL_SHORTLIST_ADAPTIVE_ARM, TERMINAL_SHORTLIST_OBJECTIVE_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_EARLY_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_CONDITIONAL_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_IDENTIFIER_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_VIEW_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_FALLBACK_ARM, runIntentAnchorArm} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs";
import {comparisonLiveClientFactory} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-live-client-r1.mjs";
import {createStageOutputGuard} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-output-guard.mjs";
import {createStagePersistence} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/stage-persistence.mjs";
import {verifyHenCandidateView} from "../../src/hen-candidate-view-v1.mjs";
import {createVpsLocalCredentialBinding, createVpsLocalPost, verifyHen11VpsTopology} from "../hen-11-live-contextbench-v1/vps-local-glm-v1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`g01-fast-live.${reason}`); };

export function sourceOutForFreeze(freeze) {
  const root = resolve(freeze.output_root);
  if (freeze.source_out === undefined) return join(root, "source", "00");
  const parts = relative("/opt/are/evolution-runtime", root).split(sep);
  need(parts.length === 3 && /^g01-product-replication-r[0-9]+$/.test(parts[0]) &&
    /^[a-z0-9-]+$/.test(parts[1]) && ["control", "candidate"].includes(parts[2]) &&
    freeze.source_out === join("/tmp", `are-${parts[0]}-source`, parts[1], parts[2], "source", "00"),
  "source-scratch-binding");
  return freeze.source_out;
}

export function sourceCheckoutLayoutForFreeze(freeze, task) {
  if (freeze.source_checkout_layout === undefined) return null;
  const layout = freeze.source_checkout_layout;
  const modes = {
    "g01-r15-r2-single-lower-overlay-r1": {
      campaigns: ["g01-product-replication-r15"],
      residency: "g01-r15-r2-single-checkout-residency-r1",
      lower: "are-g01-r15-r2-single-checkout-residency-r1"
    },
    "g01-r16-r2-single-lower-overlay-r1": {
      campaigns: ["g01-product-replication-r16", "g01-product-replication-r17"],
      residency: "g01-r16-r2-single-checkout-residency-r1",
      lower: "are-g01-r16-r2-single-checkout-residency-r1"
    }
  };
  const mode = modes[layout.mode];
  need(Object.keys(layout).sort().join(",") === "mode,ordinal,residency_receipt_sha256" &&
    mode !== undefined &&
    Number.isSafeInteger(layout.ordinal) && layout.ordinal >= 1 && layout.ordinal <= 24 &&
    /^[a-f0-9]{64}$/.test(layout.residency_receipt_sha256) &&
    mode.campaigns.some(campaign => resolve(freeze.output_root).startsWith(`/opt/are/evolution-runtime/${campaign}/`)) &&
    freeze.source_out !== undefined, "source-checkout-layout-shape");
  const path = `/opt/are/evolution-runtime/${mode.residency}/RESIDENCY-PROBE.json`;
  const bytes = readFileSync(path);
  need(sha(bytes) === layout.residency_receipt_sha256, "source-checkout-residency-drift");
  const receipt = JSON.parse(bytes), row = receipt.rows?.[layout.ordinal - 1];
  need(receipt.status === "passed-retained-source-only" && receipt.task_count === 24 &&
    receipt.model_calls === 0 && receipt.gold_loaded === false &&
    row?.ordinal === layout.ordinal && row.instance_id === task.instance_id &&
    row.base_commit === task.base_commit &&
    row.destination === `/dev/shm/${mode.lower}/task-${String(layout.ordinal).padStart(2, "0")}`,
  "source-checkout-residency-binding");
  return {mode: layout.mode, ordinal: layout.ordinal};
}

export async function runFastG01({freezePath, freezeSha256, signal}) {
  need(signal instanceof AbortSignal && !signal.aborted, "signal");
  const bytes = readFileSync(freezePath);
  need(sha(bytes) === freezeSha256, "freeze-drift");
  const freeze = JSON.parse(bytes);
  need(freeze.schema_version === "are.g01-fast-live-freeze/v1" && [INTENT_ANCHOR_ARM, SOURCE_NEIGHBORHOOD_ARM, SEARCH_FOLLOWTHROUGH_ARM, OBJECTIVE_SEARCH_ARM, API_SEARCH_ARM, API_SEARCH_R2_ARM, API_SEARCH_R3_ARM, TERMINAL_SHORTLIST_ARM, TERMINAL_SHORTLIST_CAP12_ARM, TERMINAL_SHORTLIST_ADAPTIVE_ARM, TERMINAL_SHORTLIST_OBJECTIVE_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_EARLY_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_CONDITIONAL_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_IDENTIFIER_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_VIEW_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_FALLBACK_ARM].includes(freeze.arm), "freeze-shape");
  need(Array.isArray(freeze.sources) && freeze.sources.length >= 1 && freeze.sources.every(binding => sha(readFileSync(binding.path)) === binding.sha256), "source-drift");
  need(sha(readFileSync(freeze.config_path)) === freeze.config_sha256, "config-drift");
  const candidate_view = freeze.candidate_view_path === null && freeze.candidate_view_sha256 === null ? undefined : JSON.parse(readFileSync(freeze.candidate_view_path));
  if (candidate_view) need(sha(readFileSync(freeze.candidate_view_path)) === freeze.candidate_view_sha256 && verifyHenCandidateView(candidate_view).ok && candidate_view.task_ref === freeze.task_id, "view-invalid");
  const config = JSON.parse(readFileSync(freeze.config_path));
  need(freeze.transport_reliability === undefined ? config.transport_reliability === undefined : freeze.transport_reliability === "bounded-view-and-output-cap-r1" && config.transport_reliability === freeze.transport_reliability, "transport-reliability-drift");
  need(freeze.non_tool_terminal_after_convergence === undefined || freeze.non_tool_terminal_after_convergence === true, "non-tool-terminal-policy-invalid");
  need(freeze.non_tool_terminal_after_convergence === undefined ? config.non_tool_terminal_after_convergence === undefined : config.non_tool_terminal_after_convergence === freeze.non_tool_terminal_after_convergence, "non-tool-terminal-policy-drift");
  need(freeze.late_bind_delivered_base === undefined || freeze.late_bind_delivered_base === true, "late-bind-delivered-base-policy-invalid");
  need(freeze.late_bind_delivered_base === undefined ? config.late_bind_delivered_base === undefined : config.late_bind_delivered_base === freeze.late_bind_delivered_base, "late-bind-delivered-base-policy-drift");
  need(freeze.span_refinement_policy === undefined || (freeze.span_refinement_policy === "source-only-go-selected-subspan-r1" && freeze.arm === TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_FALLBACK_ARM), "span-refinement-policy-invalid");
  const task = config.tasks.find(item => item.id === freeze.task_id);
  need(task && task.task_sha256 === freeze.task_sha256 && sha(readFileSync(task.task_path)) === freeze.task_sha256, "task-drift");
  const root = resolve(freeze.output_root), runs = join(root, "runs"), out = join(runs, "00");
  const source_out = sourceOutForFreeze(freeze);
  const source_checkout_layout = sourceCheckoutLayoutForFreeze(freeze, task);
  need(!existsSync(root), "output-exists");
  verifyHen11VpsTopology();
  mkdirSync(runs, {recursive: true, mode: 0o700});
  const persistence = createStagePersistence({stage_root: runs, stage_guard: createStageOutputGuard({root: runs})});
  const factory = comparisonLiveClientFactory({credential_path: config.credential_path, signal, persistence, candidate_arm: freeze.arm,
    before_dispatch: async () => !signal.aborted, credential_override: createVpsLocalCredentialBinding(), post: createVpsLocalPost()});
  return runIntentAnchorArm({config, task_id: freeze.task_id, arm: freeze.arm, candidate_view, signal, out, source_out, source_checkout_layout, evidence_root: runs, persistence, transport_reliability: freeze.transport_reliability, non_tool_terminal_after_convergence: freeze.non_tool_terminal_after_convergence ?? false, late_bind_delivered_base: freeze.late_bind_delivered_base ?? false, span_refinement_policy: freeze.span_refinement_policy ?? null,
    admit_source: async () => !signal.aborted, before_model_dispatch: async () => !signal.aborted,
    create_client: args => factory.create_client(args), measure_index_tokens: factory.measure_index_tokens});
}

if (process.argv[1] === import.meta.filename) {
  const [freezePath, freezeSha256] = process.argv.slice(2);
  const controller = new AbortController(); process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort());
  try { const result = await runFastG01({freezePath, freezeSha256, signal: controller.signal}); console.log(JSON.stringify({status: result.status, arm: result.arm, model_calls: result.receipts?.filter(item => item.kind === "model").length, output_root: JSON.parse(readFileSync(freezePath)).output_root})); }
  catch (error) { console.error(JSON.stringify({status: "failed", error: String(error.message), result_status: error.result?.status ?? null})); process.exitCode = 2; }
}
