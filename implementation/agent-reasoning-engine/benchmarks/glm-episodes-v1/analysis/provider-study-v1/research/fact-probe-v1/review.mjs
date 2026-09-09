// Independent checks of selected context and physical receipts. Open questions: H18.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {createResearchExperiment,createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../../packages/evolution-runtime/index.mjs';
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
 assert.equal(m.answer,answerFromContext(final));assert.equal(m.semantic_pass,m.answer===m.revised);assert.equal(m.recycles,r.agent_result.recycling.recycles);assert.equal(m.generic_gate_passed,r.agent_result.completion_gate.passed);assert.deepEqual(m.final_tools,final.tools.map(t=>t.function.name));
 assert.equal(r.agent_result.candidate.changes[0].utf8,`// Scripted proposal.\nexport function routeCode() { return "${m.answer}"; }\n`);
 assert.equal(m.status,'AWAITING_APPROVAL');assert.equal(r.agent_result.effect_applied,false);
 // Neither the constant request nor the mutation source supplies an answer.
 assert.equal(visibleFacts({messages:[{content:r.request},{content:r.fixtures['a.mjs']}]}).length,0);
 return m;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 for(const f of read('binding-v2.json').files)assert.equal(sha(readFileSync(new URL(f.path,root))),f.sha256,'source drift '+f.path);
 const report=read('evidence-v2/report.json');assert.equal(report.rows.length,27);const rows=[],sources=[];
 for(const soft of [8000,10000,12000])for(const revised of ['BLUE_NEW','GREEN_NEW','AMBER_OLD'])for(const [pressure,n] of [[false,0],[false,3],[true,3]]){const path=`evidence-v2/${soft}-${revised}-${pressure}-${n}.json`;const r=read(path);assert.equal(r.metrics.soft_limit,soft);assert.equal(r.metrics.revised,revised);assert.equal(r.metrics.pressure,pressure);assert.equal(r.metrics.neutralCount,n);rows.push(inspect(r));sources.push({path,sha256:sha(readFileSync(new URL(path,root)))});}
 assert.deepEqual(rows,report.rows);const immediate=rows.filter(r=>r.neutralCount===0),delayed=rows.filter(r=>r.neutralCount===3&&!r.pressure),pressured=rows.filter(r=>r.pressure);
 const supporting=immediate.every(r=>r.semantic_pass&&r.final_revision_visible&&r.recycles===0)&&delayed.every(r=>r.revision_ever_delivered&&!r.final_revision_visible&&r.recycles===0&&r.generic_gate_passed&&r.final_tools.length===1&&r.final_tools[0]==='submit_patch_candidate');
 const result={rows:27,immediate_correct:immediate.filter(r=>r.semantic_pass).length,delayed_correct:delayed.filter(r=>r.semantic_pass).length,pressured_correct:pressured.filter(r=>r.semantic_pass).length,pressured_structural_gaps:pressured.filter(r=>r.structural_gap).length,generic_gate_passes:rows.filter(r=>r.generic_gate_passed).length,scripted_model_calls:rows.reduce((s,r)=>s+r.models,0),scripted_tokenizer_calls:rows.reduce((s,r)=>s+r.tokenizers,0),provider_calls:0,supporting,source_hashes:sources,reviewer_sha256:sha(readFileSync(new URL('review.mjs',root))),authority_effect:'none',open_questions_ref:'H18.md'};save('verification.json',result);
 const h=read('hypothesis-v2.json'),e=read('experiment-v2.json');
 const o=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:'verification.json',source_result_digest:sha(readFileSync(new URL('verification.json',root))),observation_kind:supporting?'supporting':'inconclusive',phase:'experiment',claim:'Nine immediate controls preserve the authoritative value; nine delayed unpressured cases lose it with zero recycles and passed completion gates that offer only submission. Nine pressured delayed cases show the same missing-fact closure.',evaluator_id:'are-versioned-fact-context-audit-v2',evidence_refs:sources.map(s=>s.path+'#sha256='+s.sha256),limitations:['Scripted context-only responder; no GLM accuracy or failure-rate inference.','Synthetic token pressure; nominal windows are not measured token calibration.','Same small task and three values; no broad generalization.','A gate marks a proposal ready for review; no source effect was applied.']});
 const observed=createResearchExperiment({...e,observation_refs:[o.record_id]});
 const d=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:observed.record_id,observation_refs:[o.record_id],disposition:'run-experiment',supporting_count:Number(supporting),counterevidence_count:0,experiment_support_count:Number(supporting),reason_codes:['context.masking-before-recycling'],next_action:'Design a general bounded evidence-recovery phase before submission. Freeze its source, recovery budget and revised-fact controls, then compare unchanged baseline and candidate locally before any new live cohort.'});
 for(const r of [o,observed,d])assert.ok(verifyEvolutionRecord(r,r.schema_version).ok);save('research.json',{records:[observed,o,d],authority_effect:'none',open_questions_ref:'H18.md'});console.log(JSON.stringify({...result,source_hashes:undefined}));
}
