import test from 'node:test';
import assert from 'node:assert/strict';
import {recheckRefund,recheckError,UsageError} from '../bin/recheck-refund.mjs';

const orderId='a'.repeat(32);
const argv=['/private/config.json',orderId,'8','operator_one','--apply-verified-full-refund'];

function fixture(state={kind:'full-refund',provider:'stripe',providerRef:'re_final'}){
  const calls=[];
  const repository=async(op,input)=>{
    calls.push([op,input]);
    if(op==='refund-review-preflight')return {eligible:true};
    if(op==='refund-review-claim')return {orderId,customer:'buyer',provider:'stripe',
      account:'acct_test',remoteId:'cs_test',generation:9,commandStarted:true};
    if(op==='get')return {status:'paid-review',remote_id:'cs_test',expires_at:1000,
      terms:{amountCents:20000,currency:'USD'}};
    if(op==='refund-record-outcome')return {state:'succeeded'};
    if(op==='refund-finish')return {state:'review',reason:input.reason};
    throw Error('unexpected operation');
  };
  const adapters={stripe:{account:'acct_test',refundPaymentId:async()=>{
    calls.push(['payment-id']);return 'pi_test';},inspectRefund:async()=>{
      calls.push(['inspect']);return state;},
    issueFullRefund:async()=>{throw Error('forbidden POST');}}};
  const dependencies={clock:()=>1001,load:async(path,options)=>{
    calls.push(['load',path,options]);
    return {integration:{ledger:{database:'/private/ledger'},payments:{environment:'sandbox'}}};
  },repositoryFactory:()=>repository,adapterFactory:()=>adapters};
  return {calls,dependencies};
}

test('exact operator action preflights schema then records only GET-verified full refund',async()=>{
  const f=fixture();
  assert.deepEqual(await recheckRefund(argv,f.dependencies),
    {ok:true,mode:'sandbox',outcome:'verified-full-refund',orderId});
  assert.deepEqual(f.calls.map(x=>x[0]),['load','refund-review-preflight','refund-review-claim',
    'get','payment-id','inspect','refund-record-outcome']);
  assert.deepEqual(f.calls[1][1],{orderId,generation:8,now:1001});
  assert.deepEqual(f.calls[2][1],{orderId,generation:8,operatorRef:'operator_one',now:1001});
});

test('partial or inconclusive review never issues a refund command or revokes',async()=>{
  for(const state of [{kind:'partial-refund',provider:'stripe',providerRef:'re_partial'},
    {kind:'review',provider:'stripe',reason:'refund-pending'}]){
    const f=fixture(state);
    const result=await recheckRefund(argv,f.dependencies);
    assert.equal(result.outcome,'review');
    assert.equal(result.reason,state.kind==='partial-refund'?
      'operator-recheck-partial':'operator-recheck-inconclusive');
    assert.equal(f.calls.some(x=>x[0]==='refund-record-outcome'||
      x[0]==='refund-command-start'),false);
    assert.equal(f.calls.find(x=>x[0]==='refund-finish')[1].outcome,'review');
  }
});

test('invalid selection and legacy schema fail before a mutable ledger operation',async()=>{
  for(const bad of [[],argv.slice(0,4),[...argv.slice(0,2),'0',...argv.slice(3)],
    [...argv.slice(0,3),'operator@example.test',argv[4]]]){
    await assert.rejects(()=>recheckRefund(bad,{load:()=>{throw Error('unexpected load');}}),UsageError);
  }
  const f=fixture();
  f.dependencies.repositoryFactory=()=>async(op,input)=>{
    f.calls.push([op,input]);return {eligible:false};
  };
  await assert.rejects(()=>recheckRefund(argv,f.dependencies),/refund-review-conflict/);
  assert.deepEqual(f.calls.map(x=>x[0]),['load','refund-review-preflight']);
  assert.deepEqual(recheckError(new Error('private-secret=value')),
    {ok:false,error:'refund-recheck-failed'});
});
