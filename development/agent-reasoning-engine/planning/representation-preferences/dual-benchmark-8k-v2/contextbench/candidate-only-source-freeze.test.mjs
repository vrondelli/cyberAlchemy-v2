import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {collectCandidateSources,verifyCandidateSources} from './candidate-only-source-freeze.mjs';
function fixture(t){const root=mkdtempSync(join(tmpdir(),'candidate-freeze-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const write=(p,s)=>{mkdirSync(join(root,p,'..'),{recursive:true});writeFileSync(join(root,p),s);};
 write('entry.mjs',"import x from './node_modules/a/index.js';const schema=new URL('./schema.json',import.meta.url);export {x,schema};");
 write('schema.json','{}');write('node_modules/a/package.json',JSON.stringify({name:'a',main:'index.js',dependencies:{b:'1.0.0'}}));
 write('node_modules/a/index.js',"module.exports=require('b');");write('node_modules/b/package.json',JSON.stringify({name:'b',main:'index.js'}));write('node_modules/b/index.js','module.exports=1;');
 return {root,entry:join(root,'entry.mjs')};}
test('runtime schema and CommonJS transitive package source are bound',t=>{
 const f=fixture(t),files=collectCandidateSources([f.entry]);assert.ok(files.some(b=>b.path.endsWith('/schema.json')));assert.ok(files.some(b=>b.path.endsWith('/node_modules/b/index.js')));assert.equal(verifyCandidateSources(files,[f.entry]),true);
});
test('missing CommonJS source and schema drift fail closed',t=>{
 const f=fixture(t),files=collectCandidateSources([f.entry]);assert.throws(()=>verifyCandidateSources(files.filter(b=>!b.path.endsWith('/node_modules/b/index.js')),[f.entry]),/unbound-dependency/);
 writeFileSync(join(f.root,'schema.json'),'{"changed":true}');assert.throws(()=>verifyCandidateSources(files,[f.entry]),/source-drift/);
});
