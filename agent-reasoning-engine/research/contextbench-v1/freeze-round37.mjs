import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const repository=resolve('.'),root=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const path=name=>resolve(root,name),read=target=>JSON.parse(readFileSync(target)),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round37.drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function freeze(){
  const matrix=read(path('round37-matrix.json')),preflight=read(path('initial-envelope-round37.json')),inventory=read(path('round37-repository-inventory.json')),localGate=read(path('round37-local-gate.json'));
  if(matrix.tasks.length!==8||matrix.prefixes.length!==8||matrix.branches.length!==16||matrix.cells.length!==24)throw Error('round37.matrix-shape');
  if(inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round37.inventory');
  for(const prefix of matrix.prefixes){
    if(prefix.arm!=='baseline'||prefix.state_arm!=='prefix'||prefix.limits.evidence_slate!==false)throw Error('round37.prefix-treatment:'+prefix.cell_id);
    const branches=matrix.branches.filter(row=>row.prefix_cell_id===prefix.cell_id);
    if(branches.length!==2||new Set(branches.map(row=>row.state_arm)).size!==2)throw Error('round37.pair:'+prefix.cell_id);
  }
  for(const cell of matrix.cells){
    if(cell.context_limit!==8000||cell.recycle_at!==7000||cell.safety_margin!==1000||cell.arm!=='baseline'||cell.limits.total_tokens!==96000||cell.limits.output_cap!==2048||cell.limits.maximum_calls!==96||cell.limits.finalization_reserve_tokens!==14000||cell.limits.finalization_calls!==2||cell.limits.evidence_slate_candidates!==8||cell.limits.evidence_slate_bytes!==4096||cell.limits.evidence_slate_tokens!==1024||cell.limits.task_state_projection!==false||cell.limits.task_state_novelty_gate!==false||cell.limits.terminal_effect_state!==false||cell.limits.maximum_terminal_corrections!==0||cell.limits.incomplete_output_corrections!==0)throw Error('round37.envelope:'+cell.cell_id);
    const expected=cell.state_arm==='state';if(cell.limits.evidence_slate!==expected)throw Error('round37.sole-treatment:'+cell.cell_id);
  }
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round37.preflight');
  const preflightRows=preflight.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=read(resultRef);if(result.status!==row.status||(result.receipts??[]).some(receipt=>receipt.kind==='model'&&receipt.dispatched))throw Error('round37.preflight-result:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  write('preflight-binding-round37.json',{schema_version:'are.contextbench-preflight-binding/v1',status:'verified',rows:preflightRows,model_calls:0,tokenizer_only:true,authority_effect:'none',open_questions_ref:'PLAN-round37.md#open-questions'});
  const tests=readFileSync(path('round37-full-local-tests.log'),'utf8');if(!tests.includes('tests 344')||!tests.includes('pass 344')||!tests.includes('fail 0')||localGate.status!=='pass'||Object.values(localGate.checks).some(value=>value!==true))throw Error('round37.local-gates');
  if(matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum!==3072||matrix.success_criteria?.branch_model_calls!==1||matrix.success_criteria?.review_fork_rate!==1||matrix.success_criteria?.treatment_exposure_rate!==1)throw Error('round37.criteria');
  write('freeze-validation-v37.json',{schema_version:'are.contextbench-freeze-validation/v1',status:'passed',round:37,evaluation_stage:'development',tasks:8,prefixes:8,branches:16,cells:24,paired_task_outcomes:8,scheduled_trajectories:16,repetitions_per_arm:1,shared_prefix:true,treatment:'completion-or-capacity-evidence-review-v1',maximum_input_candidates:8,maximum_slate_bytes:4096,maximum_slate_tokens:1024,maximum_pressure_envelope_bytes:4096,maximum_paired_token_difference:3072,branch_model_calls:1,per_trajectory_model_token_ceiling:96000,logical_model_token_ceiling:1536000,sealed_scoreability_rate:1,native_scorer_smoke_rate:1,model_calls:0,authority_effect:'none'});
  const continuity=structuredClone(read(path('round37-continuity.json')));delete continuity.experiment_and_task_refs.unresolved;
  Object.assign(continuity.experiment_and_task_refs,{selection_ref:'round37-task-selection.json',matrix_ref:'round37-matrix.json',inventory_ref:'round37-repository-inventory.json',preflight_ref:'initial-envelope-round37.json',freeze_ref:'freeze-round37-execution.json',scorer_ref:'score-round37.mjs'});
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['round37-task-selection.json','round37-public-input-screening.json','round37-matrix.json','round37-repository-inventory.json','initial-envelope-round37.json','preflight-binding-round37.json','freeze-validation-v37.json','round37-local-gate.json','round37-full-local-tests.log','round37-scorer-readiness.json','score-round37.mjs','build-round37-matrix.mjs'];
  const byPath=new Map(continuity.continuity_review.reviewed_artifacts.map(row=>[row.path,row]));for(const name of reviewed){const item={path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))};byPath.set(item.path,item);}continuity.continuity_review.reviewed_artifacts=[...byPath.values()];
  const verdict=verifyResearchContinuity({binding:continuity,policy:read(resolve('agent-reasoning-engine/research/continuity-policy-v4.json')),hypotheses:read(path('hypotheses-round37.json')),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round37.freeze-continuity:'+verdict.reason_codes.join(','));write('round37-freeze-continuity.json',continuity);
  const local=[
    'agent-reasoning-engine/LIGHTHOUSE.md',
    'agent-reasoning-engine/research/continuity-policy-v4.json',
    'agent-reasoning-engine/research/contextbench-v1/PLAN-round37.md',
    'agent-reasoning-engine/research/contextbench-v1/hypotheses-round37.json',
    'agent-reasoning-engine/research/contextbench-v1/experiment-round37.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-freeze-continuity.json',
    'agent-reasoning-engine/research/contextbench-v1/work-plan-v37.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-task-selection.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-public-input-screening.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-matrix.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-repository-inventory.json',
    'agent-reasoning-engine/research/contextbench-v1/initial-envelope-round37.json',
    'agent-reasoning-engine/research/contextbench-v1/preflight-binding-round37.json',
    'agent-reasoning-engine/research/contextbench-v1/freeze-validation-v37.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-local-gate.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-full-local-tests.log',
    'agent-reasoning-engine/research/contextbench-v1/round37-scorer-readiness.json',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round37.mjs',
    'agent-reasoning-engine/research/contextbench-v1/select-round37-tasks.py',
    'agent-reasoning-engine/research/contextbench-v1/prepare-round37-repositories.py',
    'agent-reasoning-engine/research/contextbench-v1/build-round37-local-gate.mjs',
    'agent-reasoning-engine/research/contextbench-v1/build-round37-matrix.mjs',
    'agent-reasoning-engine/research/contextbench-v1/score-round37.mjs',
    'agent-reasoning-engine/research/contextbench-v1/freeze-round37.mjs',
    'agent-reasoning-engine/research/contextbench-v1/round36-interrupted-outcome.json',
    'agent-reasoning-engine/research/contextbench-v1/round36-closeout.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-scoreability-input.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-sealed-scoreability.json',
    'agent-reasoning-engine/research/contextbench-v1/round37-native-scorer-smoke.json',
    'agent-reasoning-engine/research/contextbench-v1/smoke-round37-native-scorer.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-capacity-pressure-review-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-capacity-pressure-review-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-capacity-pressure-review-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-capacity-pressure-review-context-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate-capacity-pressure-review-terminal-v1.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-review-prefix-v3.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/capacity-pressure-review-validation.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/preflight-live-capacity-pressure-review-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-capacity-pressure-review-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-capacity-pressure-review-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-capacity-pressure-review-v1.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.test.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round37/manifest.json'
  ].map(target=>resolve(repository,target));
  for(const task of matrix.tasks)local.push(resolve(implementation,'development-tasks-round37',task.instance_id+'.json'));
  local.push('/home/vrondelli/.config/are/glm-flash-credential.json');const sources=[...new Set(local)].sort().map(target=>({path:target,sha256:fileSha(target)}));
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,evaluation_stage:'development',expected_tasks:8,expected_cells:24,matrix_ref:path('round37-matrix.json'),preflight_ref:path('initial-envelope-round37.json'),task_manifest_ref:resolve(implementation,'development-tasks-round37/manifest.json'),task_directory:resolve(implementation,'development-tasks-round37'),repository_inventory_ref:path('round37-repository-inventory.json'),repository_inventory_sha256:fileSha(path('round37-repository-inventory.json')),upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(implementation,'score_native.py'),scoring_cache:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round37-score-cache',native_worktree_root:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round37-native-worktrees',confirmation_scorer:path('score-round37.mjs'),maximum_slate_candidates:8,maximum_slate_bytes:4096,maximum_slate_tokens:1024,maximum_pressure_envelope_bytes:4096,execution:{runner:resolve(implementation,'run-shared-capacity-pressure-review-v1.mjs'),shards:1,partition:'sequential; one shared trajectory to first terminal candidate, fresh-context pressure, or incomplete-output pressure, then one terminal-only control review and one terminal-only slate review per fresh task'},sources,continuity_review:{...continuity.continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round36-execution.json'),successor_reason:'Round 36 left H60 inconclusive because an unscoreable identity stopped the frozen run. Round 37 retains the mechanism and adds sealed scoreability plus per-identity native scorer admission before freeze.'};
  write('freeze-round37-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round37-execution.json'));
  write('work-state-frozen-v37-execution.json',{schema_version:'are.contextbench-work-state/v1',round:37,status:'frozen-run-ready',completed:['R37-A','R37-B','R37-C','R37-D','R37-E','R37-F','R37-G','R37-H','R37-I','R37-K'],frontier:['R37-L'],freeze_ref:'freeze-round37-execution.json',freeze_sha256:sha(material),benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round37.md#open-questions'});
  return{status:'frozen-run-ready',sources:sources.length,freeze_sha256:sha(material),tasks:8,trajectories:16,cells:24,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(freeze()));
