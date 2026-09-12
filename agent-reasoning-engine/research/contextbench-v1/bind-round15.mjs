import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/',source=root+'round14-selected-hypothesis-review.json',expected='bb5c4f704d0edfe7059ff827c3f0760d2e9d2a9b4ee0a0df19814b6f9b7f7565';
const fileSha=path=>sha(readFileSync(path)),read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
  const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round15.predecessor-drift');
  const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round15.predecessor-records');
  const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round15-continuity.json');
  const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round14-complete',records,
    outcome:{source_ref:root+'round14-outcome-review.json',source_digest:fileSha(root+'round14-outcome-review.json')},
    closeout:{source_ref:root+'round14-closeout.json',source_digest:fileSha(root+'round14-closeout.json')},
    implementation:{record_id:'implementation-evidence:'+fileSha(root+'shared-prefix-instrument-review-v1.json'),source_ref:root+'shared-prefix-instrument-review-v1.json'},
    question:{record_id:'candidate-question:contextbench-shared-prefix-round15',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},source_ref:source,source_digest:expected,authority_effect:'none'};
  return {...material,registration_digest:digest(material)};
}
export const verifyPredecessor=value=>{try{return canonicalJson(value)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
  const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
  const rows=[
    ['continuity',[],'objective-method-round14-continuity'],['audit',['continuity'],'complete-boundary-state-inventory'],['preserve',['audit'],'exact-round14-runtime-preservation'],
    ['instrument',['preserve'],'pause-export-import-and-isolated-clone'],['oracle',['instrument'],'zero-model-causal-oracle'],['test',['oracle'],'full-regression-verification'],
    ['design',['test'],'fixed-repeated-shared-prefix-matrix'],['preflight',['design'],'eight-initial-envelopes-zero-model'],['freeze',['preflight'],'exact-frozen-run-envelope'],
    ['run',['freeze'],'all-prefixes-and-branches-accounted'],['score',['run'],'post-exposure-native-and-token-analysis'],['review',['score'],'reviewed-h25-decision-and-v3-successor']];
  const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round15.'+id,title:'ContextBench round fifteen: '+id,owner:'executing agent',lane:'product-construction',stage:id,
    question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round15.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round15.verify:'+id}));
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
  return {registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H25 shared-prefix GLM-5.3-flash 8K construction; no provider outcome or clearance.'};
}

export function verifyEvidence(e){
  try{
    const stage=e.validator_ref.split(':').at(-1);if(fileSha(resolve(e.artifact_ref))!==e.artifact_digest)return{ok:false};
    if(stage==='continuity'){
      const verdict=verifyResearchContinuity({binding:read(root+'round15-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v3.json'),hypotheses:read(root+'hypotheses-round15.json'),phase:'final',root:resolve('.')});if(!verdict.ok)return{ok:false};
    }else if(stage==='audit'){
      const value=read(root+'round15-boundary-audit.json');if(value.status!=='complete'||value.required_state.transport_and_cost.length<3)return{ok:false};
    }else if(stage==='preserve'){
      const value=read('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round14-preserved/runtime-manifest.json');if(value.round!==14||value.files.length!==7||value.files.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(['instrument','oracle','test'].includes(stage)){
      const value=read(root+'shared-prefix-instrument-review-v1.json');if(value.status!=='verified-offline-causal-instrument'||value.contextbench_tests!==147||value.coding_runtime_tests!==334||value.continuity_tests!==4||value.failed!==0||value.model_calls!==0||value.bindings.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(stage==='design'){
      const matrix=read(root+'development-matrix-v15.json'),experiment=read(root+'experiment-round15.json');if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12||!verifyEvolutionRecord(experiment,experiment.schema_version).ok)return{ok:false};
    }else if(stage==='preflight'){
      const value=read(root+'initial-envelope-round15.json');if(value.status!=='passed-initial-envelope'||value.rows.length!==8||value.model_calls!==0)return{ok:false};
    }else if(stage==='freeze'){
      const {freeze,matrix}=verifyFreeze(e.artifact_ref);if(matrix.round!=='contextbench-development-round15'||freeze.expected_cells!==56||freeze.expected_tasks!==8)return{ok:false};
    }else return{ok:false};
    return{ok:true,binding:e};
  }catch{return{ok:false};}
}

export function materialize(){
  const built=build(),artifactByStage={continuity:root+'round15-continuity.json',audit:root+'round15-boundary-audit.json',preserve:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round14-preserved/runtime-manifest.json',instrument:root+'shared-prefix-instrument-review-v1.json',oracle:root+'shared-prefix-instrument-review-v1.json',test:root+'shared-prefix-instrument-review-v1.json',design:root+'experiment-round15.json',preflight:root+'initial-envelope-round15.json'};
  const criterionByStage=Object.fromEntries(built.plan.tasks.map(task=>[task.stage,task.completion_criteria[0]])),events=[];
  for(const stage of ['continuity','audit','preserve','instrument','oracle','test','design','preflight']){
    const artifact=artifactByStage[stage],taskId='contextbench.round15.'+stage;events.push({event_id:`r15-${stage}-start`,task_id:taskId,action:'start'},{event_id:`r15-${stage}-complete`,task_id:taskId,action:'complete',evidence:[{criterion_id:criterionByStage[stage],artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}]});
  }
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});
  if(state.frontier.product_construction[0]!=='contextbench.round15.freeze')throw Error('round15.frontier');
  for(const [name,value] of [['work-plan-v15.json',built],['work-state-preflight-v15.json',state]]){const path=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round15.artifact-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});}
  return{tasks:built.plan.tasks.length,completed:8,frontier:state.frontier.product_construction,model_calls:0,authority_effect:'none'};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
