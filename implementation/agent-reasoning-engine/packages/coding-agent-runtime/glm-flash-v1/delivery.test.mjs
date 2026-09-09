import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient,MODEL,hash,stable} from './transport.mjs';
import {runGlmAgent} from './agent.mjs';
import {validateDeliveryPolicy,rememberDeliveryProjection,selectedDelivery,projectDeliveryProgress} from './delivery.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {snapshotTree} from '../verifier.mjs';

const tc=(id,path='a.mjs',name='read-file')=>({id,type:'function',function:{name,arguments:JSON.stringify(name==='read-file'?{path}:path)}});
const reply=(message,finish_reason='stop')=>({model:MODEL,choices:[{message:{role:'assistant',...message},finish_reason}],usage:{prompt_tokens:100,completion_tokens:20}});
async function setup(t,handler) {
 const directory=mkdtempSync(join(tmpdir(),'are-delivery-')),root=join(directory,'fixture');mkdirSync(root);
 writeFileSync(join(root,'a.mjs'),'export const a=1;\n');writeFileSync(join(root,'b.mjs'),'export const b=1;\n');
 const base=snapshotTree(root),requests=[],invoked=[];
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,
  changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;\n'}],authority_effect:'none'};
 const server=createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));requests.push({path:req.url,body});
  res.setHeader('content-type','application/json');res.end(JSON.stringify(handler({body,requests,tokenizer:req.url.endsWith('/tokenizer'),candidate})));
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 t.after(async()=>{server.closeAllConnections();await new Promise(done=>server.close(done));rmSync(directory,{recursive:true,force:true});});
 const origin=`http://127.0.0.1:${server.address().port}`,clientOptions={chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer'};
 const runtime=createReadOnlyToolRuntime({repository_root:root,observation_allowlist:['a.mjs','b.mjs']});
 const input={run_id:'delivery',request:'Change a to 2',fixture_root:root,client:createGlmClient(clientOptions),retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',
  observation_allowlist:['a.mjs','b.mjs'],mutation_allowlist:['a.mjs'],verification_command:[],
  tool_runtime:{...runtime,invoke:async(name,args)=>{invoked.push({name,args});return runtime.invoke(name,args);}},
  tool_policy:{allow:['read-file','read-context-evidence','read-inspection-evidence']},
  context_recycling:{directory:join(directory,'state'),context_limit:10000,recycle_at:9000,safety_margin:1000,
   state:{objective:'Change a to 2',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}};
 return {input,root,directory,requests,invoked,clientOptions};
}

test('bounded batch defers unexecuted reads, preserves all native IDs and records delivery after resume',async t=>{
 const x=await setup(t,({tokenizer,requests,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  return requests.filter(r=>r.path.endsWith('/chat/completions')).length===1
   ?reply({tool_calls:[tc('a'),tc('b','b.mjs'),tc('archive',{digest:'a'.repeat(64)},'read-context-evidence')]},'tool_calls')
   :reply({content:JSON.stringify(candidate)});
 });
 const paused=await runGlmAgent({...x.input,pause_after_steps:1});assert.equal(paused.status,'PAUSED');assert.equal(x.invoked.length,1);
 assert.deepEqual(paused.delivery_progress.executed_read_call_ids,['a']);assert.deepEqual(paused.delivery_progress.delivered_call_ids,[]);
 assert.deepEqual(paused.delivery_progress.undelivered_call_ids,['a']);assert.deepEqual(paused.delivery_progress.deferred_call_ids,['b','archive']);
 assert.deepEqual(paused.history[0].messages.slice(1).map(m=>m.tool_call_id),['a','b','archive']);
 assert.deepEqual(paused.history[0].observations.map(o=>o.ok),[true,false,false]);
 const result=await runGlmAgent({...x.input,client:createGlmClient(x.clientOptions)});assert.equal(result.status,'AWAITING_APPROVAL');
 assert.deepEqual(result.delivery_progress.delivered_call_ids,['a']);assert.deepEqual(result.history[1].delivered_call_ids,['a']);
 const checkpoint=JSON.parse(readFileSync(join(x.directory,'state','checkpoint.json'),'utf8'));assert.deepEqual(checkpoint.history[1].delivered_call_ids,['a']);
 assert.equal(checkpoint.history[0].observations[0].output.utf8,'export const a=1;\n');
});

test('legacy executes all reads and does not expose new tool or delivery prompt',async t=>{
 const x=await setup(t,({tokenizer,requests,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  assert.ok(!body.tools.some(tool=>tool.function.name==='read-inspection-evidence'));assert.doesNotMatch(body.messages[0].content,/Bounded delivery/);
  return requests.filter(r=>r.path.endsWith('/chat/completions')).length===1?reply({tool_calls:[tc('a'),tc('b','b.mjs')]},'tool_calls'):reply({content:JSON.stringify(candidate)});
 });
 const result=await runGlmAgent({...x.input,delivery_policy:undefined});assert.equal(result.status,'AWAITING_APPROVAL');assert.equal(x.invoked.length,2);
 assert.equal(result.delivery_policy,'legacy-v1');assert.equal(result.delivery_progress,undefined);assert.equal(result.history[0].delivered_call_ids,undefined);
 assert.equal(validateDeliveryPolicy(),'legacy-v1');assert.throws(()=>validateDeliveryPolicy('guess'),/delivery-policy-invalid/);
});

test('whole batch validation precedes any execution even for a would-be deferred invalid call',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({tool_calls:[tc('a'),tc('invalid',4)]},'tool_calls'));
 const result=await runGlmAgent(x.input);assert.deepEqual(result.reason_codes,['glm.tool-arguments-invalid']);assert.equal(x.invoked.length,0);
});

test('deferred IDs consume the unchanged 24-tool-call allowance',async t=>{
 const x=await setup(t,({tokenizer,requests})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  return reply({tool_calls:Array.from({length:8},(_,i)=>tc(`read-${n}-${i}`))},'tool_calls');
 });
 const result=await runGlmAgent(x.input);assert.deepEqual(result.reason_codes,['glm.tool-call-limit']);assert.equal(x.invoked.length,3);
 assert.equal(result.history.flatMap(e=>e.calls??[]).length,24);assert.equal(result.delivery_progress.deferred_call_ids.length,21);
});

test('discarded render attempts do not become delivery evidence',()=>{
 const entry=id=>{const observation={ok:true,output:{utf8:id}};return {calls:[{id,name:'read-file',arguments:{path:id}}],observations:[observation],
  messages:[{role:'assistant',tool_calls:[tc(id,id)]},{role:'tool',tool_call_id:id,content:stable(observation)}]};};
 const history=[entry('old'),entry('new')],projections=new Map();
 rememberDeliveryProjection(projections,'large prompt',history,history);rememberDeliveryProjection(projections,'chosen prompt',history,history.slice(-1));
 const selected=selectedDelivery(projections,{prompt_digest:hash(stable('chosen prompt'))});assert.deepEqual(selected,['new']);
 assert.deepEqual(projectDeliveryProgress(history,[],selected).undelivered_call_ids,['old']);
 assert.throws(()=>selectedDelivery(projections,{prompt_digest:'unknown'}),/delivery-dispatch-untracked/);
});

for(const retention_policy of ['clear-v1','recent-observations-v2'])test(`bounded ${retention_policy} fallback retains newest whole exchange with at most two measurements`,async t=>{
 const x=await setup(t,({tokenizer,body,requests,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:body.messages.length>4?7000:100}};
  const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  if(n<3)return reply({tool_calls:[tc(`read-${n}`,n===1?'a.mjs':'b.mjs')]},'tool_calls');
  assert.equal(body.messages.length,4);assert.equal(body.messages[3].tool_call_id,'read-2');assert.match(body.messages[3].content,/export const b=1/);
  return reply({content:JSON.stringify(candidate)});
 });
 const result=await runGlmAgent({...x.input,retention_policy});assert.equal(result.status,'AWAITING_APPROVAL');assert.equal(result.recycling.recycles,1);
 assert.deepEqual(result.delivery_progress.delivered_call_ids,['read-1','read-2']);let measured=0;
 for(const request of x.requests)if(request.path.endsWith('/tokenizer'))measured++;else{assert.ok(measured<=2);measured=0;}
});

test('too-large newest exchange blocks and leaves exact observation undelivered',async t=>{
 const x=await setup(t,({tokenizer,body})=>tokenizer?{usage:{prompt_tokens:body.messages.length>2?7000:100}}:reply({tool_calls:[tc('a')]},'tool_calls'));
 const result=await runGlmAgent(x.input);assert.deepEqual(result.reason_codes,['recycling.fresh-context-too-large']);
 assert.deepEqual(result.delivery_progress.undelivered_call_ids,['a']);assert.deepEqual(result.delivery_progress.delivered_call_ids,[]);
 assert.equal(result.receipts.filter(r=>r.kind==='model').length,1);assert.equal(result.receipts.filter(r=>r.kind==='tokenizer').length,3);
});

for(const recycled of [false,true])test(`archive execution is not delivery until its body appears on next selected request; recycled=${recycled}`,async t=>{
 const x=await setup(t,({tokenizer,body,requests,candidate})=>{
  if(tokenizer) {
   const generation=JSON.parse(body.messages[0].content.split('\n').at(-1)).generation;
   return {usage:{prompt_tokens:recycled&&generation===0&&body.messages.length>2?7000:100}};
  }
  const n=requests.filter(r=>r.path.endsWith('/chat/completions')).length;
  if(n===1)return reply({tool_calls:[tc('original')]},'tool_calls');
  if(n===2)return reply({tool_calls:[tc('archive',{call_id:'original',max_chars:10},'read-inspection-evidence')]},'tool_calls');
  return reply({content:JSON.stringify(candidate)});
 });
 const paused=await runGlmAgent({...x.input,pause_after_steps:2});assert.equal(paused.status,'PAUSED');
 assert.deepEqual(paused.delivery_progress.undelivered_call_ids,['archive']);assert.deepEqual(paused.delivery_progress.delivered_call_ids,['original']);
 const result=await runGlmAgent({...x.input,client:createGlmClient(x.clientOptions)});assert.equal(result.status,'AWAITING_APPROVAL');
 assert.deepEqual(result.delivery_progress.delivered_call_ids,['original','archive']);
 assert.deepEqual(result.delivery_progress.meaningful_archive_delivery_call_ids,recycled?['archive']:[]);
});

test('empty archive slices and future delivery IDs cannot prove meaningful evidence recovery',()=>{
 const history=[{calls:[{id:'archive',name:'read-context-evidence',arguments:{}}],observations:[{ok:true,output:{text:''}}],delivered_call_ids:['archive']},
  {delivered_call_ids:['archive']}];
 const result=projectDeliveryProgress(history,[{generation:1},{generation:1}]);assert.deepEqual(result.delivered_call_ids,['archive']);
 assert.deepEqual(result.meaningful_archive_delivery_call_ids,[]);
 assert.deepEqual(projectDeliveryProgress(history.slice(0,1),[{generation:1}]).delivered_call_ids,[]);
});

test('failed dispatched request reports delivery uncertainty rather than definitely undelivered',async t=>{
 const x=await setup(t,({tokenizer,requests})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  return requests.filter(r=>r.path.endsWith('/chat/completions')).length===1?reply({tool_calls:[tc('a')]},'tool_calls'):reply({content:''},'length');
 });
 const result=await runGlmAgent(x.input);assert.deepEqual(result.reason_codes,['glm.incomplete-output']);
 assert.deepEqual(result.delivery_progress.delivery_unknown_call_ids,['a']);assert.deepEqual(result.delivery_progress.undelivered_call_ids,[]);
 assert.deepEqual(result.delivery_progress.delivered_call_ids,[]);
});

test('delivery policy is bound on resume and malformed final still checkpoints confirmed delivery',async t=>{
 const x=await setup(t,({tokenizer,requests})=>tokenizer?{usage:{prompt_tokens:100}}
  :requests.filter(r=>r.path.endsWith('/chat/completions')).length===1?reply({tool_calls:[tc('a')]},'tool_calls'):reply({content:'not a candidate'}));
 assert.equal((await runGlmAgent({...x.input,pause_after_steps:1})).status,'PAUSED');const before=x.requests.length;
 const drift=await runGlmAgent({...x.input,delivery_policy:'legacy-v1',client:createGlmClient(x.clientOptions)});
 assert.deepEqual(drift.reason_codes,['recycling.scope-or-policy-drift']);assert.equal(x.requests.length,before);
 const result=await runGlmAgent({...x.input,client:createGlmClient(x.clientOptions)});assert.deepEqual(result.reason_codes,['glm.candidate-invalid']);
 assert.deepEqual(result.history.at(-1).delivered_call_ids,['a']);
 const checkpoint=JSON.parse(readFileSync(join(x.directory,'state','checkpoint.json'),'utf8'));assert.equal(checkpoint.phase,'terminal');
 assert.deepEqual(checkpoint.history.at(-1).delivered_call_ids,['a']);
});
