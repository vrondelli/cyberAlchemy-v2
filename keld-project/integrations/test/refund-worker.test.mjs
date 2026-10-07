import test from 'node:test';
import assert from 'node:assert/strict';
import {processLateRefunds} from '../src/refund-worker.mjs';

function fixture(states,{issue=async()=>{},start=async()=>({idempotencyKey:'stable-key'}),
  commandStarted=false}={}){
  const calls=[];let claimed=false,index=0;
  const work={orderId:'order-one',customer:'buyer',provider:'stripe',account:'acct_test',
    remoteId:'cs_one',generation:1,commandStarted};
  const order={id:'order-one',status:'paid-review',remote_id:'cs_one',expires_at:1000,
    terms:{amountCents:20000,currency:'USD'}};
  const repository=async(op,args)=>{
    calls.push([op,args]);
    if(op==='refund-claim'){if(claimed)return null;claimed=true;return work;}
    if(op==='get')return order;
    if(op==='refund-command-start')return start();
    if(op==='refund-record-outcome')return {state:'succeeded'};
    if(op==='refund-finish')return {state:args.outcome==='retry'?'queued':'review',reason:args.reason};
    throw Error('unexpected operation');
  };
  const adapters={stripe:{account:'acct_test',refundPaymentId:async()=>{calls.push(['payment-id']);return 'pi_one';},
    inspectRefund:async()=>{calls.push(['inspect']);const value=states[index++];
      if(value instanceof Error)throw value;return value;},
    issueFullRefund:async(...args)=>{calls.push(['issue',...args]);return issue(...args);}}};
  return {repository,adapters,calls};
}

const run=f=>processLateRefunds({...f,clock:()=>1001,allowProviderMutation:true});
test('refund worker is disconnected and disabled by default',async()=>{
  const f=fixture([]);
  await assert.rejects(()=>processLateRefunds({...f,clock:()=>1001}),{code:'refund-mutation-disabled'});
  assert.deepEqual(f.calls,[]);
});

test('exact unrefunded preflight marks may-send before one command then records fresh full outcome',async()=>{
  const f=fixture([{kind:'unrefunded',provider:'stripe'},
    {kind:'full-refund',provider:'stripe',providerRef:'re_one'}]);
  assert.equal((await run(f)).succeeded,1);
  const names=f.calls.map(x=>x[0]);
  assert.deepEqual(names,['refund-claim','get','payment-id','inspect','refund-command-start',
    'issue','inspect','refund-record-outcome','refund-claim']);
  assert.deepEqual(f.calls.find(x=>x[0]==='issue').slice(1),['pi_one',{amountCents:20000,currency:'USD'},'stable-key']);
  assert.equal(names.includes('refund-finish'),false);
});

test('ambiguous preflight reviews without a provider command; read outage retries',async()=>{
  const review=fixture([{kind:'review',provider:'stripe',reason:'refund-list-incomplete'}]);
  assert.equal((await run(review)).review[0].reason,'refund-list-incomplete');
  assert.equal(review.calls.some(x=>x[0]==='refund-command-start'||x[0]==='issue'),false);
  const unavailable=fixture([Error('private provider failure')]);
  assert.equal((await run(unavailable)).retried,1);
  const finish=unavailable.calls.find(x=>x[0]==='refund-finish')[1];
  assert.deepEqual([finish.outcome,finish.reason],['retry','preflight-read-unavailable']);
});

test('uncertain command outcome schedules only a read-only recheck',async()=>{
  const f=fixture([{kind:'unrefunded',provider:'stripe'}],{issue:async()=>{throw Error('timeout');}});
  const result=await run(f);
  assert.equal(result.retried,1);
  assert.equal(f.calls.filter(x=>x[0]==='issue').length,1);
  assert.deepEqual(f.calls.find(x=>x[0]==='refund-finish')[1],{
    work:{orderId:'order-one',generation:1},outcome:'retry',reason:'post-command-recheck',now:1001});
});

test('started command with unresolved payment never sends a second POST',async()=>{
  const f=fixture([{kind:'unrefunded',provider:'stripe'}],{commandStarted:true});
  assert.equal((await run(f)).retried,1);
  assert.equal(f.calls.filter(x=>x[0]==='refund-command-start'||x[0]==='issue').length,0);
  assert.equal(f.calls.find(x=>x[0]==='refund-finish')[1].reason,'post-command-recheck');
});

test('started command later records a verified full refund without another POST',async()=>{
  const f=fixture([{kind:'full-refund',provider:'stripe',providerRef:'re_one'}],
    {commandStarted:true});
  assert.equal((await run(f)).succeeded,1);
  assert.equal(f.calls.filter(x=>x[0]==='refund-command-start'||x[0]==='issue').length,0);
  assert.equal(f.calls.filter(x=>x[0]==='refund-record-outcome').length,1);
});
