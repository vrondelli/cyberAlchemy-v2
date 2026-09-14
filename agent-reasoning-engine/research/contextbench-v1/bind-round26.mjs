import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyEvolutionRecord,verifyResearchContinuity} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const source=root+'round25-selected-hypothesis-review.json';
const expected='e4cf8454fb2ea814d38f92dd4e3ef225da71de09abe06f4fc09cafc49e450984';
const fileSha=path=>sha(readFileSync(path)),read=path=>JSON.parse(readFileSync(path));

export function predecessor(){
  const bytes=readFileSync(source);if(sha(bytes)!==expected)throw Error('round26.predecessor-drift');
  const records=JSON.parse(bytes).records;if(records.length!==4||records.some(record=>!verifyEvolutionRecord(record,record.schema_version).ok))throw Error('round26.predecessor-records');
  const decision=records.find(record=>record.schema_version==='are.learning-decision/v1'),continuity=read(root+'round26-continuity.json');
  const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'contextbench-round25-complete',records,
    outcome:{source_ref:root+'round25-outcome-review.json',source_digest:fileSha(root+'round25-outcome-review.json')},
    closeout:{source_ref:root+'round25-closeout.json',source_digest:fileSha(root+'round25-closeout.json')},
    implementation:{record_id:'implementation-evidence:'+fileSha(root+'novelty-gated-state-review-v1.json'),source_ref:root+'novelty-gated-state-review-v1.json'},
    question:{record_id:'candidate-question:contextbench-shared-prefix-round26',question:continuity.question_and_hypotheses.question,source_decision_ref:decision.record_id},source_ref:source,source_digest:expected,authority_effect:'none'};
  return {...material,registration_digest:digest(material)};
}
export const verifyPredecessor=value=>{try{return canonicalJson(value)===canonicalJson(predecessor());}catch{return false;}};

export function build(){
  const registrations=[predecessor()],research_dag=materializeResearchDag({registrations,verify_registration:verifyPredecessor});
  const rows=[
    ['continuity',[],'objective-method-round26-continuity'],['preserve',['continuity'],'exact-round25-runtime-preservation'],
    ['instrument',['preserve'],'deterministic-novelty-gated-widest-state'],['test',['instrument'],'full-regression-verification'],
    ['design',['test'],'fixed-repeated-shared-prefix-matrix'],['preflight',['design'],'eight-initial-envelopes-zero-model'],
    ['freeze',['preflight'],'exact-frozen-run-envelope'],['run',['freeze'],'all-prefixes-branches-and-failures-accounted'],
    ['score',['run'],'post-exposure-native-validity-token-selector-and-missingness-analysis'],['review',['score'],'reviewed-h42-decision-and-fixed-successor']];
  const tasks=rows.map(([id,deps,criterion])=>({task_id:'contextbench.round26.'+id,title:'ContextBench round twenty-six: '+id,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registrations[0].question.record_id,depends_on:deps.map(dep=>'contextbench.round26.'+dep),completion_criteria:[criterion],validator_ref:'contextbench.round26.verify:'+id}));
  const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyPredecessor});
  return{registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyPredecessor}),claim_ceiling:'H42 novelty-gated widest-handle state construction; no provider outcome or clearance.'};
}

export function verifyEvidence(e){
  try{
    const stage=e.validator_ref.split(':').at(-1);if(fileSha(resolve(e.artifact_ref))!==e.artifact_digest)return{ok:false};
    if(stage==='continuity'){
      const verdict=verifyResearchContinuity({binding:read(root+'round26-continuity.json'),policy:read('agent-reasoning-engine/research/continuity-policy-v4.json'),hypotheses:read(root+'hypotheses-round26.json'),phase:'final',root:resolve('.')});if(!verdict.ok)return{ok:false};
    }else if(stage==='preserve'){
      const value=read('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round25-preserved/runtime-manifest.json');if(value.round!==25||value.files.length!==28||value.files.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(['instrument','test'].includes(stage)){
      const value=read(root+'novelty-gated-state-review-v1.json');if(value.status!=='verified-offline'||value.path_policy.maximum_paths!==8||value.path_policy.maximum_distinct_handles_per_path!==1||value.path_policy.handle_selection!=='widest-inclusive-line-span'||value.path_policy.tie_break!=='newest-receipt'||value.path_policy.novelty_gate!==true||value.path_policy.repeat_policy!=='present-each-selected-read-id-once-per-branch'||value.path_policy.empty_delta!=='audited-zero-token-suppression'||value.terminal_envelope.same_schema!==true||value.secret_resolution.timeout_ms!==30000||value.secret_resolution.successful!==3||value.tests.contextbench<165||value.tests.coding_runtime<336||value.tests.continuity!==54||value.tests.external_transport!==10||value.failed!==0||value.model_calls!==0||value.bindings.some(item=>fileSha(item.path)!==item.sha256))return{ok:false};
    }else if(stage==='design'){
      const matrix=read(root+'development-matrix-v26.json'),experiment=read(root+'experiment-round26.json');if(matrix.prefixes.length!==8||matrix.branches.length!==48||matrix.cells.length!==56||matrix.branch_order.state_first_pairs!==12||matrix.branch_order.control_first_pairs!==12||matrix.cells.some(cell=>cell.limits.terminal_content_fallback!==true||cell.limits.task_state_max_paths!==8||cell.limits.task_state_handles_per_path!==1||cell.limits.task_state_handle_selection!=='widest'||cell.limits.task_state_novelty_gate!==(cell.state_arm==='state'))||matrix.success_criteria.state_model_token_non_increase!==true||matrix.success_criteria.novelty_gate!==true||matrix.success_criteria.unique_handle_presentations_per_branch!==true||matrix.success_criteria.empty_delta_suppression_audited!==true||!verifyEvolutionRecord(experiment,experiment.schema_version).ok)return{ok:false};
    }else if(stage==='preflight'){
      const value=read(root+'initial-envelope-round26.json');if(value.status!=='passed-initial-envelope'||value.rows.length!==8||value.model_calls!==0)return{ok:false};
    }else if(stage==='freeze'){
      const {freeze,matrix}=verifyFreeze(e.artifact_ref);if(matrix.round!=='contextbench-development-round26'||freeze.expected_cells!==56||freeze.expected_tasks!==8)return{ok:false};
    }else return{ok:false};
    return{ok:true,binding:e};
  }catch{return{ok:false};}
}

export function materialize(){
  const built=build(),artifactByStage={continuity:root+'round26-continuity.json',preserve:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round25-preserved/runtime-manifest.json',instrument:root+'novelty-gated-state-review-v1.json',test:root+'novelty-gated-state-review-v1.json',design:root+'experiment-round26.json',preflight:root+'initial-envelope-round26.json'};
  const criterionByStage=Object.fromEntries(built.plan.tasks.map(task=>[task.stage,task.completion_criteria[0]])),events=[];
  for(const stage of ['continuity','preserve','instrument','test','design','preflight']){const artifact=artifactByStage[stage],taskId='contextbench.round26.'+stage;events.push({event_id:`r26-${stage}-start`,task_id:taskId,action:'start'},{event_id:`r26-${stage}-complete`,task_id:taskId,action:'complete',evidence:[{criterion_id:criterionByStage[stage],artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}]});}
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});
  if(state.frontier.product_construction[0]!=='contextbench.round26.freeze')throw Error('round26.frontier');
  for(const [name,value] of [['work-plan-v26.json',built],['work-state-preflight-v26.json',state]]){const path=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round26.artifact-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});}
  return{tasks:built.plan.tasks.length,completed:6,frontier:state.frontier.product_construction,model_calls:0,authority_effect:'none'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(materialize()));
