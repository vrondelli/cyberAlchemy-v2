// Reviewed round-eleven evidence -> H22 D07/D08 construction and preflight frontier.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const source=root+'round11-selected-hypothesis-review.json';
const expected='7ee30be10cc7d66dafe38bf92faef96dda448d7b559e206b2414d0bec2e845ec';
const fileSha=path=>sha(readFileSync(path));
const read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
 const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round12.predecessor-drift');
 const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round12.predecessor-records');
 const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round12-continuity.json');
 const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round11-stopped',records,
  outcome:{source_ref:root+'round11-stopping-review.json',source_digest:fileSha(root+'round11-stopping-review.json')},
  closeout:{source_ref:root+'round11-closeout.json',source_digest:fileSha(root+'round11-closeout.json')},
  implementation:{record_id:'implementation-evidence:'+fileSha(root+'incomplete-output-ledger-review-v1.json'),source_ref:root+'incomplete-output-ledger-review-v1.json'},
  question:{record_id:'candidate-question:contextbench-boundary-state-round12',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},
  source_ref:source,source_digest:expected,authority_effect:'none'};
 return{...material,registration_digest:digest(material)};
}
export const verifyPredecessor=registration=>{try{return canonicalJson(registration)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
 const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
 const rows=[['continuity',[],'objective-method-and-round11-continuity'],['integrate',['continuity'],'accounted-incomplete-output-ledger-repair'],['test',['integrate'],'cross-layer-correction-and-poison-controls'],['design',['test'],'fixed-matched-h22-experiment'],['preflight',['design'],'initial-envelope-deadline-and-boundary-policy-health'],['freeze',['preflight'],'exact-frozen-run-envelope'],['run',['freeze'],'all-sixteen-attempts-accounted'],['score',['run'],'native-scores-token-and-generation-integrity'],['review',['score'],'reviewed-h22-decision-and-method-bound-successor']];
 const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round12.'+id,title:'ContextBench round twelve: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round12.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round12.verify:'+id}));
 const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
 return{registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H22 exposed GLM-5.3-flash 8K one-shot boundary-state development construction; no provider outcome or benchmark clearance.'};
}

export function verifyEvidence(evidence){
 try{
  const stage=evidence.validator_ref.split(':').at(-1);if(fileSha(resolve(evidence.artifact_ref))!==evidence.artifact_digest)return{ok:false};
  if(stage==='continuity'){
   const result=verifyResearchContinuity({binding:read(root+'round12-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v2.json'),hypotheses:read(root+'hypotheses-round12.json'),phase:'final',root:resolve('.')});if(!result.ok)return{ok:false};
  }else if(['integrate','test'].includes(stage)){
   const review=read(root+'incomplete-output-ledger-review-v1.json');if(review.status!=='verified-cross-layer-repair'||review.tests.contextbench.passed!==140||review.tests.contextbench.failed!==0||review.tests.coding_agent_runtime.passed!==333||review.tests.coding_agent_runtime.failed!==0||review.tests.continuity.passed!==3||review.tests.integrated_length_then_correction.failed!==0||review.tests.malformed_response_poison.failed!==0||review.model_calls!==0)return{ok:false};
   for(const item of review.bindings)if(fileSha(item.path)!==item.sha256)return{ok:false};
  }else if(stage==='design'){
   const experiment=read(root+'experiment-round12.json'),matrix=read(root+'development-matrix-v12.json');if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok||matrix.round!=='contextbench-development-round12'||matrix.cells.length!==16||matrix.tasks.length!==8)return{ok:false};
   for(let index=0;index<matrix.cells.length;index+=2){const pair=matrix.cells.slice(index,index+2);if(new Set(pair.map(cell=>cell.instance_id)).size!==1||new Set(pair.map(cell=>cell.state_arm)).size!==2||pair.some(cell=>cell.limits.task_state_presentations_per_generation!==1||cell.provider_profile.model_timeout_ms!==300000))return{ok:false};}
  }else if(stage==='preflight'){
   const preflight=read(root+'preflight-binding-round12.json');if(preflight.status!=='verified'||preflight.model_calls!==0||preflight.initial_envelope_rows!==8||preflight.presentations_per_generation!==1||preflight.model_timeout_ms!==300000)return{ok:false};
  }else if(stage==='freeze'){
   const {freeze,matrix}=verifyFreeze(evidence.artifact_ref);if(matrix.round!=='contextbench-development-round12'||freeze.expected_cells!==16||freeze.expected_tasks!==8)return{ok:false};
  }else return{ok:false};
  return{ok:true,binding:evidence};
 }catch{return{ok:false};}
}

export function materialize(){
 const built=build(),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
 const stages=[['continuity','objective-method-and-round11-continuity',root+'round12-continuity.json'],['integrate','accounted-incomplete-output-ledger-repair',root+'incomplete-output-ledger-review-v1.json'],['test','cross-layer-correction-and-poison-controls',root+'incomplete-output-ledger-review-v1.json'],['design','fixed-matched-h22-experiment',root+'experiment-round12.json']];
 const events=stages.flatMap(([id,criterion,artifact])=>[{event_id:`r12-${id}-start`,task_id:`contextbench.round12.${id}`,action:'start'},{event_id:`r12-${id}-complete`,task_id:`contextbench.round12.${id}`,action:'complete',evidence:evidence(criterion,artifact)}]);
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(state.frontier.product_construction[0]!=='contextbench.round12.preflight')throw Error('round12.frontier-invalid');
 for(const [name,value] of [['work-plan-v12.json',built],['work-state-ready-v12.json',state]]){const target=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round12.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});}
 return{tasks:built.plan.tasks.length,frontier:state.frontier.product_construction};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
