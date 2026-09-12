// Reviewed round-four evidence -> candidate round-five D03/D07/D08 work.
// Open questions: PLAN-round5.md. No execution authority.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
const root='agent-reasoning-engine/research/contextbench-v1/',source=root+'round4-selected-hypothesis-review.json';
const expected=sha(readFileSync(source));
export function predecessor(){
  const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round5.predecessor-drift');
  const records=JSON.parse(bytes).records;if(records.length!==4||records.some(r=>!verifyEvolutionRecord(r,r.schema_version).ok))throw Error('round5.predecessor-records');
  const decision=records.find(r=>r.schema_version==='are.learning-decision/v1');
  const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round4-complete',records,
    implementation:{record_id:'implementation-evidence:'+sha(readFileSync(root+'freeze-round4.json')),source_ref:root+'freeze-round4.json'},
    question:{record_id:'candidate-question:contextbench-terminal-submission-round5',question:'Does schema-bound no-effect terminal submission improve valid completion without changing evidence delivery, effects, context, or cumulative model-token caps?',source_decision_ref:decision.record_id},
    source_ref:source,source_digest:expected,authority_effect:'none'};
  return {...material,registration_digest:digest(material)};
}
export const verifyPredecessor=r=>{try{return canonicalJson(r)===canonicalJson(predecessor());}catch{return false;}};
export function build(){
  const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
  const stages=[['freeze',[],'exact-frozen-run-envelope'],['run',['freeze'],'all-six-attempts-accounted'],['score',['run'],'matched-terminal-outcomes-and-token-accounting'],['review',['score'],'reviewed-h9-decision-and-successor']];
  const tasks=stages.map(([id,deps,criterion])=>({task_id:'contextbench.round5.'+id,title:'ContextBench round five: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(d=>'contextbench.round5.'+d),completion_criteria:[criterion],validator_ref:'contextbench.round5.verify:'+id}));
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
  return{registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'Question-bound exposed development work; no global admission, H1 support, confirmation or benchmark success.'};
}
export function verifyFreezeEvidence(binding){
  try{
    if(binding.task_id!=='contextbench.round5.freeze'||binding.validator_ref!=='contextbench.round5.verify:freeze'||binding.criterion_id!=='exact-frozen-run-envelope'||sha(readFileSync(binding.artifact_ref))!==binding.artifact_digest)return{ok:false};
    const{freeze,matrix}=verifyFreeze(binding.artifact_ref);if(matrix.round!=='contextbench-development-round5'||freeze.expected_cells!==6||freeze.expected_tasks!==3||!freeze.sources.some(s=>s.path===resolve(root+'work-plan-v5.json')))return{ok:false};return{ok:true,binding};
  }catch{return{ok:false};}
}
export function materialize(){
  const built=build(),hypotheses=JSON.parse(readFileSync(root+'hypotheses-round5.json')),hypothesis=hypotheses.records.find(h=>h.record_id===hypotheses.selection.selected),matrix=JSON.parse(readFileSync(root+'development-matrix-v5.json'));
  const experiment=createResearchExperiment({hypothesis_ref:hypothesis.record_id,research_question:built.registrations[0].question.question,baseline_ref:'development-matrix-v5.json:freeform',treatment_ref:'development-matrix-v5.json:structured',metrics:hypothesis.metrics,dataset_refs:['development-matrix-v5.json@'+sha(readFileSync(root+'development-matrix-v5.json'))],required_repetitions:1,success_criteria:{...matrix.success_criteria,scope:matrix.claim_ceiling,protocol_ref:'PLAN-round5.md'},stop_conditions:matrix.stopping_rules,observation_refs:[]});
  if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok)throw Error('round5.invalid-experiment');
  const outputs=[['work-plan-v5.json',built],['experiment-round5.json',experiment]];for(const[name,value]of outputs){const p=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(p)){if(readFileSync(p,'utf8')!==bytes)throw Error('round5.artifact-drift:'+name);}else writeFileSync(p,bytes,{flag:'wx'});}return{tasks:built.plan.tasks.length,question:built.registrations[0].question.record_id,experiment:experiment.record_id};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
