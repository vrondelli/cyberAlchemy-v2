// Reviewed round-ten evidence -> H21 D07/D08 replication and preflight frontier.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const source=root+'round10-selected-hypothesis-review.json';
const expected='61e0208cb60bbd6891dbd0d55d41351a04e4eaa0f8a91594426e7fbc6bfde141';
const fileSha=path=>sha(readFileSync(path));
const read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
 const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round11.predecessor-drift');
 const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round11.predecessor-records');
 const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round11-continuity.json');
 const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round10-stopped',records,
  outcome:{source_ref:root+'round10-stopping-review.json',source_digest:fileSha(root+'round10-stopping-review.json')},
  closeout:{source_ref:root+'round10-closeout.json',source_digest:fileSha(root+'round10-closeout.json')},
  implementation:{record_id:'implementation-evidence:'+fileSha(root+'provider-deadline-repair-v1.json'),source_ref:root+'provider-deadline-repair-v1.json'},
  question:{record_id:'candidate-question:contextbench-boundary-state-round11',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},
  source_ref:source,source_digest:expected,authority_effect:'none'};
 return{...material,registration_digest:digest(material)};
}
export const verifyPredecessor=registration=>{try{return canonicalJson(registration)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
 const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
 const rows=[['continuity',[],'objective-method-and-round10-continuity'],['integrate',['continuity'],'common-provider-deadline-repair'],['test',['integrate'],'deadline-and-one-shot-runtime-suites'],['design',['test'],'fixed-matched-h21-replication'],['preflight',['design'],'initial-envelope-deadline-and-boundary-policy-health'],['freeze',['preflight'],'exact-frozen-run-envelope'],['run',['freeze'],'all-sixteen-attempts-accounted'],['score',['run'],'native-scores-token-and-generation-integrity'],['review',['score'],'reviewed-h21-decision-and-method-bound-successor']];
 const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round11.'+id,title:'ContextBench round eleven: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round11.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round11.verify:'+id}));
 const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
 return{registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H21 exposed GLM-5.3-flash 8K one-shot boundary-state development construction; no provider outcome or benchmark clearance.'};
}

export function verifyEvidence(evidence){
 try{
  const stage=evidence.validator_ref.split(':').at(-1);if(fileSha(resolve(evidence.artifact_ref))!==evidence.artifact_digest)return{ok:false};
  if(stage==='continuity'){
   const result=verifyResearchContinuity({binding:read(root+'round11-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v2.json'),hypotheses:read(root+'hypotheses-round11.json'),phase:'final',root:resolve('.')});if(!result.ok)return{ok:false};
  }else if(['integrate','test'].includes(stage)){
   const review=read(root+'provider-deadline-repair-v1.json');if(review.status!=='verified-common-instrument-repair'||review.tests.contextbench.passed!==138||review.tests.contextbench.failed!==0||review.tests.coding_agent_runtime.passed!==333||review.tests.coding_agent_runtime.failed!==0||review.model_calls!==0)return{ok:false};
   for(const item of review.bindings)if(fileSha(item.path)!==item.sha256)return{ok:false};
   const boundary=read(root+'boundary-state-component-review-v1.json');if(boundary.tests.contextbench.failed!==0||boundary.tests.coding_agent_runtime.failed!==0||boundary.tests.continuity_runtime.failed!==0)return{ok:false};
  }else if(stage==='design'){
   const experiment=read(root+'experiment-round11.json'),matrix=read(root+'development-matrix-v11.json');if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok||matrix.round!=='contextbench-development-round11'||matrix.cells.length!==16||matrix.tasks.length!==8)return{ok:false};
   for(let index=0;index<matrix.cells.length;index+=2){const pair=matrix.cells.slice(index,index+2);if(new Set(pair.map(cell=>cell.instance_id)).size!==1||new Set(pair.map(cell=>cell.state_arm)).size!==2||pair.some(cell=>cell.limits.task_state_presentations_per_generation!==1||cell.provider_profile.model_timeout_ms!==300000))return{ok:false};}
  }else if(stage==='preflight'){
   const preflight=read(root+'preflight-binding-round11.json');if(preflight.status!=='verified'||preflight.model_calls!==0||preflight.initial_envelope_rows!==8||preflight.presentations_per_generation!==1||preflight.model_timeout_ms!==300000)return{ok:false};
  }else if(stage==='freeze'){
   const {freeze,matrix}=verifyFreeze(evidence.artifact_ref);if(matrix.round!=='contextbench-development-round11'||freeze.expected_cells!==16||freeze.expected_tasks!==8)return{ok:false};
  }else return{ok:false};
  return{ok:true,binding:evidence};
 }catch{return{ok:false};}
}

export function materialize(){
 const built=build(),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
 const stages=[['continuity','objective-method-and-round10-continuity',root+'round11-continuity.json'],['integrate','common-provider-deadline-repair',root+'provider-deadline-repair-v1.json'],['test','deadline-and-one-shot-runtime-suites',root+'provider-deadline-repair-v1.json'],['design','fixed-matched-h21-replication',root+'experiment-round11.json']];
 const events=stages.flatMap(([id,criterion,artifact])=>[{event_id:`r11-${id}-start`,task_id:`contextbench.round11.${id}`,action:'start'},{event_id:`r11-${id}-complete`,task_id:`contextbench.round11.${id}`,action:'complete',evidence:evidence(criterion,artifact)}]);
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(state.frontier.product_construction[0]!=='contextbench.round11.preflight')throw Error('round11.frontier-invalid');
 for(const [name,value] of [['work-plan-v11.json',built],['work-state-ready-v11.json',state]]){const target=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round11.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});}
 return{tasks:built.plan.tasks.length,frontier:state.frontier.product_construction};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
