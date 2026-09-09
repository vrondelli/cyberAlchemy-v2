// Independent checks of selected context and physical receipts. Open questions: README.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {createResearchExperiment,createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
import {sha,visibleFacts,answerFromContext} from './probe.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),save=(p,v)=>writeFileSync(new URL(p,root),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const stable=value=>JSON.stringify(value,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export function inspect(r){
 assert.deepEqual(r.receipts,r.agent_result.receipts);assert.equal(r.captures.length,r.receipts.length);
 for(let i=0;i<r.captures.length;i++){const c=r.captures[i],p=r.receipts[i];assert.equal(sha(c.raw),c.sha256);assert.equal(c.sha256,p.request_sha256);assert.equal(c.kind,p.kind);assert.equal(p.status,200);}
 const models=r.captures.filter(c=>c.kind==='model');assert.equal(r.selected.length,models.length);assert.equal(r.selected.length,r.agent_result.recycling.dispatches.length);
 for(let i=0;i<r.selected.length;i++){
  const s=r.selected[i],d=r.agent_result.recycling.dispatches[i],body=JSON.parse(models[i].raw),prompt=JSON.parse(s.prompt);
  assert.equal(sha(JSON.stringify(s.prompt)),d.prompt_digest);assert.equal(s.generation,d.generation);assert.equal(s.model_request_sha256,models[i].sha256);assert.deepEqual(prompt.messages,body.messages);assert.deepEqual(prompt.tools,body.tools);
  const tokenHash=sha(stable({model:body.model,messages:body.messages,tools:body.tools}));assert.equal(tokenHash,s.tokenizer_request_sha256);assert.ok(r.receipts.some(p=>p.kind==='tokenizer'&&p.status===200&&p.request_sha256===tokenHash));
 }
 const m=r.metrics,final=JSON.parse(r.selected.at(-1).prompt),has=s=>visibleFacts(JSON.parse(s.prompt)).some(f=>f.revision===2&&f.value===m.revised);
 assert.equal(m.revision_ever_delivered,r.selected.some(has));assert.equal(m.final_revision_visible,has(r.selected.at(-1)));assert.equal(m.revision_delivered_before_recycle,r.selected.some(s=>has(s)&&s.generation<r.selected.at(-1).generation));
 assert.equal(m.recycles,r.agent_result.recycling.recycles);assert.deepEqual(m.final_tools,final.tools.map(t=>t.function.name));assert.equal(m.status,r.agent_result.status);assert.equal(r.agent_result.effect_applied,false);
 assert.equal(m.models,models.length);assert.equal(m.tokenizers,r.receipts.length-models.length);assert.ok(m.models<=(m.soft_limit===8000?16:12));assert.ok(m.tokenizers<=(m.soft_limit===8000?32:24));
 assert.equal(visibleFacts({messages:[{content:r.request},{content:r.fixtures['a.mjs']}]}).length,0);
 if(m.arm==='recovery'&&m.strategy==='missing'){
  assert.equal(m.status,'BLOCK');assert.equal(r.agent_result.candidate,undefined);assert.ok(r.agent_result.reason_codes.includes('glm.inspection-call-not-unique'));assert.equal(m.semantic_pass,false);
  return {...m,generic_gate_passed:null}; // No completion gate returned: unknown, not measured false.
 }
 assert.equal(m.answer,answerFromContext(final));assert.equal(m.semantic_pass,m.answer===m.revised);assert.equal(m.generic_gate_passed,r.agent_result.completion_gate.passed);assert.equal(m.status,'AWAITING_APPROVAL');
 assert.equal(r.agent_result.candidate.changes[0].utf8,`// Scripted proposal.\nexport function routeCode() { return "${m.answer}"; }\n`);
 const recovered=(s,path)=>JSON.parse(s.prompt).messages.some(msg=>{try{const o=JSON.parse(msg.content);return o.ok===true&&o.output?.path===path&&typeof o.output.call_id==='string'&&o.output.utf8===r.fixtures[path]&&o.output.sha256===sha(r.fixtures[path]);}catch{return false;}});
 if(m.arm==='recovery'&&m.neutralCount===3){assert.ok(recovered(r.selected.at(-1),'c-revision.md'),'decisive archive body absent');if(m.strategy==='stale-first'){const old=r.selected.findIndex(s=>recovered(s,'b-original.md'));assert.ok(old>=0&&old<r.selected.length-1,'missing stale-first delivery');}}
 return m;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 for(const f of read('binding.json').files)assert.equal(sha(readFileSync(new URL(f.path,root))),f.sha256,'source drift '+f.path);
 const report=read('evidence/report.json');assert.equal(report.rows.length,90);const rows=[],sources=[];
 for(const soft of [8000,10000,12000])for(const revised of ['BLUE_NEW','GREEN_NEW','AMBER_OLD'])for(const [pressure,n,strategy] of [[false,0,'latest'],[false,3,'latest'],[true,3,'latest'],[true,3,'stale-first'],[true,3,'missing']])for(const arm of ['baseline','recovery']){const path=`evidence/${soft}-${revised}-${pressure}-${n}-${strategy}-${arm}.json`,r=read(path);assert.deepEqual([r.metrics.soft_limit,r.metrics.revised,r.metrics.pressure,r.metrics.neutralCount,r.metrics.strategy,r.metrics.arm],[soft,revised,pressure,n,strategy,arm]);assert.deepEqual(r.metrics,report.rows[rows.length]);rows.push(inspect(r));sources.push({path,sha256:sha(readFileSync(new URL(path,root)))});}
 const immediate=rows.filter(r=>r.neutralCount===0),delayed=rows.filter(r=>r.neutralCount===3&&r.strategy!=='missing'),missing=rows.filter(r=>r.arm==='recovery'&&r.strategy==='missing');
 const supporting=immediate.every(r=>r.semantic_pass)&&delayed.filter(r=>r.arm==='recovery').every(r=>r.semantic_pass&&r.final_revision_visible&&r.generic_gate_passed)&&missing.every(r=>r.status==='BLOCK')&&rows.every(r=>r.pressure?r.recycles>0&&r.revision_delivered_before_recycle:r.recycles===0);
 const result={rows:90,immediate_correct:immediate.filter(r=>r.semantic_pass).length,delayed_baseline_correct:delayed.filter(r=>r.arm==='baseline'&&r.semantic_pass).length,delayed_candidate_correct:delayed.filter(r=>r.arm==='recovery'&&r.semantic_pass).length,missing_reference_blocks:missing.filter(r=>r.status==='BLOCK').length,maximum_model_calls:Math.max(...rows.map(r=>r.models)),maximum_tokenizer_calls:Math.max(...rows.map(r=>r.tokenizers)),scripted_model_calls:rows.reduce((s,r)=>s+r.models,0),scripted_tokenizer_calls:rows.reduce((s,r)=>s+r.tokenizers,0),provider_calls:0,supporting,source_hashes:sources,reviewer_sha256:sha(readFileSync(new URL('review.mjs',root))),authority_effect:'none',open_questions_ref:'README.md'};save('verification.json',result);
 const h=read('hypothesis.json'),e=read('experiment.json');
 const o=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:'verification.json',source_result_digest:sha(readFileSync(new URL('verification.json',root))),observation_kind:supporting?'supporting':'inconclusive',phase:'experiment',claim:'Both arms pass nine immediate controls. Recovery candidate resolves 27/27 delayed valid cases versus baseline 0/27; all nine invalid archive references block without a proposal. Maximum ten scripted model calls within existing budgets.',evaluator_id:'are-recovery-phase-context-audit-v1',evidence_refs:sources.map(s=>s.path+'#sha256='+s.sha256),limitations:['Scripted task-aware responder; no proof GLM selects the right evidence.','Synthetic tokenizer pressure, no real window calibration.','Single revised-fact task; no multi-fact or long-document generalization.','Invalid-reference blocks exercise existing validation, not model recognition of missing evidence.','Submission remains available: candidate permits recovery but cannot guarantee it.']});
 const observed=createResearchExperiment({...e,observation_refs:[o.record_id]});const d=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:observed.record_id,observation_refs:[o.record_id],disposition:supporting?'run-experiment':'revise-hypothesis',supporting_count:Number(supporting),counterevidence_count:0,experiment_support_count:Number(supporting),reason_codes:['recovery-affordance-local-test'],next_action:'Freeze a bounded live comparison that tests whether GLM selects decisive evidence under actual measured pressure; include selective recovery and premature-submission outcomes, without modifying the active original comparison.'});for(const r of [o,observed,d])assert.ok(verifyEvolutionRecord(r,r.schema_version).ok);save('research.json',{records:[observed,o,d],authority_effect:'none',open_questions_ref:'README.md'});console.log(JSON.stringify({...result,source_hashes:undefined}));
}
