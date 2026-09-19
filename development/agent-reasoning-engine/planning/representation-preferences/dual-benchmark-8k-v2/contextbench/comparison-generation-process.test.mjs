import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createComparisonGenerationProcess} from './comparison-generation-process.mjs';
function fixture(body){const root=mkdtempSync(join(tmpdir(),'recovery-child-'));const worker=join(root,'worker.mjs');writeFileSync(worker,body);return {root,worker};}
const args={request:{schedule:{},sources:{}}};
test('actual child close precedes generation return and certifies only local settlement',async()=>{
 const f=fixture("for await(const c of process.stdin){};process.stdout.write(JSON.stringify({terminal:{workers_settled:true,status:'sealed'},error:null}));setTimeout(()=>process.exit(0),30);");
 try{
 const p=createComparisonGenerationProcess({worker:f.worker});await assert.rejects(p.settle({terminal:null}),/not-closed/);
 const terminal=await p.generate(args),r=await p.settle({terminal});assert.equal(r.exit_code,0);assert.equal(r.local_settled,true);assert.equal(r.remote_completion_claimed,false);
 assert.throws(()=>process.kill(r.child_pid,0),{code:'ESRCH'});
 await assert.rejects(p.generate(args),/single-use/);await assert.rejects(p.settle({terminal:{}}),/terminal-mismatch/);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('nonzero exit retains returned failure terminal',async()=>{
 const f=fixture("for await(const c of process.stdin){};process.stdout.write(JSON.stringify({terminal:{workers_settled:true,usage:{total_tokens:52}},error:'failed'}),()=>process.exit(2));");
 try{const p=createComparisonGenerationProcess({worker:f.worker});let error;try{await p.generate(args);}catch(e){error=e;}
 assert.equal(error.result.usage.total_tokens,52);assert.equal((await p.settle({terminal:error.result})).exit_code,2);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('cancellation escalates and awaits child close with unknown terminal',async()=>{
 const f=fixture("process.on('SIGTERM',()=>{});for await(const c of process.stdin){};setInterval(()=>{},1000);");
 try{const p=createComparisonGenerationProcess({worker:f.worker,kill_grace_ms:30}),c=new AbortController();
 // Allow module startup before cancellation; an early SIGTERM is also a valid closed child.
 const timer=setTimeout(()=>c.abort(),150);let error;try{await p.generate({...args,signal:c.signal});}catch(e){error=e;}finally{clearTimeout(timer);}
 assert.equal(error.result,null);const r=await p.settle({terminal:null});assert.equal(r.local_settled,true);assert.ok(['SIGKILL','SIGTERM'].includes(r.termination_signal));assert.throws(()=>process.kill(r.child_pid,0),{code:'ESRCH'});
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('bounded stdout overflow cannot parse or return success',async()=>{
 const f=fixture("for await(const c of process.stdin){};process.stdout.write('x'.repeat(9*1024*1024));setInterval(()=>{},1000);");
 try{const p=createComparisonGenerationProcess({worker:f.worker,kill_grace_ms:30});let error;try{await p.generate(args);}catch(e){error=e;}
 assert.match(error.message,/output-limit/);assert.equal(error.result,null);assert.equal((await p.settle({terminal:null})).local_settled,true);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});

test('child exit closes inherited pipes of a surviving native child before returning',async()=>{
 const f=fixture("import {spawn} from 'node:child_process';for await(const c of process.stdin){};const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});child.on('spawn',()=>process.stdout.write(JSON.stringify({terminal:{workers_settled:true},error:null}),()=>process.exit(0)));");
 try{const p=createComparisonGenerationProcess({worker:f.worker});const started=Date.now();let terminal=null,error=null;try{terminal=await p.generate(args);}catch(e){error=e;terminal=e.result;}
 const receipt=await p.settle({terminal});assert.ok(Date.now()-started<7000);assert.equal(receipt.forced,true);
 // A host that delays orphan reaping must remain inconclusive, never falsely settled.
 if(error){assert.match(error.message,/process-group-not-settled/);assert.equal(receipt.local_settled,false);}else assert.equal(receipt.process_group_absent,true);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});

test('actual comparison worker rejects malformed schedule and exits before provider access',async()=>{
 const p=createComparisonGenerationProcess();let error;try{await p.generate(args);}catch(e){error=e;}
 assert.ok(error);assert.equal(error.result,null);const settlement=await p.settle({terminal:null});assert.equal(settlement.local_settled,true);assert.equal(settlement.exit_code,2);
});
