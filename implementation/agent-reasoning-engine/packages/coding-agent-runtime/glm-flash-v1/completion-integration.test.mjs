import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient,MODEL,hash,stable} from './transport.mjs';
import {runGlmAgent} from './agent.mjs';
import {FINAL_PATCH_REQUEST} from './completion.mjs';
import {parseConfig} from './cli.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {snapshotTree} from '../verifier.mjs';

const DROP_CONNECTION=Symbol('test transport disconnect');
const tc=(id,path='a.mjs',name='read-file')=>({id,type:'function',function:{name,arguments:JSON.stringify(name==='read-file'?{path}:path)}});
const reply=(message,finish_reason='stop')=>({model:MODEL,choices:[{message:{role:'assistant',...message},finish_reason}],usage:{prompt_tokens:100,completion_tokens:20}});
async function setup(t,handler,files={a:'export const a=1;\n',b:'export const b=1;\n'}) {
 const directory=mkdtempSync(join(tmpdir(),'are-delivery-')),root=join(directory,'fixture');mkdirSync(root);
 writeFileSync(join(root,'a.mjs'),files.a);writeFileSync(join(root,'b.mjs'),files.b);
 const base=snapshotTree(root),requests=[],invoked=[];
 const candidate={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,
  changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;\n'}],authority_effect:'none'};
 const server=createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));requests.push({path:req.url,body});
  const response=handler({body,requests,tokenizer:req.url.endsWith('/tokenizer'),candidate});
  if(response===DROP_CONNECTION){res.destroy();return;}
  res.setHeader('content-type','application/json');res.end(JSON.stringify(response));
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


function state(body){return body.messages[0].content.split('\n').map(line=>{try{return JSON.parse(line).completion_state;}catch{return null;}}).find(Boolean);}
test('completion budgets, current-request availability and final patch survive resume',async t=>{
 const states=[];
 const x=await setup(t,({tokenizer,body,requests,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  assert.doesNotMatch(body.messages[0].content,/"recent_progress":/);
  assert.match(body.messages[0].content,/"confirmed_archive_recovery_after_recycle":/);
  states.push(state(body));const n=states.length;
  return n<3?reply({tool_calls:[tc(n===1?'a':'b',n===1?'a.mjs':'b.mjs')]},'tool_calls'):reply({content:JSON.stringify(candidate)});
 });
 const input={...x.input,completion_policy:'budget-aware-v1',client:createGlmClient({...x.clientOptions,maximum_requests:3})};
 const paused=await runGlmAgent({...input,pause_after_steps:1});assert.equal(paused.status,'PAUSED');
 const r=await runGlmAgent({...input,client:createGlmClient({...x.clientOptions,maximum_requests:3})});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_policy,'budget-aware-v1');
 assert.deepEqual(states.map(s=>s.inspection_guidance.reading_turns_remaining),[0,0,0]);
 assert.deepEqual(states.map(s=>s.inspection_guidance.suggested_archive_read),[null,null,null]);
 assert.deepEqual(states.map(s=>s.remaining_model_turns),[3,2,1]);assert.deepEqual(states.map(s=>s.phase),['synthesize','synthesize','finalize']);
 assert.deepEqual(states.map(s=>s.remaining_tool_calls),[24,23,22]);
 assert.equal(states[1].files_seen_or_present.find(f=>f.path==='a.mjs').full_file_seen_or_present,true);
 assert.deepEqual(paused.delivery_progress.delivered_call_ids,[]); // rendered availability never became early durable confirmation
 assert.deepEqual(r.delivery_progress.delivered_call_ids,['a','b']);
});
test('completion policy cannot change on resume or enable without bounded delivery',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({tool_calls:[tc('a')]},'tool_calls'));
 const input={...x.input,completion_policy:'budget-aware-v1'};
 assert.equal((await runGlmAgent({...input,pause_after_steps:1})).status,'PAUSED');
 const r=await runGlmAgent({...input,completion_policy:'none',client:createGlmClient(x.clientOptions)});
 assert.deepEqual(r.reason_codes,['recycling.scope-or-policy-drift']);
 const invalid=await runGlmAgent({...input,delivery_policy:'legacy-v1',client:createGlmClient(x.clientOptions)});
 assert.deepEqual(invalid.reason_codes,['glm.completion-requires-bounded-delivery']);
});
test('completion hints do not raise caps if model ignores finalization',async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;assert.equal(state(body).remaining_model_turns,4-n);
  return reply({tool_calls:[tc('a'+n)]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,completion_policy:'budget-aware-v1',client:createGlmClient({...x.clientOptions,maximum_requests:3})});
 assert.deepEqual(r.reason_codes,['glm.model-request-limit']);assert.equal(n,3);
 assert.equal(r.receipts.filter(r=>r.kind==='model').length,3);
});
test('omitted completion policy preserves prompt and malformed final still fails',async t=>{
 const x=await setup(t,({tokenizer,body})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  assert.equal(state(body),undefined);return reply({content:'not a patch'});
 });
 const r=await runGlmAgent(x.input);assert.equal(r.completion_policy,'none');assert.deepEqual(r.reason_codes,['glm.candidate-invalid']);
});
test('current archive page advances prompt availability without prematurely confirming delivery',async t=>{
 const states=[];
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  states.push(state(body));
  if(states.length===1)return reply({tool_calls:[tc('a')]},'tool_calls');
  if(states.length===2)return reply({tool_calls:[tc('page',{call_id:'a',offset:0,max_chars:5},'read-inspection-evidence')]},'tool_calls');
  return reply({content:JSON.stringify(candidate)});
 });
 const input={...x.input,completion_policy:'budget-aware-v1'};
 const paused=await runGlmAgent({...input,pause_after_steps:2});
 assert.equal(paused.status,'PAUSED');assert.ok(!paused.delivery_progress.delivered_call_ids.includes('page'));
 const r=await runGlmAgent({...input,client:createGlmClient(x.clientOptions)});
 assert.equal(r.status,'AWAITING_APPROVAL');
 const file=states[2].files_seen_or_present.find(f=>f.path==='a.mjs');
 assert.deepEqual(file.archive_ranges_seen_or_present,[[0,5]]);assert.equal(file.first_missing_offset,5);
 assert.ok(r.delivery_progress.delivered_call_ids.includes('page'));
});


test('compact guidance removes redundant instruction bytes while preserving prompt evidence',async t=>{
 const baseline=JSON.parse(readFileSync(new URL('./evidence/prompt-overhead-baseline.json',import.meta.url),'utf8'));
 let checked=false;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  const system=body.messages[0].content;
  for(const text of baseline.after_instructions)assert.ok(system.includes(text));
  for(const text of baseline.before_instructions)assert.ok(!system.includes(text));
  const oldSystem=baseline.after_instructions.reduce((text,part,index)=>text.replace(part,baseline.before_instructions[index]),system);
  assert.ok(Buffer.byteLength(oldSystem)-Buffer.byteLength(system)>=700);
  assert.equal(body.messages[1].content,'Change a to 2');
  assert.match(system,/Never change tests/);
  assert.ok(state(body).inspection_guidance);
  checked=true;return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'budget-aware-v1'});
 assert.equal(r.status,'AWAITING_APPROVAL');assert.ok(checked);
});

for(const inputTokens of [5713,5740])test(`recorded oversized input ${inputTokens} still blocks before model dispatch`,async t=>{
 let modelCalls=0;
 const x=await setup(t,({tokenizer,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:inputTokens}};
  modelCalls++;return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'budget-aware-v1',source_policy:'inspected-mutation-v1',
  context_recycling:{...x.input.context_recycling,context_limit:16384,recycle_at:8000,safety_margin:256}});
 assert.deepEqual(r.reason_codes,['recycling.fresh-context-too-large']);assert.equal(modelCalls,0);
 assert.equal(r.delivery_progress.delivered_call_ids.length,0);
});


test('execution control defers confirmed repeats across resume and reserves final response',async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;
  if(n===1)return reply({tool_calls:[tc('first')]},'tool_calls');
  if(n===2)return reply({tool_calls:[tc('repeat')]},'tool_calls');
  if(n===3){
   const result=body.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).find(o=>o.reason_codes?.includes('completion.repeat-read-deferred'));
   assert.ok(result);return reply({tool_calls:[tc('recovery',result.output.suggested_archive_read.arguments,'read-inspection-evidence')]},'tool_calls');
  }
  assert.deepEqual(body.tools,[]);return reply({content:JSON.stringify(candidate)});
 });
 const input={...x.input,completion_policy:'bounded-execution-v2',client:createGlmClient({...x.clientOptions,maximum_requests:4})};
 const paused=await runGlmAgent({...input,pause_after_steps:1});assert.equal(paused.status,'PAUSED');
 const drift=await runGlmAgent({...input,completion_policy:'budget-aware-v1',client:createGlmClient({...x.clientOptions,maximum_requests:4})});
 assert.deepEqual(drift.reason_codes,['recycling.scope-or-policy-drift']);
 const r=await runGlmAgent({...input,client:createGlmClient({...x.clientOptions,maximum_requests:4})});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));
 assert.equal(x.invoked.length,1);assert.equal(n,4);
 assert.deepEqual(r.delivery_progress.deferred_call_ids,['repeat']);
 assert.deepEqual(r.delivery_progress.delivered_call_ids,['first','recovery']);
 assert.equal(r.history.flatMap(h=>h.calls??[]).length,3);
});

test('execution control rejects tools returned in final response before invocation',async t=>{
 const x=await setup(t,({tokenizer,body})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  assert.deepEqual(body.tools,[]);return reply({tool_calls:[tc('forbidden')]},'tool_calls');
 });
 const r=await runGlmAgent({...x.input,completion_policy:'bounded-execution-v2',client:createGlmClient({...x.clientOptions,maximum_requests:1})});
 assert.deepEqual(r.reason_codes,['glm.tool-denied']);assert.equal(x.invoked.length,0);
 assert.equal(r.receipts.filter(r=>r.kind==='model').length,1);
});

test('execution control does not accept unsupported final text as a repair',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({content:'Insufficient evidence'}));
 const r=await runGlmAgent({...x.input,completion_policy:'bounded-execution-v2',client:createGlmClient({...x.clientOptions,maximum_requests:1})});
 assert.deepEqual(r.reason_codes,['glm.candidate-invalid']);assert.equal(x.invoked.length,0);
});


test('v3 transitions after inspection across resume with native evidence and exact source intact',async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;
  if(n===1){assert.ok(body.tools.length);assert.notEqual(body.messages.at(-1).content,FINAL_PATCH_REQUEST);return reply({tool_calls:[tc('source')]},'tool_calls');}
  assert.deepEqual(body.tools,[]);assert.equal(body.messages.at(-1).role,'user');assert.equal(body.messages.at(-1).content,FINAL_PATCH_REQUEST);
  assert.equal(body.messages[1].content,'Change a to 2');
  assert.ok(body.messages.some(m=>m.role==='tool'&&m.tool_call_id==='source'));
  const attached=body.messages.filter(m=>m.role==='user').map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).find(m=>m?.sources);
  assert.equal(attached.sources[0].utf8,'export const a=1;\n');
  assert.equal(state(body).remaining_model_turns,3);
  return reply({content:JSON.stringify(candidate)});
 });
 const input={...x.input,source_policy:'inspected-mutation-v1',completion_policy:'explicit-finalization-v3',client:createGlmClient({...x.clientOptions,maximum_requests:4})};
 assert.equal((await runGlmAgent({...input,pause_after_steps:1})).status,'PAUSED');
 const r=await runGlmAgent({...input,client:createGlmClient({...x.clientOptions,maximum_requests:4})});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(n,2);
 assert.deepEqual(r.delivery_progress.delivered_call_ids,['source']);assert.equal(x.invoked.length,1);
});

for(const response of ['progress','tool'])test(`v3 rejects unsupported ${response} final response without retry`,async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body})=>{
  assert.deepEqual(body.tools,[]);assert.equal(body.messages.at(-1).content,FINAL_PATCH_REQUEST);
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;return response==='tool'?reply({tool_calls:[tc('unoffered')]},'tool_calls'):reply({content:'Insufficient evidence; continuing.'});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'explicit-finalization-v3',client:createGlmClient({...x.clientOptions,maximum_requests:3})});
 assert.deepEqual(r.reason_codes,[response==='tool'?'glm.tool-denied':'glm.candidate-invalid']);assert.equal(n,1);assert.equal(x.invoked.length,0);
});


test('v3 explicit final request still requires full tokenizer admission',async t=>{
 let calls=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  assert.equal(body.messages.at(-1).content,FINAL_PATCH_REQUEST);
  if(tokenizer)return {usage:{prompt_tokens:5740}};
  calls++;return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'explicit-finalization-v3',client:createGlmClient({...x.clientOptions,maximum_requests:3}),
  context_recycling:{...x.input.context_recycling,context_limit:16384,recycle_at:8000,safety_margin:256}});
 assert.deepEqual(r.reason_codes,['recycling.fresh-context-too-large']);assert.equal(calls,0);
 assert.deepEqual(r.delivery_progress.delivered_call_ids,[]);
});


test('v3 recovery instruction appears after all reads and recycling, then clears when recovery is present',async t=>{
 let n=0,overflow=false;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer){if(n===2&&!overflow){overflow=true;return {usage:{prompt_tokens:8500}};}return {usage:{prompt_tokens:100}};}
  n++;
  if(n<=2)return reply({tool_calls:[tc(n===1?'a':'b',n===1?'a.mjs':'b.mjs')]},'tool_calls');
  if(n===3){assert.match(body.messages.at(-1).content,/Before finalizing, complete one bounded archive recovery/);assert.match(body.messages.at(-1).content,/"call_id":"a"/);return reply({tool_calls:[tc('page',{call_id:'a',offset:0,max_chars:1024},'read-inspection-evidence')]},'tool_calls');}
  assert.equal(body.messages.at(-1).content,FINAL_PATCH_REQUEST);
  assert.ok(!body.messages.some(m=>m.role==='user'&&m.content.includes('Before finalizing, complete one bounded archive recovery')));
  return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'explicit-finalization-v3',client:createGlmClient({...x.clientOptions,maximum_requests:6})});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(n,4);
 assert.deepEqual(r.delivery_progress.meaningful_archive_delivery_call_ids,['page']);
});


test('v3 retains inspected requirements as user data in final request without extra reads',async t=>{
 let n=0;const requirements=['Preserve ordering','Preserve unique identifiers'];
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;if(n<=2)return reply({tool_calls:[tc(n===1?'a':'b',n===1?'a.mjs':'b.mjs')]},'tool_calls');
  const data=body.messages.filter(m=>m.role==='user').map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).find(m=>m?.posture==='untrusted-json-fields');
  assert.deepEqual(data.fields[0].value,requirements);assert.equal(data.fields[0].source_call_id,'b');
  assert.ok(!body.messages[0].content.includes('Preserve unique identifiers'));
  return reply({content:JSON.stringify(candidate)});
 },{a:'export const a=1;\n',b:JSON.stringify({requirements,examples:['not pinned']})});
 const r=await runGlmAgent({...x.input,completion_policy:'explicit-finalization-v3',client:createGlmClient({...x.clientOptions,maximum_requests:5})});
 assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(x.invoked.length,2);
 assert.deepEqual(r.delivery_progress.delivered_call_ids,['a','b']);
});

for(const policy of ['explicit-finalization-v3','patch-contract-v4','compact-contract-v5','deduplicated-state-v6'])test(`${policy} early finalization contract guidance is opt-in`,async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;
  const guidance=body.messages.filter(m=>m.role==='user'&&(m.content.includes('Top-level keys:')||m.content.startsWith('Final JSON:')));
  assert.equal(guidance.length,policy!=='explicit-finalization-v3'&&n===3?1:0);
  assert(body.tools.length>0);
  return n<3?reply({tool_calls:[tc(String(n),n===1?'a.mjs':'b.mjs')]},'tool_calls'):reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:policy});
 assert.equal(r.status,'AWAITING_APPROVAL');assert.equal(n,3);assert.equal(r.effect_applied,false);
 assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
});
for(const [name,mutate,reasons] of [
 ['nested rationale',c=>{c.changes[0].rationale='reason'},['patch-set.change-invalid']],
 ['extra digest',c=>{c.changes[0].replacement_sha256='0'.repeat(64)},['patch-set.change-invalid']],
 ['missing authority',c=>{delete c.authority_effect},['patch-set.authority-effect-invalid']],
 ['combined defects',c=>{c.changes[0].rationale='reason';delete c.authority_effect},['patch-set.authority-effect-invalid','patch-set.change-invalid']]
])test(`v4 rejects ${name} with exact diagnostics and no retry`,async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;assert.deepEqual(body.tools,[]);
  assert(body.messages.some(m=>m.role==='user'&&(m.content.includes('Top-level keys:')||m.content.startsWith('Final JSON:'))));
  mutate(candidate);return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'patch-contract-v4',client:createGlmClient({...x.clientOptions,maximum_requests:3})});
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['glm.candidate-invalid']);
 const {issues,truncated,...legacy}=r.candidate_validation;
 assert.deepEqual(legacy,{ok:false,reason_codes:reasons,authority_effect:'none'});assert.equal(truncated,false);assert.ok(issues.length>=reasons.length);assert.ok(issues.every(i=>typeof i.instance_path==='string'&&reasons.includes(i.code))); 
 assert.equal(n,1);assert.equal(r.automatic_retry_permitted,false);assert.equal(r.effect_applied,false);
 assert.equal(r.candidate,undefined);assert.equal(x.invoked.length,0);
 assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
});

for(const [name,mutate,reasons] of [
 ['nested rationale',c=>{c.changes[0].rationale='reason'},['patch-set.change-invalid']],
 ['extra digest',c=>{c.changes[0].replacement_sha256='0'.repeat(64)},['patch-set.change-invalid']],
 ['missing authority',c=>{delete c.authority_effect},['patch-set.authority-effect-invalid']],
 ['combined defects',c=>{c.changes[0].rationale='reason';delete c.authority_effect},['patch-set.authority-effect-invalid','patch-set.change-invalid']]
])test(`v5 rejects ${name} with exact diagnostics and no retry`,async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;assert.deepEqual(body.tools,[]);
  assert(body.messages.some(m=>m.role==='user'&&(m.content.includes('Top-level keys:')||m.content.startsWith('Final JSON:'))));
  mutate(candidate);return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:'compact-contract-v5',client:createGlmClient({...x.clientOptions,maximum_requests:3})});
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['glm.candidate-invalid']);
 const {issues,truncated,...legacy}=r.candidate_validation;
 assert.deepEqual(legacy,{ok:false,reason_codes:reasons,authority_effect:'none'});assert.equal(truncated,false);assert.ok(issues.length>=reasons.length);assert.ok(issues.every(i=>typeof i.instance_path==='string'&&reasons.includes(i.code))); 
 assert.equal(n,1);assert.equal(r.automatic_retry_permitted,false);assert.equal(r.effect_applied,false);
 assert.equal(r.candidate,undefined);assert.equal(x.invoked.length,0);
 assert.equal(readFileSync(join(x.root,'a.mjs'),'utf8'),'export const a=1;\n');
});

test('v5 reduces a final request relative to v4 while preserving schema and recovery guidance',async t=>{
 const sizes={};
 for(const policy of ['patch-contract-v4','compact-contract-v5']){
  const x=await setup(t,({tokenizer,body,candidate})=>{
   if(tokenizer)return {usage:{prompt_tokens:100}};
   sizes[policy]=Buffer.byteLength(JSON.stringify(body));
   assert.deepEqual(body.tools,[]);
   const text=body.messages.map(m=>m.content).join('\n');
   assert.match(text,/expected_file_sha256/);assert.match(text,/authority_effect/);
   assert.match(text,/recovery/);assert.match(text,/half-open UTF-16/);
   return reply({content:JSON.stringify(candidate)});
  });
  const r=await runGlmAgent({...x.input,completion_policy:policy,client:createGlmClient({...x.clientOptions,maximum_requests:3})});
  assert.equal(r.status,'AWAITING_APPROVAL');
 }
 assert(sizes['patch-contract-v4']-sizes['compact-contract-v5']>300,JSON.stringify(sizes));
});


test('v6 removes only redundant progress digests and preserves authoritative mutation binding',async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;
  if(n===3){
   const completion=state(body);assert.equal(completion.files_seen_or_present.length,2);
   assert(completion.files_seen_or_present.every(f=>!Object.hasOwn(f,'sha256')&&f.full_file_seen_or_present));
   const lines=body.messages[0].content.split('\n').flatMap(line=>{try{return [JSON.parse(line)]}catch{return []}});
   const progress=lines.find(x=>x.inspection_progress).inspection_progress.successful_file_reads;
   assert(progress.every(r=>!Object.hasOwn(r,'file_sha256')));
   assert.equal(lines.find(x=>x.mutation_files).mutation_files['a.mjs'],candidate.changes[0].expected_file_sha256);
  }
  return n<3?reply({tool_calls:[tc(String(n),n===1?'a.mjs':'b.mjs')]},'tool_calls'):reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,source_policy:'inspected-mutation-v1',completion_policy:'deduplicated-state-v6'});
 assert.equal(r.status,'AWAITING_APPROVAL');assert.equal(n,3);
 assert(r.history[0].observations[0].output.sha256);assert.deepEqual(r.delivery_progress.delivered_call_ids,['1','2']);
});

for(const policy of ['deduplicated-state-v6','reserved-headroom-v7'])test(`${policy} reserves soft headroom before dispatch`,async t=>{
 let calls=0;
 const x=await setup(t,({tokenizer,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:6500}};
  calls++;return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,completion_policy:policy});
 if(policy==='reserved-headroom-v7'){
  assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['recycling.fresh-context-too-large']);assert.equal(calls,0);
  assert.deepEqual(r.admission_policy,{configured_soft_limit:9000,soft_headroom_reservation:256,effective_recycle_at:8744});
 }else{assert.equal(r.status,'AWAITING_APPROVAL');assert.equal(calls,1);}
});
test('v7 admitted requests retain reserve and policy cannot change on resume',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:6400}}:reply({tool_calls:[tc('a')]},'tool_calls'));
 const input={...x.input,completion_policy:'reserved-headroom-v7'};
 const paused=await runGlmAgent({...input,pause_after_steps:1});assert.equal(paused.status,'PAUSED');
 assert(paused.recycling.dispatches.every(d=>9000-d.projected_upper_bound>256));
 const changed=await runGlmAgent({...input,completion_policy:'deduplicated-state-v6',client:createGlmClient(x.clientOptions)});
 assert.equal(changed.status,'BLOCK');assert.deepEqual(changed.reason_codes,['recycling.scope-or-policy-drift']);
});

const v8Requirements={required_reads:['a.mjs','b.mjs'],distinct_turns:true,archive_after_recycle:true};
test('v8 rejects an early valid patch without retry or acceptance',async t=>{
 let n=0;const x=await setup(t,({tokenizer,candidate})=>{if(tokenizer)return {usage:{prompt_tokens:100}};n++;return reply({content:JSON.stringify(candidate)});});
 const r=await runGlmAgent({...x.input,completion_policy:'verified-completion-v8',completion_requirements:v8Requirements,client:createGlmClient({...x.clientOptions,token_margin:512})});
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['glm.completion-requirements-unmet']);assert.deepEqual(r.completion_gate.missing_required_reads,['a.mjs','b.mjs']);assert.equal(n,1);assert.equal(r.candidate,undefined);assert.equal(r.automatic_retry_permitted,false);
});
for(const recover of [false,true])test(`v8 ${recover?'accepts confirmed':'rejects missing'} post-recycle archive recovery`,async t=>{
 let n=0;const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:body.messages[0].content.includes('"generation":0')&&body.messages.some(m=>m.role==='tool')?9000:100}};
  n++;
  if(n<=2)return reply({tool_calls:[tc(n===1?'a':'b',n===1?'a.mjs':'b.mjs')]},'tool_calls');
  if(recover&&n===3)return reply({tool_calls:[tc('archive',{call_id:'a',offset:0,max_chars:16},'read-inspection-evidence')]},'tool_calls');
  return reply({content:JSON.stringify(candidate)});
 });
 const r=await runGlmAgent({...x.input,source_policy:'inspected-mutation-v1',completion_policy:'verified-completion-v8',completion_requirements:v8Requirements,client:createGlmClient({...x.clientOptions,token_margin:512})});
 assert(r.recycling.recycles>0);assert.deepEqual(r.completion_gate.missing_required_reads,[]);
 assert.equal(r.completion_gate.archive_recovery_required,true);assert.equal(r.completion_gate.archive_recovery_confirmed,recover);
 assert.equal(r.status,recover?'AWAITING_APPROVAL':'BLOCK');assert.equal(n,recover?4:3);
});
test('v8 requirements are scope-bound across resume',async t=>{
 const x=await setup(t,({tokenizer})=>tokenizer?{usage:{prompt_tokens:100}}:reply({tool_calls:[tc('a')]},'tool_calls'));
 const make=()=>createGlmClient({...x.clientOptions,token_margin:512});const input={...x.input,completion_policy:'verified-completion-v8',completion_requirements:v8Requirements,client:make()};
 assert.equal((await runGlmAgent({...input,pause_after_steps:1})).status,'PAUSED');
 const r=await runGlmAgent({...input,client:make(),completion_requirements:{...v8Requirements,required_reads:['a.mjs']}});
 assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['recycling.scope-or-policy-drift']);
});

test('v9 confirms both pages across resume and rejects a premature patch',async t=>{
 for(const early of [false,true]){
  let n=0;
  const x=await setup(t,({tokenizer,body,candidate})=>{
   if(tokenizer)return {usage:{prompt_tokens:100}};
   n++;
   if(n===1)return reply({tool_calls:[tc('small')]},'tool_calls');
   if(n===2)return reply({tool_calls:[tc('page0','b.mjs')]},'tool_calls');
   if(n===3&&!early)return reply({tool_calls:[{id:'page1',type:'function',function:{name:'read-file',arguments:JSON.stringify({path:'b.mjs',offset:5000})}}]},'tool_calls');
   return reply({content:JSON.stringify(candidate)});
  },{a:'export const a=1;',b:'x'.repeat(9000)});
  const config={...x.input,completion_policy:'paged-completion-v9',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:['a.mjs','b.mjs'],distinct_turns:true,archive_after_recycle:false}};
  const paused=await runGlmAgent({...config,client:createGlmClient({...x.clientOptions,token_margin:512}),pause_after_steps:2});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
  const r=await runGlmAgent({...config,client:createGlmClient({...x.clientOptions,token_margin:512})});
  assert.equal(r.status,early?'BLOCK':'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,!early);
  if(early)assert.deepEqual(r.completion_gate.missing_required_reads,['b.mjs']);
  else assert.ok(r.delivery_progress.delivered_call_ids.includes('page1'));
 }
});

test('v10 compact next-read hint completes a large file in two confirmed pages',async t=>{
 let n=0;
 const x=await setup(t,({tokenizer,body,candidate})=>{
  if(tokenizer)return {usage:{prompt_tokens:100}};
  n++;const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(x=>'next_required_read' in x);
  assert.ok(control);assert.doesNotMatch(body.messages[0].content,/files_seen_or_present/);
  if(control.next_required_read){const call=control.next_required_read;return reply({tool_calls:[{id:'read'+n,type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]},'tool_calls');}
  return reply({content:JSON.stringify(candidate)});
 },{a:'export const a=1;',b:'x'.repeat(10732)});
 const result=await runGlmAgent({...x.input,completion_policy:'compact-paging-v10',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:['a.mjs','b.mjs'],distinct_turns:true,archive_after_recycle:false},client:createGlmClient({...x.clientOptions,token_margin:512})});
 assert.equal(result.status,'AWAITING_APPROVAL',JSON.stringify(result.reason_codes));assert.equal(n,4);assert.equal(result.completion_gate.passed,true);
 assert.deepEqual(result.history.filter(e=>e.calls?.[0].arguments.path==='b.mjs').map(e=>e.observations[0].output.next_offset),[5500,10732]);
});

test('v12 8K budget carries fourteen file reads, archive recovery and final across resume',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.deepEqual(body.tools,[]);
  const base=snapshotTree(x.root);return reply({content:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})});
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'budgeted-paging-v12',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1'});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);
});

test('v12 rejects a mismatched client budget and impossible remaining reads before dispatch',async t=>{
 const x=await setup(t,()=>{throw new Error('unexpected dispatch');});
 const config={...x.input,completion_policy:'budgeted-paging-v12',completion_requirements:{required_reads:['a.mjs'],distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const bad=await runGlmAgent({...config,client:createGlmClient({...x.clientOptions,token_margin:512})});assert.deepEqual(bad.reason_codes,['glm.completion-request-budget-invalid']);
 const paths=['a.mjs','b.mjs'];for(let i=0;i<14;i++){const path='extra'+i+'.mjs';paths.push(path);writeFileSync(join(x.root,path),'x');}
 const r=await runGlmAgent({...config,observation_allowlist:paths,tool_runtime:createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths}),completion_requirements:{...config.completion_requirements,required_reads:paths},client:createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1'})});
 assert.deepEqual(r.reason_codes,['glm.page-turn-budget-insufficient']);assert.equal(x.requests.length,0);assert.equal(r.receipts.length,0);
});

test('v13 gives exact late page instructions across a full 16-turn resumed episode',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.deepEqual(body.tools,[]);
  const base=snapshotTree(x.root);return reply({content:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})});
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'page-adherence-v13',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1'});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);
});


test('v14 preserves final deadline across page instructions across a full 16-turn resumed episode',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.deepEqual(body.tools,[]);
  const base=snapshotTree(x.root);return reply({content:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})});
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'final-latency-v14',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);
});


test('v15 places exact final synthesis contract last after recovery and resume',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){assert.ok(!body.messages.some(m=>m.content?.startsWith('Before answering, compare')));const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.deepEqual(body.tools,[]);
  const base=snapshotTree(x.root);const last=body.messages.at(-1).content;assert.ok(last.startsWith('Before answering, compare'));const template=JSON.parse(last.split('\n').at(-1));assert.equal(template.expected_base_tree_sha256,base.tree_sha256);assert.equal(template.changes[0].expected_file_sha256,base.files['a.mjs']);assert.equal(template.authority_effect,'none');assert.equal(template.schema_version,'are.patch-set-candidate/v1');return reply({content:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})});
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'synthesis-adherence-v15',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);
});


test('v16 completes native submission after full inspection, recovery and resume',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.equal(body.tools.length,1);assert.equal(body.tools[0].function.name,'submit_patch_candidate');
  const base=snapshotTree(x.root);return reply({tool_calls:[{id:'submission',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})}}]},'tool_calls');
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'native-submission-v16',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000,native_submission:true});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);assert.equal(r.history.at(-1).messages.length,1);assert.equal(r.history.at(-1).calls,undefined);const resumed=await runGlmAgent({...config,client:client()});assert.equal(resumed.status,'BLOCK');
});


test('v16 rejects a premature native proposal through the existing delivery gate',async t=>{
 let x;
 x=await setup(t,({tokenizer})=>{if(tokenizer)return {usage:{prompt_tokens:100}};const b=snapshotTree(x.root);return reply({tool_calls:[{id:'premature',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:b.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:b.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})}}]},'tool_calls');});
 const r=await runGlmAgent({...x.input,completion_policy:'native-submission-v16',completion_requirements:{required_reads:['a.mjs'],distinct_turns:true,archive_after_recycle:true},client:createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000,native_submission:true}),context_recycling:{...x.input.context_recycling,recycle_at:8000}});
 assert.deepEqual(r.reason_codes,['glm.completion-requirements-unmet']);assert.equal(r.history.length,1);assert.equal(r.history[0].observations,undefined);assert.equal(r.effect_applied,false);
});

test('v17 uses high reasoning only on final native submission and preserves resume',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;assert.equal(body.reasoning_effort,n===16?'high':'low');
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.equal(body.tools.length,1);assert.equal(body.tools[0].function.name,'submit_patch_candidate');
  const base=snapshotTree(x.root);return reply({tool_calls:[{id:'submission',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})}}]},'tool_calls');
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'native-reasoning-v17',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000,native_submission:true,final_reasoning_effort:'high'});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);assert.equal(r.history.at(-1).messages.length,1);assert.equal(r.history.at(-1).calls,undefined);const resumed=await runGlmAgent({...config,client:client()});assert.equal(resumed.status,'BLOCK');
});


test('v18 keeps low native reasoning and appends minimal repair obligations after resume',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.equal(body.reasoning_effort,'low');assert.ok(body.messages.some(m=>m.content?.includes('Map EACH inspected requirement')));assert.equal(body.tools.length,1);assert.equal(body.tools[0].function.name,'submit_patch_candidate');
  const base=snapshotTree(x.root);return reply({tool_calls:[{id:'submission',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})}}]},'tool_calls');
 });
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'minimal-repair-v18',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000,native_submission:true});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);assert.equal(r.history.at(-1).messages.length,1);assert.equal(r.history.at(-1).calls,undefined);const resumed=await runGlmAgent({...config,client:client()});assert.equal(resumed.status,'BLOCK');
});


test('v19 delivers exact inspected example fields on terminal native submission after resume',async t=>{
 let x,n=0;
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.ok(body.messages.some(m=>{try{return JSON.parse(m.content).fields?.some(f=>f.values?.some(v=>v.value==='Exact example evidence.'));}catch{return false;}}));assert.equal(body.tools.length,1);assert.equal(body.tools[0].function.name,'submit_patch_candidate');
  const base=snapshotTree(x.root);return reply({tool_calls:[{id:'submission',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})}}]},'tool_calls');
 });
 writeFileSync(join(x.root,'b.mjs'),JSON.stringify({examples:[{interpretation:'Exact example evidence.'}]}));
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'case-evidence-v19',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000,native_submission:true});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);assert.equal(r.history.at(-1).messages.length,1);assert.equal(r.history.at(-1).calls,undefined);const resumed=await runGlmAgent({...config,client:client()});assert.equal(resumed.status,'BLOCK');
});


for(const maximum_model_retries of [0,2])test(`v20 terminal native submission survives resume and ${maximum_model_retries} physical retries`,async t=>{
 let x,n=0;const failedTurns=new Set();
 const paths=['a.mjs','b.mjs','c.mjs','d.mjs','e.mjs','f.mjs'];
 x=await setup(t,({tokenizer,body})=>{
  const control=body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
  if(tokenizer)return {usage:{prompt_tokens:control?.generation===0&&body.messages.some(m=>m.role==='tool')?7000:100}};
  if(maximum_model_retries&&[0,15].includes(n)&&!failedTurns.has(n)){failedTurns.add(n);return DROP_CONNECTION;}
  n++;
  const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));
  if(control.next_required_read){assert.ok(action);const hinted=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);assert.deepEqual(hinted,control.next_required_read);assert.ok(Number.isSafeInteger(hinted.arguments.offset));}
  if(control.next_required_read){const c=control.next_required_read;return reply({tool_calls:[{id:'p'+n,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}]},'tool_calls');}
  if(n===15)return reply({tool_calls:[tc('recovery',{call_id:'p1',offset:0,max_chars:100},'read-inspection-evidence')]},'tool_calls');
  assert.equal(n,16);assert.ok(body.messages.some(m=>{try{return JSON.parse(m.content).fields?.some(f=>f.values?.some(v=>v.value==='Exact example evidence.'));}catch{return false;}}));assert.equal(body.tools.length,1);assert.equal(body.tools[0].function.name,'submit_patch_candidate');
  const base=snapshotTree(x.root);return reply({tool_calls:[{id:'submission',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;'}],authority_effect:'none'})}}]},'tool_calls');
 });
 writeFileSync(join(x.root,'b.mjs'),JSON.stringify({examples:[{explanation:'Exact example evidence.'}]}));
 for(const path of paths.slice(2))writeFileSync(join(x.root,path),'x'.repeat(9800));
 const runtime=createReadOnlyToolRuntime({repository_root:x.root,observation_allowlist:paths});
 const config={...x.input,tool_runtime:runtime,observation_allowlist:paths,completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},context_recycling:{...x.input.context_recycling,recycle_at:8000}};
 const client=()=>createGlmClient({...x.clientOptions,token_margin:512,maximum_requests:16,request_budget:'paging-v1',final_timeout_ms:60000,native_submission:true,maximum_model_retries});
 const paused=await runGlmAgent({...config,client:client(),pause_after_steps:13});assert.equal(paused.status,'PAUSED',JSON.stringify(paused.reason_codes));
 const r=await runGlmAgent({...config,client:client()});assert.equal(r.status,'AWAITING_APPROVAL',JSON.stringify(r.reason_codes));assert.equal(r.completion_gate.passed,true);assert.equal(r.receipts.filter(x=>x.kind==='model').at(-1).timeout_ms,60000);assert.equal(n,16);assert.equal(r.receipts.filter(r=>r.kind==='model').length,16+maximum_model_retries);assert.equal(r.paging_budget.maximum_requests,16);assert.ok(r.recycling.recycles>0);assert.equal(r.history.at(-1).messages.length,1);assert.equal(r.history.at(-1).calls,undefined);const resumed=await runGlmAgent({...config,client:client()});assert.equal(resumed.status,'BLOCK');
});

