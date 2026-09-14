import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const repository=resolve('.'),root=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(root,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round29.drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function freeze(){
  const matrix=read('development-matrix-v29.json'),preflight=read('initial-envelope-round29.json'),review=read('same-trajectory-effect-closure-review-v1.json');
  if(matrix.tasks.length!==8||matrix.prefixes.length!==8||matrix.branches.length!==24||matrix.cells.length!==32)throw Error('round29.matrix-shape');
  const taskCounts=new Map();
  for(const cell of matrix.branches){
    if(cell.state_arm!=='state'||cell.arm!=='baseline'||cell.repetition<1||cell.repetition>3)throw Error('round29.branch-identity:'+cell.cell_id);
    taskCounts.set(cell.instance_id,(taskCounts.get(cell.instance_id)||0)+1);
  }
  if(taskCounts.size!==8||[...taskCounts.values()].some(n=>n!==3))throw Error('round29.repetitions');
  for(const cell of matrix.cells){
    const treatment=cell.cell_kind!=='shared-prefix';
    if(cell.limits.task_state_projection!==false||cell.limits.task_state_novelty_gate!==false||cell.limits.terminal_effect_state!==treatment||cell.limits.terminal_effect_state_evidence!==6)throw Error('round29.treatment-envelope:'+cell.cell_id);
    if(cell.context_limit!==8000||cell.recycle_at!==7000||cell.safety_margin!==1000||cell.limits.total_tokens!==96000||cell.limits.output_cap!==2048||cell.limits.maximum_calls!==96)throw Error('round29.fixed-envelope:'+cell.cell_id);
  }
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round29.preflight');
  if(review.status!=='verified-offline'||review.tests.contextbench!==175||review.tests.failed!==0||review.policy.additional_model_calls!==0||review.policy.additional_model_tokens!==0)throw Error('round29.instrument-review');
  const preflightRows=preflight.rows.map(row=>{
    const resultRef=resolve(row.output_path,'result.json'),result=JSON.parse(readFileSync(resultRef));
    if(result.status!=='token_budget_stopped'||result.error!=='recycling.dispatch-admission-denied'||result.receipts.some(r=>r.kind==='model'&&r.dispatched))throw Error('round29.preflight-row:'+row.instance_id);
    return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};
  });
  write('preflight-binding-round29.json',{schema_version:'are.contextbench-preflight-binding/v1',status:'verified',rows:preflightRows,model_calls:0,tokenizer_only:true,authority_effect:'none',open_questions_ref:'PLAN-round29.md#open-questions'});
  write('freeze-validation-v29.json',{schema_version:'are.contextbench-freeze-validation/v1',status:'passed',round:29,tasks:8,prefixes:8,branches:24,scheduled_trajectories:24,repetitions_per_task:3,same_trajectory_baseline:true,common_task_state_projection:false,treatment_terminal_effect_state:true,terminal_effect_state_evidence:6,additional_model_calls:0,additional_model_tokens:0,model_calls:0,authority_effect:'none'});
  const continuity=structuredClone(read('round29-continuity.json'));
  delete continuity.experiment_and_task_refs.unresolved;
  continuity.experiment_and_task_refs.preflight_ref='initial-envelope-round29.json';
  continuity.experiment_and_task_refs.freeze_ref='freeze-round29-execution.json';
  continuity.continuity_review.run_ready=true;
  continuity.continuity_review.passed=true;
  continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['development-matrix-v29.json','experiment-round29.json','same-trajectory-effect-closure-review-v1.json','initial-envelope-round29.json','preflight-binding-round29.json','freeze-validation-v29.json','round29-contextbench-tests.log'];
  continuity.continuity_review.reviewed_artifacts.push(...reviewed.map(name=>({path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))})));
  const verdict=verifyResearchContinuity({binding:continuity,policy:JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v4.json'))),hypotheses:read('hypotheses-round29.json'),phase:'freeze',root:repository});
  if(!verdict.ok)throw Error('round29.freeze-continuity:'+verdict.reason_codes.join(','));
  write('round29-freeze-continuity.json',continuity);
  const prior=read('freeze-round28-execution-v2.json'),additions=[
    'agent-reasoning-engine/research/contextbench-v1/PLAN-round29.md','agent-reasoning-engine/research/contextbench-v1/prepare-round29.mjs','agent-reasoning-engine/research/contextbench-v1/freeze-round29.mjs','agent-reasoning-engine/research/contextbench-v1/hypotheses-round29.json','agent-reasoning-engine/research/contextbench-v1/round28-stopped-closeout.json','agent-reasoning-engine/research/contextbench-v1/round29-effect-closure-k6.json','agent-reasoning-engine/research/contextbench-v1/round29-continuity.json','agent-reasoning-engine/research/contextbench-v1/development-matrix-v29.json','agent-reasoning-engine/research/contextbench-v1/experiment-round29.json','agent-reasoning-engine/research/contextbench-v1/same-trajectory-effect-closure-review-v1.json','agent-reasoning-engine/research/contextbench-v1/initial-envelope-round29.json','agent-reasoning-engine/research/contextbench-v1/preflight-binding-round29.json','agent-reasoning-engine/research/contextbench-v1/freeze-validation-v29.json','agent-reasoning-engine/research/contextbench-v1/round29-freeze-continuity.json','agent-reasoning-engine/research/contextbench-v1/round29-contextbench-tests.log','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-effect-state.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-effect-state.test.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-terminal-submission.test.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate.test.mjs'
  ].map(p=>resolve(repository,p));
  const sourcePaths=[...new Set([...prior.sources.map(item=>resolve(item.path)),...additions])].sort(),sources=sourcePaths.map(path=>({path,sha256:fileSha(path)}));
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,expected_tasks:8,expected_cells:32,matrix_ref:path('development-matrix-v29.json'),preflight_ref:path('initial-envelope-round29.json'),task_manifest_ref:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),task_directory:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),repository_inventory_ref:'/tmp/are-contextbench-repositories-v1/inventory.json',upstream:'/tmp/are-contextbench-upstream-117',python:'/tmp/are-contextbench-venv-117/bin/python',scorer:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),scoring_cache:'/tmp/are-contextbench-native-score-cache-v1',sources,continuity_review:{...continuity.continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round28-execution-v2.json'),successor_reason:'Round 28 exposed a post-response deterministic treatment, so H47 evaluates its causal contribution by scoring model-only and closure-augmented selections from the exact same GLM trajectory.'};
  write('freeze-round29-execution.json',{...material,freeze_sha256:sha(material)});
  verifyFreeze(path('freeze-round29-execution.json'));
  write('work-state-frozen-v29-execution.json',{schema_version:'are.contextbench-work-state/v1',round:29,status:'frozen-run-ready',completed:['R29-C','R29-L','R29-H','R29-I','R29-T','R29-D','R29-P','R29-F'],frontier:['R29-R'],freeze_ref:'freeze-round29-execution.json',freeze_sha256:sha(material),benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round29.md#open-questions'});
  return{status:'frozen-run-ready',sources:sources.length,freeze_sha256:sha(material),frontier:'R29-R',model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(freeze()));
