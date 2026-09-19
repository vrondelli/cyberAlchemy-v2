import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHeadlessTools} from './deepseek-headless-plugin.mjs';
async function fixture(run){
 const root=mkdtempSync(join(tmpdir(),'dsh-headless-')),base=join(root,'base'),work=join(root,'work'),evidence=join(root,'evidence');mkdirSync(base);mkdirSync(evidence);
 const git=(cwd,...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{git(base,'init');writeFileSync(join(base,'value.js'),'export const value = 1;\n');git(base,'add','.');git(base,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');const commit=git(base,'rev-parse','HEAD');git(root,'clone','--no-local',base,work);await run({work_root:work,base_root:base,evidence_root:evidence,base_commit:commit});}finally{rmSync(root,{recursive:true,force:true});}
}
test('final selection diagnoses invented and edited evidence, accepts base evidence and closes episode',()=>fixture(async options=>{
 const adapter=createHeadlessTools(options);let concluded=0;
 const invoke=(name,args,id)=>adapter.definitions.find(d=>d.name===name).execute(args,{callId:id,signal:new AbortController().signal,concludeTurn:()=>concluded++});
 const read=await invoke('read_file',{path:'value.js',start_line:1,line_count:1,revision:'base'},'r1');
 await invoke('apply_edits',{edits:[{path:'value.js',source_sha256:read.output.source_sha256,old_text:'value = 1',new_text:'value = 2'}]},'e1');
 const current=await invoke('read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'},'r2');
 const bad=await invoke('submit_context_selection',{summary:'bad',context_read_ids:[current.output.read_id,'f'.repeat(64)]},'s1');
 assert.equal(bad.ok,false);assert.ok(bad.diagnostic.issues.some(x=>x.code==='final-selection.changed-source-lines'));assert.ok(bad.diagnostic.issues.some(x=>x.code==='final-selection.undelivered-read-id'));assert.equal(concluded,0);
 const good=await invoke('submit_context_selection',{summary:'Attempted correction',context_read_ids:[read.output.read_id]},'s2');assert.equal(good.ok,true);assert.equal(concluded,1);assert.equal(adapter.snapshot().closed,true);
 await assert.rejects(()=>invoke('get_patch',{},'p1'),/closed/);
 assert.ok(readdirSync(options.evidence_root).length>=8);
 assert.throws(()=>createHeadlessTools(options),/fresh-evidence/);
}));
test('evidence roots must be disjoint from the model repository',()=>fixture(async options=>{
 const nested=join(options.work_root,'evidence');mkdirSync(nested);
 assert.throws(()=>createHeadlessTools({...options,evidence_root:nested}),/disjoint-roots/);
}));
test('modified base source is rejected before creating evidence',()=>fixture(async options=>{
 writeFileSync(join(options.base_root,'value.js'),'changed base\n');
 assert.throws(()=>createHeadlessTools(options),/base-dirty/);
 assert.deepEqual(readdirSync(options.evidence_root),[]);
}));
