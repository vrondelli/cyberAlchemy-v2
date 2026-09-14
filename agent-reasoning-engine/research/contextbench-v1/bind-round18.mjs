import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/',source=root+'round17-selected-hypothesis-review.json',expected='945212f38185e56a64a6cee0d675a06b495e7e45f1b90b8dd0d02cbc94cd6789';
const fileSha=path=>sha(readFileSync(path)),read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
  const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round18.predecessor-drift');
  const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round18.predecessor-records');
  const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round18-continuity.json');
  const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round17-stopped',records,
    outcome:{source_ref:root+'round17-stopping-review.json',source_digest:fileSha(root+'round17-stopping-review.json')},
    closeout:{source_ref:root+'round17-closeout.json',source_digest:fileSha(root+'round17-closeout.json')},
    implementation:{record_id:'implementation-evidence:'+fileSha(root+'unified-tokenizer-retry-review-v1.json'),source_ref:root+'unified-tokenizer-retry-review-v1.json'},
    question:{record_id:'candidate-question:contextbench-shared-prefix-round18',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},source_ref:source,source_digest:expected,authority_effect:'none'};
  return {...material,registration_digest:digest(material)};
}
export const verifyPredecessor=value=>{try{return canonicalJson(value)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
  const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
  const rows=[
    ['continuity',[],'objective-method-round17-continuity'],['preserve',['continuity'],'exact-round17-runtime-preservation'],
    ['instrument',['preserve'],'unified-stateless-tokenizer-retry'],['oracle',['instrument'],'cross-path-identical-body-retry'],['test',['oracle'],'full-regression-verification'],
    ['design',['test'],'fixed-repeated-shared-prefix-matrix'],['preflight',['design'],'eight-initial-envelopes-zero-model'],['freeze',['preflight'],'exact-frozen-run-envelope'],
    ['run',['freeze'],'all-prefixes-and-branches-accounted'],['score',['run'],'post-exposure-native-and-token-analysis'],['review',['score'],'reviewed-h29-h25-decision-and-v4-successor']];
  const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round18.'+id,title:'ContextBench round eighteen: '+id,owner:'executing agent',lane:'product-construction',stage:id,
    question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round18.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round18.verify:'+id}));
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
  return {registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H29 unified tokenizer recovery plus H25 GLM-5.3-flash 8K construction; no provider outcome or clearance.'};
}

export function verifyEvidence(e){
  try{
    const stage=e.validator_ref.split(':').at(-1);if(fileSha(resolve(e.artifact_ref))!==e.artifact_digest)return{ok:false};
    if(stage==='continuity'){
      const verdict=verifyResearchContinuity({binding:read(root+'round18-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v4.json'),hypotheses:read(root+'hypotheses-round18.json'),phase:'final',root:resolve('.')});if(!verdict.ok)return{ok:false};
    }else if(stage==='preserve'){
      const value=read('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round17-preserved/runtime-manifest.json');if(value.round!==17||value.files.length!==14||value.files.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(['instrument','oracle','test'].includes(stage)){
      const value=read(root+'unified-tokenizer-retry-review-v1.json');if(value.status!=='verified-offline'||value.contextbench_tests!==151||value.coding_runtime_tests!==335||value.continuity_tests!==54||value.external_transport_tests!==10||value.failed!==0||value.model_calls!==0||value.bindings.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(stage==='design'){
      const matrix=read(root+'development-matrix-v18.json'),experiment=read(root+'experiment-round18.json');if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12||!verifyEvolutionRecord(experiment,experiment.schema_version).ok)return{ok:false};
    }else if(stage==='preflight'){
      const value=read(root+'initial-envelope-round18.json');if(value.status!=='passed-initial-envelope'||value.rows.length!==8||value.model_calls!==0)return{ok:false};
    }else if(stage==='freeze'){
      const {freeze,matrix}=verifyFreeze(e.artifact_ref);if(matrix.round!=='contextbench-development-round18'||freeze.expected_cells!==56||freeze.expected_tasks!==8)return{ok:false};
    }else return{ok:false};
    return{ok:true,binding:e};
  }catch{return{ok:false};}
}

export function materialize(){
  const built=build(),artifactByStage={continuity:root+'round18-continuity.json',preserve:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round17-preserved/runtime-manifest.json',instrument:root+'unified-tokenizer-retry-review-v1.json',oracle:root+'unified-tokenizer-retry-review-v1.json',test:root+'unified-tokenizer-retry-review-v1.json',design:root+'experiment-round18.json',preflight:root+'initial-envelope-round18.json'};
  const criterionByStage=Object.fromEntries(built.plan.tasks.map(task=>[task.stage,task.completion_criteria[0]])),events=[];
  for(const stage of ['continuity','preserve','instrument','oracle','test','design','preflight']){
    const artifact=artifactByStage[stage],taskId='contextbench.round18.'+stage;events.push({event_id:`r18-${stage}-start`,task_id:taskId,action:'start'},{event_id:`r18-${stage}-complete`,task_id:taskId,action:'complete',evidence:[{criterion_id:criterionByStage[stage],artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}]});
  }
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});
  if(state.frontier.product_construction[0]!=='contextbench.round18.freeze')throw Error('round18.frontier');
  for(const [name,value] of [['work-plan-v18.json',built],['work-state-preflight-v18.json',state]]){const path=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round18.artifact-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});}
  return{tasks:built.plan.tasks.length,completed:7,frontier:state.frontier.product_construction,model_calls:0,authority_effect:'none'};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
