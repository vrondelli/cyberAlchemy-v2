const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function validateLargerWindowMatrix(matrix, expectedWindow = 10000, expectedStage = "10k-development-transfer", expectedHypothesis = "LW-H1") {
  const issues = [];
  const check = (condition, code) => { if (!condition) issues.push(code); };
  check(matrix?.schema_version === "are.contextbench-development-matrix/v1", "matrix.schema");
  check(matrix?.evaluation_stage === expectedStage, "matrix.stage");
  check(matrix?.hypothesis_ref === expectedHypothesis, "matrix.hypothesis");
  check(matrix?.window_tokens === expectedWindow, "matrix.window");
  check(Array.isArray(matrix?.tasks) && matrix.tasks.length === 8 && new Set(matrix.tasks.map((row) => row.instance_id)).size === 8, "matrix.tasks");
  check(Array.isArray(matrix?.prefixes) && matrix.prefixes.length === 8, "matrix.prefixes");
  check(Array.isArray(matrix?.branches) && matrix.branches.length === 16, "matrix.branches");
  check(Array.isArray(matrix?.cells) && matrix.cells.length === 24, "matrix.cells");
  const recycleAt = expectedWindow - 1000;
  for (const cell of matrix?.cells ?? []) {
    const ref = `cell:${cell.cell_id ?? "unknown"}`;
    check(cell.context_limit === expectedWindow, `${ref}.context-limit`);
    check(cell.recycle_at === recycleAt, `${ref}.recycle-at`);
    check(cell.safety_margin === 1000 && cell.context_limit - cell.recycle_at === cell.safety_margin, `${ref}.safety-margin`);
    check(cell.limits?.total_tokens === 96000 && cell.limits?.output_cap === 2048 && cell.limits?.maximum_calls === 96, `${ref}.token-policy`);
    check(cell.provider_profile?.model_timeout_ms === 120000 && cell.provider_profile?.request_budget === "contextbench-deferral-v1", `${ref}.provider-policy`);
    const state = cell.state_arm === "state";
    check(cell.limits?.decision_state === state, `${ref}.decision-state`);
    check(cell.limits?.decision_state_substitution === state, `${ref}.decision-state-substitution`);
    check(cell.limits?.decision_state_handles === state, `${ref}.decision-state-handles`);
    check(expectedHypothesis === "LW-H3a"
      ? cell.limits?.decision_state_handle_activation_minimum === (state ? 3 : undefined)
      : cell.limits?.decision_state_handle_activation_minimum === undefined,
    `${ref}.decision-state-handle-activation`);
  }
  for (const prefix of matrix?.prefixes ?? []) {
    const branches = matrix.branches.filter((row) => row.prefix_cell_id === prefix.cell_id);
    check(branches.length === 2, `pair:${prefix.cell_id}.shape`);
    check(branches.filter((row) => row.state_arm === "control").length === 1 && branches.filter((row) => row.state_arm === "state").length === 1, `pair:${prefix.cell_id}.arms`);
    for (const branch of branches) {
      const state = branch.state_arm === "state";
      check(expectedHypothesis === "LW-H3a"
        ? branch.limits?.decision_state_handle_activation_minimum === (state ? 3 : undefined)
        : branch.limits?.decision_state_handle_activation_minimum === undefined,
      `pair:${prefix.cell_id}.decision-state-handle-activation`);
    }
    if (branches.length === 2) {
      const normalized = branches.map((row) => ({...row, cell_id: null, state_arm: null, order_in_pair: null, limits: {...row.limits, decision_state: null, decision_state_substitution: null, decision_state_handles: null, decision_state_handle_activation_minimum: null}}));
      check(equal(normalized[0], normalized[1]), `pair:${prefix.cell_id}.unregistered-difference`);
    }
  }
  check(matrix?.physical_call_ceiling?.total_model_calls === 784 && matrix?.success_criteria?.maximum_physical_model_calls === 784, "matrix.physical-call-ceiling");
  check(matrix?.success_criteria?.minimum_complete_pairs === 6, "matrix.minimum-pairs");
  check(matrix?.success_criteria?.paired_macro_span_f1_gain_minimum === 0.05, "matrix.span-f1-gate");
  check(matrix?.success_criteria?.aggregate_treatment_tokens_not_above_control === true, "matrix.aggregate-token-gate");
  check(matrix?.success_criteria?.treatment_minus_control_tokens_per_pair_maximum === 3072, "matrix.paired-token-gate");
  if (expectedHypothesis === "LW-H3a") {
    check(matrix?.success_criteria?.conditional_activation_minimum_handles === 3, "matrix.conditional-activation-threshold");
    check(matrix?.success_criteria?.inactive_prompt_equivalent_to_control === true, "matrix.inactive-control-parity");
    check(matrix?.success_criteria?.activation_receipt_required === true, "matrix.activation-receipt");
  }
  return Object.freeze({ok: issues.length === 0, issues: Object.freeze([...new Set(issues)].sort()), authority_effect: "none"});
}
