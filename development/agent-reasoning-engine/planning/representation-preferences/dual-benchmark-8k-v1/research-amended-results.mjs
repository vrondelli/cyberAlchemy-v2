// Additive retrospective native records; requires real audited results. No provider calls.
// Open questions: AMENDMENT.md#open-questions.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {materializeResearchDag} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {digest} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir),check=process.argv.includes('--check');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8')),local=p=>read(prefix+'/'+p),sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex'),bind=p=>({path:p,sha256:sha(p)});
const emit=(name,x)=>{const text=JSON.stringify(x,null,2)+'\n',path=join(dir,name);if(check)assert.equal(readFileSync(path,'utf8'),text,name);else writeFileSync(path,text,{flag:'wx'});};
const bindings=bs=>{for(const b of bs)assert.equal(sha(b.path),b.sha256,b.path);};
const result=local('AMENDED-RESULTS.json'),audit=local('AMENDED-POSTRUN-AUDIT.json');assert.equal(audit.ok,true);assert.deepEqual(audit.findings,[]);bindings(audit.source_bindings);
execFileSync(process.execPath,[join(dir,'audit-amended.mjs'),'--check'],{maxBuffer:8*1024*1024});
const original=local('freeze.json'),amendment=local('AMENDMENT-FREEZE.json');bindings([...original.bindings,...original.external_bindings,...amendment.bindings]);assert.equal(amendment.original_freeze_sha256,sha(prefix+'/freeze.json'));
const zero=local('live/stage1/pairs/contextbench-4/run/result.json');assert.equal(zero.usage.total_tokens,0);assert.equal(zero.unknown_usage,false);for(const a of Object.values(zero.arms))assert.equal(a.usage.model_calls,0);
const hypotheses=local('hypotheses.json'),experiments=local('experiments.json').records,registrations=[];
for(const benchmark of ['longmemeval','contextbench']){
 const selection=hypotheses.branch_selections.find(x=>x.benchmark===benchmark),h=hypotheses.records.find(x=>x.record_id===selection.selected),e=experiments.find(x=>x.hypothesis_ref===h.record_id),native=result.benchmarks[benchmark];
 assert.ok(h&&e&&typeof native.passed==='boolean');assert.equal(native.planned_per_arm,8);assert.equal(native.rows.length,8);
 const evidence=[prefix+'/AMENDED-RESULTS.json',prefix+'/AMENDED-POSTRUN-AUDIT.json',prefix+'/AMENDMENT-FREEZE.json',prefix+'/RESULTS.json',prefix+'/'+benchmark+'/observations.json'];
 const o=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:prefix+'/AMENDED-RESULTS.json',source_result_digest:digest(result),observation_kind:native.passed?'supporting':'counterevidence',phase:'experiment',claim:native.conclusion+' This is the explicitly amended development comparison; original infrastructure failure and all observed outcomes remain preserved.',evaluator_id:benchmark==='contextbench'?'pinned-native-contextbench-scorer':'blind-same-model-native-longmemeval-rubric',evidence_refs:evidence,limitations:['Prospective exception only for original CB4 zero-model-exposure checkout failure; not a clean original preregistered success.','Four exposed development tasks per benchmark, two planned repetitions; not held-out confirmation.','Only one LongMemEval source history exceeds8000tokens; same-model rubric judgments may be biased.','ContextBench source selection does not establish code-repair correctness.']});
 const d=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:e.record_id,observation_refs:[o.record_id],disposition:native.passed?'collect-replications':'revise-hypothesis',next_action:native.passed?'Preregister untouched long-history confirmation; preserve original and amended evidence separately.':'Investigate the measured failure and preregister a revised mechanism without changing the15% or quality criteria.',reason_codes:[native.passed?'amended-development-criteria-met':'amended-development-criteria-not-met','original-zero-exposure-exception-preserved'],supporting_count:native.passed?1:0,counterevidence_count:native.passed?0:1});
 assert.ok([h,e,o,d].every(x=>verifyEvolutionRecord(x).ok));
 emit(benchmark+'/amended-observations.json',{records:[o,d],original_observations_ref:prefix+'/'+benchmark+'/observations.json',amendment_ref:prefix+'/AMENDMENT-FREEZE.json',authority_effect:'none',open_questions_ref:'../AMENDMENT.md#open-questions'});
 const implementation={record_id:'implementation:'+digest({original:original.bindings,amendment:amendment.bindings}),source_bindings:[...original.bindings,...amendment.bindings]};
 const question={record_id:'question:'+digest({benchmark,amended_next:d.next_action}),question:d.next_action};
 const body={experiment_id:'dual8k-amended-'+benchmark,records:[h,e,o,d],implementation,question,evidence_bindings:[...evidence.map(bind),bind(prefix+'/'+benchmark+'/amended-observations.json')]};registrations.push({...body,registration_digest:digest(body)});
}
const verify=r=>{try{const{registration_digest,...body}=r;assert.equal(registration_digest,digest(body));bindings([...r.evidence_bindings,...r.implementation.source_bindings]);assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));assert.equal(r.records[2].source_result_digest,digest(result));assert.equal(r.records[1].hypothesis_ref,r.records[0].record_id);assert.equal(r.records[3].experiment_ref,r.records[1].record_id);return true;}catch{return false;}};
const dag=materializeResearchDag({registrations,verify_registration:verify});emit('amended-registrations.json',registrations);emit('amended-research-dag.json',dag);
const tasks=[['AF',[],'Freeze zero-exposure exception and repaired source'],['FX',['AF'],'First exposure of original CB4'],['AG',['FX'],'Apply unchanged amended scaling health gate'],['AS2',['AG'],'Second-stage execution or explicit non-admission'],['AJ',['AS2'],'Reconcile fixed denominators, all costs and scoring'],['AD',['AJ'],'Independently review amended observation and successor']];
const plan=materializeResearchPlan({research_dag:dag,registrations,verify_registration:verify,tasks:tasks.map(([task_id,depends_on,title])=>({task_id,depends_on,title,owner:'coordinator',lane:'product-construction',stage:'prototype',question_ref:registrations[0].question.record_id,completion_criteria:['Inspect exact evidence for '+title],validator_ref:prefix+'/AMENDED-COMPLETION-AUDIT.md'}))});emit('amended-research-work-plan.json',plan);
console.log(JSON.stringify({verified:true,observations:2,decisions:2,existing_hypotheses_and_experiments_reused:true,retrospective:true,authority_effect:'none'}));
