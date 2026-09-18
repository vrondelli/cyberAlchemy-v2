import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const here = resolve("agent-reasoning-engine/research/contextbench-v1/larger-window-v1");
const taskRoot = resolve("implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round56");
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const writeExact = (name, value) => {
  const path = resolve(here, name);
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  if (existsSync(path)) {
    if (readFileSync(path, "utf8") !== bytes) throw new Error(`round56.artifact-drift:${name}`);
  } else writeFileSync(path, bytes, {flag: "wx"});
};

const providerProfile = Object.freeze({
  token_margin: 512,
  reasoning_effort: "low",
  model_timeout_ms: 120000,
  index_tokenizer_maximum_calls: 512,
  request_budget: "contextbench-deferral-v1",
  request_tokenizer_maximum_calls: 291,
  index_tokenizer_transport_attempts: 2,
  request_tokenizer_transport_attempts: 2,
});
const limits = Object.freeze({
  maximum_calls: 96,
  output_cap: 2048,
  total_tokens: 96000,
  index_entries: 8,
  index_tokens: 1024,
  finalization_reserve_tokens: 14000,
  finalization_calls: 2,
  output_deferral: true,
  terminal_submission: true,
  task_state_bytes: 4096,
  task_state_tokens: 1024,
  task_state_evidence: 8,
  task_state_outcomes: 12,
  task_state_projection: false,
  incomplete_output_corrections: 0,
  task_state_presentations_per_generation: 1,
  task_state_include_outcomes: false,
  maximum_terminal_corrections: 0,
  terminal_content_fallback: true,
  task_state_max_paths: 8,
  task_state_handles_per_path: 1,
  task_state_handle_selection: "widest",
  task_state_novelty_gate: false,
  terminal_effect_state: false,
  terminal_effect_state_tokens: 3072,
  terminal_effect_state_evidence: 6,
  evidence_slate: false,
  evidence_slate_candidates: 8,
  evidence_slate_bytes: 4096,
  evidence_slate_tokens: 1024,
  decision_state_evidence: 3,
  decision_state_bytes: 1024,
  decision_state_tokens: 160,
  decision_state_substitution: false,
  decision_state_handles: false,
  decision_state: false,
});

const selection = read(resolve(here, "round56-task-selection.json"));
const projection = read(resolve(here, "round56-sealed-scoreability.json"));
const inventory = read(resolve(here, "round56-repository-inventory.json"));
const hypotheses = read(resolve(here, "hypotheses.json"));
const windowPolicy = read(resolve(here, "window-policy.json"));
const manifestPath = resolve(taskRoot, "manifest.json");
const manifest = read(manifestPath);
if (selection.status !== "selected-fresh-scoreable-10k-development-transfer" || selection.tasks.length !== 8 || manifest.tasks.length !== 8 || manifest.gold_fields_present !== false) throw new Error("round56.selection-invalid");
if (inventory.status !== "ready" || inventory.repositories.length !== 8 || inventory.repositories.some((row) => row.clone_transfer_verified !== true)) throw new Error("round56.repositories-invalid");
if (hypotheses.selected !== "LW-H1") throw new Error("round56.hypothesis-invalid");
const policy = windowPolicy.policies.find((row) => row.window_tokens === 10000);
if (!policy || policy.context_limit - policy.recycle_at !== policy.safety_margin || policy.safety_margin !== 1000) throw new Error("round56.window-policy-invalid");
const scoreability = new Map(projection.rows.map((row) => [row.instance_id, row]));

const tasks = selection.tasks.map((selected, index) => {
  const entry = manifest.tasks.find((row) => row.instance_id === selected.instance_id);
  const bytes = readFileSync(resolve(taskRoot, entry.file));
  const task = JSON.parse(bytes);
  if (sha(bytes) !== entry.sha256 || entry.sha256 !== selected.task_sha256 || scoreability.get(task.instance_id)?.scoreable !== true) throw new Error(`round56.task-binding:${selected.instance_id}`);
  for (const forbidden of ["gold_context", "patch", "test_patch", "f2p", "p2p"]) if (Object.hasOwn(task, forbidden)) throw new Error(`round56.gold-field:${task.instance_id}`);
  return {instance_id: task.instance_id, original_inst_id: task.original_inst_id, repo: task.repo, repo_url: task.repo_url, base_commit: task.base_commit, source: task.source, language: task.language, locked_order: index + 1};
});

const prefixes = [], branches = [];
for (const [index, task] of tasks.entries()) {
  const ordinal = String(index + 1).padStart(2, "0");
  const prefixId = `r56-${ordinal}-terminal-prefix-10k`;
  const common = {...task, arm: "baseline", context_limit: policy.context_limit, recycle_at: policy.recycle_at, safety_margin: policy.safety_margin, provider_profile: providerProfile, repetition: 1, limits: {...limits}};
  prefixes.push({...common, cell_id: prefixId, cell_kind: "shared-prefix", state_arm: "prefix", repetition: 0});
  const control = {...common, cell_id: `r56-${ordinal}-control-review-rep1-10k`, cell_kind: "branch", prefix_cell_id: prefixId, state_arm: "control", order_in_pair: index % 2 === 0 ? 1 : 2};
  const state = {...common, cell_id: `r56-${ordinal}-terminal-handles-rep1-10k`, cell_kind: "branch", prefix_cell_id: prefixId, state_arm: "state", order_in_pair: index % 2 === 0 ? 2 : 1, limits: {...limits, decision_state: true, decision_state_substitution: true, decision_state_handles: true}};
  branches.push(...(index % 2 === 0 ? [control, state] : [state, control]));
}

const successCriteria = {
  scheduled_identities: 8,
  all_identities_accounted: true,
  minimum_complete_pairs: 6,
  earliest_infeasibility_stop: true,
  symmetric_fixed_zero_for_bounded_failure: true,
  indeterminate_model_calls_maximum: 2,
  indeterminate_call_full_reservation_debit: true,
  unbounded_unknown_model_calls: 0,
  automatic_retries: 0,
  model_timeout_ms: 120000,
  total_model_tokens_per_logical_path: 96000,
  maximum_physical_model_calls: 784,
  full_denominator_reported: true,
  decision_boundary_exact: true,
  held_boundary_response_effects: 0,
  treatment_state_presentations: 1,
  control_state_presentations: 0,
  evidence_handle_maximum: 3,
  evidence_handle_bytes_maximum: 1024,
  evidence_handle_tokens_maximum: 160,
  minimum_first_request_input_token_reduction: 128,
  terminal_boundary_only: true,
  private_handle_resolution: true,
  treatment_added_full_read_id_occurrences: 0,
  inherited_full_read_id_occurrences_paired: true,
  paired_macro_span_f1_gain_minimum: 0.05,
  span_coverage_non_degradation: true,
  span_precision_non_degradation: true,
  file_coverage_non_degradation: true,
  file_precision_non_degradation: true,
  valid_selection_non_degradation: true,
  exact_reconstruction: true,
  aggregate_treatment_tokens_not_above_control: true,
  treatment_minus_control_tokens_per_pair_maximum: 3072,
  window_tokens: 10000,
};
const matrix = {
  schema_version: "are.contextbench-development-matrix/v1",
  round: "contextbench-larger-window-round56",
  evaluation_stage: "10k-development-transfer",
  hypothesis_ref: "LW-H1",
  alternative_hypothesis_refs: ["LW-H2", "LW-H3", "LW-H0"],
  predecessor_ref: "../round55-closeout.json",
  window_tokens: 10000,
  tasks,
  prefixes,
  branches,
  cells: [...prefixes, ...branches],
  task_manifest_ref: manifestPath,
  selection: "Eight locked globally unexposed, public-screened, sealed-scoreable identities from distinct repositories.",
  protocol_ref: "PLAN.md",
  continuity_ref: "continuity-binding.json",
  window_policy_ref: "window-policy.json",
  treatment: "Unchanged H72 terminal-only request-local evidence handles with exact private resolution and incremental non-disclosure.",
  branch_order: {method: "alternating control-first and treatment-first by locked task order", shared_prefixes: 8, review_branches: 16, physical_cells: 24},
  physical_call_ceiling: {prefix_calls: 8 * 96, branch_calls: 16, total_model_calls: 784, automatic_retries: 0},
  stopping_rules: [
    "No reruns, replacements, or within-round changes after freeze.",
    "Every identity remains in the fixed denominator.",
    "Stop when six eligible pairs become mathematically unreachable.",
    "Any unbounded usage, ancestry drift, nonterminal boundary, held effect, disclosure, input-reduction, or paired-token violation stops before the next task."
  ],
  success_criteria: successCriteria,
  claim_ceiling: "Fresh GLM-5.3-flash 10K unchanged-H72 development transfer only; not confirmation, 12K qualification, full ContextBench clearance, or production policy.",
  authority_effect: "none",
  open_questions_ref: "PLAN.md#open-questions",
};
writeExact("round56-matrix.json", matrix);
writeExact("round56-public-input-screening.json", {schema_version: "are.contextbench-public-input-screening/v1", status: "passed", round: 56, rows: tasks.map((task) => ({instance_id: task.instance_id, security_sensitive: false})), screen_ref: "round56-task-selection.json#public_input_screen", model_calls: 0, authority_effect: "none", open_questions_ref: "PLAN.md#open-questions"});
process.stdout.write(`${JSON.stringify({status: "matrix-ready", tasks: 8, prefixes: 8, branches: 16, cells: 24, window_tokens: 10000, recycle_at: 9000, maximum_physical_model_calls: 784, model_calls: 0})}\n`);
