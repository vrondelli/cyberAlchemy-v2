// Exact predecessor evidence -> candidate D07/D08 successor. Open questions: PROTOCOL-round3.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
const root='agent-reasoning-engine/research/contextbench-v1/';
const source=root+'round2-selected-hypothesis-review.json';
const expected='5caf9b6c8332b08e688958f345849aa891f82160e1806493aa149975632aa929';
export function predecessor(){
 const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round3.predecessor-drift');
 const records=JSON.parse(bytes).records;
 if(records.length!==4||records.some(r=>!verifyEvolutionRecord(r,r.schema_version).ok))throw Error('round3.predecessor-records');
 const decision=records.find(r=>r.schema_version==='are.learning-decision/v1');
 const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round2-stopped',records,
  implementation:{record_id:'implementation-evidence:'+sha(readFileSync(root+'freeze-round2.json')),source_ref:root+'freeze-round2.json'},
  question:{record_id:'candidate-question:contextbench-useful-state-round3',question:'With complete source-version feedback, pending delivery and bounded finalization, does the evidence index improve final relevant-context selection under GLM small-window pressure?',source_decision_ref:decision.record_id},
  source_ref:source,source_digest:expected,authority_effect:'none'};
 return {...material,registration_digest:digest(material)};
}
export const verifyPredecessor=r=>{try{return canonicalJson(r)===canonicalJson(predecessor());}catch{return false;}};
export function build(){
 const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
 const stages=[['freeze',[],'exact-frozen-run-envelope'],['run',['freeze'],'all-scheduled-attempts-accounted'],['score',['run'],'independent-native-scores-and-token-accounting'],['review',['score'],'reviewed-learning-decision-and-successor']];
 const tasks=stages.map(([id,deps,criterion])=>({task_id:'contextbench.round3.'+id,title:'ContextBench round three: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(d=>'contextbench.round3.'+d),completion_criteria:[criterion],validator_ref:'contextbench.round3.verify:'+id}));
 const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
 return {registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'Candidate question-bound work plan; no global admission or benchmark success.'};
}
export function verifyFreezeEvidence(binding){
 try{
  if(binding.task_id!=='contextbench.round3.freeze'||binding.validator_ref!=='contextbench.round3.verify:freeze'||binding.criterion_id!=='exact-frozen-run-envelope')return {ok:false};
  if(sha(readFileSync(binding.artifact_ref))!==binding.artifact_digest)return {ok:false};
  const {freeze,matrix}=verifyFreeze(binding.artifact_ref);
  if(matrix.round!=='contextbench-development-round3'||!freeze.sources.some(s=>s.path===resolve(root+'work-plan-v3.json')))return {ok:false};
  return {ok:true,binding};
 }catch{return {ok:false};}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const built=build();writeFileSync(root+'work-plan-v3.json',JSON.stringify(built,null,2)+'\n',{flag:'wx'});
 const hypothesis=JSON.parse(readFileSync(root+'hypotheses.json')).records[0],matrix=JSON.parse(readFileSync(root+'development-matrix-v3.json'));
 const experiment=createResearchExperiment({hypothesis_ref:hypothesis.record_id,research_question:built.registrations[0].question.question,baseline_ref:'development-matrix-v3.json:baseline',treatment_ref:'development-matrix-v3.json:index',metrics:hypothesis.metrics,dataset_refs:['development-matrix-v3.json@'+sha(readFileSync(root+'development-matrix-v3.json'))],required_repetitions:1,success_criteria:{scope:'16-cell development diagnostic at 8K only; no confirmation or clearance',acceptance_ref:'acceptance.json',protocol_ref:'PROTOCOL-round3.md',coverage:'Every scheduled ID accounted; unstarted-paused distinct from attempted failure',analysis:'Paired native metrics and cumulative model tokens with complete missingness; no independent H5/H6 or semantic retention claim'},stop_conditions:matrix.stopping_rules,observation_refs:[]});
 if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok)throw Error('round3.invalid-experiment');
 writeFileSync(root+'experiment-round3.json',JSON.stringify(experiment,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({tasks:built.plan.tasks.length,question:built.registrations[0].question.record_id,experiment:experiment.record_id}));
}
