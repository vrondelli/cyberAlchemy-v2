// Offline candidate checks; no paid provider. Open questions: PLAN.md.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,mkdtempSync,mkdirSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{createServer}from'node:http';import{once}from'node:events';import{createHash}from'node:crypto';
const root=new URL('./snapshot/',import.meta.url),c=new URL('development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/',root),b=new URL('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/',root);
const {scopeToolCallIdentities}=await import(new URL('packet-diversity-v1/tool-call-identity-v1.mjs',c));const {projectHistory}=await import(new URL('discovery-v1/history.mjs',c));
const {createGlmClient,hash}=await import(new URL('packet-diversity-v1/transport-bounded-v3.mjs',c));const {createStagePersistence}=await import(new URL('packet-diversity-v1/stage-persistence.mjs',c));const {createStageOutputGuard}=await import(new URL('packet-diversity-v1/stage-output-guard.mjs',c));const {openContextRecycling}=await import(new URL('packet-diversity-v1/context-recycling-bounded-v3.mjs',c));
const {stable,attachObservationHandles,bindDelivery}=await import(new URL('delivery.mjs',b));const {capturePublicResponse,selectFinalReads}=await import(new URL('final-selection.mjs',b));
const sha=s=>createHash('sha256').update(s).digest('hex');
const fixture=JSON.parse(readFileSync(new URL('ARE-HISTORY.json',import.meta.url)));
test('retained full251-message history reproduces conflict; unique occurrence IDs remove structural collision',()=>{
 assert.equal(fixture.history.length,251);assert.throws(()=>projectHistory(fixture),/pending-content-conflict/);
 const h=structuredClone(fixture.history),seen=new Map();let duplicates=0;
 for(let i=0,sequence=1;i<h.length;i++)if(h[i].tool_calls?.length){const old=h[i],scoped=scopeToolCallIdentities(old,{request_sha256:sha(stable(old)),sequence:sequence++});h[i]=scoped.message;
  for(const m of scoped.evidence.mapping){if(seen.has(m.provider_id))duplicates++;seen.set(m.provider_id,true);const reply=h.slice(i+1,i+1+old.tool_calls.length).find(r=>r.tool_call_id===m.provider_id);assert.ok(reply);reply.tool_call_id=m.runtime_id;}}
 assert.equal(duplicates,1);const out=projectHistory({history:h,pending:h.slice(-3)});assert.equal(out.diagnostics.pending_protected,true);assert.equal(out.diagnostics.complete_exchanges_after,2);
 // This replay checks structure only; historical read IDs and scores are not rewritten.
});
test('mapping preserves all content and arguments, is deterministic, and separates repeated response IDs',()=>{
 const m=fixture.pending[0],original=structuredClone(m),scope={request_sha256:'a'.repeat(64),sequence:1};
 const a=scopeToolCallIdentities(m,scope),b=scopeToolCallIdentities(m,{...scope,sequence:2});assert.deepEqual(scopeToolCallIdentities(m,scope),a);assert.deepEqual(m,original);
 for(let i=0;i<m.tool_calls.length;i++){assert.notEqual(a.message.tool_calls[i].id,b.message.tool_calls[i].id);assert.deepEqual(a.message.tool_calls[i].function,m.tool_calls[i].function);a.message.tool_calls[i].id=m.tool_calls[i].id;}assert.deepEqual(a.message,m);
});
test('duplicate IDs within one response remain invalid, and scope must be explicit',()=>{
 const m=structuredClone(fixture.pending[0]);m.tool_calls[1].id=m.tool_calls[0].id;assert.throws(()=>scopeToolCallIdentities(m,{request_sha256:'a'.repeat(64),sequence:1}),/duplicate-or-invalid/);assert.throws(()=>scopeToolCallIdentities(fixture.pending[0],{request_sha256:'bad',sequence:0}),/scope/);
});
test('actual transport/recycler scopes repeated IDs, persists mapping, and binds both source deliveries and terminal selection',async t=>{
 const p=mkdtempSync(join(tmpdir(),'audit75-'));let cleanupRecycler;t.after(()=>{cleanupRecycler?.close();rmSync(p,{recursive:true,force:true});});mkdirSync(join(p,'evidence'));mkdirSync(join(p,'source'));let model=0;const selected=[],requests=[];
 const server=createServer(async(req,res)=>{let bytes='';for await(const chunk of req)bytes+=chunk;const body=JSON.parse(bytes);requests.push(body);res.setHeader('content-type','application/json');if(req.url==='/tokenizer')return res.end(JSON.stringify({usage:{prompt_tokens:100}}));
 model++;const message=model<=2?{role:'assistant',content:null,tool_calls:[{id:'provider-reused-id',type:'function',function:{name:'read_file',arguments:JSON.stringify({path:'source.txt',start_line:model,end_line:model})}}]}:{role:'assistant',content:JSON.stringify({summary:'Both observations',context_read_ids:selected})};res.end(JSON.stringify({model:'glm-5.3-flash',choices:[{message,finish_reason:model<=2?'tool_calls':'stop'}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}}));});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const base='http://127.0.0.1:'+server.address().port;
 const persistence=createStagePersistence({stage_root:join(p,'evidence'),stage_guard:createStageOutputGuard({root:join(p,'evidence')})}),opts={chat_endpoint:base+'/chat/completions',tokenizer_endpoint:base+'/tokenizer',maximum_output_tokens:8192,maximum_requests:96,maximum_response_bytes:1048576,request_budget:'contextbench-full-window-v1',persistence,before_dispatch:async()=>true};
 const client=createGlmClient({...opts,scope_tool_call_ids:true});assert.notEqual(client.identity,createGlmClient(opts).identity);
 const directory=join(p,'evidence/state'),recycler=openContextRecycling({persistence,transport:client.transport,scope:{request:'fixture'},fixture_root:join(p,'source'),options:{directory,context_limit:1000000,recycle_at:990000,safety_margin:10000,state:{objective:'fixture',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});client.bindRunLedger({directory,binding:'b'.repeat(64)});cleanupRecycler=recycler;
 const history=[],captures=[],ids=[];let final;
 for(let i=1;i<=3;i++){
  const result=await recycler.generate({history,run_id:'fixture',render:async()=>{const prompt=stable({messages:[{role:'user',content:'Read both lines'},...projectHistory({history}).history],tools:[]});captures.push({prompt,prompt_sha256:sha(prompt)});return prompt;},admit_dispatch:async()=>true});
  final=capturePublicResponse(result,client.receipts.lastIndexOf(result.receipt));const m=JSON.parse(result.final_bytes).message;history.push(m);
  if(i<=2){const call=m.tool_calls[0];ids.push(call.id);const output=attachObservationHandles(call,{ok:true,output:{path:'source.txt',start_line:i,end_line:i,source_sha256:sha('one\ntwo\n'),utf8:i===1?'one':'two',byte_count:3}});selected.push(output.output.read_id);history.push({role:'tool',tool_call_id:call.id,content:stable(output)});}
  recycler.completeStep(history,i===3);
 }
 assert.notEqual(ids[0],ids[1]);const binding=bindDelivery({captures,receipts:client.receipts});assert.deepEqual(binding.unmapped,[]);assert.equal(binding.read_observations.length,2);assert.equal(binding.token_accounting.known_total_tokens,450);assert.equal(binding.token_accounting.unknown_usage_dispatched_requests,0);assert.deepEqual(selectFinalReads({captures,receipts:client.receipts,response_capture:final}).final_read_ids,selected);
 const ledger=JSON.parse(readFileSync(join(directory,'glm-transport-ledger.json'))),{ledger_digest,...material}=ledger;assert.equal(hash(material),ledger_digest);const models=ledger.receipts.filter(r=>r.kind==='model');assert.equal(models.length,3);assert.deepEqual(models.slice(0,2).map(r=>r.tool_call_identity.mapping[0].provider_id),['provider-reused-id','provider-reused-id']);assert.equal(requests.filter(r=>r.stream===false).length,3);
});
