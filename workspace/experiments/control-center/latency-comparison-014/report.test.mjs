import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metricCoverage} from './report.mjs';
const budgets={'workspace.tauri.chat-cold-ipc-handshake':{minimum_samples:1,p95_ms:1000},'chat.delta-to-paint':{minimum_samples:1,p95_ms:16.7}};
test('missing metrics remain visible even with a complete handshake population',()=>{const r=metricCoverage(budgets,{status:'POPULATION_COMPLETE',p95_ms:{baseline:900,uninstrumented:899}},true);assert.equal(r[0].status,'PASS');assert.equal(r[1].status,'not_evaluable');});
test('incomplete or invalid evidence never emits budget pass',()=>{for(const [status,valid] of [['INCOMPLETE',true],['POPULATION_COMPLETE',false]])assert.ok(metricCoverage(budgets,{status},valid).every(m=>m.status==='not_evaluable'));});
test('unchanged budget violation fails',()=>assert.equal(metricCoverage(budgets,{status:'POPULATION_COMPLETE',p95_ms:{baseline:1001,uninstrumented:900}},true)[0].status,'FAIL'));
test('malformed budgets fail closed',()=>assert.throws(()=>metricCoverage({x:{minimum_samples:0,p95_ms:100}},{},true),/invalid-budget/));
