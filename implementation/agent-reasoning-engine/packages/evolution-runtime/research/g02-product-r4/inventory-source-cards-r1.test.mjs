import test from 'node:test';import assert from 'node:assert/strict';import{hash}from'./vps-json-provider-r1.mjs';
import{buildSourceCardPacket,parseSourceCardChoice,createSourceCardRequest}from'./inventory-source-cards-r1.mjs';
const source=(path,utf8)=>({path,utf8,source_sha256:hash(utf8)});
test('exact source hashes, line coordinates and language-neutral inventory retained',()=>{
 const b=buildSourceCardPacket({problem_statement:'Attribute min max filter',sources:[source('x.hpp','#define JSON_TESTS_PRIVATE\nint maximum(int x) {\n}'),source('a.py','def min(value):\n    return value\n'),source('doc.rst','Attribute filter\n============\n')]});
 assert.deepEqual(b.packet.cards.map(c=>c.path),['a.py','doc.rst','x.hpp']);for(const c of b.packet.cards){assert.equal(c.excerpt_is_partial,true);assert.ok(c.excerpt.length>0);assert.ok(c.excerpt.every(r=>r.line>=1&&r.line<=c.line_count));}
});
test('exact IDs only; no path repair, unknown IDs, duplicates or hidden fields',()=>{
 const b=buildSourceCardPacket({problem_statement:'Bug',sources:[source('a.py','def f(): pass')]});
 assert.deepEqual(parseSourceCardChoice('{"file_ids":["f0001"]}',b),['a.py']);assert.deepEqual(parseSourceCardChoice('{"file_ids":[]}',b),[]);
 for(const raw of ['{"paths":["a.py"]}','{"file_ids":["a.py"]}','{"file_ids":["f9999"]}','{"file_ids":["f0001","f0001"]}','{"file_ids":[1]}','{"file_ids":[],"reason":"x"}','```json\n{"file_ids":[]}\n```'])assert.throws(()=>parseSourceCardChoice(raw,b));
});
test('digest mismatch, unsafe path, duplicate sources and size overflow fail closed',()=>{
 for(const s of [{...source('a','x'),source_sha256:'bad'},source('../x','x'),source('x','x'.repeat(1024**2+1))])assert.throws(()=>buildSourceCardPacket({problem_statement:'Bug',sources:[s]}));
 assert.throws(()=>buildSourceCardPacket({problem_statement:'Bug',sources:[source('a','x'),source('a','x')]}));
});
test('excerpt budget and unicode clipping preserve valid source prefixes',()=>{
 const s=source('a.py','def bug():\n'+'😀'.repeat(1000)+' bug\n');const b=buildSourceCardPacket({problem_statement:'bug',sources:[s]});
 const rows=b.packet.cards[0].excerpt;assert.ok(rows.reduce((n,r)=>n+Buffer.byteLength(JSON.stringify(r)),0)<=384);for(const r of rows){assert.ok(Buffer.byteLength(r.text)<=120);assert.ok(!r.text.includes('\uFFFD'));assert.ok(s.utf8.split('\n')[r.line-1].startsWith(r.text));}
});
test('selection request contains bounded source packet and issue only',()=>{
 const b=buildSourceCardPacket({problem_statement:'Bug',sources:[source('a.py','def f(): pass')]});const r=createSourceCardRequest({request_id:'synthetic',problem_statement:'Bug',packet:b.packet});assert.equal(r.output_cap,512);assert.deepEqual(r.tools,[]);assert.deepEqual(JSON.parse(r.messages[1].content),{issue:'Bug',inventory:b.packet});
});
test('symlink cards explicitly retain exact link text without claiming target code',()=>{
 const s={...source('lib/link.py','../release.py'),source_kind:'symlink'};const b=buildSourceCardPacket({problem_statement:'release',sources:[s]});
 assert.equal(b.packet.cards[0].source_kind,'symlink');assert.equal(b.packet.cards[0].excerpt[0].text,'../release.py');assert.equal(b.packet.cards[0].source_sha256,hash('../release.py'));
 assert.throws(()=>buildSourceCardPacket({problem_statement:'release',sources:[{...s,source_kind:'unverified-target'}]}));
});
