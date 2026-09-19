import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createMatchedRepositoryTools} from './deepseek-matched-tools.mjs';
import {tools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {observationMaterial,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
async function fixture(run){
 const root=mkdtempSync(join(tmpdir(),'dsh-tools-'));
 const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{git('init');writeFileSync(join(root,'value.js'),'export const value = 1;\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');await run(root,git('rev-parse','HEAD'));}finally{rmSync(root,{recursive:true,force:true});}
}
const execution=id=>({callId:id,signal:new AbortController().signal});
test('identical source/edit schemas, actual edit, original base and stable evidence handles',()=>fixture(async(root,base_commit)=>{
 const saved=[],adapter=createMatchedRepositoryTools({root,base_commit,persist:r=>saved.push(r)});
 assert.deepEqual(adapter.definitions.map(d=>({type:'function',function:{name:d.name,description:d.description,parameters:d.parameters}})),tools);
 const invoke=(name,args,id)=>adapter.definitions.find(d=>d.name===name).execute(args,execution(id));
 const read=await invoke('read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'},'r1');
 assert.equal(read.output.read_id,hash(stable(observationMaterial('r1',read.output))));
 assert.equal(saved[0].kind,'tool-intent');assert.equal(saved[1].kind,'source-snapshot');assert.equal(saved[2].delivery_confirmed,false);
 const edit=await invoke('apply_edits',{edits:[{path:'value.js',source_sha256:read.output.source_sha256,old_text:'value = 1',new_text:'value = 2'}]},'e1');assert.equal(edit.ok,true);
 assert.match(readFileSync(join(root,'value.js'),'utf8'),/value = 2/);
 const base=await invoke('read_file',{path:'value.js',start_line:1,line_count:1,revision:'base'},'r2');assert.equal(base.output.source_sha256,read.output.source_sha256);
 assert.match((await invoke('get_patch',{},'p1')).output.patch,/\+export const value = 2/);
 const rendered=adapter.definitions[1].output.render({},base);assert.deepEqual(JSON.parse(rendered[0].text),base);
 assert.equal(adapter.snapshot().poisoned,false);
}));
test('schema errors stay visible; duplicate IDs and pre-cancelled edits do not mutate',()=>fixture(async(root,base_commit)=>{
 const adapter=createMatchedRepositoryTools({root,base_commit,persist:()=>{}}),read=adapter.definitions.find(d=>d.name==='read_file');
 const bad=await read.execute({},execution('bad'));assert.equal(bad.ok,false);assert.ok(bad.issues.length>1);
 await assert.rejects(()=>read.execute({},execution('bad')),/duplicate-call-id/);
 const controller=new AbortController();controller.abort();await assert.rejects(()=>adapter.definitions.find(d=>d.name==='apply_edits').execute({}, {callId:'cancel',signal:controller.signal}),/cancelled/);
 assert.equal(adapter.snapshot().records.length,2);assert.match(readFileSync(join(root,'value.js'),'utf8'),/value = 1/);
}));
test('post-edit persistence failure latches the adapter and retains the prior intent',()=>fixture(async(root,base_commit)=>{
 const saved=[],adapter=createMatchedRepositoryTools({root,base_commit,persist:r=>{if(r.kind==='tool-result')throw Error('disk-full');saved.push(r);}});
 const edit=adapter.definitions.find(d=>d.name==='apply_edits');
 await assert.rejects(()=>edit.execute({edits:[{path:'value.js',source_sha256:hash('export const value = 1;\n'),old_text:'value = 1',new_text:'value = 2'}]},execution('e1')),/disk-full/);
 assert.match(readFileSync(join(root,'value.js'),'utf8'),/value = 2/);assert.equal(saved[0].kind,'tool-intent');assert.equal(adapter.snapshot().poisoned,true);
 await assert.rejects(()=>edit.execute({},execution('e2')),/poisoned/);
}));
test('registration failure rolls back registered capabilities',()=>fixture(async(root,base_commit)=>{
 const adapter=createMatchedRepositoryTools({root,base_commit,persist:()=>{}});let count=0,removed=0;
 assert.throws(()=>adapter.register({tools:{register(){if(++count===3)throw Error('registry-failure');return ()=>removed++;}}}),/registry-failure/);assert.equal(removed,2);
}));
