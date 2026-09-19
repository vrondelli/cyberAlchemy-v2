import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDS,sha} from './adapter.mjs';
import {referenceBinding,evaluator} from './evaluate.mjs';
const usage={prompt_tokens:10,completion_tokens:2,total_tokens:12};
function fixture(){
 const rows=IDS.map(question_id=>({question_id,question_type:'multi-session',question:'Synthetic question?',question_date:'2024/01/01 (Mon) 12:00'}));
 const oracle=rows.map(r=>({...r,answer:'PRIVATE_SYNTHETIC_REFERENCE'}));
 const binding=referenceBinding({rows,oracle,source_binding:{source:'synthetic'},oracle_sha256:sha('oracle'),rubric_sha256:sha('rubric')});
 const render=(ref,response)=>JSON.stringify({question:ref.question,reference:ref.answer,response,abstention:ref.abstention});
 const e=evaluator({rows,oracle,binding,render});
 const seal={schema:'are.full-s-generation-seal/v1',terminal:true,source_integrity_verified:true,transport_settled:true,result:{planned_pairs:4,planned_answer_slots:8,unknown_usage:false,held_tokens:0,usage:{prompt_tokens:80,completion_tokens:16,total_tokens:96},results:IDS.map(question_id=>({question_id,unknown_usage:false,held_tokens:0,usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24},calls:['control','treatment'].map(arm=>({arm,usage})),answers:['control','treatment'].map(arm=>({arm,status:'completed',text:'synthetic answer',answer_sha256:sha('synthetic answer')}))}))}};
 const freeze={schema:'are.full-s-evaluator-freeze/v1',approved:true,reference_binding_sha256:sha(binding),generation_seal_sha256:sha(seal),maximum_judge_calls:8,maximum_judge_tokens:64000,context_limit:8000,tokenizer_timeout_ms:10000,evaluator_sha256:sha(readFileSync(new URL('./evaluate.mjs',import.meta.url))),rubric_sha256:binding.rubric_sha256};
 const events=[],meter=async request=>({input_tokens:100,wire_sha256:sha(request)}),generate=async({request})=>({status:200,finish_reason:'stop',output:'yes',usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110,completion_tokens_details:{reasoning_tokens:8}},request_sha256:sha(request)});
 const options={seal,freeze,meter,generate,record:async r=>events.push(r),synthetic_only:true};return {rows,oracle,binding,e,seal,freeze,events,options};
}
test('identity binding emits hashes only and rejects question/type/date/cardinality drift',()=>{
 const f=fixture();assert.ok(!JSON.stringify(f.binding).includes('PRIVATE_SYNTHETIC_REFERENCE'));assert.ok(!JSON.stringify(f.binding).includes('Synthetic question'));
 for(const key of ['question','question_type','question_date']){const rows=structuredClone(f.rows);rows[0][key]+=' changed';assert.throws(()=>referenceBinding({rows,oracle:f.oracle}),/identity/);}
 assert.throws(()=>referenceBinding({rows:f.rows,oracle:[...f.oracle,f.oracle[0]]}),/cardinality/);
});
test('eight blind native-style requests fit64000 and public receipts never expose references',async()=>{
 const f=fixture();let calls=0;const result=await f.e.score({...f.options,generate:async request=>{calls++;const prompt=request.request.messages[0].content;assert.ok(!prompt.includes('control')&&!prompt.includes('treatment'));return f.options.generate(request);}});
 assert.equal(calls,8);assert.equal(result.judgments.length,8);assert.equal(result.reserved_tokens,64000);assert.equal(result.usage.total_tokens,880);assert.equal(result.totals.control.correct,4);assert.equal(result.totals.treatment.correct,4);assert.equal(result.usage.completion_tokens,80);assert.equal(result.totals.control.generation_tokens,48);assert.equal(result.totals.control.total_tokens,488);assert.ok(!JSON.stringify(f.events).includes('PRIVATE_SYNTHETIC_REFERENCE'));
});
test('generation seal and evaluatorfreeze gates reject before any model request',async()=>{
 const f=fixture();for(const change of [{terminal:false},{transport_settled:false},{source_integrity_verified:false}]){const seal={...f.seal,...change},freeze={...f.freeze,generation_seal_sha256:sha(seal)};await assert.rejects(f.e.score({...f.options,seal,freeze}),/seal/);}
 await assert.rejects(f.e.score({...f.options,freeze:{...f.freeze,maximum_judge_tokens:64001}}),/budget/);
 await assert.rejects(f.e.score({...f.options,synthetic_only:false}),/production/);
 assert.equal(f.events.length,0);
});
test('noncompleted generation remains in fixed denominator without fabricated judge calls',async()=>{
 const f=fixture();f.seal.result.results[0].answers[0]={arm:'control',status:'blocked',text:null,answer_sha256:null};f.freeze.generation_seal_sha256=sha(f.seal);
 const r=await f.e.score(f.options);assert.equal(r.judge_calls,7);assert.equal(r.judgments.length,8);assert.equal(r.totals.control.planned,4);assert.equal(r.totals.control.completed,3);assert.equal(r.totals.control.correct,3);
});
test('unknown judge cost and capacity failures stop new calls without dropping slots',async()=>{
 for(const kind of ['unknown','capacity']){const f=fixture();let calls=0;const r=await f.e.score({...f.options,generate:async({request})=>{calls++;throw kind==='unknown'?Error('private failure text'):Object.assign(Error('capacity'),{receipt:{status:503,error_code:'1305',request_sha256:sha(request),usage}});}});assert.equal(calls,1);assert.equal(r.judgments.length,8);assert.ok(r.health_stop);assert.equal(r.unknown_usage,kind==='unknown');assert.equal(r.held_tokens,kind==='unknown'?8000:0);assert.ok(!JSON.stringify(r).includes('private failure text'));}
});
test('positive observed usage survives contradictory no-dispatch flag',async()=>{
 const f=fixture();const r=await f.e.score({...f.options,generate:async({request})=>{throw Object.assign(Error('failure'),{model_started:false,receipt:{status:503,request_sha256:sha(request),usage}});}});assert.equal(r.usage.total_tokens,12);assert.equal(r.judge_calls,1);assert.equal(r.unknown_usage,false);
});
test('actual8K failure and tokenizer error have zero model cost',async()=>{
 const f=fixture();let generated=0;const r=await f.e.score({...f.options,meter:async request=>({input_tokens:6977,wire_sha256:sha(request)}),generate:async()=>{generated++;}});assert.equal(generated,0);assert.equal(r.usage.total_tokens,0);assert.equal(r.judgments.length,8);
 const down=await f.e.score({...f.options,meter:async()=>{throw Object.assign(Error('private'),{receipt:{usage}});}});assert.equal(down.usage.total_tokens,0);assert.equal(down.unknown_usage,false);
});
test('invalid judgment preserves costs but cannot become correct; finaljournal retains accounting',async()=>{
 const f=fixture();const r=await f.e.score({...f.options,generate:async options=>({...await f.options.generate(options),output:'maybe'})});assert.equal(r.totals.control.correct,0);assert.equal(r.usage.total_tokens,880);
 await assert.rejects(f.e.score({...f.options,record:async event=>{if(event.kind==='evaluation-result')throw Error('disk');}}),error=>Boolean(error.result?.judgments.length===8&&error.usage?.total_tokens===880));
});
test('pinned native rubric renders unchanged semantics with synthetic references only',async()=>{
 const {renderNative,RUBRIC_PATH}=await import('./evaluate.mjs');const ref={question_type:'knowledge-update',question:'Synthetic question',answer:'Synthetic reference',abstention:false};
 const prompt=renderNative(RUBRIC_PATH,ref,'Synthetic response');assert.ok(prompt.includes('updated answer'));assert.ok(prompt.includes('Correct Answer: Synthetic reference'));assert.ok(prompt.includes('Model Response: Synthetic response'));
 const abstention=renderNative(RUBRIC_PATH,{...ref,abstention:true},'Synthetic response');assert.ok(abstention.includes('unanswerable'));
});
test('full-S evaluator binds separately stored references and rejects private file drift',async()=>{
 const {mkdtempSync,mkdirSync,writeFileSync,rmSync}=await import('node:fs'),{join}=await import('node:path'),{tmpdir}=await import('node:os'),{SOURCE}=await import('./adapter.mjs'),{openFullSEvaluator}=await import('./evaluate.mjs');
 const root=mkdtempSync(join(tmpdir(),'full-s-evaluator-'));try{
  const source=join(root,'source'),privateDir=join(root,'evaluator');mkdirSync(source);mkdirSync(privateDir);
  const f=fixture(),sourceRows=f.rows.map(r=>({...r,haystack_dates:['2024/01/01 (Mon) 12:00'],haystack_sessions:[[{role:'user',content:'synthetic source'}]]}));
  const files=sourceRows.map(row=>{const path=`source-${row.question_id}.json`,raw=JSON.stringify(row);writeFileSync(join(source,path),raw);return {question_id:row.question_id,path,sha256:sha(raw),question_sha256:sha(row.question),question_date:row.question_date};});
  const metadata={pinned_upstream_source_verified:true,source_sha256:SOURCE.sha256,source_bytes:SOURCE.bytes,source_records:500,source_revision:SOURCE.revision,source_filename:SOURCE.filename};
  const receipt={...metadata,status:'verified-source-only-projection',selected:files,evaluation_references_emitted:false};const raw=JSON.stringify(receipt);writeFileSync(join(source,'acquisition.json'),raw);
  const manifest={schema:'longmemeval-full-s-source-manifest/v1',variant:SOURCE.filename,source_sha256:SOURCE.sha256,source_revision:SOURCE.revision,package_directory:source,acquisition_sha256:sha(raw),rows:files};
  const references=f.oracle.map(row=>{const path=`reference-${row.question_id}.json`,raw=JSON.stringify(row);writeFileSync(join(privateDir,path),raw);return {question_id:row.question_id,path,sha256:sha(raw)};});
  writeFileSync(join(privateDir,'reference-acquisition.json'),JSON.stringify({...metadata,status:'verified-evaluator-reference-projection',selected:references,evaluation_references_emitted:true,generator_reference_access:false}));
  const opened=openFullSEvaluator({source_manifest:manifest,reference_directory:privateDir});assert.equal(opened.binding.reference_variant,SOURCE.filename);assert.ok(!JSON.stringify(opened.binding).includes('PRIVATE_SYNTHETIC_REFERENCE'));
  writeFileSync(join(privateDir,references[0].path),'{}');assert.throws(()=>openFullSEvaluator({source_manifest:manifest,reference_directory:privateDir}),/reference-file-drift/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('receipt usage cannot be masked by zero error usage or unproven no-dispatch claims',async()=>{
 const f=fixture();const known=await f.e.score({...f.options,generate:async({request})=>{throw Object.assign(Error('contradiction'),{model_started:false,usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0},receipt:{request_sha256:sha(request),usage}});}});assert.equal(known.usage.total_tokens,12);assert.equal(known.judge_calls,1);assert.equal(known.unknown_usage,false);assert.ok(known.health_stop);
 for(const partial of [{model_started:false},{model_started:false,dispatch_proof:'not-dispatched',receipt:{status:503}},{model_started:false,dispatch_proof:'not-dispatched',usage:{prompt_tokens:5}}]){const r=await f.e.score({...f.options,generate:async()=>{throw Object.assign(Error('unknown'),partial);}});assert.equal(r.unknown_usage,true);assert.equal(r.held_tokens,8000);assert.equal(r.judge_calls,1);}
 const proven=await f.e.score({...f.options,generate:async()=>{throw Object.assign(Error('preclient'),{model_started:false,dispatch_proof:'not-dispatched'});}});assert.equal(proven.unknown_usage,false);assert.equal(proven.usage.total_tokens,0);assert.equal(proven.judge_calls,0);
});
test('cached/reasoning subtotals and generation usage ledger inconsistencies reject',async()=>{
 for(const detail of [{prompt_tokens_details:{cached_tokens:101}},{prompt_tokens_details:{cached_tokens:-1}},{completion_tokens_details:{reasoning_tokens:-1}}]){const f=fixture();const r=await f.e.score({...f.options,generate:async options=>{const receipt=await f.options.generate(options);receipt.usage={...receipt.usage,...detail};return receipt;}});assert.equal(r.judge_calls,1);assert.equal(r.usage.total_tokens,110);assert.equal(r.health_stop,'judge-usage-detail');}
 const f=fixture();f.seal.result.results[0].calls[0].usage={prompt_tokens:0,completion_tokens:0,total_tokens:0};f.freeze.generation_seal_sha256=sha(f.seal);await assert.rejects(f.e.score(f.options),/generation-call-usage/);assert.equal(f.events.length,0);
});
test('selected native reference values preserve JSON type and Python formatting',async()=>{
 const {renderNative,RUBRIC_PATH}=await import('./evaluate.mjs');
 for(const [answer,rendered]of [[42,'42'],[3.25,'3.25'],[true,'True'],[null,'None'],[['x',2],"['x', 2]"],[{x:2},"{'x': 2}"]]){
  const f=fixture();f.oracle[0].answer=answer;const binding=referenceBinding({rows:f.rows,oracle:f.oracle,source_binding:{},oracle_sha256:sha('synthetic'),rubric_sha256:sha('rubric')});assert.equal(binding.rows[0].answer_json_type,answer===null?'null':Array.isArray(answer)?'array':typeof answer);
  const prompt=renderNative(RUBRIC_PATH,{question_type:'multi-session',question:'Synthetic',answer,abstention:false},'Synthetic');assert.ok(prompt.includes('Correct Answer: '+rendered));
 }
 for(const answer of [Number.MAX_SAFE_INTEGER+1,Infinity,NaN,-0,{nested:Infinity}]){const f=fixture();f.oracle[0].answer=answer;assert.throws(()=>referenceBinding({rows:f.rows,oracle:f.oracle}),/reference-answer-shape/);}
});
