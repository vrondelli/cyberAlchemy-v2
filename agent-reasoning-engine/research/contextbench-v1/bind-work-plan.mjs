// Candidate D08 adapter over exact historical research evidence, not global registration.
// Open questions: PROTOCOL-v1.md. New experiment outcomes are never fabricated here.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),save=(p,v)=>writeFileSync(new URL(p,root),JSON.stringify(v,null,2)+'\n');
const sourcePath='../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/reviewed-research-result.json';
const expected='93aacd56027c59b4aaa20a7b4337b4526c7ac4dfbf2415eedb2846579708c89d';
export function historyProjection(){
 const bytes=readFileSync(new URL(sourcePath,root));if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('history.source-drift');
 const source=JSON.parse(bytes),decision=source.records.filter(r=>r.schema_version==='are.learning-decision/v1').at(-1);
 const h=source.records.find(r=>r.record_id===decision.hypothesis_ref),e=source.records.find(r=>r.schema_version==='are.research-experiment/v1'&&r.hypothesis_ref===h.record_id),o=source.records.find(r=>r.record_id===decision.observation_refs[0]);
 const records=[h,e,o,decision];if(records.some(r=>!r||!verifyEvolutionRecord(r,r.schema_version).ok))throw Error('history.invalid-record');
 const implementation={record_id:`implementation-evidence:${source.source_result_sha256}`,source_ref:sourcePath,source_sha256:expected,posture:'historical reviewed evidence; no current implementation admission'};
 const question={record_id:'candidate-question:contextbench-useful-state-117',question:'Does bounded confirmed evidence state improve relevant-context selection and recovery under small GLM windows at equal cumulative token budgets?',source_decision_ref:decision.record_id,posture:'current successor question, not historical preregistration'};
 const material={schema_version:'are.contextbench-history-projection/v1',experiment_id:'historical-recovery-reservation-v1',implementation,question,records,source_ref:sourcePath,source_sha256:expected,authority_effect:'none'};
 return {...material,registration_digest:digest(material)};
}
export const verifyHistoryProjection=r=>{try{return canonicalJson(r)===canonicalJson(historyProjection());}catch{return false;}};
export function buildWorkPlan(){
 const registration=historyProjection(),registrations=[registration],research_dag=materializeResearchDag({registrations,verify_registration:verifyHistoryProjection});
 const stages=[['freeze',[],'exact-frozen-run-envelope'],['run',['freeze'],'all-scheduled-attempts-accounted'],['score',['run'],'independent-native-scores-and-token-accounting'],['review',['score'],'reviewed-learning-decision-and-successor']];
 const tasks=stages.map(([id,deps,criterion])=>({task_id:`contextbench.round1.${id}`,title:`ContextBench development round one: ${id}`,owner:'executing agent',lane:'product-construction',stage:id,question_ref:registration.question.record_id,depends_on:deps.map(d=>`contextbench.round1.${d}`),completion_criteria:[criterion],validator_ref:`contextbench.round1.verify:${id}`}));
 const plan=materializeResearchPlan({research_dag,registrations,tasks,verify_registration:verifyHistoryProjection});
 return {registrations,research_dag,plan,state:replayResearchWork({plan,registrations,verify_registration:verifyHistoryProjection})};
}
export function writeWorkArtifacts(){
const built=buildWorkPlan();save('work-plan-v1.json',built);
const hypothesis=read('hypotheses.json').records[0],matrix=read('development-matrix-v1.json');
const experiment=createResearchExperiment({hypothesis_ref:hypothesis.record_id,research_question:built.registrations[0].question.question,baseline_ref:'development-matrix-v1.json:baseline',treatment_ref:'development-matrix-v1.json:index',metrics:hypothesis.metrics,dataset_refs:[`development-matrix:${digest(matrix)}`],required_repetitions:1,success_criteria:{scope:'One diagnostic development repetition at 8K; never confirmation or full clearance',acceptance_ref:'acceptance.json',coverage:'All 16 scheduled cells retained with explicit failures and missingness',analysis:'Paired native span scores and total tokens; no mechanism claim without observed delivery/displacement/use'},stop_conditions:matrix.stopping_rules,observation_refs:[]});
if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok)throw Error('experiment.invalid');save('experiment-round1.json',experiment);
console.log(JSON.stringify({tasks:built.plan.tasks.length,frontier:built.state.frontier,experiment:experiment.record_id,run_ready:false}));

}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)writeWorkArtifacts();
