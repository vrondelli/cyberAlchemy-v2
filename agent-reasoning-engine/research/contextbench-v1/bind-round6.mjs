// Reviewed round-five evidence -> H11 D07/D08 construction and pre-freeze state.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
const root='agent-reasoning-engine/research/contextbench-v1/',source=root+'round5-selected-hypothesis-review.json',expected='e05c8f71bbce584b96df5c2ed68bb065781eb79b057fa5a4d3748b505795b390';
const fileSha=p=>sha(readFileSync(p)),read=p=>JSON.parse(readFileSync(p));

export function predecessor(){
  const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round6.predecessor-drift');const records=JSON.parse(bytes).records;if(records.length!==4||records.some(r=>!verifyEvolutionRecord(r,r.schema_version).ok))throw Error('round6.predecessor-records');
  const decision=records.find(r=>r.schema_version==='are.learning-decision/v1'),continuity=read(root+'round6-continuity.json');
  const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round5-complete',records,implementation:{record_id:'implementation-evidence:'+fileSha(root+'task-state-component-review-v1.json'),source_ref:root+'task-state-component-review-v1.json'},question:{record_id:'candidate-question:contextbench-event-state-round6',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},source_ref:source,source_digest:expected,authority_effect:'none'};
  return{...material,registration_digest:digest(material)};
}
export const verifyPredecessor=r=>{try{return canonicalJson(r)===canonicalJson(predecessor());}catch{return false;}};
export function build(){
  const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
  const rows=[['continuity',[],'objective-method-and-predecessor-continuity'],['state-contract',['continuity'],'closed-receipt-and-event-fact-contract'],['integrate',['state-contract'],'post-recycle-opt-in-integration'],['test',['integrate'],'adversarial-state-integrity-and-accounting-tests'],['design',['test'],'fixed-matched-h11-experiment'],['freeze',['design'],'exact-frozen-run-envelope'],['run',['freeze'],'all-sixteen-attempts-accounted'],['score',['run'],'native-scores-token-and-state-integrity'],['review',['score'],'reviewed-h11-decision-and-successor']];
  const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round6.'+id,title:'ContextBench round six: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(x=>'contextbench.round6.'+x),completion_criteria:[criterion],validator_ref:'contextbench.round6.verify:'+id}));
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});return{registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H11 exposed 8K development construction; no provider outcome or benchmark clearance.'};
}
export function verifyEvidence(binding){
  try{
    if(fileSha(resolve(binding.artifact_ref))!==binding.artifact_digest)return{ok:false};
    if(binding.validator_ref==='contextbench.round6.verify:continuity'){
      const result=verifyResearchContinuity({binding:read(root+'round6-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v1.json'),hypotheses:read(root+'hypotheses-round6.json'),phase:'final',root:resolve('.')});if(!result.ok)return{ok:false};
    }else if(['state-contract','integrate','test'].some(x=>binding.validator_ref.endsWith(':'+x))){const x=read(root+'task-state-component-review-v1.json');if(x.tests.focused.passed!==6||x.tests.contextbench_suite.passed!==127||x.tests.episode_integration.new_controls!==3)return{ok:false};
    }else if(binding.validator_ref==='contextbench.round6.verify:design'){const x=read(root+'experiment-round6.json'),m=read(root+'development-matrix-v6.json');if(!verifyEvolutionRecord(x,x.schema_version).ok||m.cells.length!==16||m.tasks.length!==8||m.cells.some(c=>c.limits.terminal_submission!==true))return{ok:false};
    }else if(binding.validator_ref==='contextbench.round6.verify:freeze'){const{freeze,matrix}=verifyFreeze(binding.artifact_ref);if(matrix.round!=='contextbench-development-round6'||freeze.expected_cells!==16||freeze.expected_tasks!==8)return{ok:false};
    }else return{ok:false};return{ok:true,binding};
  }catch{return{ok:false};}
}
export function materialize(){
  const built=build(),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
  const stages=[['continuity','objective-method-and-predecessor-continuity',root+'round6-continuity.json'],['state-contract','closed-receipt-and-event-fact-contract',root+'task-state-component-review-v1.json'],['integrate','post-recycle-opt-in-integration',root+'task-state-component-review-v1.json'],['test','adversarial-state-integrity-and-accounting-tests',root+'task-state-component-review-v1.json'],['design','fixed-matched-h11-experiment',root+'experiment-round6.json']];
  const events=stages.flatMap(([id,criterion,artifact])=>[{event_id:`r6-${id}-start`,task_id:`contextbench.round6.${id}`,action:'start'},{event_id:`r6-${id}-complete`,task_id:`contextbench.round6.${id}`,action:'complete',evidence:evidence(criterion,artifact)}]);
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(state.frontier.product_construction[0]!=='contextbench.round6.freeze')throw Error('round6.frontier-invalid');
  for(const[name,value]of [['work-plan-v6.json',built],['work-state-ready-v6.json',state]]){const p=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(p)){if(readFileSync(p,'utf8')!==bytes)throw Error('round6.artifact-drift:'+name);}else writeFileSync(p,bytes,{flag:'wx'});}return{tasks:built.plan.tasks.length,frontier:state.frontier.product_construction};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
