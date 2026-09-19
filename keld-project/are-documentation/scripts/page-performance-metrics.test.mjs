import {test} from 'node:test';import assert from 'node:assert/strict';
import {percentile,clsScore,frameSummary,failuresFor} from './page-performance-metrics.mjs';
test('nearest-rank percentiles preserve outliers and missing samples',()=>{assert.equal(percentile([], .95),null);assert.equal(percentile([10,100,20,30],.75),30)});
test('CLS uses largest session, ignores recent-input shifts and resets at gaps',()=>{assert.equal(clsScore([{startTime:0,value:.03},{startTime:400,value:.04},{startTime:500,value:1,hadRecentInput:true},{startTime:2000,value:.05}]),.07)});
test('frame stalls and blocking time remain visible',()=>{const r=frameSummary([16,17,70],1000,[{duration:80},{duration:30}]);assert.equal(r.p95Ms,70);assert.equal(r.blockingMsPerSecond,30);assert.equal(r.over33Ratio,1/3)});
test('missing measurements fail instead of becoming zero',()=>{assert.equal(failuresFor({lcpMs:null},{lcpMs:2500}).length,1);assert.equal(failuresFor({lcpMs:2501},{lcpMs:2500}).length,1)});
