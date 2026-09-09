import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assess,prelaunchReasons,protocol} from './host.mjs';
const row=atMs=>({atMs,normalizedLoad1:0.1,availableMemoryFraction:0.5,cpuPressureAvg10:0,memoryPressureAvg10:0});
const rows=()=>[0,1000,2000,3000,4000,5000,5500,6000].map(row);
test('complete clean window qualifies under unchanged policy',()=>{assert.equal(assess(rows(),4500,6100).qualified,true);assert.deepEqual(prelaunchReasons(rows().slice(0,5)),[]);assert.equal(protocol.maxCpuPressureAvg10,5);});
test('each load threshold rejects independently',()=>{for(const [key,value] of [['normalizedLoad1',0.51],['availableMemoryFraction',0.19],['cpuPressureAvg10',5.1],['memoryPressureAvg10',1.1]]){const r=rows();r[1][key]=value;assert.ok(assess(r,4500,6100).reasons.includes('host-unqualified:'+key));assert.ok(prelaunchReasons(r.slice(0,5)).includes('host-unqualified:'+key));}});
test('missing, stale and non-monotonic coverage fail',()=>{assert.equal(assess([],4500,6100).qualified,false);const r=rows();r[6].atMs=5000;assert.equal(assess(r,4500,6100).qualified,false);assert.equal(assess(rows(),4500,10000).qualified,false);assert.ok(prelaunchReasons([row(0)]).length);});
test('unavailable samples and nonfinite values cannot qualify',()=>{const r=rows();r[0].cpuPressureAvg10=NaN;assert.equal(assess(r,4500,6100).qualified,false);assert.equal(assess(rows(),4500,6100,['unavailable']).qualified,false);assert.equal(assess([null],4500,6100).qualified,false);});
