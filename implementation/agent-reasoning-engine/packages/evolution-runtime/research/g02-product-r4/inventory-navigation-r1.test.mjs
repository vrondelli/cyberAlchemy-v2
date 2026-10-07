import test from 'node:test';import assert from 'node:assert/strict';
import {buildInventory,buildFilePacket,parseDirectoryChoice,parseFileChoice,buildNavigationRequest} from './inventory-navigation-r1.mjs';
test('language-neutral full inventory, stable grouping and root files',()=>{
 const i=buildInventory(['src/lib/a/x.hpp','README.rst','src/lib/a/y.py','docs/a.md']);
 assert.deepEqual(i.catalog.directories,[{directory:'.',groups:[['.',1],['docs',1]]},{directory:'src/lib',groups:[['a',2]]}]);
 assert.deepEqual(buildFilePacket(i,['src/lib/a']).directories,[{directory:'src/lib/a',files:['x.hpp','y.py']}]);
});
test('invalid or duplicate path rejected, never normalized into a valid path',()=>{
 for(const p of ['/etc/passwd','../secret','a/../b','a\\b','a\nsecret'])assert.throws(()=>buildInventory([p]));
 assert.throws(()=>buildInventory(['x','x']));
});
test('choices constrained to exact catalog and file packet',()=>{
 const i=buildInventory(['lib/a.py','README.md']);const p=buildFilePacket(i,['lib']);
 assert.deepEqual(parseDirectoryChoice('{"prefixes":["lib"]}',i),['lib']);
 assert.deepEqual(parseFileChoice('{"paths":["lib/a.py"]}',p),['lib/a.py']);
 assert.throws(()=>parseDirectoryChoice('{"prefixes":["other"]}',i));
 assert.throws(()=>parseFileChoice('{"paths":["README.md"]}',p));
 assert.throws(()=>buildFilePacket(i,['lib','lib']));
});
test('strict JSON, no repair or hidden fields, empty file abstention retained',()=>{
 const i=buildInventory(['x.py']),p=buildFilePacket(i,['.']);
 assert.deepEqual(parseFileChoice('{"paths":[]}',p),[]);
 for(const raw of ['```json\n{"paths":[]}\n```','{"paths":[],"reason":"x"}','{"paths":["x.py","x.py"]}','{"paths":[1]}'])assert.throws(()=>parseFileChoice(raw,p));
 assert.throws(()=>parseDirectoryChoice('{"prefixes":[]}',i));
});
test('packet overflow fails closed without truncating paths',()=>{
 const paths=Array.from({length:100},(_,i)=>'src/'+String(i)+'x'.repeat(1000));
 assert.throws(()=>buildInventory(paths),/unsplittable-group-cap/);
});
test('issue-only plus exact inventory request, bounded public output',()=>{
 const i=buildInventory(['x.py']);const r=buildNavigationRequest({request_id:'synthetic',problem_statement:'Fix x',stage:'directories',packet:i.catalog});
 assert.equal(r.output_cap,512);assert.deepEqual(r.tools,[]);
 assert.deepEqual(JSON.parse(r.messages[1].content),{issue:'Fix x',inventory:i.catalog});
 assert.throws(()=>buildNavigationRequest({request_id:'x',problem_statement:'x'.repeat(24577),stage:'files',packet:{}}));
});
test('oversized nested group is recursively partitioned without dropped files',()=>{
 const paths=Array.from({length:1000},(_,i)=>'test/integration/targets/t'+i+'/tasks/main.yml');
 const inventory=buildInventory(paths);assert.ok(inventory.groups.size>1);
 assert.deepEqual([...inventory.groups.values()].flat().sort(),paths.sort());
 const prefixes=[...inventory.groups.keys()].slice(0,3);assert.ok(Buffer.byteLength(JSON.stringify(buildFilePacket(inventory,prefixes)))<=65536);
});
