import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,readdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {projectFixture} from './project-canonical-buggy-fixture-r1.mjs';
function fixture({symlink=false}={}){
  const base=mkdtempSync(join(tmpdir(),'are-buggy-projection-test-'));const root=join(base,'trusted');mkdirSync(root);
  const git=(...args)=>execFileSync('git',['-C',root,...args],{stdio:'pipe'});
  git('init','--quiet');git('config','user.name','Fixture Test');git('config','user.email','fixture@example.invalid');
  writeFileSync(join(root,'Source.java'),'class Source { int value = 1; }\n');
  writeFileSync(join(root,'defects4j.build.properties'),'gold=not-exported\n');
  git('add','.');git('commit','--quiet','-m','fixed');git('tag','D4J_JxPath_8_FIXED_VERSION');
  writeFileSync(join(root,'Source.java'),'class Source { int value = 0; }\n');
  if(symlink)symlinkSync('Source.java',join(root,'Alias.java'));
  git('add','.');git('commit','--quiet','-m','buggy');git('tag','D4J_JxPath_8_BUGGY_VERSION');
  return {root,output:join(base,'export'),project:'JxPath',bug:8,frameworkPin:'a'.repeat(40),git};
}
test('exports buggy Java only; receipt seals corpus without history or gold',()=>{
  const f=fixture();const r=projectFixture(f);
  assert.equal(r.complete,true);assert.equal(r.source_count,1);
  assert.deepEqual(readdirSync(join(f.output,'corpus')),['Source.java']);
  assert.match(readFileSync(join(f.output,'corpus','Source.java'),'utf8'),/value = 0/);
  assert.equal(r.boundary.trusted_preparation_may_read_fixed_patch_gold,true);
  assert.throws(()=>projectFixture(f),/EEXIST/);
});
test('rejects fixed HEAD and dirty preparation fixture',()=>{
  const f=fixture();f.git('checkout','--quiet','D4J_JxPath_8_FIXED_VERSION');assert.throws(()=>projectFixture(f),/buggy tag/);
  f.git('checkout','--quiet','D4J_JxPath_8_BUGGY_VERSION');writeFileSync(join(f.root,'extra.txt'),'x');assert.throws(()=>projectFixture(f),/dirty/);
});
test('rejects symlink source and boundary overlap',()=>{
  const f=fixture({symlink:true});assert.throws(()=>projectFixture(f),/unsafe/);
  assert.throws(()=>projectFixture({...f,output:join(f.root,'export')}),/overlapping/);
});
