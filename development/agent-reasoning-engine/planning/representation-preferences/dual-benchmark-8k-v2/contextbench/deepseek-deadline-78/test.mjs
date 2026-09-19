// Deadline and paid-usage invariants, no external model. Open questions: PLAN.md.
import test from'node:test';import assert from'node:assert/strict';import{mkdtempSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{createServer}from'node:http';import{once}from'node:events';
const c=new URL('./snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/',import.meta.url);const{createDurableTransport}=await import(new URL('deepseek-durable-transport.mjs',c));const{postOnce}=await import(new URL('packet-diversity-v1/transport-bounded-v3.mjs',c));
const stream='data: '+JSON.stringify({model:'glm-5.3-flash',choices:[{index:0,delta:{content:'complete'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}})+'\n\ndata: [DONE]\n\n';
for(const timeout_ms of[10,1000])test('DSH delayed response with deadline '+timeout_ms+' retains exact known/unknown usage',async t=>{
 const p=mkdtempSync(join(tmpdir(),'deadline78-'));t.after(()=>rmSync(p,{recursive:true,force:true}));let calls=0;
 const transport=createDurableTransport({root:p,window:1000000,token_budget:4000000,output_cap:8192,timeout_ms,post:async(path,body,signal)=>{if(path==='tokenizer')return{status:200,bytes:'{"usage":{"prompt_tokens":100}}'};calls++;await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,60);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});});return{status:200,bytes:stream};}});
 const request=transport.process(JSON.stringify({model:'glm-5.3-flash',stream:true,messages:[],max_tokens:8192}));if(timeout_ms===10)await assert.rejects(request);else assert.equal((await request).bytes,stream);
 const seal=await transport.close();assert.equal(calls,1);assert.equal(seal.model_calls,1);assert.equal(seal.unknown_usage_dispatched_requests,timeout_ms===10?1:0);assert.equal(seal.known_total_tokens,timeout_ms===10?0:150);assert.equal(seal.cost_complete,timeout_ms!==10);
});
test('ARE whole-response deadline rejects an interrupted reply and accepts it with sufficient time',async t=>{
 const server=createServer(async(req,res)=>{for await(const _ of req){}setTimeout(()=>{res.setHeader('content-type','application/json');res.end('{"ok":true}');},60);});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const url=new URL('http://127.0.0.1:'+server.address().port);
 await assert.rejects(postOnce(url,'{}',{apiKey:null,timeout_ms:10,maximum_response_bytes:1000}),/deadline-exceeded/);assert.deepEqual((await postOnce(url,'{}',{apiKey:null,timeout_ms:1000,maximum_response_bytes:1000})).payload,{ok:true});
});
