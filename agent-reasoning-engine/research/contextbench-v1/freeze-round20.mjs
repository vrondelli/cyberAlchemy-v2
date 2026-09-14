import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build,verifyEvidence,verifyPredecessor} from './bind-round20.mjs';

const repository=resolve('.'),research=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(research,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=target=>sha(readFileSync(target));
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',target=path(name);if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round20.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

function preflightBinding(){
  const report=read('initial-envelope-round20.json'),matrix=read('development-matrix-v20.json');
  if(report.status!=='passed-initial-envelope'||report.model_calls!==0||report.rows.length!==8)throw Error('round20.preflight-report');
  if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12)throw Error('round20.matrix');
  if(matrix.cells.some(cell=>cell.provider_profile.index_tokenizer_transport_attempts!==2||cell.provider_profile.request_tokenizer_transport_attempts!==2||cell.limits.incomplete_output_corrections!==2))throw Error('round20.retry-envelope');
  const rows=report.rows.map(row=>{const resultRef=resolve(row.output_path,'result.json'),result=JSON.parse(readFileSync(resultRef));if(result.status!=='token_budget_stopped'||result.error!=='recycling.dispatch-admission-denied'||result.receipts.some(receipt=>receipt.kind==='model'&&receipt.dispatched)||result.admissions.length!==1)throw Error('round20.preflight-row:'+row.instance_id);return{instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};});
  return{status:'verified',initial_envelope_rows:8,rows,prefixes:8,branches:48,repetitions:3,state_first_pairs:12,control_first_pairs:12,projection_mode:'evidence-only',model_calls:0,authority_effect:'none',open_questions_ref:'PLAN-round20.md#open-questions'};
}

function validation(){
  const suites=[['round20-contextbench-tests.log',155],['round20-coding-runtime-tests.log',335],['round20-continuity-tests.log',54],['round20-external-transport-tests.log',10]],logs=[];
  for(const [name,expected] of suites){const bytes=readFileSync(path(name),'utf8');if(!bytes.includes(`ℹ tests ${expected}`)||!bytes.includes(`ℹ pass ${expected}`)||!bytes.includes('ℹ fail 0'))throw Error('round20.tests:'+name);logs.push({path:path(name),sha256:fileSha(path(name)),passed:expected});}
  return{status:'passed',contextbench_tests:155,coding_runtime_tests:335,continuity_tests:54,external_transport_tests:10,failed:0,provider_model_calls:0,logs,component_review_refs:['round19-stopping-review.json','local-outcome-taxonomy-review-v1.json'],round19_failure_replay_ref:'round20-round19-failure-replay.json',authority_effect:'none'};
}

function freezeContinuity(){
  const continuity=structuredClone(read('round20-continuity.json'));delete continuity.experiment_and_task_refs.unresolved;continuity.experiment_and_task_refs.work_plan_ref='work-plan-v20.json';continuity.experiment_and_task_refs.matrix_ref='development-matrix-v20.json';continuity.experiment_and_task_refs.experiment_ref='experiment-round20.json';
  continuity.continuity_review.run_ready=true;continuity.continuity_review.passed=true;continuity.continuity_review.unresolved_bindings=[];
  for(const name of ['work-plan-v20.json','work-state-preflight-v20.json','development-matrix-v20.json','experiment-round20.json','initial-envelope-round20.json','preflight-binding-round20.json','freeze-validation-v20.json','bind-round20.mjs','prepare-round20.mjs','prepare-round20-continuity.mjs','local-outcome-taxonomy-review-v1.json','round20-round19-failure-replay.json'])continuity.continuity_review.reviewed_artifacts.push({path:'agent-reasoning-engine/research/contextbench-v1/'+name,sha256:fileSha(path(name))});
  const verdict=verifyResearchContinuity({binding:continuity,policy:JSON.parse(readFileSync(resolve('agent-reasoning-engine/research/continuity-policy-v4.json'))),hypotheses:read('hypotheses-round20.json'),phase:'freeze',root:repository});if(!verdict.ok)throw Error('round20.continuity:'+verdict.reason_codes.join(','));return continuity;
}

function sources(){
  const prior=read('freeze-round19-execution.json').sources.map(source=>resolve(source.path));
  const additions=[
    ...['PLAN-round20.md','hypotheses-round20.json','round20-continuity.json','prepare-round20-continuity.mjs','local-outcome-taxonomy-review-v1.json','round20-round19-failure-replay.json','prepare-round20.mjs','development-matrix-v20.json','experiment-round20.json','bind-round20.mjs','work-plan-v20.json','work-state-preflight-v20.json','initial-envelope-round20.json','preflight-binding-round20.json','freeze-validation-v20.json','round20-freeze-continuity-execution.json','round20-contextbench-tests.log','round20-coding-runtime-tests.log','round20-continuity-tests.log','round20-external-transport-tests.log','freeze-round20.mjs','round19-interim-tasks1-2.json','round19-stopping-review.json','round19-selected-hypothesis-review.json','round19-closeout.json','work-state-stopped-v19.json','close-round19-stopped.mjs','preserve-round19.mjs'].map(name=>'agent-reasoning-engine/research/contextbench-v1/'+name),
    ...['dispatch-validation.mjs','dispatch-validation.test.mjs','local-failure-ledger.mjs','local-failure-ledger.test.mjs','live-client.mjs','live-client.test.mjs','request-tokenizer-retry.test.mjs','episode.mjs','episode.test.mjs','orchestrate.mjs','orchestrate.test.mjs','shared-prefix.mjs','shared-prefix.test.mjs','run-prefix-cell.mjs','run-branch-cell.mjs','run-shared-sequence.mjs'].map(name=>'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/'+name),
    'implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs',
    'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs','implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
    'implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-continuity.mjs','implementation/agent-reasoning-engine/packages/evolution-runtime/test/research-continuity.test.mjs',
    'agent-reasoning-engine/research/continuity-policy-v4.json','agent-reasoning-engine/research/CONTINUITY.md','agent-reasoning-engine/research/CONTINUITY-TEMPLATE.md',
    'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round19-preserved/runtime-manifest.json'];
  const preserved=JSON.parse(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round19-preserved/runtime-manifest.json')));if(preserved.round!==19||preserved.files.length!==17)throw Error('round20.preserved-runtime');additions.push(...preserved.files.map(item=>item.preserved_path));
  const unique=[...new Set([...prior,...additions].map(item=>resolve(repository,item)))].sort();for(const source of unique)if(!existsSync(source))throw Error('round20.missing-source:'+source);return unique.map(source=>({path:source,sha256:fileSha(source)}));
}

export function createFreeze(){
  write('preflight-binding-round20.json',preflightBinding());write('freeze-validation-v20.json',validation());write('round20-freeze-continuity-execution.json',freezeContinuity());
  const material={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,expected_tasks:8,expected_cells:56,matrix_ref:path('development-matrix-v20.json'),preflight_ref:path('initial-envelope-round20.json'),task_manifest_ref:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),task_directory:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),repository_inventory_ref:'/tmp/are-contextbench-repositories-v1/inventory.json',upstream:'/tmp/are-contextbench-upstream-117',python:'/tmp/are-contextbench-venv-117/bin/python',scorer:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),scoring_cache:'/tmp/are-contextbench-native-score-cache-v1',sources:sources(),continuity_review:{...read('round20-freeze-continuity-execution.json').continuity_review,passed:true},claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round19-execution.json'),successor_reason:'Round 19 showed that a fully accounted tokenizer failure can remain local, then exposed an HTTP-200 tool-call shape failure and a non-durable in-memory ledger. H31 closes the eligible local outcome taxonomy and persists every accepted local failure before continuing, while shared integrity, ancestry, budget and unknown-usage failures remain global stops.'};
  write('freeze-round20-execution.json',{...material,freeze_sha256:sha(material)});verifyFreeze(path('freeze-round20-execution.json'));
  const built=build(),ready=read('work-state-preflight-v20.json'),artifact='agent-reasoning-engine/research/contextbench-v1/freeze-round20-execution.json',events=[...ready.events,{event_id:'r20-freeze-execution-start',task_id:'contextbench.round20.freeze',action:'start'},{event_id:'r20-freeze-execution-complete',task_id:'contextbench.round20.freeze',action:'complete',evidence:[{criterion_id:'exact-frozen-run-envelope',artifact_ref:artifact,artifact_digest:fileSha(path('freeze-round20-execution.json'))}]}];
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(!state.tasks.some(task=>task.task_id==='contextbench.round20.run'&&task.state==='ready'))throw Error('round20.run-not-ready');write('work-state-frozen-v20-execution.json',state);
  return{sources:material.sources.length,freeze_sha256:sha(material),artifact_sha256:fileSha(path('freeze-round20-execution.json')),frontier:state.frontier};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(createFreeze()));
