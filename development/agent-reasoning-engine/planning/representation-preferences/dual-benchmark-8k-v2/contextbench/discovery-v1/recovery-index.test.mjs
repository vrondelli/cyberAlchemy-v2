import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRecoverySnapshot,buildRecoveryPage,resolveRecoveryRequest} from './recovery-index.mjs';
import {attachObservationHandles,bodyForReceipt,stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
// Fixture counter, NOT a provider tokenizer or token-saving observation.
const measure_tokens=async text=>Math.ceil(Buffer.byteLength(text)/4);
function fixture(count){
 const messages=[];
 for(let i=0;i<count;i++){
  const path='file'+i+'.txt',body='original body '+i,call={id:'call'+i,type:'function',function:{name:'read_file',arguments:stable({path,start_line:1,line_count:1})}};
  const output=attachObservationHandles(call,{ok:true,output:{path,start_line:1,end_line:1,utf8:body,source_sha256:hash(body)}});
  messages.push({role:'assistant',tool_calls:[call],content:''},{role:'tool',tool_call_id:call.id,content:stable(output)});
 }
 const prompt=stable({messages,tools:[]}),receipt={kind:'model',dispatched:true,status:200,model:'fixture',output_cap:2048,reasoning_effort:'low',input_tokens:1,output_tokens:1};
 receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
 return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]};
}
test('all37 observations uniquely reachable including17th; bounded pages progress, exact native identities preserved',async()=>{
 const archive=fixture(37),snapshot=createRecoverySnapshot(archive),before=stable(snapshot),seen=new Set();let cursor=null,pages=0;
 do{
  const page=await buildRecoveryPage({snapshot,cursor,measure_tokens});assert.equal(page.status,'ready');const value=JSON.parse(page.model.text);assert.ok(value.entries.length>0&&value.entries.length<=16);assert.ok(page.fit.bytes<=1024&&page.fit.measured_tokens<=256);
  for(const entry of value.entries){const r=resolveRecoveryRequest({snapshot,page,request:{handle:entry.handle}});assert.equal(seen.has(r.read_id),false);seen.add(r.read_id);assert.equal(r.source_posture,'historical-delivered-observation');assert.equal(r.current_source_verified,false);assert.match(r.utf8,/^original body /);}
  assert.notEqual(page.next_cursor,cursor??'first');cursor=page.next_cursor;pages++;assert.ok(pages<=37);
 }while(cursor);
 assert.equal(seen.size,37);assert.ok(pages>1);assert.equal(stable(snapshot),before);
});
test('stale, malformed, extra-field and altered version cursors rejected without parser widening',async()=>{
 const snapshot=createRecoverySnapshot(fixture(17)),page=await buildRecoveryPage({snapshot,measure_tokens});assert.ok(page.next_cursor);
 await assert.rejects(buildRecoveryPage({snapshot:createRecoverySnapshot(fixture(18)),cursor:page.next_cursor,measure_tokens}),/stale-cursor/);
 for(const cursor of ['?',Buffer.from('{}').toString('base64url')])await assert.rejects(buildRecoveryPage({snapshot,cursor,measure_tokens}),/cursor-/);
 for(const patch of [{extra:true},{v:'other'},{o:999}]){const value={...JSON.parse(Buffer.from(page.next_cursor,'base64url').toString()),...patch};await assert.rejects(buildRecoveryPage({snapshot,cursor:Buffer.from(stable(value)).toString('base64url'),measure_tokens}),/cursor-/);}
});
test('strict whole request schema rejects unseen/unlisted identifiers and mutated private page',async()=>{
 const snapshot=createRecoverySnapshot(fixture(17)),page=await buildRecoveryPage({snapshot,measure_tokens});
 for(const request of [{handle:'r999'},{handle:'r16'},{handle:'observed-read:'+ 'a'.repeat(64)},{handle:'r0',extra:1},{},{handle:0},[],null])assert.throws(()=>resolveRecoveryRequest({snapshot,page,request}),/request-schema|unlisted-handle/);
 const altered=structuredClone(page);altered.private.read_ids[0]='a'.repeat(64);assert.throws(()=>resolveRecoveryRequest({snapshot,page:altered,request:{handle:'r0'}}),/page-integrity/);
});
test('current source edits cannot affect original delivered body; snapshot input detached and tampering rejected',async()=>{
 const archive=fixture(1),snapshot=createRecoverySnapshot(archive),page=await buildRecoveryPage({snapshot,measure_tokens}),dir=mkdtempSync(join(tmpdir(),'recovery-page-'));
 try{writeFileSync(join(dir,'file0.txt'),'EDITED current source');archive.captures[0].prompt='changed caller input';const r=resolveRecoveryRequest({snapshot,page,request:{handle:'r0'}});assert.equal(r.utf8,'original body 0');assert.equal(r.source_sha256,hash('original body 0'));
 const bad=structuredClone(snapshot);bad.archive.receipts[0].input_tokens++;assert.throws(()=>resolveRecoveryRequest({snapshot:bad,page,request:{handle:'r0'}}),/snapshot-integrity/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('tiny budgets explicitly unfit with no repeat cursor; invalid measurement rejected; empty archive finite',async()=>{
 const snapshot=createRecoverySnapshot(fixture(17));for(const options of [{max_bytes:1},{max_tokens:1}]){const p=await buildRecoveryPage({snapshot,measure_tokens,...options});assert.equal(p.status,'unfit');assert.equal(p.model,null);assert.equal(p.next_cursor,null);assert.equal(p.progress,false);}
 await assert.rejects(buildRecoveryPage({snapshot,measure_tokens:async()=>NaN}),/invalid-token-measurement/);
 const empty=await buildRecoveryPage({snapshot:createRecoverySnapshot({captures:[],receipts:[]}),measure_tokens});assert.equal(empty.status,'empty');assert.equal(empty.next_cursor,null);
});
test('tokenizer-only and failed request observations do not enter the archive',()=>{
 const archive=fixture(1);assert.equal(createRecoverySnapshot({...archive,receipts:[]}).observation_count,0);archive.receipts[0].status=500;assert.equal(createRecoverySnapshot(archive).observation_count,0);
});
test('identical source identities collapse to latest confirmed original ID; changed revision/range/body/path survive',async()=>{
 const sourceHash=hash('whole-file-v1');
 const exchange=(id,change={})=>{
  const o={path:'same.txt',start_line:1,end_line:1,utf8:'body',source_sha256:sourceHash,...change};
  const call={id,type:'function',function:{name:'read_file',arguments:stable({path:o.path,start_line:o.start_line,line_count:1})}},out=attachObservationHandles(call,{ok:true,output:o});
  return {id:out.output.read_id,messages:[{role:'assistant',content:'',tool_calls:[call]},{role:'tool',tool_call_id:id,content:stable(out)}]};
 };
 const old=exchange('old'),latest=exchange('latest'),others=[exchange('revision',{source_sha256:hash('whole-file-v2')}),exchange('range',{start_line:2,end_line:2}),exchange('body',{utf8:'different'}),exchange('path',{path:'other.txt'})];
 const archive={captures:[],receipts:[]};
 for(const messages of [[old,...others].flatMap(x=>x.messages),latest.messages]){
  const prompt=stable({messages,tools:[]}),receipt={kind:'model',dispatched:true,status:200,model:'fixture',output_cap:2048,reasoning_effort:'low',input_tokens:1,output_tokens:1};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));archive.captures.push({prompt,prompt_sha256:hash(prompt)});archive.receipts.push(receipt);
 }
 const snapshot=createRecoverySnapshot(archive);assert.equal(snapshot.delivered_observation_count,6);assert.equal(snapshot.observation_count,5);assert.equal(snapshot.duplicate_observation_count,1);assert.deepEqual(snapshot.archive,archive);
 let cursor=null;const ids=[];do{const page=await buildRecoveryPage({snapshot,cursor,measure_tokens});for(const e of JSON.parse(page.model.text).entries)ids.push(resolveRecoveryRequest({snapshot,page,request:{handle:e.handle}}).read_id);cursor=page.next_cursor;}while(cursor);
 assert.equal(ids[0],latest.id);assert.ok(!ids.includes(old.id));assert.deepEqual(new Set(ids),new Set([latest,...others].map(x=>x.id)));
});
