// Exact ESM, runtime-data and CommonJS package binding. Open questions: CANDIDATE-ONLY-LIVE.md.
import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFileSync,realpathSync,lstatSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
export const fileHash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
export function collectCandidateSources(entries){
 assert.equal(typeof vm.SourceTextModule,'function','candidate-freeze.vm-flag-required');
 const files=new Map(),packages=new Set();
 function packageTree(entry){
  let root=dirname(entry);while(!existsSync(join(root,'package.json'))){const parent=dirname(root);assert.notEqual(parent,root,'candidate-freeze.package-root');root=parent;}
  root=realpathSync(root);if(packages.has(root))return;packages.add(root);
  const pkg=JSON.parse(readFileSync(join(root,'package.json'))),require=createRequire(join(root,'package.json'));
  function walk(dir){for(const name of readdirSync(dir)){if(name==='node_modules')continue;const path=join(dir,name),st=lstatSync(path);assert.ok(!st.isSymbolicLink(),'candidate-freeze.package-symlink');if(st.isDirectory())walk(path);else if(/\.(js|cjs|mjs|json)$/.test(name))bind(path,false);}}
  walk(root);
  for(const dependency of Object.keys(pkg.dependencies??{}))packageTree(require.resolve(dependency));
 }
 function bind(path,expand=true){
  path=realpathSync(path);if(files.has(path))return;assert.ok(lstatSync(path).isFile(),'candidate-freeze.regular-file');
  assert.ok(files.size<4096,'candidate-freeze.capacity');files.set(path,{path,sha256:fileHash(path)});
  if(!expand)return;
  if(path.endsWith('.mjs')){
   const source=readFileSync(path,'utf8');
   for(const spec of new vm.SourceTextModule(source,{identifier:path}).dependencySpecifiers){if(spec.startsWith('node:'))continue;assert.ok(spec.startsWith('.'),'candidate-freeze.bare-esm-import');bind(resolve(dirname(path),spec));}
   for(const m of source.matchAll(/new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)/g)){if(m[1].endsWith('/'))continue;bind(resolve(dirname(path),m[1]));}
  }else if(path.includes('/node_modules/')&&/\.(js|cjs)$/.test(path))packageTree(path);
 }
 for(const entry of entries)bind(entry);
 return [...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
}
export function verifyCandidateSources(files,entries){
 assert.ok(Array.isArray(files)&&files.length>0&&files.length<=4096,'candidate-freeze.files');
 const seen=new Set();for(const b of files){assert.equal(realpathSync(b.path),b.path);assert.ok(!seen.has(b.path));seen.add(b.path);assert.equal(fileHash(b.path),b.sha256,'candidate-freeze.source-drift');}
 for(const b of collectCandidateSources(entries)){assert.ok(seen.has(b.path),'candidate-freeze.unbound-dependency:'+b.path);assert.equal(files.find(x=>x.path===b.path).sha256,b.sha256);}
 return true;
}
