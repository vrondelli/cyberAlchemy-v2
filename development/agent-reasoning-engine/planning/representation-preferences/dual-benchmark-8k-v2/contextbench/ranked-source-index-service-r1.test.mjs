// Real Git/Python/process boundary; no provider calls.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createSourceHintService,runSourceIndex} from './ranked-source-index-service-r1.mjs';
async function fixture(fn){
 const repository=mkdtempSync(join(tmpdir(),'source-bridge-'));
 try{
  const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:repository,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-q');writeFileSync(join(repository,'needle.js'),'export const needle = 42;\n');
  git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');
  const base_commit=git('rev-parse','HEAD');
  return await fn({repository,base_commit,signal:new AbortController().signal});
 }finally{rmSync(repository,{recursive:true,force:true});}
}
test('real worker binds pinned source and saves one manifest across queries',()=>fixture(async input=>{
 const manifests=[],events=[];
 const service=await createSourceHintService({...input,save_manifest:v=>manifests.push(v),record:e=>events.push(e)});
 writeFileSync(join(input.repository,'needle.js'),'worktree replacement');
 const first=await service.query('needle'),second=await service.query('export');
 assert.equal(first.hints[0].path,'needle.js');assert.equal(first.hints[0].base_commit,input.base_commit);
 assert.equal(first.index_digest,second.index_digest);assert.equal(manifests.length,1);
 assert.equal(events.length,3);assert.ok(events.every(e=>e.model_calls===0&&e.settlement.process_group_absent&&e.python_settlement.process_group_absent));
 assert.ok(events.every(e=>!('manifest' in e)));assert.equal(service.expected.files.size,1);
 service.close();await assert.rejects(service.query('needle'),/service-state/);
}));
test('admission failure poisons service before another index query',()=>fixture(async input=>{
 let admitted=true;const events=[];
 const service=await createSourceHintService({...input,save_manifest:()=>{},record:e=>events.push(e),before_index:()=>admitted});
 admitted=false;await assert.rejects(service.query('needle'),/admission/);
 assert.equal(events.at(-1).kind,'source-index-failure');
 await assert.rejects(service.query('needle'),/service-state/);service.close();
}));
test('invalid pinned commit preserves failed worker settlement',()=>fixture(async input=>{
 await assert.rejects(runSourceIndex({...input,base_commit:'0'.repeat(40),query:'needle'}),e=>{
  assert.equal(e.message,'source-index.failed');assert.equal(e.result.settlement.process_group_absent,true);
  assert.equal(e.result.report.ok,false);assert.equal(e.result.report.settlement.process_group_absent,true);return true;
 });
}));
test('outer deadline settles a supervised process without retry',()=>fixture(async input=>{
 const worker_path=join(input.repository,'waiting.mjs');
 writeFileSync(worker_path,"process.stdin.resume();setInterval(()=>{},1000);\n");
 await assert.rejects(runSourceIndex({...input,query:'needle'},{worker_path,deadline_ms:100}),e=>{
  assert.equal(e.result.expired,true);assert.equal(e.result.settlement.process_group_absent,true);
  assert.equal(e.result.settlement.forced,false);return true;
 });
}));
test('semantic worker rejection retains terminal and settlement evidence',()=>fixture(async input=>{
 const real=await runSourceIndex({...input,query:'needle'});
 const terminal={ok:true,result:structuredClone(real.value),settlement:real.python_settlement};
 terminal.result.index_digest='0'.repeat(64);
 const worker_path=join(input.repository,'forged.mjs');
 writeFileSync(worker_path,'process.stdin.resume();process.stdin.on("end",()=>process.stdout.write('+JSON.stringify(JSON.stringify({terminal,error:null}))+'));\n');
 await assert.rejects(runSourceIndex({...input,query:'needle'},{worker_path}),e=>{
  assert.match(e.message,/manifest-digest/);assert.equal(e.result.report.result.index_digest,'0'.repeat(64));
  assert.equal(e.result.settlement.process_group_absent,true);return true;
 });
}));
