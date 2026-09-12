// Bind round seven to the objective hierarchy, research method and reviewed round-six evidence.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root = 'agent-reasoning-engine/research/contextbench-v1/';
const fileSha = path => sha(readFileSync(path));
const binding = path => ({path, sha256: fileSha(path)});
const local = name => binding(root + name);

export function prepare() {
  const hypotheses = JSON.parse(readFileSync(root + 'hypotheses-round7.json'));
  const material = {
    schema_version: 'are.research-continuity-binding/v1',
    binding_ref: 'round7-continuity.json',
    policy_ref: 'agent-reasoning-engine/research/continuity-policy-v1.json',
    policy_sha256: fileSha('agent-reasoning-engine/research/continuity-policy-v1.json'),
    authority_effect: 'none',
    objective_refs: [
      binding('agent-reasoning-engine/LIGHTHOUSE.md'),
      binding('agent-reasoning-engine/research/tool-state-audit-v1/OBJECTIVE.md'),
      binding('implementation/agent-reasoning-engine/GLM-FINISH-PLAN.md'),
      binding('agent-reasoning-engine/research/tool-state-audit-v1/PLAN.md'),
      binding('agent-reasoning-engine/research/contextbench-v1/acceptance.json'),
    ],
    objective_contribution: 'Test whether exact-generation deterministic process state helps GLM-5.3-flash resume useful reasoning after actual local recycling at 8K and improves native ContextBench evidence selection within the same cumulative model input plus output token cap.',
    method_refs: [
      binding('agent-reasoning-engine/research/CONTINUITY.md'),
      binding('implementation/agent-reasoning-engine/packages/evolution-runtime/ontology/research-learning-v1.json'),
    ],
    method_definitions: ['ARE-RL-D01', 'ARE-RL-D02', 'ARE-RL-D03', 'ARE-RL-D04', 'ARE-RL-D05', 'ARE-RL-D07', 'ARE-RL-D08'],
    predecessor_refs: [
      local('round6-closeout.json'),
      local('round6-stopping-review.json'),
      local('round6-selected-hypothesis-review.json'),
      local('work-state-stopped-v6.json'),
      local('exact-generation-render-review-v1.json'),
    ],
    question_and_hypotheses: {
      records_ref: 'hypotheses-round7.json',
      selected: hypotheses.selection.selected,
      alternatives: hypotheses.selection.alternatives,
      question: 'After actual local recycling, does exact-generation event-derived state improve native evidence selection without speculative tokenizer work within the same cumulative model-token cap?',
    },
    experiment_and_task_refs: {
      plan_ref: 'PLAN-round7.md',
      tasks: ['R7-C', 'R7-I', 'R7-E', 'R7-D', 'R7-F', 'R7-R', 'R7-S', 'R7-L'],
      component_review_ref: 'exact-generation-render-review-v1.json',
      matrix_ref: 'development-matrix-v7.json',
      experiment_ref: 'experiment-round7.json',
      unresolved: 'D07/D08 work binding, tokenizer-only initial-envelope and state-path health preflights, exact source closure, and freeze-phase continuity review remain before dispatch.',
    },
    measurement_mapping: {
      native: 'Paired ContextBench span and file metrics measure source-evidence selection; they do not establish repair correctness or semantic retention by themselves.',
      retention: 'A successful post-recycle model request bound to an exact-generation state presentation establishes mechanism exposure; useful retention additionally requires improved native outcomes or completed correctness evidence.',
      integrity: 'Every projected fact must bind to task input, successful request receipt, tool event, or repository result; unused-generation measurements and unmatched presentations are instrument failures.',
      tokens: 'Count every model input and output token, including state presentation, recovery, failed submissions, and corrections. Local deterministic work is free until model-visible under the selected optimization cost.',
      transfer: 'One exposed GLM-5.3-flash 8K development round cannot establish another window, model, domain, full-cohort result, semantic retention, or repair correctness.',
    },
    acceptance_and_scope: {
      acceptance: binding('agent-reasoning-engine/research/contextbench-v1/acceptance.json'),
      SWE_bench_in_active_scope: false,
      window_order: 'GLM small-window chapter first; 8K development before 10K/12K and reserved confirmation.',
      exposure: 'Rounds one through six and the eight round-four development identities are exposed. Reserved confirmation remains untouched.',
      stopping_rules: 'No within-round tuning, replacement, source refresh, threshold changes, or lucky reruns. Pause unstarted cells on shared provider or instrument failure and retain every attempt.',
    },
    retained_counterevidence: [
      'Round four exposed source-index recovery but gained only 0.000819 macro span F1, lost 0.01333 file F1, and used 77,656 more aggregate model tokens.',
      'Round five repaired terminal validity on a three-task exposed cohort; valid serialization did not establish useful state, semantic retention, or repair correctness.',
      'Round six attempted three of sixteen cells, used 21,019 known model tokens plus one unknown-usage call, produced zero native scores and zero state presentations, and retained thirteen unstarted cells.',
      'Both round-six treatment attempts performed speculative future-generation state measurement and failed before exposure, so H11 remains untested rather than supported or refuted.',
      'Exact-generation state may remain distracting or insufficient even when its exposure and accounting are valid.',
    ],
    successor_rule: 'Freeze H13 only after exact-generation controls, matched design, preflights, exact source closure, D07/D08 work binding and freeze continuity pass. Run each frozen cell once. A passing exposed development result may prepare untouched confirmation under the unchanged acceptance contract; any failure or inconclusive result must retain evidence and select a reviewed competing successor. Never rerun unchanged, lower thresholds, infer clearance, or transition automatically to another benchmark.',
    continuity_review: {
      reviewer: 'executing parent agent',
      reviewed_artifacts: [
        local('PLAN-round7.md'),
        local('hypotheses-round7.json'),
        local('round6-closeout.json'),
        local('round6-stopping-review.json'),
        local('round6-selected-hypothesis-review.json'),
        local('work-state-stopped-v6.json'),
        local('exact-generation-render-review-v1.json'),
        local('development-matrix-v7.json'),
        local('experiment-round7.json'),
      ],
      passed_for_candidate_plan: true,
      run_ready: false,
      criterion_verdicts: {
        enduring_objective: 'H13 tests reusable reasoning continuity, recovery, correctness-oriented completion and outcomes under total model-token cost.',
        initial_GLM_objective: 'H13 directly tests GLM-5.3-flash after recycling at 8K; later small windows remain ordered after valid 8K evidence.',
        current_milestone: 'The fixed ContextBench acceptance contract remains the uncleared milestone; development evidence cannot clear it.',
        method_and_predecessor: 'The reviewed round-six zero-exposure failure leads through an explicit gap, question, H13/H12/H0 selection, fixed experiment and future observation/decision chain.',
        counterevidence: 'Prior weak quality gains, added tokens, terminal-only validity, round-six failures and the semantic ceiling are retained.',
        measurement_and_token_cost: 'Native selection, exact exposure, integrity, correctness limits and cumulative model input plus output tokens are separated.',
        scope_and_acceptance: 'Only exposed 8K development tasks are used; SWE-bench is excluded and full identities, windows, tiers and reserved repetitions remain unchanged.',
        testability: 'H13 has one changed variable, exact exposure checks, matched controls, fixed thresholds, falsifiers and stopping rules.',
      },
      unresolved_bindings: ['R7-F'],
    },
    open_questions_ref: 'PLAN-round7.md#open-questions',
  };
  const bytes = JSON.stringify(material, null, 2) + '\n';
  const target = root + 'round7-continuity.json';
  if (existsSync(target)) {
    if (readFileSync(target, 'utf8') !== bytes) throw Error('round7.artifact-drift:round7-continuity.json');
  } else writeFileSync(target, bytes, {flag: 'wx'});
  return {binding: target, sha256: fileSha(target)};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(prepare()));
