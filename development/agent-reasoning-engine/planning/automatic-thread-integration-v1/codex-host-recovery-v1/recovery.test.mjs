import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runRecovery} from './supervisor.mjs';
import {fixtureHost,fixtureState} from './fixture-host.mjs';
import {openStore} from './store.mjs';
function fixture(t,options={}) {
 const directory=mkdtempSync(join(tmpdir(),'are-recovery-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const host=fixtureHost(directory,options);return {directory,host,state:fixtureState(),task_id:'crash-task'};
}
function verify(f,result) {
 assert.equal(result.status,'completed');assert.equal(result.recycles,2);assert.equal(result.generation,2);
 assert.deepEqual(result.state.pending,[]);
 assert.deepEqual(f.host.snapshot().effects,f.state.pending.map(x=>x.id));
 assert.equal(f.host.snapshot().opens,3);
 for(const key of ['objective','constraints','facts','lessons']) assert.deepEqual(result.state[key],f.state[key]);
 const contexts=Object.values(f.host.snapshot().contexts).sort((a,b)=>a.receipt.generation-b.receipt.generation);
 assert.deepEqual(contexts.map(c=>c.capsule.state.completed.length),[0,2,4]);
 assert.deepEqual(contexts.map(c=>c.capsule.state.pending.length),[6,4,2]);
}
test('repeated recycling preserves state and completes each action once; terminal restart does nothing',async t=>{
 const f=fixture(t);verify(f,await runRecovery(f));verify(f,await runRecovery(f));
});
for(const [boundary,epoch] of [['before-open',0],['after-open',0],['opened',0],['prepared',0],['before-step',0],['after-step',0],['completed',0],['recycle-stop',0],['sealed',1],['after-open',1],['opened',1],['done',2]]) {
 test(`SIGKILL at ${boundary} generation ${epoch} recovers without duplicate actions`,async t=>{
  const f=fixture(t);const child=spawn(process.execPath,[fileURLToPath(new URL('./crash-worker.mjs',import.meta.url)),f.directory,boundary,String(epoch)],{stdio:'ignore'});
  const stopped=await new Promise((resolve,reject)=>{child.on('exit',(code,signal)=>resolve({code,signal}));child.on('error',reject);});
  assert.deepEqual(stopped,{code:null,signal:'SIGKILL'});
  // Kernel lock release follows inherited pipe closure; wait by retrying only lock acquisition.
  let result;for(let i=0;i<30;i++){try{result=await runRecovery(f);break;}catch(e){if(!e.message.includes('writer-busy'))throw e;await new Promise(r=>setTimeout(r,10));}}
  verify(f,result);
 });
}
for(const field of ['pending','uncertain'])test(`${field} source work blocks successor staging`,async t=>{
 const f=fixture(t,{[field]:1});const result=await runRecovery(f);
 assert.equal(result.status,'reconcile');assert.equal(result.reason,'source-not-quiescent');assert.equal(f.host.snapshot().opens,1);
});
test('unknown dispatch outcome never replays or creates a successor',async t=>{
 const f=fixture(t,{unknown:true});await assert.rejects(runRecovery({...f,fault(label){if(label==='before-step')throw Error('simulated interruption');}}));
 const result=await runRecovery(f);assert.equal(result.status,'reconcile');assert.deepEqual(f.host.snapshot().effects,[]);assert.equal(f.host.snapshot().opens,1);
});
test('lookup completion settles a tool that returned after its caller stopped',async t=>{
 const f=fixture(t);let calls=0;
 await assert.rejects(runRecovery({...f,fault(label){if(label==='after-step'&&++calls===2)throw Error('lost tool acknowledgement');}}));
 verify(f,await runRecovery(f));
});
test('corrupt checkpoint and changed constraints fail before host work',async t=>{
 const f=fixture(t);verify(f,await runRecovery(f));
 await assert.rejects(runRecovery({...f,state:{...f.state,constraints:['changed']}}),/scope-or-policy-drift/);
 const path=join(f.directory,'checkpoint.json');const data=JSON.parse(readFileSync(path,'utf8'));data.value.state.pending=[];data.value.generation=99;
 writeFileSync(path,JSON.stringify(data));await assert.rejects(runRecovery(f),/checkpoint-integrity/);assert.equal(f.host.snapshot().opens,3);
});
test('stale operation receipt fails without committing completion',async t=>{
 const f=fixture(t);const step=f.host.step;f.host.step=async op=>({...await step(op),generation:999});
 await assert.rejects(runRecovery(f),/operation-receipt-binding/);
 const data=JSON.parse(readFileSync(join(f.directory,'checkpoint.json'),'utf8'));assert.equal(data.value.state.completed.length,0);
});
test('wrong capsule and reused source context cannot activate a successor',async t=>{
 const f=fixture(t);const open=f.host.open;f.host.open=async req=>({...await open(req),capsule_digest:'wrong'});
 await assert.rejects(runRecovery(f),/fresh-context-binding/);assert.deepEqual(f.host.snapshot().effects,[]);
 const g=fixture(t);const stage=g.host.open;g.host.open=async req=>({...await stage(req),context_id:'fixture-context-0'});
 await assert.rejects(runRecovery(g),/fresh-context-binding/);assert.equal(g.host.snapshot().effects.length,2);
});
test('single writer and cancellation prevent competing or unwanted dispatch',async t=>{
 const f=fixture(t);const lock=await openStore(f.directory);
 try{await assert.rejects(runRecovery(f),/writer-busy/);}finally{await lock.close();}
 const result=await runRecovery({...f,signal:AbortSignal.abort()});assert.equal(result.status,'cancelled');assert.equal(f.host.snapshot().opens,0);
});
test('oversized state and exhausted recycle allowance stop safely',async t=>{
 const f=fixture(t);await assert.rejects(runRecovery({...f,state:{...f.state,facts:['x'.repeat(70000)]}}),/capsule-too-large/);
 await assert.rejects(runRecovery({...f,max_recycles:0}),/recycle-limit-reached/);assert.equal(f.host.snapshot().effects.length,2);
});
test('pending tools can settle before a later recovery resumes',async t=>{
 const options={pending:1};const f=fixture(t,options);
 assert.equal((await runRecovery(f)).status,'reconcile');options.pending=0;
 verify(f,await runRecovery(f));
});
test('a recycle label cannot hide an effect that already started',async t=>{
 const f=fixture(t);f.host.step=async op=>({...op,status:'recycle',provider_sent:false,effects_started:true,evidence_ref:'fixture:started-tool'});
 const result=await runRecovery(f);assert.equal(result.status,'reconcile');assert.equal(f.host.snapshot().opens,1);
});
test('oversized returned state cannot be committed or silently truncated',async t=>{
 const f=fixture(t);const step=f.host.step;f.host.step=async op=>({...await step(op),result:'x'.repeat(70000)});
 await assert.rejects(runRecovery(f),/capsule-too-large/);
 const data=JSON.parse(readFileSync(join(f.directory,'checkpoint.json'),'utf8'));assert.equal(data.value.phase,'executing');assert.equal(data.value.state.completed.length,0);
});
test('caller mutations while acquiring the writer cannot change the bound task',async t=>{
 const f=fixture(t);const initial=structuredClone(f.state);const running=runRecovery(f);
 f.state.constraints.push('unapproved caller mutation');const result=await running;
 assert.deepEqual(result.state.constraints,initial.constraints);
});
