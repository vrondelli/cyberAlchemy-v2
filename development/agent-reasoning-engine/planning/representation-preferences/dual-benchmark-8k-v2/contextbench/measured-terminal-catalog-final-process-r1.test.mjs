import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runCatalogFinalQualification} from './measured-terminal-catalog-final-process-r1.mjs';
const terminal={schema:'are.measured-catalog-final-campaign/v1',qualified:true,model_calls:0,rows:Array.from({length:4},()=>({qualified:true}))};
function fixture(t,body){const root=mkdtempSync(join(tmpdir(),'qualify-child-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const worker=join(root,'worker.mjs');writeFileSync(worker,body);return {worker,kill_grace_ms:30};}
const args=()=>({request:{schedule:{assigned_outcomes:4}},signal:new AbortController().signal,deadline_ms:3000});
test('returns only after successful child close',async t=>{
 const deps=fixture(t,"for await(const c of process.stdin){};process.stdout.write("+JSON.stringify(JSON.stringify({terminal,error:null}))+");");
 const r=await runCatalogFinalQualification(args(),deps);assert.equal(r.qualified,true);assert.equal(r.process_settlement.local_settled,true);assert.equal(r.process_settlement.remote_completion_claimed,false);
 assert.throws(()=>process.kill(r.process_settlement.child_pid,0),{code:'ESRCH'});
});
test('child failure preserves measurements and settlement',async t=>{
 const report={...terminal,qualified:false,persistence_failure:'disk'};
 const deps=fixture(t,"for await(const c of process.stdin){};process.stdout.write("+JSON.stringify(JSON.stringify({terminal:report,error:'disk'}))+",()=>process.exit(2));");
 await assert.rejects(runCatalogFinalQualification(args(),deps),e=>{assert.deepEqual(e.result.measurement_report,report);assert.equal(e.result.qualified,false);assert.equal(e.result.process_settlement.local_settled,true);return true;});
});
test('deadline kills and settles an unresponsive child',async t=>{
 const deps=fixture(t,"process.on('SIGTERM',()=>{});for await(const c of process.stdin){};setInterval(()=>{},1000);");
 await assert.rejects(runCatalogFinalQualification({...args(),deadline_ms:200},deps),e=>{assert.equal(e.result.deadline_exceeded,true);assert.equal(e.result.process_settlement.local_settled,true);assert.equal(e.result.qualified,false);return true;});
});
test('parent cancellation cannot return qualified',async t=>{
 const deps=fixture(t,"for await(const c of process.stdin){};setInterval(()=>{},1000);"),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),100);
 try{await assert.rejects(runCatalogFinalQualification({...args(),signal:controller.signal},deps),e=>{assert.equal(e.result.qualified,false);assert.equal(e.result.process_settlement.local_settled,true);return true;});}finally{clearTimeout(timer);}
});
test('actual qualification worker rejects invalid freeze before provider access',async()=>{
 await assert.rejects(runCatalogFinalQualification(args()),e=>{assert.equal(e.result.measurement_report,null);assert.equal(e.result.process_settlement.exit_code,2);assert.equal(e.result.process_settlement.local_settled,true);return true;});
});
test('rejects zero or excessive deadlines and already cancelled input',async()=>{
 for(const deadline_ms of [0,600001])await assert.rejects(runCatalogFinalQualification({...args(),deadline_ms}),/deadline/);
 const c=new AbortController();c.abort();await assert.rejects(runCatalogFinalQualification({...args(),signal:c.signal}),/active-signal/);
});
