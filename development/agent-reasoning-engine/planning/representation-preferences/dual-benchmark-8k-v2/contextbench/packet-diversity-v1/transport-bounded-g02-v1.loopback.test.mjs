import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import {once} from 'node:events';
import {mkdirSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient,MODEL} from './transport-bounded-g02-v1.mjs';
import {createGlmClient as createPredecessor} from '../full-cycle-80/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/transport-bounded-v3.mjs';
import {openContextRecycling} from './context-recycling-bounded-v3.mjs';
import {createStageOutputGuard} from './stage-output-guard.mjs';
import {createStagePersistence} from './stage-persistence.mjs';

const schema={type:'object',properties:{path:{type:'string'}},required:['path'],additionalProperties:false};
const tool=(name='read_file',parameters=schema)=>({type:'function',function:{name,description:'Read a fixture path.',parameters}});
const calls=(count,name='read_file',args={path:'x'})=>Array.from({length:count},(_,index)=>({id:`call-${index}`,type:'function',function:{name,arguments:JSON.stringify(args)}}));
const response=(message,finish_reason)=>({model:MODEL,choices:[{message,finish_reason}],usage:{prompt_tokens:10,completion_tokens:20}});

async function loopback(t,modelPayload,{tools=[tool()],wrapPersistence=value=>value}={}){
  const root=mkdtempSync(join(tmpdir(),'g02-transport-loopback-')),stage=join(root,'stage'),fixture=join(root,'fixture');
  mkdirSync(stage);mkdirSync(fixture);
  const requests=[];
  const server=http.createServer((request,reply)=>{
    const chunks=[];request.on('data',chunk=>chunks.push(chunk));request.on('end',()=>{
      requests.push({path:request.url,body:JSON.parse(Buffer.concat(chunks).toString('utf8'))});
      const payload=request.url.endsWith('/tokenizer')?{usage:{prompt_tokens:10}}:modelPayload;
      const bytes=Buffer.from(JSON.stringify(payload));
      reply.writeHead(200,{'content-type':'application/json','content-length':bytes.length});reply.end(bytes);
    });
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const port=server.address().port,guard=createStageOutputGuard({root:stage});
  const base=createStagePersistence({stage_guard:guard,stage_root:stage}),persistence=wrapPersistence(base);
  const options={chat_endpoint:`http://127.0.0.1:${port}/chat/completions`,tokenizer_endpoint:`http://127.0.0.1:${port}/tokenizer`,maximum_requests:4,maximum_output_tokens:64,maximum_request_bytes:131072,maximum_response_bytes:262144,request_budget:'standard-v1',token_margin:32,persistence,before_dispatch:async()=>true};
  const client=createGlmClient(options),directory=join(stage,'state');
  const recycler=openContextRecycling({transport:client.transport,persistence,fixture_root:fixture,scope:{request:'fixture'},options:{directory,context_limit:4096,recycle_at:3500,safety_margin:512,state:{objective:'fixture',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
  client.bindRunLedger({directory,binding:'b'.repeat(64)});
  let recyclerClosed=false,closed=false;
  const closeRecycler=()=>{if(!recyclerClosed){recyclerClosed=true;recycler.close();}};
  const close=async()=>{if(!closed){closed=true;try{closeRecycler();}finally{server.close();await once(server,'close');rmSync(root,{recursive:true,force:true});}}};
  t.after(close);
  const prompt=JSON.stringify({messages:[{role:'user',content:'fixture'}],tools});
  return {client,recycler,prompt,requests,directory,persistence,options,closeRecycler,close,ledger:()=>JSON.parse(readFileSync(join(directory,'glm-transport-ledger.json'),'utf8'))};
}

test('terminal and 8, 9, 32-call responses complete tokenizer and chat with an idle bound ledger',async t=>{
  const cases=[
    ['terminal',response({role:'assistant',content:'done'},'stop'),false],
    ['eight',response({role:'assistant',content:null,tool_calls:calls(8)},'tool_calls'),false],
    ['nine',response({role:'assistant',content:null,tool_calls:calls(9)},'tool_calls'),true],
    ['thirty-two',response({role:'assistant',content:null,tool_calls:calls(32)},'tool_calls'),true]
  ];
  for(const [label,payload,recoverable] of cases){
    await t.test(label,async t=>{
      const f=await loopback(t,payload),generated=await f.recycler.generate({history:[],run_id:label,render:()=>f.prompt});
      assert.equal(f.requests.length,2);assert.deepEqual(f.requests.map(item=>item.path),['/tokenizer','/chat/completions']);
      assert.equal(generated.receipt.input_tokens,10);assert.equal(generated.receipt.output_tokens,20);
      assert.equal(generated.receipt.tool_call_shape.recoverable,recoverable);
      assert.match(generated.receipt.tool_schema_binding_sha256,/^[a-f0-9]{64}$/);
      assert.equal(f.ledger().phase,'idle');assert.deepEqual(f.ledger().receipts,f.client.receipts);
      f.recycler.completeStep([],true);
    });
  }
});

test('33, unknown, bad JSON, schema-invalid and duplicate-ID responses fail closed with accounted receipts',async t=>{
  const duplicate=calls(9);duplicate[8].id=duplicate[0].id;
  const badJson=calls(9);badJson[4].function.arguments='not-json';
  const cases=[
    ['thirty-three',calls(33)],
    ['unknown',calls(9,'unknown_tool')],
    ['bad-json',badJson],
    ['schema-invalid',calls(9,'read_file',{path:1})],
    ['duplicate-id',duplicate]
  ];
  for(const [label,tool_calls] of cases){
    await t.test(label,async t=>{
      const f=await loopback(t,response({role:'assistant',content:null,tool_calls},'tool_calls'));
      await assert.rejects(f.recycler.generate({history:[],run_id:label,render:()=>f.prompt}),/glm\.tool-calls-invalid/);
      const ledger=f.ledger(),receipt=ledger.receipts.at(-1);
      assert.equal(f.requests.length,2);assert.equal(ledger.phase,'failed');assert.equal(receipt.input_tokens,10);assert.equal(receipt.output_tokens,20);
      assert.match(receipt.tool_schema_binding_sha256,/^[a-f0-9]{64}$/);assert.ok(receipt.tool_batch_diagnostic);assert.ok(!JSON.stringify(receipt.tool_batch_diagnostic).includes('not-json'));
    });
  }
});

test('invalid advertised schemas fail before tokenizer and model dispatch',async t=>{
  const cases=[
    ['duplicate-name',[tool(),tool()],/tool-schema-name-duplicate/],
    ['invalid-schema',[tool('bad',{type:'not-a-json-schema-type'})],/tool-schema-compile-failed/]
  ];
  for(const [label,tools,error] of cases){
    await t.test(label,async t=>{
      const f=await loopback(t,response({role:'assistant',content:'unused'},'stop'),{tools});
      await assert.rejects(f.recycler.generate({history:[],run_id:label,render:()=>f.prompt}),error);
      assert.equal(f.requests.length,0);assert.equal(f.client.receipts.length,0);assert.equal(f.ledger().phase,'idle');
    });
  }
});

test('predecessor ledger is rejected while a G02 idle ledger can restart',async t=>{
  const root=mkdtempSync(join(tmpdir(),'g02-ledger-restart-')),stage=join(root,'stage'),directory=join(stage,'state');mkdirSync(stage);mkdirSync(directory);
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const persistence=createStagePersistence({stage_guard:createStageOutputGuard({root:stage}),stage_root:stage});
  const options={chat_endpoint:'http://127.0.0.1:1/chat/completions',tokenizer_endpoint:'http://127.0.0.1:1/tokenizer',persistence,before_dispatch:async()=>true};
  persistence.createLock(join(directory,'writer.lock'));
  createPredecessor(options).bindRunLedger({directory,binding:'b'.repeat(64)});
  assert.throws(()=>createGlmClient(options).bindRunLedger({directory,binding:'b'.repeat(64),require_existing:true}),/ledger-binding-drift/);
  persistence.removeLock(join(directory,'writer.lock'));

  const fresh=join(stage,'fresh');mkdirSync(fresh);persistence.createLock(join(fresh,'writer.lock'));
  const first=createGlmClient(options);first.bindRunLedger({directory:fresh,binding:'c'.repeat(64)});persistence.removeLock(join(fresh,'writer.lock'));
  persistence.createLock(join(fresh,'writer.lock'));const restarted=createGlmClient(options);
  restarted.bindRunLedger({directory:fresh,binding:'c'.repeat(64),require_existing:true});assert.equal(restarted.receipts.length,0);
  persistence.removeLock(join(fresh,'writer.lock'));
});

test('G02 restart restores an idle ledger containing accounted response receipts',async t=>{
  const f=await loopback(t,response({role:'assistant',content:'done'},'stop'));
  await f.recycler.generate({history:[],run_id:'restart-accounted',render:()=>f.prompt});f.recycler.completeStep([],true);f.closeRecycler();
  f.persistence.createLock(join(f.directory,'writer.lock'));
  const restarted=createGlmClient(f.options);restarted.bindRunLedger({directory:f.directory,binding:'b'.repeat(64),require_existing:true});
  assert.deepEqual(restarted.receipts,f.client.receipts);assert.equal(restarted.receipts.filter(receipt=>receipt.kind==='model').length,1);
  f.persistence.removeLock(join(f.directory,'writer.lock'));
});

test('idle-ledger persistence failure after a recoverable response preserves spend and forbids success',async t=>{
  let injected=false;
  const f=await loopback(t,response({role:'assistant',content:null,tool_calls:calls(9)},'tool_calls'),{wrapPersistence:base=>({...base,atomicJson(path,value){
    if(!injected&&path.endsWith('glm-transport-ledger.json')&&value.phase==='idle'&&value.receipts?.some(receipt=>receipt.kind==='model')){injected=true;throw Object.assign(Error('fixture-ledger-write'),{persistence_failure:true});}
    return base.atomicJson(path,value);
  }})});
  await assert.rejects(f.recycler.generate({history:[],run_id:'persistence-failure',render:()=>f.prompt}),error=>error.persistence_failure===true&&error.receipt?.input_tokens===10&&error.receipt?.output_tokens===20);
  assert.equal(f.requests.length,2);assert.equal(f.ledger().phase,'failed');assert.equal(f.client.receipts.at(-1).tool_call_shape.recoverable,true);
});
