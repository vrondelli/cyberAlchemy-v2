import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createEvolutionRuntime, createResearchHypothesis, createResearchExperiment, createHypothesisObservation,
  createLearningDecision, verifyEvolutionRecord, verifyResearchContinuity} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {materializeResearchDag, verifyResearchDag} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan, replayResearchWork, transitionResearchWork} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {canonicalJson, digest} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
assert.ok(process.argv.slice(2).every(arg=>arg==='--check'),'unsupported argument');
const dir=import.meta.dirname, root=resolve(dir,'../../../../..'), rel=p=>relative(root,resolve(dir,p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(resolve(dir,p),'utf8'));
const binding=p=>({path:rel(p),sha256:sha(readFileSync(resolve(dir,p)))});
const emit=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n'; if(process.argv.includes('--check')) assert.equal(readFileSync(resolve(dir,name),'utf8'),bytes,`artifact drift: ${name}`);else writeFileSync(resolve(dir,name),bytes);};
const selection=json('tasks.json'), prior=json('../evidence/result.json');
assert.equal(selection.tasks.length,24);assert.equal(new Set(selection.tasks.map(t=>t.task_id)).size,24);
for(const name of ['PrefEval','BenchPreS','LongMemEval']) for(const split of ['development','reserved'])
  assert.equal(selection.tasks.filter(t=>t.benchmark===name&&t.split===split).length,4);
for(const t of selection.tasks){assert.match(t.record_sha256,/^[a-f0-9]{64}$/);assert.match(t.revision,/^[a-f0-9]{40}$/);assert.ok(t.execution_gate);}
const policyPath=resolve(root,'agent-reasoning-engine/research/continuity-policy-v4.json'), policy=JSON.parse(readFileSync(policyPath));
const continuityRef=rel('continuity.json');
const scope='GLM-5.3-flash proposed 8K pilot; preserve ContextBench milestone. Preference benchmark transfer is unproven.';
const metrics=['native-quality','misapplication','completion','total-model-input-plus-output-tokens'];
const template={research_question:'Does scoped retained preference state improve appropriate outcomes at equal model-token budgets?',baseline_ref:'same-model-history-only',treatment_ref:'same-model-scoped-ARE-state',dataset_refs:[rel('tasks.json')],required_repetitions:2,
 success_criteria:{quality_no_worse:true,completion_no_worse:true,misapplication_no_worse:true,at_least_one_quality_gain:true,max_total_tokens:614400},stop_conditions:['No gold leakage','No unknown usage','No unresolved rights at dispatch','No silent retries or task drops','Freeze exact adapter and evaluator before dispatch']};
const defs=[['H1','Scoped retained state improves relevant preference and memory outcomes without increasing misapplication.','Bind evidence-derived lessons to applicability scope and current requests.','No native gain, worse completion, more misapplication or budget breach.'],
 ['H0','Available history and explicit manual feedback are sufficient; added state has no benefit.','The model recovers preferences directly; projection duplicates useful evidence.','A repeated paired gain survives fresh reserved evaluation within budget.'],
 ['H2','Broad automatic reuse increases misapplication; scope selection is the dominant missing mechanism.','Unconditional persistent preference application leaks into unsuitable requests.','Scoped and unconditional variants show the same error pattern in a separately frozen diagnostic.']];
const hypotheses=defs.map(([hypothesis_key,statement,mechanism,falsifier])=>createResearchHypothesis({hypothesis_key,statement,mechanism,falsifier,scope,metrics,
 provenance_refs:[continuityRef,rel('../RESULTS.md'),rel('tasks.json')],continuity_contract:policy.required_hypothesis_continuity_values,experiment_template:hypothesis_key==='H2'?{...template,baseline_ref:'unconditional-state-reuse-future-diagnostic',stop_conditions:[...template.stop_conditions,'Not in selected pilot schedule; requires successor freeze.']}:template}));
const hypothesesDoc={records:hypotheses,selection:{selected:hypotheses[0].record_id,alternatives:hypotheses.slice(1).map(h=>h.record_id)},authority_effect:'none'};
emit('hypotheses.json',hypothesesDoc);
// Actual predecessor observation: local contracts passed, semantic benefit unknown.
// Use D07's documented verifier seam for this exact local conformance evidence.
const local=createResearchHypothesis({hypothesis_key:'representation-contract-predecessor',statement:'The implemented preference lifecycle conforms to its local contract.',
 mechanism:'Persist explicit consent and typed applicability in the existing ledger.',falsifier:'A selected conformance test fails.',scope:'Local scripted contract tests; no external benchmark claim.',metrics:['local-test-pass-count'],
 provenance_refs:[rel('../evidence/result.json')],experiment_template:{research_question:'Does the preference lifecycle satisfy the local contract?',baseline_ref:'before-explicit-confirmation',treatment_ref:'after-explicit-confirmation',required_repetitions:1}});
const experiment=createResearchExperiment({...local.experiment_template,hypothesis_ref:local.record_id,metrics:local.metrics,observation_refs:[]});
const observation=createHypothesisObservation({hypothesis_ref:local.record_id,source_result_ref:rel('../evidence/result.json'),source_result_digest:sha(readFileSync(resolve(dir,'../evidence/result.json'))),
 observation_kind:'inconclusive',phase:'experiment',claim:`${prior.tests.passed} local contract tests passed; native preference quality and token benefit were not measured.`,evaluator_id:'node:test-local-contracts',evidence_refs:[rel('../evidence/result.json')],limitations:['Scripted providers, not live model evidence.','Semantic transfer remains unknown.']});
const decision=createLearningDecision({hypothesis_ref:local.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,disposition:'inconclusive',reason_codes:['external-transfer-not-measured'],next_action:'Prepare separately frozen native benchmark pilot.'});
const implementation={schema_version:'are.local-implementation-evidence/v1',source_bindings:prior.source_bindings,authority_effect:'none'};implementation.record_id=`implementation-evidence:${digest(implementation)}`;
const question={schema_version:'are.local-research-question/v1',question:template.research_question,source_observation_ref:observation.record_id,authority_effect:'none'};question.record_id=`research-question:${digest(question)}`;
const registration={schema_version:'are.local-contract-research-registration/v1',experiment_id:'representation-preference-contracts-v1',records:[local,experiment,observation,decision],implementation,question,
 evidence_binding:binding('../evidence/result.json'),authority_effect:'none'};registration.registration_digest=digest(registration);
function verifyRegistration(r){return canonicalJson(r)===canonicalJson(registration)&&r.records.every(x=>verifyEvolutionRecord(x).ok)
 &&sha(readFileSync(resolve(root,r.evidence_binding.path)))===r.evidence_binding.sha256;}
const registrations=[registration], dag=materializeResearchDag({registrations,verify_registration:verifyRegistration});
assert.equal(verifyResearchDag(dag,registrations,verifyRegistration),true);
const profile=JSON.parse(readFileSync(resolve(root,'implementation/agent-reasoning-engine/packages/evolution-runtime/profiles/default-v1.json')));
const runtime=createEvolutionRuntime({profile});
for(const record of [...registration.records,...hypotheses]) assert.equal(runtime.append(record).ok,true);
const experiments=['PrefEval','BenchPreS','LongMemEval'].map(name=>createResearchExperiment({...template,research_question:`${name}: ${template.research_question}`,hypothesis_ref:hypotheses[0].record_id,metrics,dataset_refs:selection.tasks.filter(t=>t.benchmark===name&&t.split==='development').map(t=>t.task_id),observation_refs:[]}));
for(const r of experiments)assert.equal(runtime.append(r).ok,true);
const schedule=[];
for(const t of selection.tasks.filter(t=>t.split==='development')) for(let repetition=1;repetition<=2;repetition++)
 for(const arm of repetition===1?['control','scoped-ARE']:['scoped-ARE','control']) schedule.push({ordinal:schedule.length+1,task_id:t.task_id,benchmark:t.benchmark,repetition,arm,
  max_input_tokens:7168,max_output_tokens:1024,dispatch_status:'NOT_READY',execution_gate:t.execution_gate});
emit('schedule.json',{status:'PLANNED_NOT_DISPATCHED',model_alias:'GLM-5.3-flash',provider_model_id:null,context_cap:8192,
  maximum_total_model_tokens:614400,maximum_judge_calls:48,schedule,authority_effect:'none'});
const cycle=runtime.sealCycle({status:'prepared-not-dispatched',selected_task_manifest:rel('tasks.json')});assert.equal(cycle.ok,true);
emit('evolution-records.json',{status:'PREPARED_NOT_RUN',records:runtime.snapshot(),cycle:cycle.cycle,authority_effect:'none'});
emit('predecessor-registration.json',registration);emit('research-dag.json',dag);
const tasks=[];
function task(id,title,deps=[],lane='product-construction'){tasks.push({task_id:id,title,owner:lane==='operational-support'?'Keld product owner':'ARE research implementer',lane,stage:id,question_ref:question.record_id,depends_on:deps,completion_criteria:[`${id}:evidence`],validator_ref:rel('build.mjs')});}
task('selection','Verify pinned identities, partitions and provenance');
for(const name of ['prefeval','benchpres','longmemeval']){
 task(`${name}.adapter`,'Bind original input and evaluator-only gold; measure unchanged detector coverage',['selection']);
 task(`${name}.instrument`,'Pin evaluator, model, token accounting and independent score checks',[`${name}.adapter`]);
 const deps=[`${name}.instrument`];
 if(name!=='longmemeval'){task(`${name}.rights`,'Resolve noncommercial license applicability or obtain permission',[],'operational-support');deps.push(`${name}.rights`);}
 task(`${name}.freeze`,'Review continuity and exact runnable protocol',deps);
 task(`${name}.run`,'Execute counterbalanced paired development tasks',[`${name}.freeze`]);
 task(`${name}.review`,'Bind outputs, native scores, observations and reviewed learning decision',[`${name}.run`]);
 task(`${name}.reserved`,'Create successor freeze for untouched reserved tasks if justified',[`${name}.review`]);
}
const plan=materializeResearchPlan({research_dag:dag,registrations,tasks,verify_registration:verifyRegistration});
let state=replayResearchWork({plan,registrations,verify_registration:verifyRegistration});
const selectedEvidence={criterion_id:'selection:evidence',artifact_ref:rel('tasks.json'),artifact_digest:digest(selection)};
const evidenceVerifier=e=>({ok:e.criterion_id===selectedEvidence.criterion_id&&e.artifact_ref===selectedEvidence.artifact_ref&&e.artifact_digest===digest(JSON.parse(readFileSync(resolve(root,e.artifact_ref)))),binding:e});
for(const event of [{event_id:'selection-start',task_id:'selection',action:'start'},{event_id:'selection-complete',task_id:'selection',action:'complete',evidence:[selectedEvidence]}])
 state=transitionResearchWork({plan,registrations,state,event,expected_state_digest:state.state_digest,verify_evidence:evidenceVerifier,verify_registration:verifyRegistration});
emit('work-plan.json',plan);emit('work-state.json',state);
const continuity={schema_version:'are.research-continuity-binding/v1',binding_ref:continuityRef,policy_ref:policy.policy_ref,policy_sha256:sha(readFileSync(policyPath)),
 objective_refs:Object.values(policy.objective_levels).flatMap(l=>l.refs),objective_contribution:'Test transfer of useful retained state to preferences and memory without replacing GLM ContextBench work.',
 method_refs:policy.method_refs,method_definitions:policy.required_method_definitions,predecessor_refs:[binding('../RESULTS.md'),binding('../evidence/result.json')],
 question_and_hypotheses:{question:template.research_question,records_ref:rel('hypotheses.json'),selected:hypotheses[0].record_id,alternatives:hypotheses.slice(1).map(h=>h.record_id)},
 experiment_and_task_refs:{plan_ref:rel('PLAN.md'),tasks:tasks.map(t=>t.task_id),unresolved:'Adapter, model/evaluator identity, rights on two branches, and live protocol freeze remain open.'},
 measurement_mapping:{native:'Keep each benchmark metric separate; pilot counts do not establish official scores.',retention:'LongMemEval oracle evaluates supplied relevant evidence, not long-history retrieval.',integrity:'Pin sources; isolate gold, state, arms and splits.',tokens:'Count cumulative input plus output across generator, extractor and judge; no byte proxy.',transfer:'Small benchmark subsets test bounded transfer; format offer utility remains separate.'},
 acceptance_and_scope:{acceptance:policy.acceptance_ref,SWE_bench_in_active_scope:false,window_order:'Preserve GLM small-window chapter and existing larger-window ContextBench order; independent preference pilot.',pilot_protocol:rel('PLAN.md')},
 retained_counterevidence:['105 contract tests do not establish semantic benefit.','Narrow lexical detector may abstain on every external task.','Oracle history cannot prove useful retrieval or provider compaction behavior.','Scope and replacement bugs were fixed in prior construction; preserve their tests.'],
 successor_rule:'Invalid instrumentation returns to construction; valid failure revises hypothesis; valid improvement requires fresh reserved freeze.',
 continuity_review:{reviewer:'executing-agent self-review; independent live-freeze review pending',reviewed_artifacts:[binding('PLAN.md'),binding('hypotheses.json')],
 criterion_verdicts:Object.fromEntries(policy.required_review_criteria.map(c=>[c,'Candidate selection checked; live dispatch remains blocked pending exact protocol dependencies.'])),passed_for_candidate_plan:true,run_ready:false},authority_effect:'none'};
emit('continuity.json',continuity);
const final=verifyResearchContinuity({binding:continuity,policy,hypotheses:hypothesesDoc,phase:'final',root});
const freeze=verifyResearchContinuity({binding:continuity,policy,hypotheses:hypothesesDoc,phase:'freeze',root});
emit('validation.json',{candidate_continuity:final,dispatch_freeze:freeze,task_count:24,work_task_count:tasks.length,frontier:state.frontier,records_verified:runtime.snapshot().every(r=>verifyEvolutionRecord(r).ok),authority_effect:'none'});
assert.equal(final.ok,true,JSON.stringify(final));assert.equal(freeze.ok,false,'unready study cannot freeze');
console.log(JSON.stringify({status:'PREPARED_NOT_RUN',tasks:24,continuity:final.ok,freeze:freeze.ok,frontier:state.frontier}));
