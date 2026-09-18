import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const repository=resolve('.'),root=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const path=name=>resolve(root,name),read=target=>JSON.parse(readFileSync(target)),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round43.drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function freeze(){
  const matrix=read(path('round43-matrix.json')),preflight=read(path('initial-envelope-round43.json')),inventory=read(path('round43-repository-inventory.json')),localGate=read(path('round43-local-gate.json'));
  if(matrix.tasks.length!==8||matrix.prefixes.length!==8||matrix.branches.length!==16||matrix.cells.length!==24)throw Error('round43.matrix-shape');
  if(inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round43.inventory');
  for(const prefix of matrix.prefixes){
    if(prefix.arm!=='baseline'||prefix.state_arm!=='prefix'||prefix.limits.evidence_slate!==false)throw Error('round43.prefix-treatment:'+prefix.cell_id);
    const branches=matrix.branches.filter(row=>row.prefix_cell_id===prefix.cell_id);
    if(branches.length!==2||new Set(branches.map(row=>row.state_arm)).size!==2)throw Error('round43.pair:'+prefix.cell_id);
  }
  for(const cell of matrix.cells){
    if(cell.context_limit!==8000||cell.recycle_at!==7000||cell.safety_margin!==1000||cell.provider_profile.model_timeout_ms!==120000||cell.arm!=='baseline'||cell.limits.total_tokens!==96000||cell.limits.output_cap!==2048||cell.limits.maximum_calls!==96||cell.limits.finalization_reserve_tokens!==14000||cell.limits.finalization_calls!==2||cell.limits.evidence_slate_candidates!==8||cell.limits.evidence_slate_bytes!==4096||cell.limits.evidence_slate_tokens!==1024||cell.limits.task_state_projection!==false||cell.limits.task_state_novelty_gate!==false||cell.limits.terminal_effect_state!==false||cell.limits.maximum_terminal_corrections!==0||cell.limits.incomplete_output_corrections!==0)throw Error('round43.envelope:'+cell.cell_id);
    const expected=cell.state_arm==='state';if(cell.limits.evidence_slate!==expected)throw Error('round43.sole-treatment:'+cell.cell_id);
  }
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round43.preflight');
  const preflightRows=preflight.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=read(resultRef);if(result.status!==row.status||(result.receipts??[]).some(receipt=>receipt.kind==='model'&&receipt.dispatched))throw Error('round43.preflight-result:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  write('preflight-binding-round43.json',{schema_version:'are.contextbench-preflight-binding/v1',status:'verified',rows:preflightRows,model_calls:0,tokenizer_only:true,authority_effect:'none',open_questions_ref:'PLAN-round43.md#open-questions'});
  const tests=readFileSync(path('round43-full-local-tests.log'),'utf8');if(!tests.includes('tests 323')||!tests.includes('pass 323')||!tests.includes('fail 0')||localGate.status!=='pass'||Object.values(localGate.checks).some(value=>value!==true))throw Error('round43.local-gates');
  if(matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum!==3072||matrix.success_criteria?.first_evidence_boundary_exact!==true||matrix.success_criteria?.held_confirming_response_effects!==0||matrix.success_criteria?.treatment_guidance_presentations!==1||matrix.success_criteria?.control_guidance_presentations!==0||matrix.success_criteria?.guidance_tokens_maximum!==1024||matrix.success_criteria?.minimum_complete_pairs!==6||matrix.success_criteria?.indeterminate_model_calls_maximum!==2||matrix.success_criteria?.indeterminate_call_full_reservation_debit!==true||matrix.success_criteria?.symmetric_fixed_zero_for_bounded_failure!==true||matrix.success_criteria?.automatic_retries!==0)throw Error('round43.criteria');
  write('freeze-validation-v43.json',{schema_version:'are.contextbench-freeze-validation/v1',status:'passed',round:43,evaluation_stage:'development',tasks:8,prefixes:8,branches:16,cells:24,paired_task_outcomes:8,minimum_complete_pairs:6,maximum_indeterminate_model_calls:2,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',scheduled_trajectories:16,repetitions_per_arm:1,shared_prefix:true,shared_boundary:'first-receipt-confirmed-pinned-base-read',confirming_response_effects:0,semantic_treatment:'first-evidence-guidance-v1',instrument_runner:'first-evidence-guidance-v1',model_timeout_ms:120000,maximum_input_candidates:8,maximum_guidance_bytes:4096,maximum_guidance_tokens:1024,maximum_paired_token_difference:3072,per_trajectory_model_token_ceiling:96000,logical_model_token_ceiling:1536000,sealed_scoreability_rate:1,native_scorer_smoke_rate:1,model_calls:0,authority_effect:'none'});
  const continuity=structuredClone(read(path('round43-continuity.json')));delete continuity.experiment_and_task_refs.unresolved;
  Object.assign(continuity.experiment_and_task_refs,{selection_ref:'round43-task-selection.json',matrix_ref:'round43-matrix.json',inventory_ref:'round43-repository-inventory.json',preflight_ref:'initial-envelope-round43.json',freeze_ref:'freeze-round43-execution.json',scorer_ref:'score-round43.mjs'});
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['round43-task-selection.json','round43-public-input-screening.json','round43-matrix.json','round43-repository-inventory.json','initial-envelope-round43.json','preflight-binding-round43.json','freeze-validation-v43.json','round43-local-gate.json','round43-full-local-tests.log','round43-scorer-readiness.json','score-round43.mjs','build-round43-matrix.mjs'];
  const byPath=new Map(continuity.continuity_review.reviewed_artifacts.map(row=>[row.path,row]));for(const name of reviewed){const item={path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))};byPath.set(item.path,item);}continuity.continuity_review.reviewed_artifacts=[...byPath.values()];
  const verdict=verifyResearchContinuity({binding:continuity,policy:read(resolve('agent-reasoning-engine/research/continuity-policy-v4.json')),hypotheses:read(path('hypotheses-round43.json')),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round43.freeze-continuity:'+verdict.reason_codes.join(','));write('round43-freeze-continuity.json',continuity);
  const local=[
    'agent-reasoning-engine/LIGHTHOUSE.md',
    'agent-reasoning-engine/research/continuity-policy-v4.json',
    'agent-reasoning-engine/research/contextbench-v1/PLAN-round43.md',
    'agent-reasoning-engine/research/contextbench-v1/hypotheses-round43.json',
    'agent-reasoning-engine/research/contextbench-v1/experiment-round43.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-freeze-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/work-plan-v43.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-task-selection.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-public-input-screening.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-matrix.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-repository-inventory.json',
    'agent-reasoning-engine/research/contextbench-v1/initial-envelope-round43.json',
    'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round43.json',
    'agent-reasoning-engine/research/contextbench-v1/freeze-validation-v43.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-local-gate.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-full-local-tests.log',
    'agent-reasoning-engine/research/contextbench-v1/round43-scorer-readiness.json',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round43.mjs',
    'agent-reasoning-engine/research/contextbench-v1/select-round43-tasks.py',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round43-repositories.py',
    'agent-reasoning-engine/research/contextbench-v1/build-round43-local-gate.mjs',
    'agent-reasoning-engine/research/contextbench-v1/build-round43-matrix.mjs',
    'agent-reasoning-engine/research/contextbench-v1/score-round43.mjs',
    'agent-reasoning-engine/research/contextbench-v1/freeze-round43.mjs',
    'agent-reasoning-engine/research/contextbench-v1/round42-outcome.json',
    'agent-reasoning-engine/research/contextbench-v1/round42-analysis.json',
    'agent-reasoning-engine/research/contextbench-v1/round42-closeout.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-scoreability-input.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-sealed-scoreability.json',
    'agent-reasoning-engine/research/contextbench-v1/round43-native-scorer-smoke.json',
    'agent-reasoning-engine/research/contextbench-v1/smoke-round43-native-scorer.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v2.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/first-evidence-guidance-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-first-evidence-guidance-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-first-evidence-guidance-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-first-evidence-guidance-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-first-evidence-prefix-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/first-evidence-guidance-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/preflight-live-first-evidence-guidance-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-first-evidence-guidance-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-first-evidence-guidance-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-first-evidence-guidance-v1.mjs',
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
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round43/manifest.json'
  ].map(target=>resolve(repository,target));
  for(const task of matrix.tasks)local.push(resolve(implementation,'development-tasks-round43',task.instance_id+'.json'));
  local.push('/home/vrondelli/.config/are/glm-flash-credential.json');const sources=[...new Set(local)].sort().map(target=>({path:target,sha256:fileSha(target)}));
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,evaluation_stage:'development',expected_tasks:8,expected_cells:24,matrix_ref:path('round43-matrix.json'),preflight_ref:path('initial-envelope-round43.json'),task_manifest_ref:resolve(implementation,'development-tasks-round43/manifest.json'),task_directory:resolve(implementation,'development-tasks-round43'),repository_inventory_ref:path('round43-repository-inventory.json'),repository_inventory_sha256:fileSha(path('round43-repository-inventory.json')),upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(implementation,'score_native.py'),scoring_cache:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round43-score-cache',native_worktree_root:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round43-native-worktrees',confirmation_scorer:path('score-round43.mjs'),model_timeout_ms:120000,maximum_bounded_indeterminate_calls:2,minimum_complete_pairs:6,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',maximum_guidance_candidates:8,maximum_guidance_bytes:4096,maximum_guidance_tokens:1024,execution:{runner:resolve(implementation,'run-shared-first-evidence-guidance-v1.mjs'),shards:1,partition:'sequential; exact first-delivery fork; validator-proven indeterminate calls are fully debited and their pair is retained as symmetric zeros; later independent tasks continue; all unbounded failures stop globally'},sources,continuity_review:{...continuity.continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round42-execution.json'),successor_reason:'Round 42 passed accounting and non-degradation but missed the Span-F1 gate by 0.00497. Round 43 moves the same bounded observable guidance to the first confirmed evidence boundary so it can alter exploration.'};
  write('freeze-round43-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round43-execution.json'));
  write('work-state-frozen-v43-execution.json',{schema_version:'are.contextbench-work-state/v1',round:43,status:'frozen-run-ready',completed:['R43-A','R43-B','R43-C','R43-D','R43-E','R43-F','R43-G','R43-H','R43-I','R43-J'],frontier:['R43-K'],freeze_ref:'freeze-round43-execution.json',freeze_sha256:sha(material),benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round43.md#open-questions'});
  return{status:'frozen-run-ready',sources:sources.length,freeze_sha256:sha(material),tasks:8,trajectories:16,cells:24,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(freeze()));
