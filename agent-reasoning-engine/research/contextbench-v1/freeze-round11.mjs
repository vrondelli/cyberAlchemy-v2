// Exact round-eleven source closure and D08 transition. No model requests.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build,verifyEvidence,verifyPredecessor} from './bind-round11.mjs';

const repository=resolve('.'),research=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(research,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const bytes=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',target=path(name);if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round11.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

function preflight(){
 const report=read('initial-envelope-round11.json'),matrix=read('development-matrix-v11.json');
 if(report.status!=='passed-initial-envelope'||report.model_calls!==0||report.rows.length!==8)throw Error('round11.preflight-report');
 if(matrix.cells.some(cell=>cell.limits.task_state_presentations_per_generation!==1||cell.limits.incomplete_output_corrections!==1||cell.provider_profile.model_timeout_ms!==300000))throw Error('round11.common-policy-mismatch');
 const rows=report.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=JSON.parse(readFileSync(resultRef));
  if(result.status!=='token_budget_stopped'||result.error!=='recycling.dispatch-admission-denied'||result.receipts.some(receipt=>receipt.kind==='model'&&receipt.dispatched)||result.captures.length!==1||result.admissions.length!==1||result.admissions[0].reason!=='token-budget.preflight-disabled'||result.admissions[0].total_token_limit!==96000||result.task_state_presentations.length!==0)throw Error('round11.preflight-row:'+row.instance_id);
  return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
 return{status:'verified',initial_envelope_rows:rows.length,rows,presentations_per_generation:1,common_correction_policy:1,model_timeout_ms:300000,model_calls:0,task_state_presentations:0,authority_effect:'none',open_questions_ref:'PLAN-round11.md#open-questions'};
}

function validation(){
 const suites=[['round11-contextbench-tests.log',138],['round11-coding-runtime-tests.log',333],['round11-continuity-runtime-tests.log',3]],logs=[];
 for(const [name,expected] of suites){const bytes=readFileSync(path(name),'utf8');if(!bytes.includes(`ℹ tests ${expected}`)||!bytes.includes(`ℹ pass ${expected}`)||!bytes.includes('ℹ fail 0'))throw Error('round11.tests:'+name);logs.push({path:path(name),sha256:fileSha(path(name)),passed:expected});}
 return{status:'passed',contextbench_tests:138,coding_runtime_tests:333,continuity_runtime_tests:3,failed:0,provider_model_calls:0,logs,component_review_refs:['boundary-state-component-review-v1.json','provider-deadline-repair-v1.json'],authority_effect:'none',open_questions_ref:'PLAN-round11.md#open-questions'};
}

function preflightState(){
 const built=build(),ready=read('work-state-ready-v11.json'),artifact='agent-reasoning-engine/research/contextbench-v1/preflight-binding-round11.json';
 const events=[...ready.events,{event_id:'r11-preflight-start',task_id:'contextbench.round11.preflight',action:'start'},{event_id:'r11-preflight-complete',task_id:'contextbench.round11.preflight',action:'complete',evidence:[{criterion_id:'initial-envelope-deadline-and-boundary-policy-health',artifact_ref:artifact,artifact_digest:fileSha(path('preflight-binding-round11.json'))}]}];
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(state.frontier.product_construction[0]!=='contextbench.round11.freeze')throw Error('round11.freeze-not-ready');return state;
}

function freezeContinuity(){
 const continuity=structuredClone(read('round11-continuity.json'));delete continuity.experiment_and_task_refs.unresolved;continuity.experiment_and_task_refs.work_plan_ref='work-plan-v11.json';continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
 for(const name of ['work-plan-v11.json','work-state-ready-v11.json','work-state-preflight-v11.json','initial-envelope-round11.json','preflight-binding-round11.json','freeze-validation-v11.json','bind-round11.mjs','prepare-round11.mjs','prepare-round11-continuity.mjs'])continuity.continuity_review.reviewed_artifacts.push({path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))});
 const result=verifyResearchContinuity({binding:continuity,policy:JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v2.json'))),hypotheses:read('hypotheses-round11.json'),phase:'freeze',root:repository});if(!result.ok)throw Error('round11.continuity:'+result.reason_codes.join(','));return continuity;
}

function sources(){
 const prior=read('freeze-round10.json').sources.map(source=>resolve(source.path));
 const preserved=JSON.parse(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round10-preserved/runtime-manifest.json')));
 const additions=[
  ...['round10-analysis.json','round10-stopping-review.json','round10-selected-hypothesis-review.json','round10-closeout.json','work-state-stopped-v10.json','close-round10-stopped.mjs','hypotheses-round11.json','PLAN-round11.md','round11-continuity.json','verify-round11-continuity.mjs','prepare-round11-continuity.mjs','provider-deadline-repair-v1.json','prepare-round11.mjs','development-matrix-v11.json','experiment-round11.json','bind-round11.mjs','work-plan-v11.json','work-state-ready-v11.json','initial-envelope-round11.json','preflight-binding-round11.json','freeze-validation-v11.json','work-state-preflight-v11.json','round11-freeze-continuity.json','round11-contextbench-tests.log','round11-coding-runtime-tests.log','round11-continuity-runtime-tests.log','freeze-round11.mjs'].map(name=>'agent-reasoning-engine/research/contextbench-v1/'+name),
  ...['model-timeout.test.mjs','round10-preserved/runtime-manifest.json'].map(name=>'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/'+name),
  ...preserved.files.map(item=>item.preserved_path),
  'implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs'];
 const unique=[...new Set([...prior,...additions].map(item=>resolve(repository,item)))].sort();for(const source of unique)if(!existsSync(source))throw Error('round11.missing-source:'+source);return unique.map(source=>({path:source,sha256:fileSha(source)}));
}

export function createFreeze(){
 write('preflight-binding-round11.json',preflight());write('freeze-validation-v11.json',validation());write('work-state-preflight-v11.json',preflightState());write('round11-freeze-continuity.json',freezeContinuity());
 const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,expected_tasks:8,expected_cells:16,matrix_ref:path('development-matrix-v11.json'),preflight_ref:path('initial-envelope-round11.json'),task_manifest_ref:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),task_directory:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),repository_inventory_ref:'/tmp/are-contextbench-repositories-v1/inventory.json',upstream:'/tmp/are-contextbench-upstream-117',python:'/tmp/are-contextbench-venv-117/bin/python',scorer:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),scoring_cache:'/tmp/are-contextbench-native-score-cache-v1',sources:sources(),continuity_review:{...read('round11-freeze-continuity.json').continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round10.json'),successor_reason:'Round ten verified exact one-shot delivery and showed a promising incomplete +0.2288 span signal with fewer known state tokens before a shared 120-second provider deadline. H21 replicates the same state mechanism with a common five-minute deadline.'};
 write('freeze-round11.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round11.json'));
 const built=build(),ready=read('work-state-preflight-v11.json'),artifact='agent-reasoning-engine/research/contextbench-v1/freeze-round11.json',events=[...ready.events,{event_id:'r11-freeze-start',task_id:'contextbench.round11.freeze',action:'start'},{event_id:'r11-freeze-complete',task_id:'contextbench.round11.freeze',action:'complete',evidence:[{criterion_id:'exact-frozen-run-envelope',artifact_ref:artifact,artifact_digest:fileSha(path('freeze-round11.json'))}]}];
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(!state.tasks.some(task=>task.task_id==='contextbench.round11.run'&&task.state==='ready'))throw Error('round11.run-not-ready');write('work-state-frozen-v11.json',state);
 return{sources:material.sources.length,freeze_sha256:sha(material),artifact_sha256:fileSha(path('freeze-round11.json')),frontier:state.frontier};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(createFreeze()));
