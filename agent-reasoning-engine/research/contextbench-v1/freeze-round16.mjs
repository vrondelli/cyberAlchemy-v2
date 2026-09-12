import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build,verifyEvidence,verifyPredecessor} from './bind-round16.mjs';

const repository=resolve('.'),research=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(research,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',target=path(name);if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round16.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

function preflightBinding(){
  const report=read('initial-envelope-round16.json'),matrix=read('development-matrix-v16.json');
  if(report.status!=='passed-initial-envelope'||report.model_calls!==0||report.rows.length!==8)throw Error('round16.preflight-report');
  if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12)throw Error('round16.matrix');
  const rows=report.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=JSON.parse(readFileSync(resultRef));if(result.status!=='token_budget_stopped'||result.error!=='recycling.dispatch-admission-denied'||result.receipts.some(receipt=>receipt.kind==='model'&&receipt.dispatched)||result.admissions.length!==1)throw Error('round16.preflight-row:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  return{status:'verified',initial_envelope_rows:8,rows,prefixes:8,branches:48,repetitions:3,state_first_pairs:12,control_first_pairs:12,projection_mode:'evidence-only',model_calls:0,authority_effect:'none',open_questions_ref:'PLAN-round16.md#open-questions'};
}

function validation(){
  const suites=[['round16-contextbench-tests.log',147],['round16-coding-runtime-tests.log',335],['round16-continuity-tests.log',4]],logs=[];
  for(const [name,expected] of suites){const bytes=readFileSync(path(name),'utf8');if(!bytes.includes(`ℹ tests ${expected}`)||!bytes.includes(`ℹ pass ${expected}`)||!bytes.includes('ℹ fail 0'))throw Error('round16.tests:'+name);logs.push({path:path(name),sha256:fileSha(path(name)),passed:expected});}
  return{status:'passed',contextbench_tests:147,coding_runtime_tests:335,continuity_tests:4,failed:0,provider_model_calls:0,logs,component_review_refs:['round15-stopping-review.json','post-recycle-phase-review-v1.json'],authority_effect:'none'};
}

function freezeContinuity(){
  const continuity=structuredClone(read('round16-continuity.json'));delete continuity.experiment_and_task_refs.unresolved;continuity.experiment_and_task_refs.work_plan_ref='work-plan-v16.json';continuity.experiment_and_task_refs.matrix_ref='development-matrix-v16.json';continuity.experiment_and_task_refs.experiment_ref='experiment-round16.json';
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  for(const name of ['work-plan-v16.json','work-state-preflight-v16.json','development-matrix-v16.json','experiment-round16.json','initial-envelope-round16.json','preflight-binding-round16.json','freeze-validation-v16.json','bind-round16.mjs','prepare-round16.mjs','prepare-round16-continuity.mjs','post-recycle-phase-review-v1.json'])continuity.continuity_review.reviewed_artifacts.push({path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))});
  const verdict=verifyResearchContinuity({binding:continuity,policy:JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v3.json'))),hypotheses:read('hypotheses-round16.json'),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round16.continuity:'+verdict.reason_codes.join(','));return continuity;
}

function sources(){
  const prior=read('freeze-round15-execution.json').sources.map(source=>resolve(source.path));
  const additions=[
    ...['PLAN-round16.md','hypotheses-round16.json','round16-continuity.json','prepare-round16-continuity.mjs','post-recycle-phase-review-v1.json','prepare-round16.mjs','development-matrix-v16.json','experiment-round16.json','bind-round16.mjs','work-plan-v16.json','work-state-preflight-v16.json','initial-envelope-round16.json','preflight-binding-round16.json','freeze-validation-v16.json','round16-freeze-continuity-execution.json','round16-contextbench-tests.log','round16-coding-runtime-tests.log','round16-continuity-tests.log','freeze-round16.mjs','round15-stopping-review.json','round15-selected-hypothesis-review.json','round15-closeout.json','work-state-stopped-v15.json','close-round15-stopped.mjs'].map(name=>'agent-reasoning-engine/research/contextbench-v1/'+name),
    ...['episode.mjs','episode.test.mjs','orchestrate.mjs','orchestrate.test.mjs','shared-prefix.mjs','shared-prefix.test.mjs','run-prefix-cell.mjs','run-branch-cell.mjs','run-shared-sequence.mjs'].map(name=>'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/'+name),
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs','implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round15-preserved/runtime-manifest.json'];
  const preserved=JSON.parse(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round15-preserved/runtime-manifest.json')));additions.push(...preserved.files.map(item=>item.preserved_path));
  const unique=[...new Set([...prior,...additions].map(item=>resolve(repository,item)))].sort();for(const source of unique)if(!existsSync(source))throw Error('round16.missing-source:'+source);return unique.map(source=>({path:source,sha256:fileSha(source)}));
}

export function createFreeze(){
  write('preflight-binding-round16.json',preflightBinding());write('freeze-validation-v16.json',validation());write('round16-freeze-continuity-execution.json',freezeContinuity());
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,expected_tasks:8,expected_cells:56,matrix_ref:path('development-matrix-v16.json'),preflight_ref:path('initial-envelope-round16.json'),task_manifest_ref:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),task_directory:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),repository_inventory_ref:'/tmp/are-contextbench-repositories-v1/inventory.json',upstream:'/tmp/are-contextbench-upstream-117',python:'/tmp/are-contextbench-venv-117/bin/python',scorer:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),scoring_cache:'/tmp/are-contextbench-native-score-cache-v1',sources:sources(),continuity_review:{...read('round16-freeze-continuity-execution.json').continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round15-execution.json'),successor_reason:'Round 15 shared prefixes paused correctly but resume skipped the pending post-recycle candidate-rendering phase. H26 restores that exact phase while leaving H25 tasks, state, order, criteria and token accounting unchanged.'};
  write('freeze-round16-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round16-execution.json'));
  const built=build(),ready=read('work-state-preflight-v16.json'),artifact='agent-reasoning-engine/research/contextbench-v1/freeze-round16-execution.json',events=[...ready.events,{event_id:'r16-freeze-execution-start',task_id:'contextbench.round16.freeze',action:'start'},{event_id:'r16-freeze-execution-complete',task_id:'contextbench.round16.freeze',action:'complete',evidence:[{criterion_id:'exact-frozen-run-envelope',artifact_ref:artifact,artifact_digest:fileSha(path('freeze-round16-execution.json'))}]}];
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(!state.tasks.some(task=>task.task_id==='contextbench.round16.run'&&task.state==='ready'))throw Error('round16.run-not-ready');write('work-state-frozen-v16-execution.json',state);
  return{sources:material.sources.length,freeze_sha256:sha(material),artifact_sha256:fileSha(path('freeze-round16-execution.json')),frontier:state.frontier};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(createFreeze()));
