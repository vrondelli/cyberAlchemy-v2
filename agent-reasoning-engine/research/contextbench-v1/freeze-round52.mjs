import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const repository=resolve('.'),root=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const path=name=>resolve(root,name),read=target=>JSON.parse(readFileSync(target)),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round52.drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function freeze(){
  const matrix=read(path('round52-matrix.json')),preflight=read(path('initial-envelope-round52.json')),inventory=read(path('round52-repository-inventory.json')),localGate=read(path('round52-local-gate.json'));
  if(matrix.tasks.length!==8||matrix.prefixes.length!==8||matrix.branches.length!==16||matrix.cells.length!==24)throw Error('round52.matrix-shape');
  if(inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round52.inventory');
  for(const prefix of matrix.prefixes){
    if(prefix.arm!=='baseline'||prefix.state_arm!=='prefix'||prefix.limits.decision_state!==false||prefix.limits.decision_state_substitution!==false||prefix.limits.decision_state_handles!==false)throw Error('round52.prefix-treatment:'+prefix.cell_id);
    const branches=matrix.branches.filter(row=>row.prefix_cell_id===prefix.cell_id);
    if(branches.length!==2||new Set(branches.map(row=>row.state_arm)).size!==2)throw Error('round52.pair:'+prefix.cell_id);
  }
  for(const cell of matrix.cells){
    if(cell.context_limit!==8000||cell.recycle_at!==7000||cell.safety_margin!==1000||cell.provider_profile.model_timeout_ms!==120000||cell.arm!=='baseline'||cell.limits.total_tokens!==96000||cell.limits.output_cap!==2048||cell.limits.maximum_calls!==96||cell.limits.finalization_reserve_tokens!==14000||cell.limits.finalization_calls!==2||cell.limits.decision_state_evidence!==3||cell.limits.decision_state_bytes!==1024||cell.limits.decision_state_tokens!==160||cell.limits.task_state_projection!==false||cell.limits.task_state_novelty_gate!==false||cell.limits.terminal_effect_state!==false||cell.limits.maximum_terminal_corrections!==0||cell.limits.incomplete_output_corrections!==0)throw Error('round52.envelope:'+cell.cell_id);
    const expected=cell.state_arm==='state';if(cell.limits.decision_state!==expected||cell.limits.decision_state_substitution!==expected||cell.limits.decision_state_handles!==expected)throw Error('round52.sole-treatment:'+cell.cell_id);
  }
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round52.preflight');
  const preflightRows=preflight.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=read(resultRef);if(result.status!==row.status||(result.receipts??[]).some(receipt=>receipt.kind==='model'&&receipt.dispatched))throw Error('round52.preflight-result:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  write('preflight-binding-round52.json',{schema_version:'are.contextbench-preflight-binding/v1',status:'verified',rows:preflightRows,model_calls:0,tokenizer_only:true,authority_effect:'none',open_questions_ref:'PLAN-round52.md#open-questions'});
  const tests=readFileSync(path('round52-runtime-tests.log'),'utf8');if(!tests.includes('fail 0')||localGate.status!=='pass'||Object.values(localGate.checks).some(value=>value!==true))throw Error('round52.local-gates');
  if(matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum!==3072||matrix.success_criteria?.decision_boundary_exact!==true||matrix.success_criteria?.held_boundary_response_effects!==0||matrix.success_criteria?.treatment_state_presentations!==1||matrix.success_criteria?.control_state_presentations!==0||matrix.success_criteria?.evidence_handle_tokens_maximum!==160||matrix.success_criteria?.evidence_handle_bytes_maximum!==1024||matrix.success_criteria?.evidence_handle_maximum!==3||matrix.success_criteria?.minimum_first_request_input_token_reduction!==128||matrix.success_criteria?.terminal_boundary_only!==true||matrix.success_criteria?.private_handle_resolution!==true||matrix.success_criteria?.treatment_added_full_read_id_occurrences!==0||matrix.success_criteria?.inherited_full_read_id_occurrences_paired!==true||matrix.success_criteria?.earliest_infeasibility_stop!==true||matrix.success_criteria?.aggregate_treatment_tokens_not_above_control!==true||matrix.success_criteria?.minimum_complete_pairs!==6||matrix.success_criteria?.indeterminate_model_calls_maximum!==2||matrix.success_criteria?.indeterminate_call_full_reservation_debit!==true||matrix.success_criteria?.symmetric_fixed_zero_for_bounded_failure!==true||matrix.success_criteria?.automatic_retries!==0)throw Error('round52.criteria');
  write('freeze-validation-v52.json',{schema_version:'are.contextbench-freeze-validation/v1',status:'passed',round:52,evaluation_stage:'development',tasks:8,prefixes:8,branches:16,cells:24,paired_task_outcomes:8,minimum_complete_pairs:6,maximum_indeterminate_model_calls:2,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',scheduled_trajectories:16,repetitions_per_arm:1,shared_prefix:true,shared_boundary:'first-held-terminal-candidate',confirming_response_effects:0,semantic_treatment:'request-local-terminal-evidence-handles-with-incremental-nondisclosure-v1',instrument_runner:'terminal-evidence-handles-incremental-v1',model_timeout_ms:120000,maximum_input_candidates:3,maximum_evidence_handle_bytes:1024,maximum_evidence_handle_tokens:160,minimum_first_request_input_token_reduction:128,treatment_added_full_read_id_occurrences:0,inherited_full_read_id_occurrences_paired:true,maximum_paired_token_difference:3072,per_trajectory_model_token_ceiling:96000,logical_model_token_ceiling:1536000,sealed_scoreability_rate:1,native_scorer_smoke_rate:1,model_calls:0,authority_effect:'none'});
  const continuity=structuredClone(read(path('round52-continuity.json')));delete continuity.experiment_and_task_refs.unresolved;
  Object.assign(continuity.experiment_and_task_refs,{selection_ref:'round52-task-selection.json',matrix_ref:'round52-matrix.json',inventory_ref:'round52-repository-inventory.json',preflight_ref:'initial-envelope-round52.json',freeze_ref:'freeze-round52-execution.json',scorer_ref:'score-round52.mjs'});
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['round52-task-selection.json','round52-public-input-screening.json','round52-provider-token-calibration.json','round52-round51-replay.json','round52-matrix.json','round52-repository-inventory.json','initial-envelope-round52.json','preflight-binding-round52.json','freeze-validation-v52.json','round52-local-gate.json','round52-runtime-tests.log','round52-scorer-readiness.json','score-round52.mjs','build-round52-matrix.mjs'];
  const byPath=new Map(continuity.continuity_review.reviewed_artifacts.map(row=>[row.path,row]));for(const name of reviewed){const item={path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))};byPath.set(item.path,item);}continuity.continuity_review.reviewed_artifacts=[...byPath.values()];
  const verdict=verifyResearchContinuity({binding:continuity,policy:read(resolve('agent-reasoning-engine/research/continuity-policy-v4.json')),hypotheses:read(path('hypotheses-round52.json')),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round52.freeze-continuity:'+verdict.reason_codes.join(','));write('round52-freeze-continuity.json',continuity);
  const local=[
    'agent-reasoning-engine/LIGHTHOUSE.md',
    'agent-reasoning-engine/research/continuity-policy-v4.json',
    'agent-reasoning-engine/research/contextbench-v1/PLAN-round52.md',
    'agent-reasoning-engine/research/contextbench-v1/hypotheses-round52.json',
    'agent-reasoning-engine/research/contextbench-v1/experiment-round52.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-freeze-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/work-plan-v52.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-public-input-screening.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-matrix.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-repository-inventory.json',
    'agent-reasoning-engine/research/contextbench-v1/initial-envelope-round52.json',
    'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round52.json',
    'agent-reasoning-engine/research/contextbench-v1/freeze-validation-v52.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-local-gate.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-runtime-tests.log',
    'agent-reasoning-engine/research/contextbench-v1/round52-scorer-readiness.json',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round52.mjs',
    'agent-reasoning-engine/research/contextbench-v1/select-round52-tasks.py',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round52-repositories.py',
    'agent-reasoning-engine/research/contextbench-v1/build-round52-local-gate.mjs',
    'agent-reasoning-engine/research/contextbench-v1/build-round52-matrix.mjs',
    'agent-reasoning-engine/research/contextbench-v1/score-round52.mjs',
    'agent-reasoning-engine/research/contextbench-v1/freeze-round52.mjs',
    'agent-reasoning-engine/research/contextbench-v1/round51-interrupted-outcome.json',
    'agent-reasoning-engine/research/contextbench-v1/round51-analysis.json',
    'agent-reasoning-engine/research/contextbench-v1/round51-closeout.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-round51-replay.json',
    'agent-reasoning-engine/research/contextbench-v1/replay-round52-incremental-validator.mjs',
    'agent-reasoning-engine/research/contextbench-v1/round52-provider-token-calibration.json',
    'agent-reasoning-engine/research/contextbench-v1/calibrate-round52-handles.mjs',
    
    'agent-reasoning-engine/research/contextbench-v1/round52-scoreability-input.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-sealed-scoreability.json',
    'agent-reasoning-engine/research/contextbench-v1/round52-native-scorer-smoke.json',
    'agent-reasoning-engine/research/contextbench-v1/smoke-round52-native-scorer.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/decision-state-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handle-incremental-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handle-incremental-validation.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handles-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handles-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-terminal-evidence-handles-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-terminal-decision-substitution-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-terminal-evidence-handles-incremental-v1.mjs',
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
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round52/manifest.json'
  ].map(target=>resolve(repository,target));
  for(const task of matrix.tasks)local.push(resolve(implementation,'development-tasks-round52',task.instance_id+'.json'));
  local.push('/home/vrondelli/.config/are/glm-flash-credential.json');const sources=[...new Set(local)].sort().map(target=>({path:target,sha256:fileSha(target)}));
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,evaluation_stage:'development',expected_tasks:8,expected_cells:24,matrix_ref:path('round52-matrix.json'),preflight_ref:path('initial-envelope-round52.json'),task_manifest_ref:resolve(implementation,'development-tasks-round52/manifest.json'),task_directory:resolve(implementation,'development-tasks-round52'),repository_inventory_ref:path('round52-repository-inventory.json'),repository_inventory_sha256:fileSha(path('round52-repository-inventory.json')),upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(implementation,'score_native.py'),scoring_cache:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round52-score-cache',native_worktree_root:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round52-native-worktrees',confirmation_scorer:path('score-round52.mjs'),model_timeout_ms:120000,maximum_bounded_indeterminate_calls:2,minimum_complete_pairs:6,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',maximum_evidence_handles:3,maximum_evidence_handle_bytes:1024,maximum_evidence_handle_tokens:160,minimum_first_request_input_token_reduction:128,treatment_added_full_read_id_occurrences:0,inherited_full_read_id_occurrences_paired:true,execution:{runner:resolve(implementation,'run-shared-terminal-evidence-handles-incremental-v1.mjs'),shards:1,partition:'sequential; fork at first held terminal candidate; treatment replaces registered review scaffolding with request-local evidence handles; treatment-added state and schema disclose zero full read IDs; inherited mapped-ID occurrences remain exactly paired; handles resolve before provenance validation; held response has zero effects; stop immediately when six eligible pairs become unreachable; bounded indeterminate calls are fully debited; all unbounded failures stop globally'},sources,continuity_review:{...continuity.continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round51-execution.json'),successor_reason:'Round 51 showed two valid treatment selections and lower logical tokens, then stopped because an absolute non-disclosure rule counted one full ID inherited identically by both arms. Round 52 keeps the treatment and validates only treatment-added disclosure while proving inherited equality.'};
  write('freeze-round52-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round52-execution.json'));
  write('work-state-frozen-v52-execution.json',{schema_version:'are.contextbench-work-state/v1',round:52,status:'frozen-run-ready',completed:['R52-A','R52-B','R52-C','R52-D','R52-E','R52-F','R52-G'],frontier:['R52-H'],freeze_ref:'freeze-round52-execution.json',freeze_sha256:sha(material),benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round52.md#open-questions'});
  return{status:'frozen-run-ready',sources:sources.length,freeze_sha256:sha(material),tasks:8,trajectories:16,cells:24,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(freeze()));
