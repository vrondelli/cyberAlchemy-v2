// Additive HEN-11 task-cell and orchestration boundary; no control dispatch.
import {preserveComparisonResult} from "./canonical-comparison-result.mjs";
import {buildComparisonCell as buildHistoricalCell} from "./comparison-arm.mjs";
import {runPreparedIntentAnchorTask} from "./discovery-v1/orchestrate-intent-anchor-r3.mjs";
import {providerAttemptHealth} from "./provider-attempt-health.mjs";
const need = (value, reason) => { if (!value) throw new Error(`intent-anchor-arm.${reason}`); };

export const INTENT_ANCHOR_ARM = "intent-anchor-convergence-r3";
export const SOURCE_NEIGHBORHOOD_ARM = "intent-anchor-source-neighborhood-r1";
export const SEARCH_FOLLOWTHROUGH_ARM = "intent-anchor-search-followthrough-r1";
export const OBJECTIVE_SEARCH_ARM = "intent-anchor-objective-search-r1";
export const API_SEARCH_ARM = "intent-anchor-api-search-r1";
export const API_SEARCH_R2_ARM = "intent-anchor-api-search-r2";
export const API_SEARCH_R3_ARM = "intent-anchor-api-search-r3";
export const TERMINAL_SHORTLIST_ARM = "intent-anchor-terminal-shortlist-r1";
export const TERMINAL_SHORTLIST_CAP12_ARM = "intent-anchor-terminal-shortlist-cap12-r1";
export const TERMINAL_SHORTLIST_ADAPTIVE_ARM = "intent-anchor-terminal-shortlist-adaptive-r1";
export const TERMINAL_SHORTLIST_OBJECTIVE_ARM = "intent-anchor-terminal-shortlist-objective-r1";
export const TERMINAL_SHORTLIST_DISTINCTIVE_ARM = "intent-anchor-terminal-shortlist-distinctive-r1";
export const TERMINAL_SHORTLIST_DISTINCTIVE_EARLY_ARM = "intent-anchor-terminal-shortlist-distinctive-early-r1";
export const TERMINAL_SHORTLIST_DISTINCTIVE_CONDITIONAL_ARM = "intent-anchor-terminal-shortlist-distinctive-conditional-r1";
export const TERMINAL_SHORTLIST_DISTINCTIVE_IDENTIFIER_ARM = "intent-anchor-terminal-shortlist-distinctive-identifier-r1";
export const TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_VIEW_ARM = "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1";
export const TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_FALLBACK_ARM = "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1";
export const TERMINAL_SHORTLIST_UNCOVERED_REQUIREMENT_ARM = "intent-anchor-terminal-shortlist-uncovered-requirement-r1";
export function buildIntentAnchorCell({config, task_id, arm}) {
  need([INTENT_ANCHOR_ARM, SOURCE_NEIGHBORHOOD_ARM, SEARCH_FOLLOWTHROUGH_ARM, OBJECTIVE_SEARCH_ARM, API_SEARCH_ARM, API_SEARCH_R2_ARM, API_SEARCH_R3_ARM, TERMINAL_SHORTLIST_ARM, TERMINAL_SHORTLIST_CAP12_ARM, TERMINAL_SHORTLIST_ADAPTIVE_ARM, TERMINAL_SHORTLIST_OBJECTIVE_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_EARLY_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_CONDITIONAL_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_IDENTIFIER_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_VIEW_ARM, TERMINAL_SHORTLIST_DISTINCTIVE_REASONING_FALLBACK_ARM, TERMINAL_SHORTLIST_UNCOVERED_REQUIREMENT_ARM].includes(arm), "candidate-only");
  const base = buildHistoricalCell({config, task_id, arm: "minimal-history"});
  return {...base, cell_id: `${task_id}--${arm}`, comparison_arm: arm, context_projection: arm,
    phase_contract: {exploration_tokens: config.total_tokens_per_arm - 8000, exploration_calls: 95, finalization_tokens: 8000, finalization_calls: 1}};
}

/** Executor injection is a provider-free test seam, never a manifest field. */
export async function runIntentAnchorArm({config, task_id, arm, create_client, signal, before_model_dispatch = async () => true, ...runtime}, {execute_candidate = runPreparedIntentAnchorTask} = {}) {
  const cell = buildIntentAnchorCell({config, task_id, arm}), task = config.tasks.find(item => item.id === task_id);
  need(task && signal instanceof AbortSignal && !signal.aborted, "active-task-signal");
  need(typeof create_client === "function" && typeof before_model_dispatch === "function", "dependencies");
  let client, clientAttempted = false;
  const health = () => providerAttemptHealth([...(client?.receipts ?? []), ...(client?.index_receipts ?? [])]);
  const classify = value => preserveComparisonResult(value, client);
  try {
    return classify(await execute_candidate({...runtime, task_path: task.task_path, task_sha256: task.task_sha256, repository_cache: task.repository_cache, cell, signal,
      create_client: async args => { need(!clientAttempted, "single-client"); clientAttempted = true; client = await create_client({...args, signal}); return client; },
      before_model_dispatch: async () => !signal.aborted && health().healthy && await before_model_dispatch() === true}));
  } catch (error) {
    const evidence = error.result ?? {status: "orchestration_error", error: String(error.message), benchmark_cleared: false, accounting_requires_reconciliation: true, infrastructure_failure: {orchestration_failure: true}};
    error.result = classify(evidence); throw error;
  }
}
