import {createStageOutputGuard} from './stage-output-guard.mjs';
import {createStagePersistence} from './stage-persistence.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,truncateSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import {executeVerified,verifyLiveFreezeBoundedV3,verifyJobSource} from './live-bounded-v3.mjs';
import {runSlot} from './run-bounded-v3.mjs';
import {preparePackets,hash} from './prepare.mjs';
import {fixture,wireFixture,clientOptions} from './successor-fixture.mjs';
import {createGlmClient} from './transport-bounded-v3.mjs';
const zeros=()=>({prompt_tokens:0,completion_tokens:0,total_tokens:0,model_calls:0,unknown_usage_calls:0,conservative_total_tokens:0,unknown_usage:false});
async function setup(){const f=await fixture(),prepared=await preparePackets({...f,measure_tokens:async()=>30,measure_wire:async()=>2667});
 const jobs=Array.from({length:8},(_,i)=>{const donor=structuredClone(f.donor);donor.donor_index=i;donor.donor_id='fixture-'+i;donor.task.instance_id='task-'+Math.floor(i/2);const packet=structuredClone(prepared);packet.donor_id=donor.donor_id;return {donor,prepared:packet,repoRoot:f.repoRoot};});
 const verified={jobs,config:{credential_path:'never-read'},freeze_sha256:'f'.repeat(64)},signals=new EventEmitter();return {...f,verified,signals,options:{verified,output:join(f.root,'live-v2'),signals,guard:()=>{},verify_source:()=>({all_delivered_sources_projected:true}),reverify:()=>{},create_factory:({signal,persistence,before_dispatch})=>({create_client:()=>createGlmClient({...clientOptions,signal,persistence,before_dispatch})})}};}
test('native16slot successor reserves complete budget and preserves prefix versus suffix costs',async()=>{
 const f=await setup();try{await wireFixture(async calls=>{const r=await executeVerified(f.options);assert.equal(r.status,'completed');assert.equal(r.planned_slots,16);assert.equal(r.slots.length,16);assert.equal(r.usage.total_tokens,16*120);assert.equal(r.reserved_tokens,128000);assert.equal(r.transport_settled,true);assert.equal(r.source_integrity_verified,true);assert.equal(calls.filter(c=>c.path.endsWith('/chat/completions')).length,16);assert.equal(f.signals.listenerCount('SIGINT'),0);assert.equal(JSON.parse(readFileSync(join(f.options.output,'GENERATION-SEAL.json'))).usage.total_tokens,1920);});}finally{f.cleanup();}
});
test('SIGTERM after received native usage drains actual slot promises and seals all16',async()=>{
 const f=await setup();let active=0,finished=0;try{await wireFixture(async()=>{const r=await executeVerified({...f.options,run_slot:async job=>{active++;const result=await runSlot(job);f.signals.emit('SIGTERM');await new Promise(resolve=>setTimeout(resolve,5));active--;finished++;return result;}});assert.equal(r.status,'interrupted');assert.equal(active,0);assert.ok(finished>=1&&finished<=2);assert.equal(r.slots.length,16);assert.equal(r.usage.total_tokens,finished*120);assert.equal(r.transport_settled,true);assert.ok(r.interruptions.some(e=>e.reason==='SIGTERM'));assert.equal(f.signals.listenerCount('SIGTERM'),0);});}finally{f.cleanup();}
});
test('SIGINT at native model boundary retains unknown reservations without extra attempts',async()=>{
 const f=await setup();try{await wireFixture(async calls=>{const r=await executeVerified(f.options);assert.equal(r.status,'interrupted');assert.equal(r.slots.length,16);assert.equal(r.transport_settled,true);assert.equal(r.usage.unknown_usage,true);assert.ok(r.usage.conservative_total_tokens>=8000);assert.ok(calls.filter(c=>c.path.endsWith('/chat/completions')).length<=2);},{onModel:()=>f.signals.emit('SIGINT')});}finally{f.cleanup();}
});
test('request-complete source proof failure before native dispatch stops all new model calls',async()=>{
 const f=await setup();try{await wireFixture(async calls=>{const r=await executeVerified({...f.options,verify_source:()=>{throw Error('missing terminal-only base');}});assert.equal(r.slots.length,16);assert.equal(r.source_integrity_verified,false);assert.equal(r.status,'failed');assert.equal(r.usage.total_tokens,0);assert.equal(calls.filter(c=>c.path.endsWith('/chat/completions')).length,0);});}finally{f.cleanup();}
});
test('unexpected runner failure drains outstanding real promises and keeps entered unknown slot',async()=>{
 const f=await setup();let finished=false;try{const r=await executeVerified({...f.options,run_pairs:async({jobs,execute_slot})=>{const active=execute_slot({...jobs[0],variant:'legacy',model_dispatch_enabled:true,before_model_dispatch:async()=>true});active.catch(()=>{});throw Error('pool failed');},run_slot:async job=>{await job.before_model_dispatch({dispatch:{output_reservation:2048,projected_upper_bound:2667}});await new Promise(resolve=>setTimeout(resolve,5));finished=true;throw Error('unreceipted operation');}});assert.equal(finished,true);assert.equal(r.slots.length,16);assert.equal(r.transport_settled,true);assert.equal(r.usage.conservative_total_tokens,8000);assert.equal(r.slots[0].entered,true);}finally{f.cleanup();}
});
test('seal persistence failure carries all received native usage and removes signal listeners',async()=>{
 const f=await setup();try{await wireFixture(async()=>{await assert.rejects(executeVerified({...f.options,make_persistence:options=>{const base=createStagePersistence(options);return {...base,writeJson:(path,value,flags)=>{if(path.endsWith('GENERATION-SEAL.json'))throw Error('disk');return base.writeJson(path,value,flags);}};}}),error=>Boolean(error.persistence_failure&&error.generation_seal?.slots.length===16&&error.generation_seal.usage.total_tokens===1920));assert.equal(f.signals.listenerCount('SIGINT'),0);});}finally{f.cleanup();}
});
test('successor freeze rejects original schema before any provider creation',()=>{const root=mkdtempSync(join(tmpdir(),'v2-freeze-'));try{const path=join(root,'freeze.json');writeFileSync(path,JSON.stringify({schema:'are.packet-component-live-freeze/v1',approved:true}));assert.throws(()=>verifyLiveFreezeBoundedV3(path),/explicit-freeze/);}finally{rmSync(root,{recursive:true,force:true});}});
test('complete source checker binds archived terminal delivery and actual base bytes',async()=>{
 const {mkdirSync,unlinkSync}=await import('node:fs'),{terminalSourceClosure}=await import('./source-closure.mjs');const f=await fixture();try{
  f.donor.archive_root=join(f.root,'archive');mkdirSync(f.donor.archive_root);const path=join(f.donor.archive_root,'result.json');writeFileSync(path,JSON.stringify(f.result));f.donor.bindings.push({path,sha256:hash(readFileSync(path))});
  const closure=terminalSourceClosure(f.donor),body=readFileSync(join(f.repoRoot,'a.js')),manifest={schema_version:'are.packet-base/v1',commit:f.donor.task.base_commit,bytes:body.length,files:[{path:'a.js',bytes:body.length,sha256:hash(body)}]};writeFileSync(join(f.repoRoot,'.packet-base-manifest.json'),JSON.stringify(manifest));
  const job={donor:f.donor,manifest,repoRoot:f.repoRoot,closure,row:{source_set_sha256:closure.source_set_sha256}};assert.equal(verifyJobSource(job).all_delivered_sources_projected,true);
  unlinkSync(join(f.repoRoot,'a.js'));assert.throws(()=>verifyJobSource(job),/ENOENT/);
 }finally{f.cleanup();}
});
test('uncooperative entered slot reaches bounded unresolved seal instead of hanging',async()=>{
 const f=await setup();try{const r=await executeVerified({...f.options,drain_timeout_ms:10,run_slot:async job=>{await job.before_model_dispatch({dispatch:{output_reservation:2048,projected_upper_bound:2667}});queueMicrotask(()=>f.signals.emit('SIGTERM'));return await new Promise(()=>{});}});assert.equal(r.status,'failed');assert.equal(r.transport_settled,false);assert.equal(r.drain_expired,true);assert.equal(r.slots.length,16);assert.equal(r.usage.unknown_usage,true);assert.ok(r.usage.conservative_total_tokens>=8000);assert.equal(f.signals.listenerCount('SIGTERM'),0);assert.equal(JSON.parse(readFileSync(join(f.options.output,'GENERATION-SEAL.json'))).transport_settled,false);}finally{f.cleanup();}
});
test('malformed aggregate recovers native received usage and still removes all listeners',async()=>{
 const f=await setup();try{await wireFixture(async()=>{const r=await executeVerified({...f.options,run_pairs:async({jobs,execute_slot})=>{await execute_slot({...jobs[0],variant:'legacy',model_dispatch_enabled:true,before_model_dispatch:async()=>true});throw Error('aggregation failed');},run_slot:async job=>{const result=await runSlot(job);result.usage={total_tokens:-1};return result;}});assert.equal(r.status,'failed');assert.equal(r.slots.length,16);assert.equal(r.usage.total_tokens,120);assert.equal(r.usage.unknown_usage,false);assert.equal(f.signals.listenerCount('SIGINT'),0);});}finally{f.cleanup();}
});
test('default wrapper writer fsyncs started and final seal plus parent directories',async()=>{
 const fs=(await import('node:fs')).default,{syncBuiltinESMExports}=await import('node:module'),original=fs.fsyncSync;const f=await setup();let flushes=0;
 try{fs.fsyncSync=fd=>{flushes++;return original(fd);};syncBuiltinESMExports();await wireFixture(async()=>{const result=await executeVerified(f.options);assert.equal(result.status,'completed');assert.ok(flushes>=4,'both wrapper files and directory entries flushed');});}
 finally{fs.fsyncSync=original;syncBuiltinESMExports();f.cleanup();}
});

test('evidence growth admission blocks generation before native factory',async()=>{const f=await setup();let factory=false;try{await assert.rejects(executeVerified({...f.options,guard:(path,limits)=>{assert.equal(path,f.options.output);assert.equal(limits.growth_reservation_bytes,33554432);throw Error('growth-capacity');},create_factory:()=>{factory=true;throw Error('must not run');}}),/growth-capacity/);assert.equal(factory,false);assert.equal(f.signals.listenerCount('SIGINT'),0);}finally{f.cleanup();}});

test('actual stage budget exhaustion after HTTP keeps usage and writes final sixteen-slot seal',async()=>{
 const f=await setup();let exhausted=false;
 try{await wireFixture(async calls=>{
  const r=await executeVerified(f.options);
  assert.equal(exhausted,true);assert.equal(r.status,'completed-with-failures');assert.equal(r.slots.length,16);
  const modelCalls=calls.filter(c=>c.path.endsWith('/chat/completions')).length;
  assert.ok(modelCalls>=1&&modelCalls<=2);assert.equal(r.usage.total_tokens,modelCalls*120);assert.equal(r.usage.unknown_usage,false);
  assert.equal(r.transport_settled,true);
  const seal=JSON.parse(readFileSync(join(f.options.output,'GENERATION-SEAL.json')));
  assert.equal(seal.slots.length,16);assert.equal(seal.usage.total_tokens,r.usage.total_tokens);
  assert.ok(createStageOutputGuard({root:f.options.output}).snapshot().bytes<=32*1024*1024);
 },{onModel:()=>{
  if(exhausted)return;exhausted=true;
  // Simulate an external competing artifact. Sparse logical size is deliberately
  // counted by the actual guard, without allocating 24MiB on the host.
  const path=join(f.options.output,'synthetic-competing-output');writeFileSync(path,'');truncateSync(path,24*1024*1024);
 }});}finally{f.cleanup();}
});
