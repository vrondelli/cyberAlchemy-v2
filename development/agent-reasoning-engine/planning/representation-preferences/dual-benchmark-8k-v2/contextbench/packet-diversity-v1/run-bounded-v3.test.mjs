import {createStageOutputGuard} from './stage-output-guard.mjs';
import {createStagePersistence} from './stage-persistence.mjs';
import {openContextRecycling} from './context-recycling-bounded-v3.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import http from 'node:http';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {createGlmClient,MODEL} from './transport-bounded-v3.mjs';
import {stable,bodyForReceipt,attachObservationHandles,bindDelivery} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {reasoningEvidence} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {buildTerminalEvidence,EXPANDED} from './terminal-evidence.mjs';
import {extractBoundary,preparePackets,hash} from './prepare.mjs';
import {runNativeRequest,runSlot,derivePrefixLedger,measureNativeWire,runPairs,classifyExportFailure,hasAccountedModelAttempt} from './run-bounded-v3.mjs';
const clientOptions={chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_request_bytes:262144,request_budget:'contextbench-deferral-v1',token_margin:512,model_timeout_ms:120000};
async function fixture({io,before_dispatch=()=>{}}={}){
 const root=mkdtempSync(join(tmpdir(),'packet-native-')),repoRoot=join(root,'base');mkdirSync(repoRoot);writeFileSync(join(repoRoot,'a.js'),'alpha beta\n');
 const task={instance_id:'fixture',repo_url:'https://example.invalid/source.git',base_commit:'a'.repeat(40),problem_statement:'alpha beta'};
 const call={id:'r1',type:'function',function:{name:'read_file',arguments:stable({path:'a.js',start_line:1,line_count:1})}};
 const observation=attachObservationHandles(call,{ok:true,output:{path:'a.js',start_line:1,end_line:1,utf8:'alpha beta',source_sha256:hash('alpha beta\n')}});
 const prefixPrompt=stable({messages:[{role:'user',content:'alpha beta'},{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:'r1',content:stable(observation)}],tools:[]});
 const message={role:'assistant',content:'Observed source.',reasoning_content:'synthetic fixture reasoning'};
 const profile={kind:'model',status:200,dispatched:true,model:MODEL,reasoning_effort:'low',output_cap:2048,input_tokens:100,output_tokens:20,finish_reason:'stop'};
 const receipt={...profile,request_sha256:hash(stable(bodyForReceipt(prefixPrompt,profile))),retained_reasoning:reasoningEvidence(message,{output_tokens:20,reasoning_tokens:7}),reasoning_tokens:7};
 const captures=[{prompt:prefixPrompt,prompt_sha256:hash(prefixPrompt)}],reads=bindDelivery({captures,receipts:[receipt]}).read_observations;
 const snapshots=[{path:'a.js',source_sha256:hash('alpha beta\n'),utf8:'alpha beta\n'}];
 const packet=await buildTerminalEvidence({reads,snapshots,repoRoot,problem_statement:task.problem_statement,version:EXPANDED,measure_tokens:async()=>30});
 const prompt=stable({messages:[{role:'user',content:task.problem_statement},message,{role:'user',content:packet.model.text}],tools:[packet.model.tool]});
 const last={...profile,finish_reason:'tool_calls',request_sha256:hash(stable(bodyForReceipt(prompt,profile)))};
 const result={captures:[...captures,{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt,last],terminal_evidence_presentations:[{packet}],terminal_evidence_attempts:[{receipt_start_index:1,receipt_index:1,receipt_sha256:hash(last),request_sha256:last.request_sha256}]};
 const persistence=createStagePersistence({stage_guard:createStageOutputGuard({root}),stage_root:root,io});const boundedOptions={...clientOptions,persistence,before_dispatch};
 const client=createGlmClient(boundedOptions),cell={context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{maximum_calls:96,output_cap:2048},provider_profile:{token_margin:512,request_tokenizer_transport_attempts:1,index_tokenizer_transport_attempts:1}};
 const material={version:1,binding:'b'.repeat(64),identity:client.identity,phase:'idle',model_calls:2,tokenizer_calls:0,receipts:result.receipts};
 const ledger={...material,ledger_digest:hash(material)};
 const donor={...extractBoundary({result,ledger,task,cell,donor_id:'fixture-control'}),snapshots};
 return {root,repoRoot,donor,prompt,result,ledger,task,cell,persistence,create_client:()=>createGlmClient(boundedOptions),storage_guard:()=>{},cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
/** No sockets: replace the HTTP primitive with in-memory wire responses, keeping
 * the actual GLM transport, private registration, ledger and recycler active. */
async function wireFixture(fn,{tokenCount=100,status=200,omitUsage=false,onModel=()=>{},handles=['h0']}={}){
 const original=http.request,calls=[];
 http.request=(url,options,callback)=>{const request=new EventEmitter();request.destroy=()=>{};request.end=body=>{
  const requestBody=JSON.parse(body);calls.push({path:url.pathname,body:requestBody});
  const tokenizer=url.pathname.endsWith('/tokenizer');if(!tokenizer)onModel();
  const message={role:'assistant',content:null,tool_calls:[{id:'terminal',type:'function',function:{name:'submit_context_handles_v2',arguments:stable({summary:'Synthetic selection',context_handles:handles})}}]};
  const payload=tokenizer?{usage:{prompt_tokens:tokenCount}}:status!==200?{error:{code:'1305'}}:{model:MODEL,choices:[{message,finish_reason:'tool_calls'}],...(!omitUsage?{usage:{prompt_tokens:100,completion_tokens:20}}:{})};
  queueMicrotask(()=>{const response=new EventEmitter();response.headers={'content-type':'application/json'};response.statusCode=tokenizer?200:status;response.destroy=()=>{};callback(response);response.emit('data',Buffer.from(JSON.stringify(payload)));response.emit('end');});
 };return request;};syncBuiltinESMExports();
 try{return await fn(calls);}finally{http.request=original;syncBuiltinESMExports();}
}
test('actual native continuation reserves archived reasoning, one new call and native export',async()=>{
 const f=await fixture();try{await wireFixture(async calls=>{
  const prepared=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async()=>2667});
  const result=await runSlot({...f,prepared,variant:'diversity',directory:join(f.root,'live'),model_dispatch_enabled:true});
  assert.equal(result.status,'completed');assert.equal(result.usage.total_tokens,120);assert.equal(result.usage.model_calls,1);assert.equal(result.prefix_usage.total_tokens,120);assert.equal(result.admission.input_upper_bound,619);assert.equal(result.admission.projected_upper_bound,2667);assert.equal(result.receipts.length,3);assert.deepEqual(result.receipts[0],f.donor.receipts[0]);
  assert.deepEqual(calls.map(c=>c.path),['/tokenizer','/chat/completions']);assert.equal(calls[1].body.max_tokens,2048);assert.deepEqual(calls[1].body.tools,[prepared.pair.diversity.model.tool]);
  const ledger=JSON.parse(readFileSync(join(f.root,'live/state/glm-transport-ledger.json')));assert.equal(ledger.model_calls,2);assert.equal(ledger.tokenizer_calls,1);
  assert.equal(result.native_export.selection.final_read_ids.length,1);assert.equal(JSON.parse(readFileSync(join(f.root,'live/request-result.json'))).generated,undefined);
 });}finally{f.cleanup();}
});
test('preflight and shared health callback deny real model dispatch; oversized wire never recycles',async()=>{
 const f=await fixture();try{await wireFixture(async calls=>{
  const p=await measureNativeWire({...f,directory:join(f.root,'preflight')});assert.equal(p.projected_upper_bound,2667);assert.equal(p.result.status,'preflight');
  const r=await runNativeRequest({...f,directory:join(f.root,'denied'),model_dispatch_enabled:true,before_model_dispatch:async()=>false});assert.equal(r.entered,false);assert.equal(r.usage.model_calls,0);assert.equal(calls.some(c=>c.path.endsWith('/chat/completions')),false);
 });await wireFixture(async calls=>{const p=await measureNativeWire({...f,directory:join(f.root,'oversize')});assert.equal(p.projected_upper_bound,8567);assert.equal(p.result.status,'failed');assert.equal(p.result.admission,null);assert.equal(calls.length,1);},{tokenCount:6000});}finally{f.cleanup();}
});
test('unbound reasoning, ledger drift and unknown prefix reject before any socket primitive',async()=>{
 const f=await fixture();try{
  assert.throws(()=>derivePrefixLedger({donor:f.donor,binding:'c'.repeat(64),identity:'d'.repeat(64)}),/identity-drift/);
  const bad=structuredClone(f.donor);delete bad.receipts[0].retained_reasoning;bad.prefix_receipts_sha256=hash(bad.receipts);
  await assert.rejects(runNativeRequest({...f,donor:bad,directory:join(f.root,'bad')}),/unbound-retained-reasoning/);assert.equal(existsSync(join(f.root,'bad')),false);
  const unknown=structuredClone(f.donor);delete unknown.receipts[0].output_tokens;unknown.prefix_receipts_sha256=hash(unknown.receipts);assert.throws(()=>derivePrefixLedger({donor:unknown,binding:'c'.repeat(64),identity:unknown.ledger_identity}),/prefix-known-usage/);
 }finally{f.cleanup();}
});
test('native capacity rejection and missing usage retain unknown cost without retry',async()=>{
 const f=await fixture();try{for(const [name,options]of [['capacity',{status:503}],['unknown',{omitUsage:true}]])await wireFixture(async calls=>{
  const r=await runNativeRequest({...f,directory:join(f.root,name),model_dispatch_enabled:true});assert.equal(r.usage.model_calls,1);assert.equal(r.unknown_usage,true);assert.equal(r.usage.conservative_total_tokens,8000);assert.equal(calls.filter(c=>c.path.endsWith('/chat/completions')).length,1);if(name==='capacity')assert.equal(r.provider_error_code,'1305');
 },options);}finally{f.cleanup();}
});
test('paired pool uses fixed AB/BA and two workers; unknown stops remaining slots',async()=>{
 const jobs=Array.from({length:8},(_,i)=>({donor:{donor_index:i,donor_id:'d'+i,task:{instance_id:'t'+Math.floor(i/2)}}}));let active=0,peak=0;const orders=new Map();
 const all=await runPairs({jobs,execute_slot:async j=>{active++;peak=Math.max(peak,active);orders.set(j.donor.donor_id,[...(orders.get(j.donor.donor_id)??[]),j.variant]);await new Promise(r=>setTimeout(r,1));active--;return {status:'completed',usage:{total_tokens:1},unknown_usage:false};}});
 assert.equal(peak,2);assert.equal(all.slots.length,16);assert.deepEqual(orders.get('d0'),['legacy','diversity']);assert.deepEqual(orders.get('d1'),['diversity','legacy']);
 const stopped=await runPairs({jobs,execute_slot:async()=>({status:'failed',unknown_usage:true,usage:{total_tokens:0}})});assert.equal(stopped.all_valid,false);assert.ok(stopped.slots.some(s=>s.status==='not-started-shared-health-stop'));assert.equal(stopped.slots.length,16);
});

test('known native model usage survives ledger persistence failure and stops shared health',async()=>{
 const f=await fixture({io:{writeFileSync:(...args)=>fs.writeFileSync(...args)}});const original=fs.writeFileSync;let fired=false;
 try{await wireFixture(async()=>{
  fs.writeFileSync=(path,data,...args)=>{let body;try{body=JSON.parse(data);}catch{}if(!fired&&body?.model_calls===2&&body?.phase==='idle'&&body.receipts?.at(-1)?.kind==='model'){fired=true;throw Object.assign(Error('synthetic full disk'),{code:'ENOSPC'});}return original(path,data,...args);};syncBuiltinESMExports();
  const r=await runNativeRequest({...f,directory:join(f.root,'persistence'),model_dispatch_enabled:true});assert.equal(fired,true);assert.equal(r.usage.total_tokens,120);assert.equal(r.unknown_usage,false);assert.equal(r.persistence_failure,true);assert.equal(r.status,'failed');
 });}finally{fs.writeFileSync=original;syncBuiltinESMExports();f.cleanup();}
});
test('paired preparation backs off both complete wires together without changing nonpacket messages',async()=>{
 const f=await fixture();try{
  const p=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async({variant,prompt})=>{assert.deepEqual(JSON.parse(prompt).messages.slice(0,2),JSON.parse(f.prompt).messages.slice(0,2));return variant==='diversity'?8001:2667;}});assert.equal(p.admitted,false);assert.equal(p.reason,'paired-full-wire-unfit');assert.equal(p.attempts.length,1);
  const wrong=structuredClone(f.donor);wrong.original_packet.model.text+='changed';await assert.rejects(preparePackets({...f,donor:wrong,measure_tokens:async()=>30,measure_wire:async()=>2667}),/legacy-public-reconstruction/);
 }finally{f.cleanup();}
});

test('post-generation lifecycle failures preserve native usage and never export completed selections',async()=>{
 const f=await fixture();try{for(const phase of ['completeStep','close'])await wireFixture(async calls=>{
  const prepared=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async()=>2667});let closed=false;
  const open_recycler=options=>{const native=openContextRecycling(options);return {...native,completeStep(...args){if(phase==='completeStep')throw Error('synthetic step failure');return native.completeStep(...args);},close(){closed=true;native.close();if(phase==='close')throw Error('synthetic close failure');}};};
  const r=await runSlot({...f,prepared,variant:'legacy',directory:join(f.root,'lifecycle-'+phase),model_dispatch_enabled:true,open_recycler});
  assert.equal(r.status,'failed');assert.equal(r.lifecycle_failure,true);assert.equal(r.usage.total_tokens,120);assert.equal(r.unknown_usage,false);assert.equal(r.native_export,undefined);assert.equal(closed,true);assert.equal(calls.filter(c=>c.path.endsWith('/chat/completions')).length,1);
  const saved=JSON.parse(readFileSync(join(f.root,'lifecycle-'+phase,'result.json')));assert.equal(saved.status,'failed');assert.equal(saved.usage.total_tokens,120);
 });}finally{f.cleanup();}
});
test('health reporter failure returns all fixed slots and preserves known and unknown costs',async()=>{
 const jobs=Array.from({length:8},(_,i)=>({donor:{donor_index:i,donor_id:'d'+i,task:{instance_id:'t'+Math.floor(i/2)}}}));let executed=0;
 const r=await runPairs({jobs,execute_slot:async()=>{executed++;return {status:'failed',lifecycle_failure:true,unknown_usage:false,usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120,model_calls:1,unknown_usage_calls:0,conservative_total_tokens:120}};},health:{isHealthy:()=>true,report:async()=>{throw Error('synthetic health journal failure');}}});
 assert.equal(r.slots.length,16);assert.ok(r.slots.every(Boolean));assert.equal(r.all_valid,false);assert.equal(r.usage.total_tokens,executed*120);assert.equal(r.usage.model_calls,executed);assert.ok(r.health_errors.length>=1);assert.ok(executed<=2);assert.ok(r.slots.some(s=>s.status==='not-started-shared-health-stop'));
 const unknown=await runPairs({jobs,execute_slot:async()=>({status:'failed',unknown_usage:true,usage:{total_tokens:0,model_calls:1,unknown_usage_calls:1,conservative_total_tokens:8000}}),health:{isHealthy:()=>true,report:()=>{throw Error('synthetic report failure');}}});
 assert.equal(unknown.slots.length,16);assert.equal(unknown.unknown_usage,true);assert.ok(unknown.usage.conservative_total_tokens>=8000);
});
test('tokenizer-only lifecycle failure cannot qualify a wire',async()=>{
 const f=await fixture();try{await wireFixture(async calls=>{
  const open_recycler=options=>{const native=openContextRecycling(options);return {...native,close(){native.close();throw Error('synthetic close failure');}};};
  await assert.rejects(measureNativeWire({...f,directory:join(f.root,'preflight-close'),open_recycler}),/preflight-lifecycle-failure/);assert.equal(calls.length,1);assert.equal(calls[0].path,'/tokenizer');
 });}finally{f.cleanup();}
});

test('successful tokenizer followed by arbitrary recycler error is not wire qualification',async()=>{
 const f=await fixture();try{await wireFixture(async calls=>{
  const open_recycler=options=>{const native=openContextRecycling(options);return {...native,async generate(args){try{await native.generate(args);}catch{throw Error('synthetic unexpected post-tokenizer error');}}};};
  await assert.rejects(measureNativeWire({...f,directory:join(f.root,'preflight-error'),open_recycler}),/unexpected-preflight-disposition/);assert.equal(calls.length,1);assert.equal(calls[0].path,'/tokenizer');
 });}finally{f.cleanup();}
});

test('missing native export base preserves known cost and stops pending dispatch across all fixed slots',async()=>{
 const f=await fixture();try{await wireFixture(async calls=>{
  const prepared=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async()=>2667});
  const jobs=Array.from({length:8},(_,i)=>({donor:{donor_index:i,donor_id:'d'+i,task:{instance_id:'t'+Math.floor(i/2)}}}));
  let release;const failureReported=new Promise(r=>{release=r;});let executions=0;
  const result=await runPairs({jobs,model_dispatch_enabled:true,health:{isHealthy:()=>true,report:()=>release()},execute_slot:async j=>{
   executions++;
   if(j.donor.donor_index===0)return runSlot({...f,prepared,variant:'legacy',directory:join(f.root,'missing-base'),model_dispatch_enabled:true,before_model_dispatch:j.before_model_dispatch});
   await failureReported;
   assert.equal(await j.before_model_dispatch(),false);
   return {status:'not-started-shared-health-stop',usage:{total_tokens:0},unknown_usage:false};
  }});
  assert.equal(executions,2);assert.equal(result.slots.length,16);assert.equal(result.all_valid,false);
  assert.equal(result.usage.total_tokens,120);assert.equal(result.usage.model_calls,1);assert.equal(result.unknown_usage,false);
  assert.equal(result.slots[0].status,'infrastructure-failure');assert.equal(result.slots[0].infrastructure_failure,true);assert.equal(result.slots[0].export_failure.code,'ENOENT');
  assert.equal(result.slots.filter(s=>s.status==='not-started-shared-health-stop').length,15);
  assert.equal(calls.filter(c=>c.path.endsWith('/chat/completions')).length,1);
  const persisted=JSON.parse(readFileSync(join(f.root,'missing-base/result.json')));assert.equal(persisted.usage.total_tokens,120);assert.equal(persisted.infrastructure_failure,true);
 },{onModel:()=>rmSync(join(f.repoRoot,'a.js'))});}finally{f.cleanup();}
});

test('native source projection drift is infrastructure, not a bad model selection',async()=>{
 const f=await fixture();try{await wireFixture(async()=>{
  const prepared=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async()=>2667});
  const r=await runSlot({...f,prepared,variant:'diversity',directory:join(f.root,'drift'),model_dispatch_enabled:true});
  assert.equal(r.infrastructure_failure,true);assert.equal(r.status,'infrastructure-failure');assert.equal(r.usage.total_tokens,120);assert.equal(r.unknown_usage,false);
 },{onModel:()=>writeFileSync(join(f.repoRoot,'a.js'),'different base\n')});}finally{f.cleanup();}
});

test('invalid model handles and empty selections remain known model outcomes without shared stop',async()=>{
 const f=await fixture();try{for(const handles of [['h999'],[]])await wireFixture(async()=>{
  const prepared=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async()=>2667});
  const r=await runSlot({...f,prepared,variant:'diversity',directory:join(f.root,handles.length?'invalid':'empty'),model_dispatch_enabled:true});
  assert.equal(r.status,'invalid_terminal_selection');assert.equal(r.infrastructure_failure,false);assert.equal(r.export_failure.kind,'model-selection');assert.equal(r.usage.total_tokens,120);
  const jobs=Array.from({length:8},(_,i)=>({donor:{donor_index:i,donor_id:'d'+i,task:{instance_id:'t'+Math.floor(i/2)}}}));let executed=0;
  const pooled=await runPairs({jobs,execute_slot:async()=>{executed++;return structuredClone(r);},health:{isHealthy:()=>true,report:()=>assert.fail('semantic outcome must not stop health')}});
  assert.equal(executed,16);assert.equal(pooled.usage.total_tokens,1920);assert.equal(pooled.all_valid,false);
 },{handles});}finally{f.cleanup();}
});

test('typed and unknown export errors fail closed even with semantic diagnostic wording',()=>{
 const semantic=()=>Object.assign(Error('terminal-evidence.invalid-json'),{diagnostic:{ok:false,category:'invalid-json',instrument_error:false}});
 assert.equal(classifyExportFailure(semantic()).kind,'model-selection');
 for(const e of [Object.assign(semantic(),{code:'ENOSPC'}),Object.assign(semantic(),{receipt:{persistence_failure:true}}),Object.assign(semantic(),{diagnostic:{ok:false,category:'invalid-json',instrument_error:true}}),Error('source-map.snapshot-missing'),Error('unexpected native assertion')])assert.equal(classifyExportFailure(e).kind,'infrastructure');
});

 test('native post-admission guard denial preserves proven zero model spend',async()=>{
 const f=await fixture({before_dispatch:({kind})=>{if(kind==='model')throw Error('synthetic storage guard');}});
 try{await wireFixture(async calls=>{
  const r=await runNativeRequest({...f,directory:join(f.root,'guard-denied'),model_dispatch_enabled:true});
  assert.equal(r.entered,true);assert.equal(r.status,'failed');assert.equal(r.persistence_failure,true);
  assert.equal(r.usage.model_calls,0);assert.equal(r.usage.total_tokens,0);assert.equal(r.usage.conservative_total_tokens,0);assert.equal(r.unknown_usage,false);
  assert.deepEqual(calls.map(c=>c.path),['/tokenizer']);
  assert.equal(r.receipts.at(-1).failure_code,'pre-dispatch-guard');assert.equal(r.receipts.at(-1).dispatched,false);
 });}finally{f.cleanup();}
});
test('zero dispatch proof rejects incomplete or contradictory receipts',()=>{
 const proof={kind:'model',dispatched:false,failure_code:'pre-dispatch-guard',input_tokens:0,output_tokens:0,response_bytes:0,status:null,provider_code:null};
 assert.equal(hasAccountedModelAttempt([proof]),true);
 for(const delta of [{input_tokens:1},{output_tokens:1},{response_bytes:1},{status:200},{provider_code:'1305'},{reasoning_tokens:1},{cached_tokens:1},{failure_code:undefined},{input_tokens:undefined}])assert.equal(hasAccountedModelAttempt([{...proof,...delta}]),false);
 assert.equal(hasAccountedModelAttempt([]),false);assert.equal(hasAccountedModelAttempt([proof,proof]),false);
});
