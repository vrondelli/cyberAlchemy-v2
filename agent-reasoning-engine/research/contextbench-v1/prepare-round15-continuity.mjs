// Bind Round 15 to the enduring objective, initial GLM objective, exact method,
// fixed ContextBench acceptance and reviewed Round 14 counterevidence.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const policyPath='agent-reasoning-engine/research/continuity-policy-v3.json';
const read=path=>JSON.parse(readFileSync(path));
const binding=path=>({path,sha256:sha(readFileSync(path))});

export function prepare(){
  const policy=read(policyPath),hypotheses=read(root+'hypotheses-round15.json');
  const predecessors=[
    root+'round14-closeout.json',
    root+'round14-outcome-review.json',
    root+'round14-selected-hypothesis-review.json',
    root+'round14-analysis.json',
    root+'work-state-closed-v14.json',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round14-preserved/runtime-manifest.json',
  ];
  const reviewedPaths=[root+'PLAN-round15.md',root+'hypotheses-round15.json',root+'round15-boundary-audit.json',...predecessors];
  const result={
    schema_version:'are.research-continuity-binding/v1',
    binding_ref:'round15-continuity.json',
    policy_ref:policyPath,
    policy_sha256:sha(readFileSync(policyPath)),
    authority_effect:'none',
    objective_refs:Object.values(policy.objective_levels).flatMap(level=>level.refs),
    objective_contribution:'Remove pre-treatment stochastic divergence so evidence-only ARE state can be judged causally for GLM-5.3-flash at 8K, preserving useful ContextBench quality and completed outcomes within cumulative model input plus output tokens.',
    method_refs:policy.method_refs,
    method_definitions:policy.required_method_definitions,
    predecessor_refs:predecessors.map(binding),
    question_and_hypotheses:{
      records_ref:'hypotheses-round15.json',
      selected:hypotheses.selection.selected,
      alternatives:hypotheses.selection.alternatives,
      question:'When control and treatment continue from the same exact first-recycle boundary, does evidence-only ARE state improve useful native ContextBench selection and valid completion within cumulative model input plus output tokens?',
    },
    experiment_and_task_refs:{
      plan_ref:'PLAN-round15.md',
      tasks:['R15-C','R15-A','R15-P','R15-I','R15-O','R15-T','R15-D','R15-F','R15-R','R15-S','R15-L'],
      boundary_audit_ref:'round15-boundary-audit.json',
      unresolved:'The offline causal oracle, branch ledger implementation, development matrix and exact source freeze remain before dispatch.',
    },
    measurement_mapping:{
      native:'Post-exposure paired native ContextBench span and file metrics measure evidence-selection usefulness; they do not prove patch correctness or general reasoning transfer.',
      retention:'A verified prior delivery, actual first-recycle displacement and exact treatment presentation followed by independently scored subsequent evidence use support a useful-retention claim.',
      integrity:'Verify the shared boundary digest, repository and evidence identity, receipt ancestry, isolated branch writes, zero control state, exact treatment exposure, source credit and terminal effects.',
      tokens:'Count cumulative model input and output tokens for the shared prefix and every successful, failed, corrective, treatment and control branch request; unknown usage makes a pair ineligible.',
      transfer:'The causal fork is a reusable evaluator mechanism, but one exposed GLM-5.3-flash 8K development study cannot establish larger-window, other-model, non-coding, correctness or confirmation claims.',
    },
    acceptance_and_scope:{
      acceptance:policy.acceptance_ref,
      SWE_bench_in_active_scope:false,
      window_order:'Finish the GLM small-window chapter before larger windows, other models, or other domains.',
      exposure:'Rounds one through fourteen and the selected eight-task development cohort are exposed; all reserved confirmation identities remain untouched.',
      stopping_rules:'No within-round tuning, state-content change, threshold change, task replacement, favorable-repetition selection or failed-branch replay. Stop a pair on ancestry, isolation, exposure or accounting mismatch.',
    },
    retained_counterevidence:[
      'Round 14 completed all sixteen cells but only five of eight pairs had native scores in both arms.',
      'Round 14 missed the state-token ceiling by 23,468 tokens and three recycled treatment generations lacked a state presentation.',
      'Round 14 independent arms had different first responses in every pair, so their pre-treatment trajectories were not controlled.',
      'Round 14 task 4 arms differed even though treatment had no recycle and no state exposure.',
      'Round 14 descriptive +0.1084769 paired span F1 and 107,942-token state saving cannot establish a causal state benefit.',
      'Native evidence selection remains distinct from semantic retention, repair correctness, completed user outcomes and transfer.',
    ],
    successor_rule:'Build and validate the fork without model calls, then freeze and run H25 once under its repeated-branch protocol. If H25 fails, review H20 and H0 from all retained results. If it passes, prepare the fixed 8K clearance design; every successor must again carry all three objective levels, the exact method and predecessor counterevidence.',
    continuity_review:{
      reviewer:'executing parent agent',
      reviewed_artifacts:reviewedPaths.map(binding),
      passed_for_candidate_plan:true,
      run_ready:false,
      criterion_verdicts:{
        enduring_objective:'The plan tests a reusable causal evaluator for ARE continuity, quality, completion and cumulative model-token efficiency.',
        initial_GLM_objective:'The plan explicitly keeps GLM-5.3-flash at the 8K small-window-first milestone.',
        current_milestone:'The fixed ContextBench contract remains unchanged and uncleared; Round 15 development cannot claim clearance.',
        method_and_predecessor:'The exact research chain starts from reviewed Round 14 causal counterevidence and selects H25 against H20 and H0.',
        counterevidence:'Incomplete native pairs, missed state exposure/token gates and pre-treatment divergence are retained.',
        measurement_and_token_cost:'Native quality, retention exposure, integrity, transfer limits and every model input/output token are mapped separately.',
        scope_and_acceptance:'The exposed 8K causal study precedes fixed full-dataset and reserved confirmation; no SWE-bench stage or larger-window claim is added.',
        testability:'The offline oracle requires exact ancestry and an isolated one-request state difference before any live dispatch.',
      },
      unresolved_bindings:['R15-I','R15-O','R15-T','R15-D','R15-F'],
    },
    open_questions_ref:'PLAN-round15.md#open-questions',
  };
  const verdict=verifyResearchContinuity({binding:result,policy,hypotheses,phase:'final',root:resolve('.')});
  if(!verdict.ok)throw Error('round15.continuity:'+verdict.reason_codes.join(','));
  const target=root+'round15-continuity.json',bytes=JSON.stringify(result,null,2)+'\n';
  if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round15.continuity-drift');}
  else writeFileSync(target,bytes,{flag:'wx'});
  return {ok:true,selected:result.question_and_hypotheses.selected,checked_hypotheses:verdict.checked_hypotheses,run_ready:false,policy:'v3'};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(prepare()));
