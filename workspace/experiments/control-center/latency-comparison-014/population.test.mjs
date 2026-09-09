import {test} from 'node:test';
import assert from 'node:assert/strict';
import {population} from './population.mjs';
const budgets={dispatch:{minimum_samples:2,p95_ms:50},paint:{minimum_samples:1,p95_ms:16.7}};
const make=n=>({id:String(n),identity_sha256:'a'.repeat(64),host:{startMs:4500,endMs:6100,observations:[0,1000,2000,3000,4000,5000,5500,6000].map(atMs=>({atMs,normalizedLoad1:0,availableMemoryFraction:1,cpuPressureAvg10:0,memoryPressureAvg10:0}))},failed:false,metrics:{dispatch:[n,n+1],paint:[1]}});
test('all metrics need 40 sessions, using session maxima',()=>{assert.equal(population([make(1)],budgets).metrics[0].p95_ms,null);const r=population(Array.from({length:40},(_,i)=>make(i+1)),budgets);assert.equal(r.status,'PASS');assert.equal(r.metrics[0].p95_ms,39);});
test('missing samples and mixed identity invalidate results',()=>{const a=make(1);a.metrics.dispatch=[1];assert.equal(population([a],budgets).status,'INVALID');const b=make(2);b.identity_sha256='b'.repeat(64);assert.equal(population([make(1),b],budgets).status,'INVALID');});
test('rejected host does not erase a functional failure',()=>{const a=make(1);a.host.observations[0].cpuPressureAvg10=90;a.failed=true;const r=population([a],budgets);assert.equal(r.status,'INVALID');assert.equal(r.rejected.length,1);});
test('budgets, duplicates and attempt ceilings remain enforced',()=>{const all=Array.from({length:40},(_,i)=>make(i+1));all.forEach(a=>a.metrics.paint=[17]);assert.equal(population(all,budgets).status,'FAIL');assert.throws(()=>population([make(1),make(1)],budgets));assert.throws(()=>population(Array.from({length:61},(_,i)=>make(i)),budgets));});
