// Loopback instrument limits; open questions: README.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createGlmClient} from '../external-context-v1/holdout-v1/transport.mjs';
import {openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';

test('deferral profile has a distinct identity and finite allowance without enlarging model limits',()=>{
  const config={chat_endpoint:'http://127.0.0.1:1/chat/completions',tokenizer_endpoint:'http://127.0.0.1:1/tokenizer',maximum_requests:96};
  const old=createGlmClient({...config,request_budget:'contextbench-budget-v1'});
  const next=createGlmClient({...config,request_budget:'contextbench-deferral-v1'});
  assert.equal(old.maximum_tokenizer_requests,192);assert.equal(next.maximum_tokenizer_requests,291);
  assert.equal(next.maximum_requests,96);assert.equal(next.maximum_model_retries,0);
  assert.notEqual(old.identity,next.identity);
  assert.throws(()=>createGlmClient({...config,request_budget:'contextbench-deferral-v1',maximum_requests:97}),/limits-exceed/);
});

for(const [policy,cap] of [['contextbench-budget-v1',2],['contextbench-deferral-v1',6]])
test(`${policy} enforces tokenizer cap across ledger restore without model calls`,async()=>{
  let requests=0;
  const server=createServer(async(req,res)=>{
    for await(const chunk of req){} requests++;
    assert.ok(req.url.endsWith('/tokenizer'),'denied requests must not reach model');
    res.setHeader('content-type','application/json');res.end(JSON.stringify({usage:{prompt_tokens:1}}));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const dir=mkdtempSync(tmpdir()+'/are-tokenizer-cap-');mkdirSync(dir+'/fixture');
  const url=`http://127.0.0.1:${server.address().port}`;
  const config={chat_endpoint:url+'/chat/completions',tokenizer_endpoint:url+'/tokenizer',maximum_requests:1,request_budget:policy};
  const options={directory:dir+'/state',context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:'limit test',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}};
  let recycler;
  const open=client=>openContextRecycling({transport:client.transport,fixture_root:dir+'/fixture',scope:{request:'limit test'},options});
  const measure=i=>recycler.generate({history:[],run_id:'limit',render:()=>JSON.stringify({messages:[{role:'user',content:'unique '+i}],tools:[]}),admit_dispatch:async()=>false});
  try{
    let client=createGlmClient(config);recycler=open(client);client.bindRunLedger({directory:dir+'/state',binding:'a'.repeat(64)});
    for(let i=0;i<cap;i++)await assert.rejects(measure(i),/dispatch-admission-denied/);
    assert.equal(requests,cap);recycler.close();
    client=createGlmClient(config);recycler=open(client);client.bindRunLedger({directory:dir+'/state',binding:'a'.repeat(64),require_existing:true});
    await assert.rejects(measure(cap),/tokenizer-limit/);
    assert.equal(requests,cap);assert.equal(client.receipts.filter(r=>r.kind==='model').length,0);
  }finally{recycler?.close();rmSync(dir,{recursive:true,force:true});await new Promise(r=>server.close(r));}
});
