import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRankedSourceAcquisition as canonical} from './ranked-source-acquisition-java-canonical-r1.mjs';
import {createRankedSourceAcquisition as legacy} from './ranked-source-acquisition-java-r3.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
  const base=mkdtempSync(join(tmpdir(),'are-canonical-ranker-'));const old=join(base,'old'),root=join(base,'corpus');
  mkdirSync(old);mkdirSync(root);
  const data={'Alpha.java':'class Alpha { double number; boolean compare() { return false; } }\n',
    'Beta.java':'class Beta { int count; }\n','Gamma.java':'class Gamma { String unicode = "😀"; }\n'+'// padding\n'.repeat(2200)};
  for(const [path,text] of Object.entries(data)){writeFileSync(join(old,path),text);writeFileSync(join(root,path),text);}
  const git=(...args)=>execFileSync('git',['-C',old,...args],{stdio:'pipe'});
  git('init','--quiet');git('config','user.name','Ranker Test');git('config','user.email','test@example.invalid');git('add','.');git('commit','--quiet','-m','fixture');
  const base_commit=git('rev-parse','HEAD').toString().trim();
  const sources=Object.keys(data).sort().map(path=>{const b=readFileSync(join(root,path));return {path,bytes:b.length,sha256:sha(b)};});
  const source_manifest=join(base,'RECEIPT.json');const receipt={complete:true,buggy_commit:base_commit,sources,source_count:sources.length,source_tree_sha256:sha(JSON.stringify(sources))};
  writeFileSync(source_manifest,JSON.stringify(receipt));
  return {old,root,source_manifest,base_commit,problem_statement:'number compare',mode:'trace-text',receipt};
}
test('manifest-only adapter exactly preserves legacy scoring on identical source',()=>{
  const f=fixture();const a=canonical(f),b=legacy({...f,root:f.old});
  for(const query of ['number compare','Beta count','unicode Gamma','number '+ 'compare '.repeat(160)])assert.deepEqual(a.rankAll(query),b.rankAll(query));
});
test('rejects changed, omitted and additional source instead of partial admission',()=>{
  const f=fixture();writeFileSync(join(f.root,'Extra.java'),'class Extra {}');assert.throws(()=>canonical(f),/inventory-drift/);
  const g=fixture();writeFileSync(join(g.root,'Alpha.java'),'class Tampered {}');assert.throws(()=>canonical(g),/source-drift/);
});
test('rejects metadata, source symlinks, and unsafe manifest paths',()=>{
  const f=fixture();writeFileSync(join(f.root,'gold.json'),'{}');assert.throws(()=>canonical(f),/non-java-projection/);
  const g=fixture();symlinkSync(g.source_manifest,join(g.root,'Alias.java'));assert.throws(()=>canonical(g),/source-boundary/);
  const h=fixture();h.receipt.sources[0].path='../Secret.java';h.receipt.source_tree_sha256=sha(JSON.stringify(h.receipt.sources));writeFileSync(h.source_manifest,JSON.stringify(h.receipt));assert.throws(()=>canonical(h),/unsafe-manifest/);
});
