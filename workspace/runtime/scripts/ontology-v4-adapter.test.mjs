import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {adapt,endpoint,parseLossless,qualified} from './ontology-v4-adapter.mjs';
import {previewServer} from './serve-ontology-v4.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
function fixture() {
  const p={package_key:'p',ontology_id:'sample',profile:{path:'sample/profile.json'},owner:'owner',source_status:'candidate',endpoint_aliases:{other:'q'},
    nodes:{id_field:'id',type_field:'kind'},relations:{id_field:'id',type_field:'type',source_field:'from',target_field:'to',direction_map:{directed:'directed',symmetric:'symmetric'}}};
  const row=(pkg,kind,id,raw,type='type')=>({identity:{subject_id:qualified(pkg,kind,id),subject_kind:kind,type_ref:type},source_record:raw,lifecycle:'active',source_binding:{package_key:pkg,path:'records.json',selector:'/nodes/0',sha256:'source'}});
  const rows=[row('p','node','a',{id:'a',kind:'Entity',label:'A'}),row('q','node','a',{id:'a',kind:'Entity',label:'Other A'}),row('p','relation','r',{id:'r',type:'links',from:'a',to:'other::a'})];
  const view={views:[{id:'selected',node_ids:['a'],relation_ids:['r'],purpose:'test'}]};
  const content=JSON.stringify(view);const doc=row('p','node','views',{content,content_sha256:sha(content)},'source-document');doc.source_binding.path='sample/VIEWS.json';rows.push(doc);
  return {manifest:{authority_effect:'none',packages:[p,{...p,package_key:'q'}]},exported:{authority_effect:'none',head:'head',records:rows}};
}
test('same local IDs remain package-qualified, with cross-package endpoints',()=>{
  const f=fixture(),s=adapt(f.manifest,f.exported);assert.equal(s.nodes.length,2);assert.notEqual(s.nodes[0].id,s.nodes[1].id);assert.equal(s.relations[0].target,s.nodes[1].id);assert.equal(s.views[0].error,null);
});
test('unsafe numbers retain exact decimal text',()=>assert.deepEqual(parseLossless('{"n":9007199254740993123,"f":1.234567890123456789,"safe":7}'),{n:'9007199254740993123',f:'1.234567890123456789',safe:7}));
test('undeclared aliases rejected',()=>assert.throws(()=>endpoint(fixture().manifest.packages[0],'unknown::a'),/Undeclared/));
test('missing endpoints rejected',()=>{const f=fixture();f.exported.records.splice(1,1);assert.throws(()=>adapt(f.manifest,f.exported),/Missing endpoint/);});
test('duplicate identities rejected',()=>{const f=fixture();f.exported.records.push(f.exported.records[0]);assert.throws(()=>adapt(f.manifest,f.exported),/Duplicate/);});
test('document corruption rejected',()=>{const f=fixture();f.exported.records.at(-1).source_record.content+=' ';assert.throws(()=>adapt(f.manifest,f.exported),/digest/);});
test('view missing refs are visible errors, not silently dropped',()=>{
  const f=fixture(),d=f.exported.records.at(-1);d.source_record.content=JSON.stringify({views:[{id:'broken',node_ids:['missing'],relation_ids:[]}]});d.source_record.content_sha256=sha(d.source_record.content);
  assert.match(adapt(f.manifest,f.exported).views[0].error,/missing node/);
});
test('symmetric relations retain direction',()=>{const f=fixture();f.exported.records[2].source_record.direction='symmetric';assert.equal(adapt(f.manifest,f.exported).relations[0].direction,'symmetric');});
test('relation-type views include matching one-hop links beyond anchor nodes',()=>{
  const f=fixture(),d=f.exported.records.at(-1);d.source_record.content=JSON.stringify({views:[{id:'context',node_ids:['a'],relation_types:['links']}]});d.source_record.content_sha256=sha(d.source_record.content);
  const s=adapt(f.manifest,f.exported);assert.equal(s.views[0].relationIds.length,1);assert.equal(s.views[0].error,null);
});
test('HTTP refuses writes, foreign origin, queries and unknown paths; refresh rereads',async()=>{
  let calls=0;const server=previewServer('/tmp/unused-ontology-preview',async()=>({head:String(++calls)}));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(url+'/api/ontology-v4',{method:'POST'})).status,405);
    assert.equal((await fetch(url+'/api/ontology-v4',{headers:{Origin:'http://foreign.invalid'}})).status,403);
    assert.equal((await fetch(url+'/api/ontology-v4?path=/etc/passwd')).status,400);
    assert.equal((await fetch(url+'/etc/passwd')).status,404);
    assert.equal(calls,0);
    assert.equal((await (await fetch(url+'/api/ontology-v4')).json()).head,'1');
    assert.equal((await (await fetch(url+'/api/ontology-v4')).json()).head,'2');
  } finally {await new Promise(r=>server.close(r));}
});
test('HTTP backend failures return error, never previous snapshot',async()=>{
  const server=previewServer('/tmp/unused-ontology-preview',async()=>{throw new Error('broken history');});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/ontology-v4`)).status,503);}finally{await new Promise(r=>server.close(r));}
});
