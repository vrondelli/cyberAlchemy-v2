import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {measurePayloadPair} from './measure-payload-pair.mjs';import {createStatelessRecyclingTransport} from './packet-diversity-v1/context-recycling-bounded-v3.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(t,{counts=[5773,3000],failure=false,model=false}={}){
 const root=mkdtempSync(join(tmpdir(),'payload-pair-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const out_root=join(root,'out');mkdirSync(out_root);const fixture_root=join(root,'fixture');mkdirSync(fixture_root);
 const rows=['raw','encoded'].map(id=>{const prompt_path=join(root,id+'.json'),raw=stable({messages:[{role:'user',content:id}],tools:[]});writeFileSync(prompt_path,raw);return {id,prompt_path,prompt_sha256:hash(raw)};});let created=0,models=0;
 return {request:{rows,out_root,fixture_root,binding:{},credential_path:'unused',signal:new AbortController().signal},counts:()=>({created,models}),deps:{host_guard:()=>({admitted:true}),create_client:({before_dispatch})=>{
  const i=created++,receipts=[];return {receipts,bindRunLedger:()=>{},transport:createStatelessRecyclingTransport({adapter_id:'fixture-'+i,source_ref:'fixture',maximum_output_tokens:2048,measure_request:async({prompt})=>{
   const wire=JSON.parse(prompt),request_sha256=hash(stable({model:'glm-5.3-flash',messages:wire.messages,tools:wire.tools}));await before_dispatch({kind:'tokenizer',request_sha256});
   if(failure){receipts.push({kind:'tokenizer',dispatched:true,status:null,failure_code:'request-failed'});throw Error('fixture-provider-failure');}
   receipts.push({kind:'tokenizer',dispatched:true,status:200,automatic_retries:0,input_tokens:counts[i],retained_reasoning_reservation:0,request_sha256});
   if(model)receipts.push({kind:'model',dispatched:true,status:200,input_tokens:1,output_tokens:1});return counts[i]+512;
  },request_once:async()=>{models++;throw Error('forbidden model');}})};
 }}};
}
test('actual native admission measures both oversized raw and fitting candidate without model dispatch',async t=>{
 const f=fixture(t),r=await measurePayloadPair(f.request,f.deps);assert.equal(r.complete,true,JSON.stringify(r));assert.equal(r.diagnostic_passed,true);assert.equal(r.rows[0].projected_tokens,8333);assert.equal(r.rows[0].within8k,false);assert.equal(r.rows[1].projected_tokens,5560);assert.equal(r.tokenizer_dispatches,2);assert.deepEqual(f.counts(),{created:2,models:0});assert.deepEqual(JSON.parse(readFileSync(join(f.request.out_root,'RESULTS.json'))),r);
});
test('no measured reduction or encoded overflow cannot pass diagnostic',async t=>{
 for(const counts of [[3000,3000],[6000,5800]]){const f=fixture(t,{counts}),r=await measurePayloadPair(f.request,f.deps);assert.equal(r.complete,true,JSON.stringify(r));assert.equal(r.diagnostic_passed,false);assert.equal(f.counts().models,0);}
});
test('provider failure retains first attempt and leaves second row unstarted',async t=>{
 const f=fixture(t,{failure:true}),r=await measurePayloadPair(f.request,f.deps);assert.equal(r.complete,false);assert.equal(r.rows[0].receipts[0].failure_code,'request-failed');assert.equal(r.rows[1].status,'not-started');assert.equal(f.counts().created,1);
});
test('model evidence contradicts tokenizer-only diagnostic and remains visible',async t=>{
 const f=fixture(t,{model:true}),r=await measurePayloadPair(f.request,f.deps);assert.equal(r.complete,false);assert.equal(r.model_calls,1);assert.equal(r.diagnostic_passed,false);
});
test('changed prompt is rejected before provider access',async t=>{
 const f=fixture(t);writeFileSync(f.request.rows[0].prompt_path,'{}');const r=await measurePayloadPair(f.request,f.deps);assert.equal(r.complete,false);assert.match(r.rows[0].error,/prompt-drift/);assert.equal(f.counts().created,0);
});

test('measurement preserves 7998, 7999, 8000 and 8001 boundaries independently of native prepare threshold',async t=>{
 for(const projected of [7998,7999,8000,8001]){
  const f=fixture(t,{counts:[6000,projected-2560]}),r=await measurePayloadPair(f.request,f.deps);
  assert.equal(r.complete,true,JSON.stringify(r));assert.equal(r.rows[1].projected_tokens,projected);
  assert.equal(r.rows[1].within8k,projected<=8000);assert.equal(r.rows[1].native_prepare_admitted,projected<7999);
  assert.equal(r.diagnostic_passed,projected<=8000);assert.equal(f.counts().models,0);
 }
});
