import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build,verifyEvidence,verifyPredecessor} from './bind-round18.mjs';

const repository=resolve('.'),research=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(research,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',target=path(name);if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round18.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

function preflightBinding(){
  const report=read('initial-envelope-round18.json'),matrix=read('development-matrix-v18.json');
  if(report.status!=='passed-initial-envelope'||report.model_calls!==0||report.rows.length!==8)throw Error('round18.preflight-report');
  if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12)throw Error('round18.matrix');
  if(matrix.cells.some(cell=>cell.provider_profile.index_tokenizer_transport_attempts!==2||cell.provider_profile.request_tokenizer_transport_attempts!==2||cell.limits.incomplete_output_corrections!==2))throw Error('round18.retry-envelope');
  const rows=report.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=JSON.parse(readFileSync(resultRef));if(result.status!=='token_budget_stopped'||result.error!=='recycling.dispatch-admission-denied'||result.receipts.some(receipt=>receipt.kind==='model'&&receipt.dispatched)||result.admissions.length!==1)throw Error('round18.preflight-row:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  return{status:'verified',initial_envelope_rows:8,rows,prefixes:8,branches:48,repetitions:3,state_first_pairs:12,control_first_pairs:12,projection_mode:'evidence-only',model_calls:0,authority_effect:'none',open_questions_ref:'PLAN-round18.md#open-questions'};
}

function validation(){
  const suites=[['round18-contextbench-tests.log',151],['round18-coding-runtime-tests.log',335],['round18-continuity-tests.log',54],['round18-external-transport-tests.log',10]],logs=[];
  for(const [name,expected] of suites){const bytes=readFileSync(path(name),'utf8');if(!bytes.includes(`ℹ tests ${expected}`)||!bytes.includes(`ℹ pass ${expected}`)||!bytes.includes('ℹ fail 0'))throw Error('round18.tests:'+name);logs.push({path:path(name),sha256:fileSha(path(name)),passed:expected});}
  return{status:'passed',contextbench_tests:151,coding_runtime_tests:335,continuity_tests:54,external_transport_tests:10,failed:0,provider_model_calls:0,logs,component_review_refs:['round17-stopping-review.json','unified-tokenizer-retry-review-v1.json'],authority_effect:'none'};
}

function freezeContinuity(){
  const continuity=structuredClone(read('round18-continuity.json'));delete continuity.experiment_and_task_refs.unresolved;continuity.experiment_and_task_refs.work_plan_ref='work-plan-v18.json';continuity.experiment_and_task_refs.matrix_ref='development-matrix-v18.json';continuity.experiment_and_task_refs.experiment_ref='experiment-round18.json';
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  for(const name of ['work-plan-v18.json','work-state-preflight-v18.json','development-matrix-v18.json','experiment-round18.json','initial-envelope-round18.json','preflight-binding-round18.json','freeze-validation-v18.json','bind-round18.mjs','prepare-round18.mjs','prepare-round18-continuity.mjs','unified-tokenizer-retry-review-v1.json'])continuity.continuity_review.reviewed_artifacts.push({path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))});
  const verdict=verifyResearchContinuity({binding:continuity,policy:JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v4.json'))),hypotheses:read('hypotheses-round18.json'),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round18.continuity:'+verdict.reason_codes.join(','));return continuity;
}

function sources(){
  const prior=read('freeze-round17-execution.json').sources.map(source=>resolve(source.path));
  const additions=[
    ...['PLAN-round18.md','hypotheses-round18.json','round18-continuity.json','prepare-round18-continuity.mjs','unified-tokenizer-retry-review-v1.json','prepare-round18.mjs','development-matrix-v18.json','experiment-round18.json','bind-round18.mjs','work-plan-v18.json','work-state-preflight-v18.json','initial-envelope-round18.json','preflight-binding-round18.json','freeze-validation-v18.json','round18-freeze-continuity-execution.json','round18-contextbench-tests.log','round18-coding-runtime-tests.log','round18-continuity-tests.log','round18-external-transport-tests.log','freeze-round18.mjs','round17-interim-task1.json','round17-stopping-review.json','round17-selected-hypothesis-review.json','round17-closeout.json','work-state-stopped-v17.json','close-round17-stopped.mjs','preserve-round17.mjs'].map(name=>'agent-reasoning-engine/research/contextbench-v1/'+name),
    ...['live-client.mjs','live-client.test.mjs','request-tokenizer-retry.test.mjs','episode.mjs','episode.test.mjs','orchestrate.mjs','orchestrate.test.mjs','shared-prefix.mjs','shared-prefix.test.mjs','run-prefix-cell.mjs','run-branch-cell.mjs','run-shared-sequence.mjs'].map(name=>'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/'+name),
    'implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs','implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
    'implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-continuity.mjs','implementation/agent-reasoning-engine/packages/evolution-runtime/test/research-continuity.test.mjs',
    'agent-reasoning-engine/research/continuity-policy-v4.json','agent-reasoning-engine/research/CONTINUITY.md','agent-reasoning-engine/research/CONTINUITY-TEMPLATE.md',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round17-preserved/runtime-manifest.json'];
  const preserved=JSON.parse(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round17-preserved/runtime-manifest.json')));if(preserved.round!==17||preserved.files.length!==14)throw Error('round18.preserved-runtime');additions.push(...preserved.files.map(item=>item.preserved_path));
  const unique=[...new Set([...prior,...additions].map(item=>resolve(repository,item)))].sort();for(const source of unique)if(!existsSync(source))throw Error('round18.missing-source:'+source);return unique.map(source=>({path:source,sha256:fileSha(source)}));
}

export function createFreeze(){
  write('preflight-binding-round18.json',preflightBinding());write('freeze-validation-v18.json',validation());write('round18-freeze-continuity-execution.json',freezeContinuity());
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,expected_tasks:8,expected_cells:56,matrix_ref:path('development-matrix-v18.json'),preflight_ref:path('initial-envelope-round18.json'),task_manifest_ref:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),task_directory:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),repository_inventory_ref:'/tmp/are-contextbench-repositories-v1/inventory.json',upstream:'/tmp/are-contextbench-upstream-117',python:'/tmp/are-contextbench-venv-117/bin/python',scorer:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),scoring_cache:'/tmp/are-contextbench-native-score-cache-v1',sources:sources(),continuity_review:{...read('round18-freeze-continuity-execution.json').continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round17-execution.json'),successor_reason:'Round 17 stopped on an unambiguous zero-byte request-tokenizer transport failure after one physical attempt while the other stateless tokenizer path already allowed two. H29 applies the same bounded identical-body retry rule to both tokenizer paths while preserving tasks, state, order, context/output/total caps, semantic criteria and model-token accounting.'};
  write('freeze-round18-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round18-execution.json'));
  const built=build(),ready=read('work-state-preflight-v18.json'),artifact='agent-reasoning-engine/research/contextbench-v1/freeze-round18-execution.json',events=[...ready.events,{event_id:'r18-freeze-execution-start',task_id:'contextbench.round18.freeze',action:'start'},{event_id:'r18-freeze-execution-complete',task_id:'contextbench.round18.freeze',action:'complete',evidence:[{criterion_id:'exact-frozen-run-envelope',artifact_ref:artifact,artifact_digest:fileSha(path('freeze-round18-execution.json'))}]}];
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(!state.tasks.some(task=>task.task_id==='contextbench.round18.run'&&task.state==='ready'))throw Error('round18.run-not-ready');write('work-state-frozen-v18-execution.json',state);
  return{sources:material.sources.length,freeze_sha256:sha(material),artifact_sha256:fileSha(path('freeze-round18-execution.json')),frontier:state.frontier};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(createFreeze()));
