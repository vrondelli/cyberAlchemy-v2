import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),base=resolve(dir,'../..'),ex=resolve(dir,'..');
const {materializeResearchDag,verifyResearchDag}=await import(resolve(root,'implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs'));
const {materializeResearchPlan,replayResearchWork}=await import(resolve(root,'implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs'));
const {verifyEvolutionRecord}=await import(resolve(root,'implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs'));
const {canonicalJson,digest}=await import(resolve(root,'implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs'));
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const binding=p=>({path:relative(root,p),sha256:sha(p)});
const check=process.argv.includes('--check');assert.ok(process.argv.slice(2).every(x=>x==='--check'));
const emit=(name,value)=>{const text=JSON.stringify(value,null,2)+'\n',p=resolve(dir,name);if(check)assert.equal(readFileSync(p,'utf8'),text,name);else writeFileSync(p,text);};
const prior=read(resolve(base,'../benchmark-pilot-v1/predecessor-registration.json'));
const configs=[
 {id:'selectivity-v2',hypotheses:'selectivity-v2/run-hypotheses.json',experiment:'selectivity-v2/run-experiment.json',observations:'selectivity-v2/observations.json',sources:['selectivity-v2/freeze.json','selectivity-v2/RESULTS.json','selectivity-v2/blind-review.json','selectivity-v2/blind-review-mapping.json'],freeze:'selectivity-v2/freeze.json'},
 {id:'longmemeval-sequential-v1',hypotheses:'longmemeval-sequential-v1/run-hypotheses.json',experiment:'longmemeval-sequential-v1/run-experiment.json',observations:'longmemeval-sequential-v1/observations.json',sources:['longmemeval-sequential-v1/freeze.json','longmemeval-sequential-v1/live/result.json'],freeze:'longmemeval-sequential-v1/freeze.json'},
 {id:'personamem-admission',hypotheses:'../hypotheses.json',experiment:'../experiments.json',observations:'personamem/observations.json',sources:['personamem/selection.json','personamem/context-admission.json','personamem/adapter.mjs','personamem/preflight.mjs','personamem/SUCCESSOR-RESEARCH.md']}
];
function materialize(config){
 const os=read(resolve(ex,config.observations)).records,o=os.find(x=>x.schema_version==='are.hypothesis-observation/v1'),d=os.find(x=>x.schema_version==='are.learning-decision/v1');
 const hs=read(resolve(ex,config.hypotheses)).records,h=hs.find(x=>x.record_id===o.hypothesis_ref),es=read(resolve(ex,config.experiment)),e=(es.records??[es]).find(x=>x.record_id===d.experiment_ref);
 assert.ok(h&&e&&o&&d);const records=[h,e,o,d];
 const bindings=[config.hypotheses,config.experiment,config.observations,...config.sources].map(x=>binding(resolve(ex,x)));
 if(config.freeze){for(const b of read(resolve(ex,config.freeze)).bindings){assert.equal(sha(resolve(root,b.path)),b.sha256,'historical freeze drift: '+b.path);if(!bindings.some(x=>x.path===b.path))bindings.push(b);}}
 const implementation={schema_version:'are.local-implementation-evidence/v1',source_bindings:bindings,posture:config.freeze?'historical-frozen-run-sources':'measured-admission-sources-no-generations',authority_effect:'none'};implementation.record_id='implementation-evidence:'+digest(implementation);
 const question={schema_version:'are.local-research-question/v1',question:d.next_action,source_observation_ref:o.record_id,authority_effect:'none'};question.record_id='research-question:'+digest(question);
 const body={schema_version:'are.local-source-bound-research-registration/v1',experiment_id:config.id,records,implementation,question,record_sources:{hypotheses:relative(root,resolve(ex,config.hypotheses)),experiment:relative(root,resolve(ex,config.experiment)),observations:relative(root,resolve(ex,config.observations))},evidence_bindings:bindings,claim_ceiling:'Retrospective source-bound registration; does not change preregistration, run completion or authority.',authority_effect:'none'};
 return {...body,registration_digest:digest(body)};
}
function verifyRegistration(r){try{
 const {registration_digest,...body}=r;assert.equal(registration_digest,digest(body));assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));
 if(r.schema_version==='are.local-contract-research-registration/v1'){
  assert.equal(r.registration_digest,prior.registration_digest);assert.equal(sha(resolve(root,r.evidence_binding.path)),r.evidence_binding.sha256);assert.equal(canonicalJson(r),canonicalJson(prior));return true;
 }
 assert.equal(r.schema_version,'are.local-source-bound-research-registration/v1');const config=configs.find(x=>x.id===r.experiment_id);assert.ok(config);
 const expectedSources={hypotheses:relative(root,resolve(ex,config.hypotheses)),experiment:relative(root,resolve(ex,config.experiment)),observations:relative(root,resolve(ex,config.observations))};assert.deepEqual(r.record_sources,expectedSources);
 assert.ok(r.evidence_bindings.length>=config.sources.length+3);for(const b of r.evidence_bindings)assert.equal(sha(resolve(root,b.path)),b.sha256);
 for(const path of [...Object.values(expectedSources),...config.sources.map(x=>relative(root,resolve(ex,x)))])assert.ok(r.evidence_bindings.some(b=>b.path===path));
 if(config.freeze)for(const b of read(resolve(ex,config.freeze)).bindings)assert.ok(r.evidence_bindings.some(x=>x.path===b.path&&x.sha256===b.sha256));
 assert.deepEqual(r.implementation.source_bindings,r.evidence_bindings);const {record_id:implementationID,...impl}=r.implementation;assert.equal(implementationID,'implementation-evidence:'+digest(impl));
 const [h,e,o,d]=r.records;assert.deepEqual([h,e,o,d].map(x=>x.schema_version),['are.research-hypothesis/v1','are.research-experiment/v1','are.hypothesis-observation/v1','are.learning-decision/v1']);
 const hs=read(resolve(root,r.record_sources.hypotheses)).records,es=read(resolve(root,r.record_sources.experiment)),os=read(resolve(root,r.record_sources.observations)).records;
 assert.deepEqual(h,hs.find(x=>x.record_id===h.record_id));assert.deepEqual(e,(es.records??[es]).find(x=>x.record_id===e.record_id));assert.deepEqual(o,os.find(x=>x.record_id===o.record_id));assert.deepEqual(d,os.find(x=>x.record_id===d.record_id));
 assert.equal(e.hypothesis_ref,h.record_id);assert.equal(o.hypothesis_ref,h.record_id);assert.equal(d.hypothesis_ref,h.record_id);assert.equal(d.experiment_ref,e.record_id);assert.ok(d.observation_refs.includes(o.record_id));
 assert.equal(d.disposition,'inconclusive');assert.equal(o.observation_kind,'inconclusive');
 assert.equal(sha(resolve(root,o.source_result_ref)),o.source_result_digest,'observation result binding');assert.ok(r.evidence_bindings.some(b=>b.path===o.source_result_ref));
 const {record_id:questionID,...question}=r.question;assert.equal(questionID,'research-question:'+digest(question));assert.equal(question.source_observation_ref,o.record_id);assert.equal(question.question,d.next_action);assert.equal(question.authority_effect,'none');
 return true;
 }catch{return false;}}
const registrations=[prior,...configs.map(materialize)];for(const r of registrations)assert.equal(verifyRegistration(r),true,r.experiment_id);
const lineage=registrations.slice(1).map(r=>({question_ref:prior.question.record_id,hypothesis_ref:r.records[0].record_id,source_ref:relative(root,resolve(dir,'D07-SUCCESSOR.md'))+'#'+r.experiment_id}));
const dag=materializeResearchDag({registrations,lineage,verify_registration:verifyRegistration});assert.equal(verifyResearchDag(dag,registrations,verifyRegistration),true);
// Negative evidence ensures the seam does more than accept supplied hashes.
for(const mutate of [r=>r.evidence_bindings[0].sha256='0'.repeat(64),r=>r.records[2]=registrations[2].records[2],r=>r.question.question='unsupported successor']){
 const altered=structuredClone(registrations[1]);mutate(altered);const {registration_digest,...b}=altered;altered.registration_digest=digest(b);assert.equal(verifyRegistration(altered),false);
}
emit('d07-registrations-v1.json',{registrations,authority_effect:'none'});emit('research-dag-v1.json',dag);emit('d07-validation-v1.json',{ok:true,native_dag_verified:true,negative_cases_rejected:3,registrations:registrations.map(x=>({experiment_id:x.experiment_id,registration_digest:x.registration_digest})),nodes:dag.nodes.length,edges:dag.edges.length,dag_digest:dag.dag_digest,a_v2_quality_observation_added:false,authority_effect:'none'});
// Preserve historical D08 snapshots; rebind their checked events to the new D07 source.
execFileSync(process.execPath,[resolve(dir,'reconcile.mjs'),'--check'],{stdio:'pipe'});
const historicalPlan=read(resolve(dir,'successor-work-plan.json')),historicalState=read(resolve(dir,'successor-work-state.json'));
const workPlan=materializeResearchPlan({research_dag:dag,registrations,tasks:historicalPlan.tasks.map(t=>({...t,validator_ref:relative(root,resolve(dir,'project-dag-v1.mjs'))})),verify_registration:verifyRegistration});
const verifyEvidence=b=>{const task=historicalState.tasks.find(x=>x.task_id===b.task_id),proof=task?.evidence.find(x=>x.criterion_id===b.criterion_id);assert.equal(task?.state,'completed');assert.ok(proof);assert.equal(b.plan_digest,workPlan.plan_digest);assert.equal(b.validator_ref,relative(root,resolve(dir,'project-dag-v1.mjs')));assert.equal(b.artifact_ref,proof.artifact_ref);assert.equal(b.artifact_digest,proof.artifact_digest);assert.equal(sha(resolve(root,b.artifact_ref)),b.artifact_digest);return {ok:true,binding:b};};
const workState=replayResearchWork({plan:workPlan,registrations,events:historicalState.events,verify_evidence:verifyEvidence,verify_registration:verifyRegistration});
emit('d07-bound-work-plan-v1.json',workPlan);emit('d07-bound-work-state-v1.json',workState);emit('d08-rebinding-v1.json',{ok:true,historical_plan_digest:historicalPlan.plan_digest,historical_state_digest:historicalState.state_digest,verifier_binding:binding(resolve(dir,'reconcile.mjs')),historical_state_binding:binding(resolve(dir,'successor-work-state.json')),new_plan_digest:workPlan.plan_digest,new_state_digest:workState.state_digest,authority_effect:'none'});
console.log(JSON.stringify({ok:true,nodes:dag.nodes.length,edges:dag.edges.length,frontier:dag.research_frontier.length}));
