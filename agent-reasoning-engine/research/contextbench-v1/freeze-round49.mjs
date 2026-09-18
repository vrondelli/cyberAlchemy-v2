import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const repository=resolve('.'),root=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const path=name=>resolve(root,name),read=target=>JSON.parse(readFileSync(target)),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round49.drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function freeze(){
  const matrix=read(path('round49-matrix.json')),preflight=read(path('initial-envelope-round49.json')),inventory=read(path('round49-repository-inventory.json')),localGate=read(path('round49-local-gate.json'));
  if(matrix.tasks.length!==16||matrix.prefixes.length!==16||matrix.branches.length!==32||matrix.cells.length!==48)throw Error('round49.matrix-shape');
  if(inventory.repositories.length!==16||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round49.inventory');
  for(const prefix of matrix.prefixes){
    if(prefix.arm!=='baseline'||prefix.state_arm!=='prefix'||prefix.limits.decision_state!==false)throw Error('round49.prefix-treatment:'+prefix.cell_id);
    const branches=matrix.branches.filter(row=>row.prefix_cell_id===prefix.cell_id);
    if(branches.length!==2||new Set(branches.map(row=>row.state_arm)).size!==2)throw Error('round49.pair:'+prefix.cell_id);
  }
  for(const cell of matrix.cells){
    if(cell.context_limit!==8000||cell.recycle_at!==7000||cell.safety_margin!==1000||cell.provider_profile.model_timeout_ms!==120000||cell.arm!=='baseline'||cell.limits.total_tokens!==96000||cell.limits.output_cap!==2048||cell.limits.maximum_calls!==96||cell.limits.finalization_reserve_tokens!==14000||cell.limits.finalization_calls!==2||cell.limits.decision_state_evidence!==8||cell.limits.decision_state_bytes!==4096||cell.limits.decision_state_tokens!==1024||cell.limits.task_state_projection!==false||cell.limits.task_state_novelty_gate!==false||cell.limits.terminal_effect_state!==false||cell.limits.maximum_terminal_corrections!==0||cell.limits.incomplete_output_corrections!==0)throw Error('round49.envelope:'+cell.cell_id);
    const expected=cell.state_arm==='state';if(cell.limits.decision_state!==expected)throw Error('round49.sole-treatment:'+cell.cell_id);
  }
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==16||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round49.preflight');
  const preflightRows=preflight.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=read(resultRef);if(result.status!==row.status||(result.receipts??[]).some(receipt=>receipt.kind==='model'&&receipt.dispatched))throw Error('round49.preflight-result:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  write('preflight-binding-round49.json',{schema_version:'are.contextbench-preflight-binding/v1',status:'verified',rows:preflightRows,model_calls:0,tokenizer_only:true,authority_effect:'none',open_questions_ref:'PLAN-round49.md#open-questions'});
  const tests=readFileSync(path('round49-runtime-tests.log'),'utf8');if(!tests.includes('tests 437')||!tests.includes('pass 437')||!tests.includes('fail 0')||localGate.status!=='pass'||Object.values(localGate.checks).some(value=>value!==true))throw Error('round49.local-gates');
  if(matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum!==3072||matrix.success_criteria?.decision_boundary_exact!==true||matrix.success_criteria?.held_boundary_response_effects!==0||matrix.success_criteria?.treatment_state_presentations!==1||matrix.success_criteria?.control_state_presentations!==0||matrix.success_criteria?.decision_state_tokens_maximum!==1024||matrix.success_criteria?.decision_state_bytes_maximum!==4096||matrix.success_criteria?.earliest_infeasibility_stop!==true||matrix.success_criteria?.aggregate_treatment_tokens_not_above_control!==true||matrix.success_criteria?.minimum_complete_pairs!==12||matrix.success_criteria?.indeterminate_model_calls_maximum!==2||matrix.success_criteria?.indeterminate_call_full_reservation_debit!==true||matrix.success_criteria?.symmetric_fixed_zero_for_bounded_failure!==true||matrix.success_criteria?.automatic_retries!==0)throw Error('round49.criteria');
  write('freeze-validation-v49.json',{schema_version:'are.contextbench-freeze-validation/v1',status:'passed',round:49,evaluation_stage:'replication',tasks:16,prefixes:16,branches:32,cells:48,paired_task_outcomes:16,minimum_complete_pairs:12,maximum_indeterminate_model_calls:2,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',scheduled_trajectories:32,repetitions_per_arm:1,shared_prefix:true,shared_boundary:'earliest-receipt-confirmed-effect-or-terminal-or-typed-pressure',confirming_response_effects:0,semantic_treatment:'decision-state-v1',instrument_runner:'decision-state-v1',model_timeout_ms:120000,maximum_input_candidates:8,maximum_decision_state_bytes:4096,maximum_decision_state_tokens:1024,maximum_paired_token_difference:3072,per_trajectory_model_token_ceiling:96000,logical_model_token_ceiling:3072000,sealed_scoreability_rate:1,native_scorer_smoke_rate:1,model_calls:0,authority_effect:'none'});
  const continuity=structuredClone(read(path('round49-continuity.json')));delete continuity.experiment_and_task_refs.unresolved;
  Object.assign(continuity.experiment_and_task_refs,{selection_ref:'round49-task-selection.json',matrix_ref:'round49-matrix.json',inventory_ref:'round49-repository-inventory.json',preflight_ref:'initial-envelope-round49.json',freeze_ref:'freeze-round49-execution.json',scorer_ref:'score-round49.mjs'});
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['round49-task-selection.json','round49-public-input-screening.json','round49-matrix.json','round49-repository-inventory.json','initial-envelope-round49.json','preflight-binding-round49.json','freeze-validation-v49.json','round49-local-gate.json','round49-runtime-tests.log','round49-scorer-readiness.json','score-round49.mjs','build-round49-matrix.mjs'];
  const byPath=new Map(continuity.continuity_review.reviewed_artifacts.map(row=>[row.path,row]));for(const name of reviewed){const item={path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))};byPath.set(item.path,item);}continuity.continuity_review.reviewed_artifacts=[...byPath.values()];
  const verdict=verifyResearchContinuity({binding:continuity,policy:read(resolve('agent-reasoning-engine/research/continuity-policy-v4.json')),hypotheses:read(path('hypotheses-round49.json')),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round49.freeze-continuity:'+verdict.reason_codes.join(','));write('round49-freeze-continuity.json',continuity);
  const local=[
    'agent-reasoning-engine/LIGHTHOUSE.md',
    'agent-reasoning-engine/research/continuity-policy-v4.json',
    'agent-reasoning-engine/research/contextbench-v1/PLAN-round49.md',
    'agent-reasoning-engine/research/contextbench-v1/hypotheses-round49.json',
    'agent-reasoning-engine/research/contextbench-v1/experiment-round49.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-freeze-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/work-plan-v49.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-task-selection.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-public-input-screening.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-matrix.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-repository-inventory.json',
    'agent-reasoning-engine/research/contextbench-v1/initial-envelope-round49.json',
    'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round49.json',
    'agent-reasoning-engine/research/contextbench-v1/freeze-validation-v49.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-local-gate.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-runtime-tests.log',
    'agent-reasoning-engine/research/contextbench-v1/round49-scorer-readiness.json',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round49.mjs',
    'agent-reasoning-engine/research/contextbench-v1/select-round49-tasks.py',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round49-repositories.py',
    'agent-reasoning-engine/research/contextbench-v1/build-round49-local-gate.mjs',
    'agent-reasoning-engine/research/contextbench-v1/build-round49-matrix.mjs',
    'agent-reasoning-engine/research/contextbench-v1/score-round49.mjs',
    'agent-reasoning-engine/research/contextbench-v1/freeze-round49.mjs',
    'agent-reasoning-engine/research/contextbench-v1/round48-outcome.json',
    'agent-reasoning-engine/research/contextbench-v1/round48-analysis.json',
    'agent-reasoning-engine/research/contextbench-v1/round48-closeout.json',
    
    'agent-reasoning-engine/research/contextbench-v1/round49-scoreability-input.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-sealed-scoreability.json',
    'agent-reasoning-engine/research/contextbench-v1/round49-native-scorer-smoke.json',
    'agent-reasoning-engine/research/contextbench-v1/smoke-round49-native-scorer.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-validation.mjs',
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
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round49/manifest.json'
  ].map(target=>resolve(repository,target));
  for(const task of matrix.tasks)local.push(resolve(implementation,'development-tasks-round49',task.instance_id+'.json'));
  local.push('/home/vrondelli/.config/are/glm-flash-credential.json');const sources=[...new Set(local)].sort().map(target=>({path:target,sha256:fileSha(target)}));
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,evaluation_stage:'replication',expected_tasks:16,expected_cells:48,matrix_ref:path('round49-matrix.json'),preflight_ref:path('initial-envelope-round49.json'),task_manifest_ref:resolve(implementation,'development-tasks-round49/manifest.json'),task_directory:resolve(implementation,'development-tasks-round49'),repository_inventory_ref:path('round49-repository-inventory.json'),repository_inventory_sha256:fileSha(path('round49-repository-inventory.json')),upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(implementation,'score_native.py'),scoring_cache:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round49-score-cache',native_worktree_root:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round49-native-worktrees',confirmation_scorer:path('score-round49.mjs'),model_timeout_ms:120000,maximum_bounded_indeterminate_calls:2,minimum_complete_pairs:12,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',maximum_decision_state_evidence:8,maximum_decision_state_bytes:4096,maximum_decision_state_tokens:1024,execution:{runner:resolve(implementation,'run-shared-decision-state-v1.mjs'),shards:1,partition:'sequential; fork at earliest receipt-confirmed effect or fallback terminal/typed pressure; held response has zero effects; stop immediately when twelve eligible pairs become unreachable; bounded indeterminate calls are fully debited; all unbounded failures stop globally'},sources,continuity_review:{...continuity.continuity_review,passed:true},claim_ceiling:'8K replication diagnostic only; not complete benchmark clearance',predecessor_freeze_ref:path('freeze-round48-execution.json'),successor_reason:'Round 48 passed every frozen development-canary gate. Round 49 replicates the unchanged universal decision-bound state on a larger fresh cohort.'};
  write('freeze-round49-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round49-execution.json'));
  write('work-state-frozen-v49-execution.json',{schema_version:'are.contextbench-work-state/v1',round:49,status:'frozen-run-ready',completed:['R49-A','R49-B','R49-C','R49-D','R49-E','R49-F','R49-G'],frontier:['R49-H'],freeze_ref:'freeze-round49-execution.json',freeze_sha256:sha(material),benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round49.md#open-questions'});
  return{status:'frozen-run-ready',sources:sources.length,freeze_sha256:sha(material),tasks:16,trajectories:32,cells:48,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(freeze()));
