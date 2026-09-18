import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {createRepositoryTools} from './repository-tools.mjs';
async function fixture(fn){
 const root=mkdtempSync(join(tmpdir(),'are-cb-repo-'));
 const git=args=>execFileSync('git',args,{cwd:root,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);
  writeFileSync(join(root,'a.py'),'alpha\nbeta\nalpha\n');writeFileSync(join(root,'b.py'),'gamma\n');git(['add','.']);git(['commit','-m','fixture']);
  const base_commit=git(['rev-parse','HEAD']);await fn(createRepositoryTools({root,base_commit}),root);
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('schema returns all detected defects before tool effects',()=>fixture(async tool=>{
 const r=await tool('read_file',{path:1,start_line:0,line_count:0,revision:'invented',extra:true});
 assert.equal(r.ok,false);assert.ok(r.issues.length>=5);
}));
test('base and current observations stay distinct after an exact edit',()=>fixture(async tool=>{
 const args={path:'a.py',start_line:1,line_count:3,revision:'base'},before=(await tool('read_file',args)).output;
 assert.equal((await tool('apply_edits',{edits:[{path:'a.py',source_sha256:before.source_sha256,old_text:'beta',new_text:'new\ncontent'}]})).ok,true);
 const base=(await tool('read_file',args)).output,current=(await tool('read_file',{...args,revision:'current',line_count:4})).output;
 assert.equal(base.utf8,before.utf8);assert.notEqual(base.source_sha256,current.source_sha256);assert.equal(current.total_lines,4);
 assert.match((await tool('get_patch',{})).output.patch,/\+new/);
}));
test('invalid later edit leaves the whole batch unapplied',()=>fixture(async(tool,root)=>{
 const before=readFileSync(join(root,'a.py'),'utf8'),s=(await tool('read_file',{path:'a.py',start_line:1,line_count:3,revision:'base'})).output;
 const r=await tool('apply_edits',{edits:[{path:'a.py',source_sha256:s.source_sha256,old_text:'beta',new_text:'changed'},{path:'b.py',source_sha256:'0'.repeat(64),old_text:'gamma',new_text:'bad'}]});
 assert.equal(r.ok,false);assert.equal(readFileSync(join(root,'a.py'),'utf8'),before);
}));
test('search pages exact whole lines with source hashes and explicit EOF',()=>fixture(async tool=>{
 const args={query:'alpha',path_prefix:'',offset:0,limit:1,revision:'base'},first=(await tool('search',args)).output;
 assert.equal(first.observations[0].utf8,'alpha');assert.equal(first.observations[0].start_line,1);assert.equal(first.next_offset,1);
 const last=(await tool('search',{...args,offset:1})).output;assert.equal(last.observations[0].start_line,3);assert.equal(last.next_offset,null);
}));
test('literal search reads only git-matched candidates before exact observation projection',()=>fixture(async tool=>{
 const result=await tool('search',{query:'beta',path_prefix:'',offset:0,limit:10,revision:'base'});
 assert.equal(result.ok,true);assert.equal(result.output.search_engine,'git-grep-literal');
 assert.equal(result.output.scanned_matching_files,1);assert.equal(result.output.total,1);assert.equal(result.output.observations[0].utf8,'beta');
}));
test('untracked and traversal paths produce corrective feedback',()=>fixture(async tool=>{
 for(const path of ['../escape','missing.py'])assert.equal((await tool('read_file',{path,start_line:1,line_count:1,revision:'current'})).ok,false);
}));
