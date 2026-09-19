import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {featureMaps} from '../src/featureMaps.ts';
const docs=JSON.parse(readFileSync(new URL('../src/generated/documentation.json',import.meta.url),'utf8')).documents;
test('every published feature has a connected map with valid related-feature links',()=>{
 assert.deepEqual(Object.keys(featureMaps).sort(),docs.map(d=>d.id).sort());
 for(const [id,map] of Object.entries(featureMaps)){
  assert.ok(map.parts.length>=8,id);
  for(const part of map.parts){assert.ok(part.title&&part.detail);if(part.related)assert.ok(featureMaps[part.related],part.related);}
  const visited=new Set([0]);
  for(const [a,b,label] of map.connections){assert.ok(map.parts[a]&&map.parts[b]&&a!==b&&label,id);}
  for(let i=0;i<map.parts.length;i++)for(const [a,b] of map.connections)if(visited.has(a)||visited.has(b)){visited.add(a);visited.add(b);}
  assert.equal(visited.size,map.parts.length,`${id}: disconnected part`);
 }
});
