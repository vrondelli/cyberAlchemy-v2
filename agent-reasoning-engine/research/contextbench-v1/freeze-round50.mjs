import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const repository=resolve('.'),root=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const path=name=>resolve(root,name),read=target=>JSON.parse(readFileSync(target)),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round50.drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function freeze(){
  const matrix=read(path('round50-matrix.json')),preflight=read(path('initial-envelope-round50.json')),inventory=read(path('round50-repository-inventory.json')),localGate=read(path('round50-local-gate.json'));
  if(matrix.tasks.length!==8||matrix.prefixes.length!==8||matrix.branches.length!==16||matrix.cells.length!==24)throw Error('round50.matrix-shape');
  if(inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round50.inventory');
  for(const prefix of matrix.prefixes){
    if(prefix.arm!=='baseline'||prefix.state_arm!=='prefix'||prefix.limits.decision_state!==false||prefix.limits.decision_state_substitution!==false)throw Error('round50.prefix-treatment:'+prefix.cell_id);
    const branches=matrix.branches.filter(row=>row.prefix_cell_id===prefix.cell_id);
    if(branches.length!==2||new Set(branches.map(row=>row.state_arm)).size!==2)throw Error('round50.pair:'+prefix.cell_id);
  }
  for(const cell of matrix.cells){
    if(cell.context_limit!==8000||cell.recycle_at!==7000||cell.safety_margin!==1000||cell.provider_profile.model_timeout_ms!==120000||cell.arm!=='baseline'||cell.limits.total_tokens!==96000||cell.limits.output_cap!==2048||cell.limits.maximum_calls!==96||cell.limits.finalization_reserve_tokens!==14000||cell.limits.finalization_calls!==2||cell.limits.decision_state_evidence!==3||cell.limits.decision_state_bytes!==1536||cell.limits.decision_state_tokens!==384||cell.limits.task_state_projection!==false||cell.limits.task_state_novelty_gate!==false||cell.limits.terminal_effect_state!==false||cell.limits.maximum_terminal_corrections!==0||cell.limits.incomplete_output_corrections!==0)throw Error('round50.envelope:'+cell.cell_id);
    const expected=cell.state_arm==='state';if(cell.limits.decision_state!==expected||cell.limits.decision_state_substitution!==expected)throw Error('round50.sole-treatment:'+cell.cell_id);
  }
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round50.preflight');
  const preflightRows=preflight.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=read(resultRef);if(result.status!==row.status||(result.receipts??[]).some(receipt=>receipt.kind==='model'&&receipt.dispatched))throw Error('round50.preflight-result:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  write('preflight-binding-round50.json',{schema_version:'are.contextbench-preflight-binding/v1',status:'verified',rows:preflightRows,model_calls:0,tokenizer_only:true,authority_effect:'none',open_questions_ref:'PLAN-round50.md#open-questions'});
  const tests=readFileSync(path('round50-runtime-tests.log'),'utf8');if(!tests.includes('tests 438')||!tests.includes('pass 438')||!tests.includes('fail 0')||localGate.status!=='pass'||Object.values(localGate.checks).some(value=>value!==true))throw Error('round50.local-gates');
  if(matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum!==3072||matrix.success_criteria?.decision_boundary_exact!==true||matrix.success_criteria?.held_boundary_response_effects!==0||matrix.success_criteria?.treatment_state_presentations!==1||matrix.success_criteria?.control_state_presentations!==0||matrix.success_criteria?.decision_state_tokens_maximum!==384||matrix.success_criteria?.decision_state_bytes_maximum!==1536||matrix.success_criteria?.decision_state_evidence_maximum!==3||matrix.success_criteria?.minimum_first_request_input_token_reduction!==128||matrix.success_criteria?.terminal_boundary_only!==true||matrix.success_criteria?.prompt_substitution!==true||matrix.success_criteria?.earliest_infeasibility_stop!==true||matrix.success_criteria?.aggregate_treatment_tokens_not_above_control!==true||matrix.success_criteria?.minimum_complete_pairs!==6||matrix.success_criteria?.indeterminate_model_calls_maximum!==2||matrix.success_criteria?.indeterminate_call_full_reservation_debit!==true||matrix.success_criteria?.symmetric_fixed_zero_for_bounded_failure!==true||matrix.success_criteria?.automatic_retries!==0)throw Error('round50.criteria');
  write('freeze-validation-v50.json',{schema_version:'are.contextbench-freeze-validation/v1',status:'passed',round:50,evaluation_stage:'development',tasks:8,prefixes:8,branches:16,cells:24,paired_task_outcomes:8,minimum_complete_pairs:6,maximum_indeterminate_model_calls:2,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',scheduled_trajectories:16,repetitions_per_arm:1,shared_prefix:true,shared_boundary:'first-held-terminal-candidate',confirming_response_effects:0,semantic_treatment:'terminal-decision-state-v2-prompt-substitution',instrument_runner:'terminal-decision-substitution-v1',model_timeout_ms:120000,maximum_input_candidates:3,maximum_decision_state_bytes:1536,maximum_decision_state_tokens:384,minimum_first_request_input_token_reduction:128,maximum_paired_token_difference:3072,per_trajectory_model_token_ceiling:96000,logical_model_token_ceiling:1536000,sealed_scoreability_rate:1,native_scorer_smoke_rate:1,model_calls:0,authority_effect:'none'});
  const continuity=structuredClone(read(path('round50-continuity.json')));delete continuity.experiment_and_task_refs.unresolved;
  Object.assign(continuity.experiment_and_task_refs,{selection_ref:'round50-task-selection.json',matrix_ref:'round50-matrix.json',inventory_ref:'round50-repository-inventory.json',preflight_ref:'initial-envelope-round50.json',freeze_ref:'freeze-round50-execution.json',scorer_ref:'score-round50.mjs'});
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['round50-task-selection.json','round50-public-input-screening.json','round50-matrix.json','round50-repository-inventory.json','initial-envelope-round50.json','preflight-binding-round50.json','freeze-validation-v50.json','round50-local-gate.json','round50-runtime-tests.log','round50-scorer-readiness.json','score-round50.mjs','build-round50-matrix.mjs'];
  const byPath=new Map(continuity.continuity_review.reviewed_artifacts.map(row=>[row.path,row]));for(const name of reviewed){const item={path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))};byPath.set(item.path,item);}continuity.continuity_review.reviewed_artifacts=[...byPath.values()];
  const verdict=verifyResearchContinuity({binding:continuity,policy:read(resolve('agent-reasoning-engine/research/continuity-policy-v4.json')),hypotheses:read(path('hypotheses-round50.json')),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round50.freeze-continuity:'+verdict.reason_codes.join(','));write('round50-freeze-continuity.json',continuity);
  const local=[
    'agent-reasoning-engine/LIGHTHOUSE.md',
    'agent-reasoning-engine/research/continuity-policy-v4.json',
    'agent-reasoning-engine/research/contextbench-v1/PLAN-round50.md',
    'agent-reasoning-engine/research/contextbench-v1/hypotheses-round50.json',
    'agent-reasoning-engine/research/contextbench-v1/experiment-round50.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-freeze-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/work-plan-v50.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-public-input-screening.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-matrix.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-repository-inventory.json',
    'agent-reasoning-engine/research/contextbench-v1/initial-envelope-round50.json',
    'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round50.json',
    'agent-reasoning-engine/research/contextbench-v1/freeze-validation-v50.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-local-gate.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-runtime-tests.log',
    'agent-reasoning-engine/research/contextbench-v1/round50-scorer-readiness.json',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round50.mjs',
    'agent-reasoning-engine/research/contextbench-v1/select-round50-tasks.py',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round50-repositories.py',
    'agent-reasoning-engine/research/contextbench-v1/build-round50-local-gate.mjs',
    'agent-reasoning-engine/research/contextbench-v1/build-round50-matrix.mjs',
    'agent-reasoning-engine/research/contextbench-v1/score-round50.mjs',
    'agent-reasoning-engine/research/contextbench-v1/freeze-round50.mjs',
    'agent-reasoning-engine/research/contextbench-v1/round49-interrupted-outcome.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-analysis.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-closeout.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-h68-preimplementation-audit.json',
    
    'agent-reasoning-engine/research/contextbench-v1/round50-scoreability-input.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-sealed-scoreability.json',
    'agent-reasoning-engine/research/contextbench-v1/round50-native-scorer-smoke.json',
    'agent-reasoning-engine/research/contextbench-v1/smoke-round50-native-scorer.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-decision-substitution-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-terminal-decision-substitution-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-terminal-decision-substitution-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-terminal-decision-substitution-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/preflight-live-storage-bounded.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-decision-state-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-decision-state-terminal-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-decision-state-output-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-decision-state-response-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-decision-state-context-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-decision-state-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-decision-state-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-decision-state-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/completion-readiness-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-completion-readiness-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-completion-readiness-prefix-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/completion-readiness-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/preflight-live-completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-completion-readiness-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/indeterminate-token-accounting.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/indeterminate-token-accounting.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/censored-pair-accounting.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/censored-pair-accounting.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/dispatch-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/dispatch-validation.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/model-timeout.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round50/manifest.json'
  ].map(target=>resolve(repository,target));
  for(const task of matrix.tasks)local.push(resolve(implementation,'development-tasks-round50',task.instance_id+'.json'));
  local.push('/home/vrondelli/.config/are/glm-flash-credential.json');const sources=[...new Set(local)].sort().map(target=>({path:target,sha256:fileSha(target)}));
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,evaluation_stage:'development',expected_tasks:8,expected_cells:24,matrix_ref:path('round50-matrix.json'),preflight_ref:path('initial-envelope-round50.json'),task_manifest_ref:resolve(implementation,'development-tasks-round50/manifest.json'),task_directory:resolve(implementation,'development-tasks-round50'),repository_inventory_ref:path('round50-repository-inventory.json'),repository_inventory_sha256:fileSha(path('round50-repository-inventory.json')),upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(implementation,'score_native.py'),scoring_cache:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round50-score-cache',native_worktree_root:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round50-native-worktrees',confirmation_scorer:path('score-round50.mjs'),model_timeout_ms:120000,maximum_bounded_indeterminate_calls:2,minimum_complete_pairs:6,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',maximum_decision_state_evidence:3,maximum_decision_state_bytes:1536,maximum_decision_state_tokens:384,minimum_first_request_input_token_reduction:128,execution:{runner:resolve(implementation,'run-shared-terminal-decision-substitution-v1.mjs'),shards:1,partition:'sequential; fork at first held terminal candidate; treatment replaces registered review scaffolding; held response has zero effects; stop immediately when six eligible pairs become unreachable; bounded indeterminate calls are fully debited; all unbounded failures stop globally'},sources,continuity_review:{...continuity.continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round49-execution.json'),successor_reason:'Round 49 rejected universal additive state after an effect-phase token ceiling failure. Round 50 tests terminal-only prompt substitution selected from that counterevidence.'};
  write('freeze-round50-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round50-execution.json'));
  write('work-state-frozen-v50-execution.json',{schema_version:'are.contextbench-work-state/v1',round:50,status:'frozen-run-ready',completed:['R50-A','R50-B','R50-C','R50-D','R50-E','R50-F','R50-G','R50-H'],frontier:['R50-I'],freeze_ref:'freeze-round50-execution.json',freeze_sha256:sha(material),benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round50.md#open-questions'});
  return{status:'frozen-run-ready',sources:sources.length,freeze_sha256:sha(material),tasks:8,trajectories:16,cells:24,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(freeze()));
