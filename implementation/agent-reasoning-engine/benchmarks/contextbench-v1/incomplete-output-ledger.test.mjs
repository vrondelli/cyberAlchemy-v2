import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createGlmClient} from '../external-context-v1/holdout-v1/transport.mjs';
import {openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';

const response=(finish_reason,content,completion_tokens)=>({model:'glm-5.3-flash',choices:[{message:{role:'assistant',content},finish_reason}],usage:{prompt_tokens:100,completion_tokens}});

test('fully accounted length response leaves ledger idle for one corrective dispatch',async()=>{
 let chats=0;
 const server=createServer(async(req,res)=>{for await(const chunk of req){}res.setHeader('content-type','application/json');if(req.url.endsWith('/tokenizer'))res.end(JSON.stringify({usage:{prompt_tokens:100}}));else{chats++;res.end(JSON.stringify(chats===1?response('length','discarded',2048):response('stop','done',1)));}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const dir=mkdtempSync(tmpdir()+'/are-incomplete-ledger-');mkdirSync(dir+'/fixture');let recycler;
 try{
  const url=`http://127.0.0.1:${server.address().port}`,client=createGlmClient({chat_endpoint:url+'/chat/completions',tokenizer_endpoint:url+'/tokenizer',request_budget:'contextbench-deferral-v1',maximum_requests:2,maximum_output_tokens:2048});
  recycler=openContextRecycling({transport:client.transport,fixture_root:dir+'/fixture',scope:{request:'correction'},options:{directory:dir+'/state',context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:'correction',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
  client.bindRunLedger({directory:dir+'/state',binding:'c'.repeat(64)});let correction=false;
  const generate=()=>recycler.generate({history:[],run_id:'correction',render:()=>JSON.stringify({messages:[{role:'user',content:correction?'concise correction':'initial'}],tools:[]})});
  await assert.rejects(generate(),/incomplete-output/);
  let ledger=JSON.parse(readFileSync(dir+'/state/glm-transport-ledger.json'));assert.equal(ledger.phase,'idle');assert.equal(ledger.model_calls,1);assert.equal(ledger.receipts.at(-1).output_tokens,2048);
  recycler.acknowledgeIncompleteOutput();correction=true;const completed=await generate();assert.ok(completed.final_bytes);
  ledger=JSON.parse(readFileSync(dir+'/state/glm-transport-ledger.json'));assert.equal(ledger.phase,'idle');assert.equal(ledger.model_calls,2);assert.equal(ledger.receipts.filter(r=>r.kind==='model').reduce((sum,r)=>sum+r.input_tokens+r.output_tokens,0),2249);assert.equal(chats,2);
 }finally{recycler?.close();rmSync(dir,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve));}
});

test('malformed successful response still poisons the ledger',async()=>{
 const server=createServer(async(req,res)=>{for await(const chunk of req){}res.setHeader('content-type','application/json');res.end(JSON.stringify(req.url.endsWith('/tokenizer')?{usage:{prompt_tokens:100}}:{model:'glm-5.3-flash',choices:[{message:{role:'assistant',content:'bad'},finish_reason:'stop'}],usage:{prompt_tokens:100}}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const dir=mkdtempSync(tmpdir()+'/are-poison-ledger-');mkdirSync(dir+'/fixture');let recycler;
 try{
  const url=`http://127.0.0.1:${server.address().port}`,client=createGlmClient({chat_endpoint:url+'/chat/completions',tokenizer_endpoint:url+'/tokenizer',request_budget:'contextbench-deferral-v1',maximum_requests:2});
  recycler=openContextRecycling({transport:client.transport,fixture_root:dir+'/fixture',scope:{request:'poison'},options:{directory:dir+'/state',context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:'poison',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
  client.bindRunLedger({directory:dir+'/state',binding:'d'.repeat(64)});const generate=()=>recycler.generate({history:[],run_id:'poison',render:()=>JSON.stringify({messages:[{role:'user',content:'test'}],tools:[]})});
  await assert.rejects(generate(),/usage-invalid/);assert.equal(JSON.parse(readFileSync(dir+'/state/glm-transport-ledger.json')).phase,'failed');
  const restored=createGlmClient({chat_endpoint:url+'/chat/completions',tokenizer_endpoint:url+'/tokenizer',request_budget:'contextbench-deferral-v1',maximum_requests:2});
  assert.throws(()=>restored.bindRunLedger({directory:dir+'/state',binding:'d'.repeat(64),require_existing:true}),/ledger-uncertain-or-failed/);
 }finally{recycler?.close();rmSync(dir,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve));}
});
