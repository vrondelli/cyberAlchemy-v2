import test from 'node:test';import assert from 'node:assert/strict';
import {buildInventory,buildFilePacket,parseDirectoryChoice,parseFileChoice,buildNavigationRequest} from './inventory-navigation-r2.mjs';
test('source-ledger exclusion preserves exactly every unobserved path',()=>{
 const paths=['lib/a.py','lib/b.hpp','README.rst','docs/x.md'],i=buildInventory(paths,['lib/a.py','absent.py']);
 assert.deepEqual(i.paths,['README.rst','docs/x.md','lib/b.hpp']);assert.deepEqual([...i.groups.values()].flat().sort(),i.paths);
 const packet=buildFilePacket(i,['lib']);assert.deepEqual(packet.directories,[{directory:'lib',files:['b.hpp']}]);
 assert.throws(()=>parseFileChoice('{"paths":["lib/a.py"]}',packet));
});
test('exact IDs resolve only through bound inventory, never a repaired prefix',()=>{
 const i=buildInventory(['lib/a.py','README.md']);const ids=[...i.idToPrefix.keys()];
 assert.deepEqual(parseDirectoryChoice(JSON.stringify({group_ids:[ids[1]]}),i),['lib']);
 for(const raw of ['{"prefixes":["lib"]}','{"group_ids":["lib"]}','{"group_ids":["g9999"]}','{"group_ids":[]}','{"group_ids":["g0001","g0001"]}','{"group_ids":[1]}','{"group_ids":["g0001"],"reason":"x"}','```json\n{"group_ids":["g0001"]}\n```'])assert.throws(()=>parseDirectoryChoice(raw,i));
});
test('deterministic catalog and IDs independent of input ordering',()=>{
 const a=buildInventory(['lib/b.py','README.md','lib/a.py'],['lib/a.py']),b=buildInventory(['README.md','lib/a.py','lib/b.py'],['lib/a.py']);
 assert.deepEqual(a.catalog,b.catalog);assert.deepEqual([...a.idToPrefix],[...b.idToPrefix]);
});
test('invalid source or ledger fails before exclusion',()=>{
 for(const p of ['/etc/passwd','../x','a/../b','a\\b','x\nsecret']){
  assert.throws(()=>buildInventory([p],[p]));assert.throws(()=>buildInventory(['valid.py'],[p]));
 }
 assert.throws(()=>buildInventory(['a.py'],['a.py','a.py']));
});
test('fully observed inventory is explicit empty source state',()=>{
 const i=buildInventory(['a.py'],['a.py']);assert.deepEqual(i.paths,[]);assert.equal(i.groups.size,0);assert.deepEqual(i.catalog,{directories:[]});
 assert.throws(()=>parseDirectoryChoice('{"group_ids":["g0001"]}',i));
});
test('request contains original issue and available packet only',()=>{
 const i=buildInventory(['a.py','b.py'],['a.py']);const r=buildNavigationRequest({request_id:'synthetic',problem_statement:'Fix error',stage:'directories',packet:i.catalog});
 assert.equal(r.output_cap,512);assert.deepEqual(r.tools,[]);assert.deepEqual(JSON.parse(r.messages[1].content),{issue:'Fix error',inventory:i.catalog});assert.ok(!r.messages[1].content.includes('a.py'));
});
test('large nested inventories preserve all unobserved files across group partition',()=>{
 const paths=Array.from({length:1000},(_,i)=>'test/integration/targets/t'+i+'/tasks/main.yml'),observed=paths.slice(0,100),i=buildInventory(paths,observed);
 assert.deepEqual([...i.groups.values()].flat().sort(),paths.slice(100).sort());assert.equal(i.paths.length,900);
 for(const prefix of i.groups.keys())assert.ok(Buffer.byteLength(JSON.stringify(buildFilePacket(i,[prefix])))<=20000);
});
