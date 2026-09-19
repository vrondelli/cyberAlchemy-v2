import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,readdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {executeLive,interruptedResult,durableWrite} from './live-bounded-v3.mjs';
import {createProviders} from './provider.mjs';
import {IDS,sha,planConfirmation} from './adapter.mjs';import {generationPlan,runGeneration} from './runner.mjs';
async function fixture(){const rows=IDS.map(question_id=>({question_id,question_type:'multi-session',question:'Which fact?',question_date:'2024/03/01 (Fri) 12:00',haystack_dates:['2024/01/01 (Mon) 12:00'],haystack_sessions:[Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',content:'source fact '.repeat(400)}))]}));const q=await planConfirmation(rows,async r=>({input_tokens:Math.ceil(JSON.stringify(r).length/4),wire_sha256:sha(r)}));return generationPlan(rows,q);}
test('durable wrapper integrates real core/provider with synthetic HTTP, seals eight slots and cannot rerun',async()=>{
 const output_root=mkdtempSync(join(tmpdir(),'are-full-live-'));try{const plan=await fixture();let verified=0,models=0;
 const options={output_root,verify:()=>{verified++;return {plan,freeze_sha256:'test',freeze:{deadline_ms:10000,credential_path:'unused'}};},checkStorage:()=>{},makeProviders:args=>createProviders({...args,exchange:async(kind,raw,digest,{onDispatch})=>{assert.equal(sha(raw),digest);const r=JSON.parse(raw),input=Math.ceil(raw.length/4);if(kind==='tokenizer')return {status:200,payload:{usage:{prompt_tokens:input}}};await onDispatch();models++;return {status:200,payload:{model:r.model,choices:[{finish_reason:'stop',message:{content:'synthetic notes'}}],usage:{prompt_tokens:input,completion_tokens:20,total_tokens:input+20}}};}})};
 const seal=await executeLive('unused','live-bounded-v3-r1',options);assert.equal(seal.result.status,'completed');assert.equal(seal.result.results.flatMap(r=>r.answers).length,8);assert.equal(seal.result.model_generation_calls,models);assert.equal(seal.transport_settled,true);assert.equal(verified,2);assert.deepEqual(JSON.parse(readFileSync(join(output_root,'live-bounded-v3-r1','GENERATION-SEAL.json'))),seal);assert.ok(readdirSync(join(output_root,'live-bounded-v3-r1')).some(n=>n.startsWith('event-')));await assert.rejects(executeLive('unused','live-bounded-v3-r1',options),/single-use/);
 }finally{rmSync(output_root,{recursive:true,force:true});}
});
test('fallback retains unknown and known partial request costs with all eight slots',async()=>{const plan=await fixture(),pair=plan.pairs[0],events=[{kind:'call-start',id:'known',pair_sha256:pair.pair_sha256,reservation_tokens:7360},{channel:'model',id:'known',dispatched:true,usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}},{kind:'call-start',id:'unknown',pair_sha256:pair.pair_sha256,reservation_tokens:7360},{channel:'model',id:'unknown',dispatched:true}];const result=interruptedResult(plan,events);assert.equal(result.results.flatMap(p=>p.answers).length,8);assert.equal(result.usage.total_tokens,120);assert.equal(result.held_tokens,7360);assert.equal(result.unknown_usage,true);});
test('provider setup failure still creates terminal zero-spend eight-slot seal',async()=>{const output_root=mkdtempSync(join(tmpdir(),'are-full-fail-'));try{const plan=await fixture();const seal=await executeLive('unused','live-bounded-v3-r1',{output_root,verify:()=>({plan,freeze_sha256:'x',freeze:{deadline_ms:10000}}),checkStorage:()=>{},makeProviders:()=>{throw Error('setup');}});assert.equal(seal.result.status,'failed');assert.equal(seal.result.usage.total_tokens,0);assert.equal(seal.result.results.flatMap(p=>p.answers).length,8);}finally{rmSync(output_root,{recursive:true,force:true});}});
test('durable journal refuses overwrite or unsafe names',()=>{const root=mkdtempSync(join(tmpdir(),'are-journal-'));try{durableWrite(root,'one.json',{x:1});assert.throws(()=>durableWrite(root,'one.json',{x:2}));assert.throws(()=>durableWrite(root,'../bad.json',{}));assert.equal(JSON.parse(readFileSync(join(root,'one.json'))).x,1);}finally{rmSync(root,{recursive:true,force:true});}});
test('rejected or synchronously throwing settlement preserves final seal and removes signal handlers',async()=>{
 const plan=await fixture();for(const synchronous of [false,true]){const output_root=mkdtempSync(join(tmpdir(),'are-settlement-fail-')),beforeInt=process.listenerCount('SIGINT'),beforeTerm=process.listenerCount('SIGTERM');try{
  const meter=()=>{};meter.settle=synchronous?()=>{throw Error('settle');}:async()=>{throw Error('settle');};const generate=()=>{};generate.settle=async()=>({settled:true});
  const seal=await executeLive('unused','live-bounded-v3-r1',{output_root,verify:()=>({plan,freeze_sha256:'x',freeze:{deadline_ms:10000}}),checkStorage:()=>{},makeProviders:()=>({meter,generate}),run:async()=>interruptedResult(plan,[])});
  assert.equal(seal.status,'failed');assert.equal(seal.transport_settled,false);assert.equal(seal.result.results.flatMap(p=>p.answers).length,8);assert.deepEqual(readFileSync(join(output_root,'live-bounded-v3-r1','GENERATION-SEAL.json'),'utf8').includes('settlement-rejected'),true);assert.equal(process.listenerCount('SIGINT'),beforeInt);assert.equal(process.listenerCount('SIGTERM'),beforeTerm);
 }finally{rmSync(output_root,{recursive:true,force:true});}}
});
test('storage rejection after receiving known usage preserves in-memory fallback cost',async()=>{
 const plan=await fixture(),output_root=mkdtempSync(join(tmpdir(),'are-storage-cost-'));let rejectStorage=false;try{
  const meter=()=>{};meter.settle=async()=>({settled:true});const generate=()=>{};generate.settle=meter.settle;
  const seal=await executeLive('unused','live-bounded-v3-r1',{output_root,verify:()=>({plan,freeze_sha256:'x',freeze:{deadline_ms:10000}}),checkStorage:()=>{if(rejectStorage)throw Error('storage floor');},makeProviders:()=>({meter,generate}),run:async({record})=>{
   await record({kind:'call-start',id:'known',pair_sha256:plan.pairs[0].pair_sha256,reservation_tokens:7360});rejectStorage=true;
   await record({channel:'model',id:'known',dispatched:true,usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}});
  }});
  assert.equal(seal.status,'failed');assert.equal(seal.result.usage.total_tokens,120);assert.equal(seal.result.unknown_usage,false);assert.equal(seal.result.results.flatMap(p=>p.answers).length,8);
 }finally{rmSync(output_root,{recursive:true,force:true});}
});
test('shared health blocks second model after waiting for secret resolution',async()=>{
 const plan=await fixture(),output_root=mkdtempSync(join(tmpdir(),'are-secret-health-'));let releaseFirst,releaseSecond,entered=0,dispatches=0;
 const secondEntered=new Promise(r=>releaseFirst=r),healthStopped=new Promise(r=>releaseSecond=r);
 try{const seal=await executeLive('unused','live-bounded-v3-r1',{output_root,verify:()=>({plan,freeze_sha256:'x',freeze:{deadline_ms:10000}}),checkStorage:()=>{},run:options=>runGeneration({...options,record:async event=>{await options.record(event);if(event.kind==='call-result'&&event.provider_status===429)releaseSecond();}}),makeProviders:args=>createProviders({...args,exchange:async(kind,raw,digest,{onDispatch})=>{
   if(kind==='tokenizer')return {status:200,payload:{usage:{prompt_tokens:100}}};
   const order=++entered;if(order===1){await onDispatch();dispatches++;await secondEntered;return {status:429,payload:{usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120},error:{code:'1302'}}};}
   releaseFirst();await healthStopped;await onDispatch();dispatches++;throw Error('must not dispatch');
  }})});
  assert.equal(entered,2);assert.equal(dispatches,1);assert.equal(seal.result.health_stop,'provider-capacity');assert.equal(seal.result.model_generation_calls,1);assert.equal(seal.result.usage.total_tokens,120);assert.equal(seal.result.unknown_usage,false);assert.equal(seal.result.results.flatMap(p=>p.answers).length,8);
 }finally{rmSync(output_root,{recursive:true,force:true});}
});

test('host successor requires growth reservation before provider construction',async()=>{const output_root=mkdtempSync(join(tmpdir(),'host-gate-'));let providers=0;try{await assert.rejects(executeLive('unused','live-bounded-v3-r1',{output_root,verify:()=>({}),checkStorage:growth=>{assert.equal(growth,33554432);throw Error('D capacity');},makeProviders:()=>{providers++;}}),/D capacity/);assert.equal(providers,0);assert.equal(readdirSync(output_root).length,0);}finally{rmSync(output_root,{recursive:true,force:true});}});
test('host successor rejects original run namespace before verification',async()=>{await assert.rejects(executeLive('unused','live-r1',{verify:()=>{throw Error('must not verify');}}),/live-bounded-v3/);});
test('host freeze explicitly binds guard, registry metadata and provenance',async()=>{
 const {verifyHostBindings,HOST_BINDING_PATH}=await import('./live-bounded-v3.mjs'),{resolve}=await import('node:path'),host=JSON.parse(readFileSync(HOST_BINDING_PATH));
 const paths=[join(import.meta.dirname,'OPERATING-RESERVE-AMENDMENT.md'),HOST_BINDING_PATH,resolve(import.meta.dirname,'../../storage-host-small-run.mjs'),host.provenance.path],freeze={bindings:paths.map(path=>({path,sha256:sha(readFileSync(path))})),storage_policy:{host_binding:HOST_BINDING_PATH,minimum_host_bytes:1073741824,minimum_guest_bytes:8589934592,launch_growth_bytes:33554432,maximum_output_bytes:33554432,final_reserve_bytes:8388608}};
 verifyHostBindings(freeze);for(let i=0;i<4;i++)assert.throws(()=>verifyHostBindings({...freeze,bindings:freeze.bindings.filter((_,j)=>i!==j)}),/explicit host binding/);assert.throws(()=>verifyHostBindings({...freeze,storage_policy:{...freeze.storage_policy,minimum_host_bytes:1}}));
});
test('actual ordinary budget rejection preserves known usage in reserved final eight-slot seal',async()=>{
 const {openSync,ftruncateSync,closeSync}=await import('node:fs'),plan=await fixture(),output_root=mkdtempSync(join(tmpdir(),'bounded-known-cost-'));try{
 const meter=()=>{};meter.settle=async()=>({settled:true});const generate=()=>{};generate.settle=meter.settle;
 const seal=await executeLive('unused','live-bounded-v3-r1',{output_root,verify:()=>({plan,freeze_sha256:'x',freeze:{deadline_ms:10000}}),checkStorage:()=>{},makeProviders:()=>({meter,generate}),run:async({record})=>{
  await record({kind:'call-start',id:'known',pair_sha256:plan.pairs[0].pair_sha256,reservation_tokens:7360});const fd=openSync(join(output_root,'live-bounded-v3-r1','ordinary-fill.json'),'wx');ftruncateSync(fd,24*1024**2);closeSync(fd);
  await record({channel:'model',id:'known',dispatched:true,usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}});
 }});
 assert.equal(seal.status,'failed');assert.equal(seal.result.usage.total_tokens,120);assert.equal(seal.result.unknown_usage,false);assert.equal(seal.result.results.flatMap(p=>p.answers).length,8);assert.equal(JSON.parse(readFileSync(join(output_root,'live-bounded-v3-r1','GENERATION-SEAL.json'))).result.usage.total_tokens,120);
 }finally{rmSync(output_root,{recursive:true,force:true});}
});
