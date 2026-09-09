import {readFileSync, readdirSync, lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchHypothesis} from '../research-learning-owned/runtime/evolution-runtime/index.mjs';
import {canonicalJson,digest} from '../research-learning-owned/runtime/request-intent-runtime/src/canonical.mjs';
import {transitionResearchWork,replayResearchWork} from '../research-learning-owned/runtime/evolution-runtime/src/research-work.mjs';
import {buildProgress as inspectProgress,verifyReport} from '../research-learning-owned/latency-inspect-001/inspect.mjs';
import {verifySaved as verifyPredecessor} from '../research-learning-owned/verify.mjs';
import {loadInput,materializeRegistration,verifyRegistration,sha,profile} from '../research-learning-owned/adapter.mjs';
import {renderHtml} from '../research-learning-owned/view.mjs';

const read = name => readFileSync(new URL(name,import.meta.url),'utf8');
const check = (ok,why) => {if(!ok)throw Error('latency-hypotheses.'+why);};
const same = (a,b) => canonicalJson(a)===canonicalJson(b);
const predecessorSha='8c0c8060ffc3fdcd3fc20c029e8507277200b89f1c2ca5cea184b9b17fb68b59';
const reportDigest='911cef5f2fe6c655cb7ce7b65cfcf8d211b919b44fd09a5aee3954c226fe2cf2';
export const loadDefinitions=()=>JSON.parse(read('./hypotheses.json'));
const strings = xs => Array.isArray(xs)&&xs.length>0&&xs.every(x=>typeof x==='string'&&x.trim())&&new Set(xs).size===xs.length;
export function validateDefinitions(items,report) {
  check(Array.isArray(items)&&items.length===4,'four-alternatives-required');
  const keys=['id','boundaries','statement','mechanism','falsifier','metrics','baseline','treatment','prediction','controls','required_spans','confounders'];
  const ids=new Set(), covered=new Set(), boundaries=new Set(report.boundaries.map(b=>b.id));
  for(const h of items){
    check(h&&same(Object.keys(h).sort(),[...keys].sort()),'definition-fields');
    check(['id','statement','mechanism','falsifier','baseline','treatment','prediction'].every(k=>typeof h[k]==='string'&&h[k].trim()),'text-required');
    check(!ids.has(h.id),'duplicate-id');ids.add(h.id);
    check(['boundaries','metrics','controls','required_spans','confounders'].every(k=>strings(h[k])),'evidence-requirements');
    for(const b of h.boundaries){check(boundaries.has(b),'unknown-boundary');covered.add(b);}
  }
  check(same([...covered].sort(),[...boundaries].sort()),'boundary-coverage');
  return true;
}
export function deriveBundle(items=loadDefinitions(),report=inspectProgress().report){
  check(report.report_digest===reportDigest&&verifyReport(report),'selected-report-drift');
  validateDefinitions(items,report);
  const protocol=JSON.parse(read('../research-learning-owned/runtime/benchmark/protocol.json'));
  const records=items.map(h=>createResearchHypothesis({hypothesis_key:h.id,statement:h.statement,mechanism:h.mechanism,
    falsifier:h.falsifier,scope:'Workspace latency; prospective untested alternative, not a causal conclusion.',metrics:h.metrics,
    provenance_refs:['workspace-timing-report:'+report.report_digest],
    experiment_template:{research_question:h.statement,baseline_ref:'unbound-design:baseline:'+h.id,treatment_ref:'unbound-design:treatment:'+h.id,
      dataset_refs:['unbound-design:matched-cold-session-fixture'],required_repetitions:protocol.qualifiedSessions,
      success_criteria:{prediction:h.prediction,existing_budgets_unchanged:true,semantic_equivalence_required:true,
        exact_candidate_binding_required:true,qualified_comparison_required:true},
      stop_conditions:['Stop on semantic or smoke failure; retain failure evidence.','Reject contaminated sessions; retain their receipts.','Stop at the unchanged maximum attempt count; insufficient qualified population remains not_evaluable.']}}));
  const material={schema_version:'workspace.controlled-latency-hypotheses/v1',task_id:'latency.hypothesize',
    predecessor_candidate_sha256:predecessorSha,timing_report_digest:report.report_digest,
    ontology:{ontology_id:'are.research-learning',sha256:profile.ontology.sha256,
      selectors:['definitions:ARE-RL-D01','definitions:ARE-RL-D03','definitions:ARE-RL-D08','relations:experiment-tests-hypothesis']},
    definitions:items,records,protocol,budget_sha256:profile.budget.sha256,
    comparison_requirements:{order:'Predeclare balanced baseline/treatment order before execution.',
      population:'40 qualified independent cold desktop sessions per arm; at most 60 attempts per arm.',
      estimator:protocol.estimator,clock:'Correlate IDs across processes; subtract only process-local monotonic timestamps.',
      identity:['candidate source digest','binary digest','budget digest','protocol digest','fixture digest','host receipts','raw logs'],
      prerequisites:['Exact instrumented baseline and treatment bytes','Instrumentation overhead check','Criterion and effect-size thresholds frozen before runs','Semantic-equivalence checks'],
      missing_prerequisites_status:'not_evaluable'},
    evidence_kind:'source-grounded-hypothesis-prototypes',causal_conclusion:'not_evaluable',observations:[],
    registration_status:'not-registered',authority_effect:'none',open_questions_ref:'README.md#open-questions'};
  return {...material,bundle_digest:digest(material)};
}
export function verifyBundle(bundle){try{return same(bundle,deriveBundle());}catch{return false;}}
export function buildProgress(bundle=deriveBundle()){
  const predecessor=verifyPredecessor();
  check(predecessor.ok&&predecessor.candidate_sha256===predecessorSha,'predecessor-drift');
  check(verifyBundle(bundle),'bundle-invalid');
  const prior=inspectProgress(),plan=prior.view.plan,registrations=[materializeRegistration(loadInput())];
  const verify_evidence=b=>{
    if(b.task_id!=='latency.hypothesize')return prior.verify_evidence(b);
    return {ok:b.plan_digest===plan.plan_digest&&b.validator_ref==='workspace.research-evidence/v1'
      &&b.criterion_id==='controlled-hypotheses'&&b.artifact_ref==='workspace-latency-hypotheses:'+bundle.bundle_digest
      &&b.artifact_digest===digest(bundle)&&verifyBundle(bundle),binding:b};
  };
  const args={plan,registrations,verify_registration:verifyRegistration,verify_evidence};
  const running=transitionResearchWork({...args,state:prior.view.state,expected_state_digest:prior.view.state.state_digest,
    event:{event_id:'latency-hypotheses-start-001',task_id:'latency.hypothesize',action:'start'}});
  const state=transitionResearchWork({...args,state:running,expected_state_digest:running.state_digest,
    event:{event_id:'latency-hypotheses-complete-001',task_id:'latency.hypothesize',action:'complete',evidence:[{
      criterion_id:'controlled-hypotheses',artifact_ref:'workspace-latency-hypotheses:'+bundle.bundle_digest,artifact_digest:digest(bundle)}]}});
  check(same(replayResearchWork({...args,events:state.events}),state),'replay');
  // Prospective records cannot be inserted as historical benchmark registrations:
  // those require real observations. Keep the historical DAG and a separate projection.
  const source='timing-report:'+bundle.timing_report_digest;
  const nodes=[{id:source,kind:'source-inspection'},...bundle.records.map(r=>({id:r.record_id,kind:'untested-hypothesis'}))];
  const edges=bundle.records.map(r=>({from:source,to:r.record_id,kind:'motivates-alternative',source_digest:bundle.bundle_digest}));
  const {view_digest:previous_view_digest,...previous}=prior.view;
  const material={...previous,state,previous_view_digest,hypothesis_bundle:bundle,
    hypothesis_projection:{nodes,edges,dependency_layers:[[source],bundle.records.map(r=>r.record_id)],authority_effect:'none'}};
  const view={...material,view_digest:digest(material)};
  const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const section='<h2>Prospective latency alternatives</h2><p>Timing inspection → four untested hypotheses. No experiment registered or executed.</p>'+bundle.definitions.map(h=>
    '<article><h3>'+escape(h.id)+'</h3><p>'+escape(h.statement)+'</p><p>Mechanism: '+escape(h.mechanism)+'</p><p>Falsifier: '+escape(h.falsifier)+'</p><p>Controlled change: '+escape(h.treatment)+'</p><p>Required spans: '+escape(h.required_spans.join('; '))+'</p></article>').join('');
  return {bundle,view,verify_evidence,html:renderHtml(view).replace('<h2>Derived work state</h2>',section+'<h2>Derived work state</h2>')};
}
export function verifySaved(){
  const candidate=JSON.parse(read('./candidate.json'));
  check(candidate.schema_version==='workspace.latency-hypothesis-candidate/v1'&&candidate.authority_effect==='none'
    &&candidate.approval==='not-requested'&&candidate.candidate_id==='WLH-001','candidate-fields');
  const paths=readdirSync(new URL('./',import.meta.url)).filter(p=>!['candidate.json','EVIDENCE.json'].includes(p)).sort();
  check(same(candidate.sources.map(s=>s.path),paths),'candidate-coverage');
  for(const s of candidate.sources){check(lstatSync(new URL(s.path,import.meta.url)).isFile()&&!lstatSync(new URL(s.path,import.meta.url)).isSymbolicLink(),'source-not-regular');check(sha(read(s.path))===s.sha256,'source-drift:'+s.path);}
  const {bundle,view,html}=buildProgress();
  for(const [path,value] of [['bundle.json',bundle],['progress.json',view]])check(read(path)===JSON.stringify(value,null,2)+'\n','saved-drift:'+path);
  check(read('view.html')===html,'saved-html-drift');
  return {ok:true,candidate_sha256:sha(read('./candidate.json')),bundle_digest:bundle.bundle_digest,frontier:view.state.frontier,authority_effect:'none'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  check(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check-saved','unsupported-argument');
  console.log(JSON.stringify(process.argv[2]?verifySaved():buildProgress().bundle,null,2));
}
