// Run against the pinned installed DSH packages: DSH_ROOT must be explicit.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createMatchedRepositoryTools} from './deepseek-matched-tools.mjs';
const dsh=process.env.DSH_ROOT;
assert.ok(dsh,'DSH_ROOT must point to the pinned installed node_modules');
const load=name=>import(pathToFileURL(join(dsh,'@deepseek-ai',name,'lib/index.js')));
const {Context}=await load('cordis');
const {SystemPrompt}=await load('dsh-system-prompt');
const {ToolRuntime}=await load('dsh-tools');
test('actual DSH registry executes shared read/edit tools with intact JSON evidence',async()=>{
 const root=mkdtempSync(join(tmpdir(),'dsh-runtime-')),ctx=new Context();
 const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  git('init');writeFileSync(join(root,'value.js'),'export const value = 1;\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');
  new SystemPrompt(ctx,{});const runtime=new ToolRuntime(ctx,{mode:'native'});
  const saved=[],adapter=createMatchedRepositoryTools({root,base_commit:git('rev-parse','HEAD'),persist:r=>saved.push(r)});
  const dispose=adapter.register(ctx);
  assert.deepEqual(runtime.schemas().map(x=>x.name).sort(),['apply_edits','get_patch','list_files','read_file','search']);
  const invoke=(name,args,callId)=>runtime.execute({name,arguments:args,callId,signal:new AbortController().signal});
  const result=await invoke('read_file',{path:'value.js',start_line:1,line_count:1,revision:'current'},'read-1');
  assert.notEqual(result.isError,true,JSON.stringify(result));
  const read=JSON.parse(result.content[0].text);assert.equal(read.ok,true);assert.match(read.output.read_id,/^[a-f0-9]{64}$/);
  const edit=await invoke('apply_edits',{edits:[{path:'value.js',source_sha256:read.output.source_sha256,old_text:'value = 1',new_text:'value = 2'}]},'edit-1');
  assert.notEqual(edit.isError,true,JSON.stringify(edit));assert.equal(JSON.parse(edit.content[0].text).ok,true);
  assert.match(readFileSync(join(root,'value.js'),'utf8'),/value = 2/);
  const base=await invoke('read_file',{path:'value.js',start_line:1,line_count:1,revision:'base'},'read-2');
  assert.equal(JSON.parse(base.content[0].text).output.source_sha256,read.output.source_sha256);
  assert.equal(saved.filter(r=>r.kind==='tool-result').length,3);
  assert.ok(saved.filter(r=>r.kind==='tool-result').every(r=>r.delivery_confirmed===false));
  dispose();assert.deepEqual(runtime.schemas(),[]);
 }finally{rmSync(root,{recursive:true,force:true});}
});
