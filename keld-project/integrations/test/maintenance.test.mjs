import test from 'node:test';
import assert from 'node:assert/strict';
import {runMaintenance} from '../src/maintenance.mjs';
const queue={counts:{queued:0,processing:0,review:0,done:0},total:0,capacity:10000,remaining:10000,due:0,deferred:0,expiredLeases:0,nextAttempt:null};

test('maintenance advances reconciliation pages, restarts sweeps and never overlaps cycles',async()=>{
  const controller=new AbortController(),reports=[],cursors=[],calls=[];let waits=0,active=0;
  const repository=async(op,input)=>{
    assert.equal(active++,0);await Promise.resolve();active--;calls.push(op);
    if(op==='event-claim')return null;
    if(op==='event-inspect')return {...queue,events:[{private:'not-in-summary'}]};
    if(op==='reconcile-scan'){cursors.push(input.after);return {orders:[{id:'b'.repeat(32),customer:'owner',provider:'paypal',account:'merchant'}],next:input.after?null:'a'.repeat(32)};}
    if(op==='get')return {id:'b'.repeat(32),remote_id:'ORDER',terms:{amountCents:20000,currency:'USD'}};
    throw Error('unexpected mutation');
  };
  const adapters={paypal:{account:'merchant',async verify(id,terms,options){assert.equal(id,'ORDER');assert.deepEqual(options,{capture:false});return null;}}};
  const result=await runMaintenance({repository,adapters,watch:true,signal:controller.signal,
    wait:async ms=>{assert.equal(ms,60000);waits++;},onCycle:async report=>{reports.push(report);if(reports.length===3)controller.abort();}});
  assert.deepEqual(cursors,[undefined,'a'.repeat(32),undefined]);assert.equal(waits,2);assert.equal(result.cycles,3);
  assert.equal(reports.every(r=>r.reconciliation.pending===1&&r.errors.length===0),true);
  assert.equal('events' in reports[0].queue,false);assert.equal(calls.filter(x=>x==='event-claim').length,3);
});

test('maintenance isolates failed stages and never logs underlying exceptions',async()=>{
  const calls=[],reports=[];
  await runMaintenance({adapters:{},repository:async op=>{calls.push(op);throw Error('secret-database-or-provider-detail');},onCycle:r=>reports.push(r)});
  assert.deepEqual(calls,['event-claim','reconcile-scan','event-inspect']);assert.equal(reports[0].errors.length,3);
  assert.equal(JSON.stringify(reports).includes('secret'),false);
});

test('maintenance shutdown finishes the claimed event but starts no further work',async()=>{
  const controller=new AbortController(),calls=[];
  const repository=async op=>{
    calls.push(op);
    if(op==='event-claim'){controller.abort();return {provider:'stripe',account:'merchant',environment:'sandbox',event_id:'evt_one',resource_kind:'charge',event_type:'charge.refunded'};}
    if(op==='event-finish')return {state:'review'};
    throw Error('work after shutdown');
  };
  const result=await runMaintenance({repository,adapters:{stripe:{account:'merchant'}},watch:true,signal:controller.signal});
  assert.deepEqual(calls,['event-claim','event-finish']);assert.deepEqual(result,{cycles:1,stopped:true});
});

test('maintenance abort interrupts idle wait; pre-aborted invocation performs no operations',async()=>{
  const controller=new AbortController();
  const repository=async op=>op==='event-claim'?null:op==='reconcile-scan'?{orders:[],next:null}:queue;
  const result=await runMaintenance({repository,adapters:{},watch:true,signal:controller.signal,onCycle:()=>{setImmediate(()=>controller.abort());}});
  assert.deepEqual(result,{cycles:1,stopped:true});
  assert.deepEqual(await runMaintenance({repository:()=>{throw Error('unexpected');},adapters:{},signal:controller.signal}),{cycles:0,stopped:true});
  for(const intervalSeconds of [0,29,3601,NaN,1.5])await assert.rejects(()=>runMaintenance({repository,adapters:{},intervalSeconds}));
});
