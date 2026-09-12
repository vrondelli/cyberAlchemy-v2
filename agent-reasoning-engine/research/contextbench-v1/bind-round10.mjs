// Reviewed round-nine counterevidence -> H19 D07/D08 construction and preflight frontier.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const source=root+'round9-selected-hypothesis-review.json';
const expected='fc1fbc4cb01aa624796097509d56d56f3975823df472db1b78df4eedebd3b4a1';
const fileSha=path=>sha(readFileSync(path));
const read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
 const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round10.predecessor-drift');
 const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round10.predecessor-records');
 const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round10-continuity.json');
 const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round9-complete',records,
  outcome:{source_ref:root+'round9-outcome-review.json',source_digest:fileSha(root+'round9-outcome-review.json')},
  closeout:{source_ref:root+'round9-closeout.json',source_digest:fileSha(root+'round9-closeout.json')},
  implementation:{record_id:'implementation-evidence:'+fileSha(root+'boundary-state-component-review-v1.json'),source_ref:root+'boundary-state-component-review-v1.json'},
  question:{record_id:'candidate-question:contextbench-boundary-state-round10',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},
  source_ref:source,source_digest:expected,authority_effect:'none'};
 return{...material,registration_digest:digest(material)};
}
export const verifyPredecessor=registration=>{try{return canonicalJson(registration)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
 const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
 const rows=[['continuity',[],'objective-method-and-round9-continuity'],['analyze',['continuity'],'round9-analysis-integrity'],['integrate',['analyze'],'one-shot-boundary-state'],['test',['integrate'],'boundary-state-controls-and-full-suites'],['design',['test'],'fixed-matched-h19-experiment'],['preflight',['design'],'initial-envelope-and-boundary-policy-health'],['freeze',['preflight'],'exact-frozen-run-envelope'],['run',['freeze'],'all-sixteen-attempts-accounted'],['score',['run'],'native-scores-token-and-generation-integrity'],['review',['score'],'reviewed-h19-decision-and-method-bound-successor']];
 const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round10.'+id,title:'ContextBench round ten: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round10.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round10.verify:'+id}));
 const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
 return{registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H19 exposed GLM-5.3-flash 8K one-shot boundary-state development construction; no provider outcome or benchmark clearance.'};
}

export function verifyEvidence(evidence){
 try{
  const stage=evidence.validator_ref.split(':').at(-1);if(fileSha(resolve(evidence.artifact_ref))!==evidence.artifact_digest)return{ok:false};
  if(stage==='continuity'){
   const result=verifyResearchContinuity({binding:read(root+'round10-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v2.json'),hypotheses:read(root+'hypotheses-round10.json'),phase:'final',root:resolve('.')});if(!result.ok)return{ok:false};
  }else if(stage==='analyze'){
   const review=read(root+'analyze-round-repair-v1.json');if(review.regression_test.passed!==3||review.regression_test.failed!==0||review.provider_model_calls!==0)return{ok:false};
   for(const item of [review.preserved_frozen_analyzer,review.repair,review.regression_test]){const path=item.path??item.log_ref,digest=item.sha256??item.log_sha256;if(fileSha(path)!==digest)return{ok:false};}
  }else if(['integrate','test'].includes(stage)){
   const review=read(root+'boundary-state-component-review-v1.json');if(review.tests.contextbench.passed!==136||review.tests.contextbench.failed!==0||review.tests.coding_agent_runtime.passed!==133||review.tests.coding_agent_runtime.failed!==0||review.tests.continuity_runtime.passed!==3||review.tests.continuity_runtime.failed!==0||review.provider_model_calls!==0)return{ok:false};
   for(const item of review.bindings)if(fileSha(item.path)!==item.sha256)return{ok:false};
  }else if(stage==='design'){
   const experiment=read(root+'experiment-round10.json'),matrix=read(root+'development-matrix-v10.json');if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok||matrix.round!=='contextbench-development-round10'||matrix.cells.length!==16||matrix.tasks.length!==8)return{ok:false};
   for(let index=0;index<matrix.cells.length;index+=2){const pair=matrix.cells.slice(index,index+2);if(new Set(pair.map(cell=>cell.instance_id)).size!==1||new Set(pair.map(cell=>cell.state_arm)).size!==2||pair.some(cell=>cell.limits.task_state_presentations_per_generation!==1))return{ok:false};}
  }else if(stage==='preflight'){
   const preflight=read(root+'preflight-binding-round10.json');if(preflight.status!=='verified'||preflight.model_calls!==0||preflight.initial_envelope_rows!==8||preflight.presentations_per_generation!==1)return{ok:false};
  }else if(stage==='freeze'){
   const {freeze,matrix}=verifyFreeze(evidence.artifact_ref);if(matrix.round!=='contextbench-development-round10'||freeze.expected_cells!==16||freeze.expected_tasks!==8)return{ok:false};
  }else return{ok:false};
  return{ok:true,binding:evidence};
 }catch{return{ok:false};}
}

export function materialize(){
 const built=build(),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
 const stages=[['continuity','objective-method-and-round9-continuity',root+'round10-continuity.json'],['analyze','round9-analysis-integrity',root+'analyze-round-repair-v1.json'],['integrate','one-shot-boundary-state',root+'boundary-state-component-review-v1.json'],['test','boundary-state-controls-and-full-suites',root+'boundary-state-component-review-v1.json'],['design','fixed-matched-h19-experiment',root+'experiment-round10.json']];
 const events=stages.flatMap(([id,criterion,artifact])=>[{event_id:`r10-${id}-start`,task_id:`contextbench.round10.${id}`,action:'start'},{event_id:`r10-${id}-complete`,task_id:`contextbench.round10.${id}`,action:'complete',evidence:evidence(criterion,artifact)}]);
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(state.frontier.product_construction[0]!=='contextbench.round10.preflight')throw Error('round10.frontier-invalid');
 for(const [name,value] of [['work-plan-v10.json',built],['work-state-ready-v10.json',state]]){const target=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round10.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});}
 return{tasks:built.plan.tasks.length,frontier:state.frontier.product_construction};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
