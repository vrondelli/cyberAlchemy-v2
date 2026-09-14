import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/',source=root+'round20-selected-hypothesis-review.json',expected='d9eb4daf10df5b6362ec6a66aed5711577d7f0caf463737dd48cdb9d95f845aa';
const fileSha=path=>sha(readFileSync(path)),read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
  const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round21.predecessor-drift');
  const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round21.predecessor-records');
  const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round21-continuity.json');
  const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round20-complete',records,
    outcome:{source_ref:root+'round20-outcome-review.json',source_digest:fileSha(root+'round20-outcome-review.json')},
    closeout:{source_ref:root+'round20-closeout.json',source_digest:fileSha(root+'round20-closeout.json')},
    implementation:{record_id:'implementation-evidence:'+fileSha(root+'terminal-correction-review-v1.json'),source_ref:root+'terminal-correction-review-v1.json'},
    question:{record_id:'candidate-question:contextbench-shared-prefix-round21',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},source_ref:source,source_digest:expected,authority_effect:'none'};
  return {...material,registration_digest:digest(material)};
}
export const verifyPredecessor=value=>{try{return canonicalJson(value)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
  const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
  const rows=[
    ['continuity',[],'objective-method-round21-continuity'],['preserve',['continuity'],'exact-round20-runtime-preservation'],
    ['instrument',['preserve'],'bounded-second-terminal-correction'],['oracle',['instrument'],'second-recovery-and-third-rejection-oracle'],['test',['oracle'],'full-regression-verification'],
    ['design',['test'],'fixed-repeated-shared-prefix-matrix'],['preflight',['design'],'eight-initial-envelopes-zero-model'],['freeze',['preflight'],'exact-frozen-run-envelope'],
    ['run',['freeze'],'all-prefixes-branches-and-failures-accounted'],['score',['run'],'post-exposure-native-validity-token-and-missingness-analysis'],['review',['score'],'reviewed-h32-h25-decision-and-v4-successor']];
  const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round21.'+id,title:'ContextBench round twenty-one: '+id,owner:'executing agent',lane:'product-construction',stage:id,
    question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round21.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round21.verify:'+id}));
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
  return {registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H32 bounded second terminal correction plus H25 GLM-5.3-flash 8K construction; no provider outcome or clearance.'};
}

export function verifyEvidence(e){
  try{
    const stage=e.validator_ref.split(':').at(-1);if(fileSha(resolve(e.artifact_ref))!==e.artifact_digest)return{ok:false};
    if(stage==='continuity'){
      const verdict=verifyResearchContinuity({binding:read(root+'round21-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v4.json'),hypotheses:read(root+'hypotheses-round21.json'),phase:'final',root:resolve('.')});if(!verdict.ok)return{ok:false};
    }else if(stage==='preserve'){
      const value=read('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round20-preserved/runtime-manifest.json');if(value.round!==20||value.files.length!==19||value.files.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(['instrument','oracle','test'].includes(stage)){
      const value=read(root+'terminal-correction-review-v1.json');if(value.status!=='verified-offline'||value.maximum_terminal_corrections!==2||value.contextbench_tests!==157||value.coding_runtime_tests!==335||value.continuity_tests!==54||value.external_transport_tests!==10||value.failed!==0||value.model_calls!==0||value.bindings.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(stage==='design'){
      const matrix=read(root+'development-matrix-v21.json'),experiment=read(root+'experiment-round21.json');if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12||matrix.cells.some(cell=>cell.limits.maximum_terminal_corrections!==2)||!verifyEvolutionRecord(experiment,experiment.schema_version).ok)return{ok:false};
    }else if(stage==='preflight'){
      const value=read(root+'initial-envelope-round21.json');if(value.status!=='passed-initial-envelope'||value.rows.length!==8||value.model_calls!==0)return{ok:false};
    }else if(stage==='freeze'){
      const {freeze,matrix}=verifyFreeze(e.artifact_ref);if(matrix.round!=='contextbench-development-round21'||freeze.expected_cells!==56||freeze.expected_tasks!==8)return{ok:false};
    }else return{ok:false};
    return{ok:true,binding:e};
  }catch{return{ok:false};}
}

export function materialize(){
  const built=build(),artifactByStage={continuity:root+'round21-continuity.json',preserve:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round20-preserved/runtime-manifest.json',instrument:root+'terminal-correction-review-v1.json',oracle:root+'terminal-correction-review-v1.json',test:root+'terminal-correction-review-v1.json',design:root+'experiment-round21.json',preflight:root+'initial-envelope-round21.json'};
  const criterionByStage=Object.fromEntries(built.plan.tasks.map(task=>[task.stage,task.completion_criteria[0]])),events=[];
  for(const stage of ['continuity','preserve','instrument','oracle','test','design','preflight']){
    const artifact=artifactByStage[stage],taskId='contextbench.round21.'+stage;events.push({event_id:`r21-${stage}-start`,task_id:taskId,action:'start'},{event_id:`r21-${stage}-complete`,task_id:taskId,action:'complete',evidence:[{criterion_id:criterionByStage[stage],artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}]});
  }
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});
  if(state.frontier.product_construction[0]!=='contextbench.round21.freeze')throw Error('round21.frontier');
  for(const [name,value] of [['work-plan-v21.json',built],['work-state-preflight-v21.json',state]]){const path=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round21.artifact-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});}
  return{tasks:built.plan.tasks.length,completed:7,frontier:state.frontier.product_construction,model_calls:0,authority_effect:'none'};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
