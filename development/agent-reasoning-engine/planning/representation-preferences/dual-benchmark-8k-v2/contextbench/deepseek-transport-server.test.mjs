// Open questions: DEEPSEEK-DURABLE-TRANSPORT.md.
import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {serveTransport} from './deepseek-transport-server.mjs';import {createDurableTransport} from './deepseek-durable-transport.mjs';
test('real loopback HTTP returns persisted SSE and graceful close seals usage',async t=>{
 const root=mkdtempSync(join(tmpdir(),'dsh-http-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const bytes='data: '+JSON.stringify({model:'glm-5.3-flash',choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}})+'\n\ndata: [DONE]\n\n';
 const transport=createDurableTransport({root,post:async p=>({status:200,bytes:p==='tokenizer'?'{"usage":{"prompt_tokens":100}}':bytes})});
 const running=serveTransport({transport,host:'127.0.0.1',port:0});await once(running.server,'listening');
 const base='http://127.0.0.1:'+running.server.address().port;
 const r=await fetch(base+'/v1/chat/completions',{method:'POST',body:JSON.stringify({model:'glm-5.3-flash',stream:true,messages:[],tools:[],max_tokens:2048})});assert.equal(r.status,200);assert.equal(await r.text(),bytes);
 const seal=await running.close();assert.equal(seal.known_total_tokens,120);assert.equal(seal.cost_complete,true);
});
test('HTTP exposes context overflow and permits a smaller subsequent request',async t=>{
 const root=mkdtempSync(join(tmpdir(),'dsh-overflow-http-'));t.after(()=>rmSync(root,{recursive:true,force:true}));let measured=0;
 const bytes='data: '+JSON.stringify({model:'glm-5.3-flash',choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}})+'\n\ndata: [DONE]\n\n';
 const transport=createDurableTransport({root,post:async p=>({status:200,bytes:p==='tokenizer'?JSON.stringify({usage:{prompt_tokens:measured++===0?6000:100}}):bytes})});
 const running=serveTransport({transport,host:'127.0.0.1',port:0});await once(running.server,'listening');const url='http://127.0.0.1:'+running.server.address().port+'/v1/chat/completions';
 const options={method:'POST',body:JSON.stringify({model:'glm-5.3-flash',stream:true,messages:[],tools:[],max_tokens:2048})};
 const denied=await fetch(url,options);assert.equal(denied.status,400);assert.equal((await denied.json()).error.code,'context_length_exceeded');
 const recovered=await fetch(url,options);assert.equal(recovered.status,200);await recovered.text();const seal=await running.close();assert.equal(seal.model_calls,1);assert.equal(seal.attempts,2);
});
test('HTTP forwards paid length response unchanged and allows the next request',async t=>{
 const root=mkdtempSync(join(tmpdir(),'dsh-length-http-'));t.after(()=>rmSync(root,{recursive:true,force:true}));let calls=0;
 const sse=reason=>'data: '+JSON.stringify({model:'glm-5.3-flash',choices:[{index:0,delta:{content:'partial'},finish_reason:reason}],usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}})+'\n\ndata: [DONE]\n\n';
 const transport=createDurableTransport({root,post:async p=>({status:200,bytes:p==='tokenizer'?'{"usage":{"prompt_tokens":100}}':sse(calls++===0?'length':'stop')})});
 const running=serveTransport({transport,host:'127.0.0.1',port:0});await once(running.server,'listening');const url='http://127.0.0.1:'+running.server.address().port+'/v1/chat/completions';
 const options={method:'POST',body:JSON.stringify({model:'glm-5.3-flash',stream:true,messages:[],max_tokens:2048})};
 for(const reason of ['length','stop']){const response=await fetch(url,options);assert.equal(response.status,200);assert.equal(await response.text(),sse(reason));}
 const seal=await running.close();assert.equal(seal.model_calls,2);assert.equal(seal.known_total_tokens,240);assert.equal(seal.state.poisoned,false);
});
