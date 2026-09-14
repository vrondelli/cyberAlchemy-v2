import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient} from '../external-context-v1/holdout-v1/transport.mjs';
import {openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=server=>new Promise(resolve=>server.close(resolve));
const prompt=JSON.stringify({messages:[{role:'user',content:'measure only'}],tools:[]});

async function fixture(handler){
  const server=createServer(handler);await listen(server);const origin=`http://127.0.0.1:${server.address().port}`,root=mkdtempSync(join(tmpdir(),'are-request-tokenizer-retry-'));mkdirSync(join(root,'fixture'));
  const client=createGlmClient({chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',maximum_requests:1,request_budget:'contextbench-deferral-v1',maximum_tokenizer_transport_attempts:2});
  const recycler=openContextRecycling({transport:client.transport,fixture_root:join(root,'fixture'),scope:{request:'measure only'},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:'measure only',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
  client.bindRunLedger({directory:join(root,'state'),binding:'a'.repeat(64)});
  return{server,root,client,recycler,cleanup:async()=>{recycler.close();rmSync(root,{recursive:true,force:true});await close(server);}};
}

test('request tokenizer retries one identical zero-response request without a model dispatch',async()=>{
  let tokenizerAttempts=0,modelCalls=0,bodies=[];const x=await fixture(async(req,res)=>{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks).toString();if(req.url.endsWith('/tokenizer')){bodies.push(body);tokenizerAttempts++;if(tokenizerAttempts===1){req.socket.destroy();return;}res.setHeader('content-type','application/json');res.end(JSON.stringify({usage:{prompt_tokens:100}}));return;}modelCalls++;res.destroy();});
  try{await assert.rejects(x.recycler.generate({history:[],run_id:'oracle',render:()=>prompt,admit_dispatch:()=>false}),/dispatch-admission-denied/);assert.equal(tokenizerAttempts,2);assert.equal(modelCalls,0);assert.equal(bodies[0],bodies[1]);const receipts=x.client.receipts;assert.equal(receipts.length,2);assert.equal(receipts[0].failure_code,'request-failed');assert.equal(receipts[0].response_bytes,0);assert.equal(receipts[0].retryable,true);assert.deepEqual(receipts.map(r=>r.attempt_index),[0,1]);assert.equal(receipts[0].request_sha256,receipts[1].request_sha256);assert.equal(receipts[1].input_tokens,100);}finally{await x.cleanup();}
});

test('request tokenizer does not retry an HTTP failure',async()=>{
  let tokenizerAttempts=0;const x=await fixture(async(req,res)=>{for await(const chunk of req){}tokenizerAttempts++;res.statusCode=503;res.setHeader('content-type','application/json');res.end(JSON.stringify({error:{code:500}}));});
  try{await assert.rejects(x.recycler.generate({history:[],run_id:'excluded',render:()=>prompt,admit_dispatch:()=>false}),/glm.http-error/);assert.equal(tokenizerAttempts,1);assert.equal(x.client.receipts.length,1);assert.equal(x.client.receipts[0].retryable,undefined);}finally{await x.cleanup();}
});
