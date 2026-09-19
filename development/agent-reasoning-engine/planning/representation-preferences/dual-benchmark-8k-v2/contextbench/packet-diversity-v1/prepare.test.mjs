import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {restoreVerifiedBase,fixedDonors,hash} from './prepare.mjs';
function repository(){
 const root=mkdtempSync(join(tmpdir(),'packet-source-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','user.name=fixture','-c','user.email=fixture@example.invalid','-C',cache,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git(['init']);writeFileSync(join(cache,'base.js'),'original pinned bytes\n');symlinkSync('base.js',join(cache,'link.js'));git(['add','.']);git(['commit','-m','synthetic fixture']);const commit=git(['rev-parse','HEAD']);
 return {root,cache,commit,donor:{repository_cache:cache,task:{base_commit:commit},reads:[{path:'base.js'}]},cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('verified minimal restoration uses exact pinned Git blob, independent of edited worktree',()=>{
 const f=repository();try{writeFileSync(join(f.cache,'base.js'),'edited cache working bytes');let guards=0;
  const directory=join(f.root,'restored'),manifest=restoreVerifiedBase({donor:f.donor,directory,storage_guard:()=>guards++});
  assert.equal(readFileSync(join(directory,'base.js'),'utf8'),'original pinned bytes\n');assert.equal(manifest.files.length,1);assert.equal(manifest.files[0].sha256,hash('original pinned bytes\n'));assert.equal(manifest.commit,f.commit);assert.ok(guards>=3);assert.equal(existsSync(join(directory,'.git')),false);
  assert.throws(()=>restoreVerifiedBase({donor:f.donor,directory,storage_guard:()=>{}}),/owned-new-base/);
 }finally{f.cleanup();}
});
test('restoration fails closed for missing objects, symlinks, path traversal and byte ceiling',()=>{
 const f=repository();try{for(const [name,change,extra,pattern]of [
  ['missing',{task:{base_commit:'f'.repeat(40)}},{},/git-object-unavailable/],
  ['link',{reads:[{path:'link.js'}]},{},/regular-base-blob/],
  ['escape',{reads:[{path:'../base.js'}]},{},/safe-path/],
  ['budget',{}, {maximum_bytes:1},/bounded-source-bytes/]
 ]){const directory=join(f.root,name);assert.throws(()=>restoreVerifiedBase({donor:{...f.donor,...change},directory,storage_guard:()=>{},...extra}),pattern);assert.equal(existsSync(directory),false);}
 }finally{f.cleanup();}
});
test('fixed four-task manifest includes both original arms and all eight fixed indices',()=>{
 const config={tasks:Array.from({length:4},(_,i)=>({id:'t'+i}))};const rows=fixedDonors(config);assert.equal(rows.length,8);assert.deepEqual(rows.map(r=>r.donor_index),[0,1,2,3,4,5,6,7]);assert.deepEqual(rows.slice(0,2).map(r=>r.donor_arm),['control','treatment']);assert.throws(()=>fixedDonors({tasks:config.tasks.slice(1)}),/four-tasks/);assert.throws(()=>fixedDonors({tasks:[...config.tasks.slice(1),config.tasks[1]]}),/distinct-tasks/);
});
