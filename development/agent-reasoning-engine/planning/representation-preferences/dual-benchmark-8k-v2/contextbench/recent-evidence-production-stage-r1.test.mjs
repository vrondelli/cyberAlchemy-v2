import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runComparisonProductionStage} from './recent-evidence-production-stage-r1.mjs';
function fixture(t,body){const root=mkdtempSync(join(tmpdir(),'production-stage-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const worker=join(root,'worker.mjs');writeFileSync(worker,body);return {worker,kill_grace_ms:30,deadline_ms:2000};}
const args=()=>({operation:'qualify',args:{},signal:new AbortController().signal});
test('successful stage returns only with local settlement',async t=>{
 const deps=fixture(t,"for await(const c of process.stdin){};process.stdout.write(JSON.stringify({terminal:{admitted:true},error:null}));");
 const r=await runComparisonProductionStage(args(),deps);assert.equal(r.value.admitted,true);assert.equal(r.settlement.local_settled,true);assert.equal(r.settlement.remote_completion_claimed,false);assert.throws(()=>process.kill(r.settlement.child_pid,0),{code:'ESRCH'});
});
test('stage failure preserves result and process settlement',async t=>{
 const deps=fixture(t,"for await(const c of process.stdin){};process.stdout.write(JSON.stringify({terminal:{known_tokens:123},error:'failed'}),()=>process.exit(2));");
 await assert.rejects(runComparisonProductionStage(args(),deps),e=>{assert.equal(e.result.terminal.known_tokens,123);assert.equal(e.result.settlement.local_settled,true);return true;});
});
test('deadline settles unresponsive worker with no invented result',async t=>{
 const deps=fixture(t,"process.on('SIGTERM',()=>{});for await(const c of process.stdin){};setInterval(()=>{},1000);");
 await assert.rejects(runComparisonProductionStage(args(),{...deps,deadline_ms:200}),e=>{assert.equal(e.result.deadline_exceeded,true);assert.equal(e.result.terminal,null);assert.equal(e.result.settlement.local_settled,true);return true;});
});
test('actual worker rejects missing freeze before any provider or evaluator access',async()=>{
 await assert.rejects(runComparisonProductionStage(args()),e=>{assert.equal(e.result.terminal,null);assert.equal(e.result.settlement.exit_code,2);assert.equal(e.result.settlement.local_settled,true);return true;});
});
test('stage limits and pre-cancellation are rejected before spawn',async()=>{
 await assert.rejects(runComparisonProductionStage({...args(),operation:'model'}),/operation-or-signal/);
 await assert.rejects(runComparisonProductionStage(args(),{deadline_ms:120001}),/deadline/);
 await assert.rejects(runComparisonProductionStage({...args(),operation:'score'},{deadline_ms:3600001}),/deadline/);
 const c=new AbortController();c.abort();await assert.rejects(runComparisonProductionStage({...args(),signal:c.signal}),/operation-or-signal/);
});

