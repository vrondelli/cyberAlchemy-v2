import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inspectRefunds,inspectionError,UsageError} from '../bin/inspect-refunds.mjs';

const orderId='a'.repeat(32);
const result={counts:{queued:1,processing:0,review:0,succeeded:0},total:1,
  due:1,deferred:0,expiredLeases:0,nextAttempt:100,next:null,
  orders:[{cursor:1,orderId,state:'queued',provider:'stripe',createdAt:90,
    attempts:0,generation:0,leaseUntil:0,nextAttempt:0,commandStartedAt:null,
    lastReason:null,fullRefundRecorded:0,reversalReviewCount:0,
    customer:'private-buyer',paymentId:'private-payment',merchantSecret:'private-secret'}],
  internal:'private-server-state'};

test('operator inspection invokes only refund-inspect and projects safe work fields',async()=>{
  const calls=[];
  const value=await inspectRefunds(['/private/config.json','queued','4'],{
    clock:()=>101,
    load:async(path,options)=>{calls.push(['load',path,options]);return {integration:{ledger:{database:'/private/ledger'}}};},
    repositoryFactory:ledger=>{calls.push(['repository',ledger]);return async(op,input)=>{
      calls.push(['operation',op,input]);return result;
    };},
  });
  assert.deepEqual(calls,[['load','/private/config.json',{requireCurrentQuote:false,role:'worker'}],
    ['repository',{database:'/private/ledger'}],
    ['operation','refund-inspect',{state:'queued',after:4,now:101}]]);
  assert.equal(value.orders[0].fullRefundRecorded,false);
  assert.equal(value.orders[0].orderId,orderId);
  assert.equal(JSON.stringify(value).includes('private-'),false);
  assert.equal('internal' in value,false);
});

test('invalid arguments fail before configuration or repository access',async()=>{
  for(const argv of [[],['config','unknown'],['config','all','-1'],['config','all','01'],
    ['config','all','9007199254740992'],['config','all','0','extra']]){
    await assert.rejects(()=>inspectRefunds(argv,{load:()=>{throw Error('unexpected load');}}),UsageError);
  }
});

test('malformed repository values and underlying errors never enter operator output',async()=>{
  await assert.rejects(()=>inspectRefunds(['config'],{
    load:async()=>({integration:{ledger:{}}}),
    repositoryFactory:()=>async()=>({...result,orders:[{...result.orders[0],lastReason:'private-secret=value'}]}),
  }),/refund-inspection-response-invalid/);
  assert.deepEqual(inspectionError(new Error('private-secret=value')),
    {ok:false,error:'refund-inspection-failed'});
});

test('package command points to inspection-only CLI',async()=>{
  const packageJson=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.equal(packageJson.scripts['inspect-refunds'],'node bin/inspect-refunds.mjs');
});
