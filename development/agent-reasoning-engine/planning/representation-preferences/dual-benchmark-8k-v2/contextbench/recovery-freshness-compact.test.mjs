import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createFreshRecoverySession as createRecoverySession,recoveryTools} from './recovery-freshness-compact.mjs';
import {attachObservationHandles,bodyForReceipt,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
// Deterministic fixture measure, not provider-token truth.
const measure_tokens=async text=>Math.ceil(Buffer.byteLength(text)/4);
function request(messages){
 const prompt=stable({messages,tools:recoveryTools}),receipt={kind:'model',dispatched:true,status:200,model:'fixture',output_cap:2048,reasoning_effort:'low',input_tokens:10,output_tokens:2};
 receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));return {prompt,receipt};
}
function fixture(count){
 const messages=[];
 for(let i=0;i<count;i++){
  const path='file'+i+'.txt',body='original '+i,call={id:'read'+i,type:'function',function:{name:'read_file',arguments:stable({path,start_line:1,line_count:1})}},out=attachObservationHandles(call,{ok:true,output:{path,start_line:1,end_line:1,utf8:body,source_sha256:hash(body)}});
  messages.push({role:'assistant',content:'',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(out)});
 }
 const {prompt,receipt}=request(messages);return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]};
}
const ack=(session,page)=>session.acknowledge(request([{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]));
test('undelivered, tokenizer-only, failed and unknown-usage receipts never authorize recovery',async()=>{
 const session=createRecoverySession({measure_tokens}),page=await session.prepare(fixture(1));
 await assert.rejects(session.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);
 for(const patch of [{kind:'tokenizer'},{dispatched:false},{status:503},{failure_code:'timeout'},{input_tokens:null}]){
  const input=request([{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]);input.receipt={...input.receipt,...patch};assert.throws(()=>session.acknowledge(input),/unconfirmed/);await assert.rejects(session.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);
 }
 ack(session,page);assert.equal((await session.execute('recover_archived_read',{handle:'r0'})).utf8,'original 0');
});
test('exact request hash and own user message required; embedded tool/assistant text is not acknowledgement',async()=>{
 const session=createRecoverySession({measure_tokens}),page=await session.prepare(fixture(1));
 for(const role of ['assistant','tool'])assert.throws(()=>session.acknowledge(request([{role,content:page.model.text}])) ,/page-not-own/);
 const mismatch=request([{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]);mismatch.receipt.request_sha256='a'.repeat(64);assert.throws(()=>session.acknowledge(mismatch),/request-receipt/);
 assert.throws(()=>session.acknowledge(request([{role:'user',content:'prefix '+page.model.text}])) ,/page-not-own/);
 ack(session,page);await session.prepare(fixture(1));await assert.rejects(session.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);
});
test('17th and all37 entries reached through acknowledged pages in immutable snapshot',async()=>{
 const session=createRecoverySession({measure_tokens}),archive=fixture(37),seen=new Set();let page=await session.prepare(archive),pages=0;
 while(true){
  ack(session,page);const model=JSON.parse(page.model.text);for(const entry of model.entries){const read=await session.execute('recover_archived_read',{handle:entry.handle});assert.ok(!seen.has(read.read_id));seen.add(read.read_id);}
  pages++;assert.ok(pages<=37);if(page.next_cursor===null)break;
  await session.execute('list_recovery_page',{cursor:page.next_cursor});page=await session.prepare(fixture(38));
  assert.equal(JSON.parse(page.model.text).total,37,'new archive must not change active snapshot during paging');
 }
 assert.equal(seen.size,37);assert.ok(pages>1);
});
test('refresh only at acknowledged end; staged next and old-page recovery deterministic within a tool batch',async()=>{
 const session=createRecoverySession({measure_tokens}),archive=fixture(17);let page=await session.prepare(archive);ack(session,page);const first=JSON.parse(page.model.text).entries[0].handle,oldCursor=page.next_cursor;
 await assert.rejects(session.execute('list_recovery_page',{cursor:null}),/refresh-before-end/);
 const oldRead=await session.execute('recover_archived_read',{handle:first});await session.execute('list_recovery_page',{cursor:oldCursor});
 assert.deepEqual(await session.execute('recover_archived_read',{handle:first}),oldRead);
 await assert.rejects(session.execute('list_recovery_page',{cursor:oldCursor}),/already-staged/);
 page=await session.prepare(archive);await assert.rejects(session.execute('recover_archived_read',{handle:first}),/not-acknowledged/);ack(session,page);
 await assert.rejects(session.execute('list_recovery_page',{cursor:oldCursor}),/cursor-not-current-next/);
 while(page.next_cursor){await session.execute('list_recovery_page',{cursor:page.next_cursor});page=await session.prepare(archive);ack(session,page);}
 await session.execute('list_recovery_page',{cursor:null});const oldFingerprint=page.private.snapshot;page=await session.prepare(fixture(18));assert.notEqual(page.private.snapshot,oldFingerprint);assert.equal(JSON.parse(page.model.text).total,18);
 const failed=request([{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]);failed.receipt.status=503;assert.throws(()=>session.acknowledge(failed),/unconfirmed/);assert.equal(ack(session,page).previous_snapshot,oldFingerprint);
 await assert.rejects(session.execute('list_recovery_page',{cursor:oldCursor}),/cursor-not-current-next/);
});
test('strict whole arguments, unknown tools, empty snapshot refresh, detached prepare result',async()=>{
 const session=createRecoverySession({measure_tokens}),empty={captures:[],receipts:[]};const page=await session.prepare(empty);assert.equal(page.status,'empty');ack(session,page);
 for(const args of [{},{cursor:null,extra:true},[],null,{cursor:3}])await assert.rejects(session.execute('list_recovery_page',args),/list-argument-schema/);
 await assert.rejects(session.execute('unknown',{}),/unknown-tool/);await session.execute('list_recovery_page',{cursor:null});const next=await session.prepare(fixture(1));const saved=structuredClone(next);next.model.text='caller mutation';ack(session,saved);assert.equal((await session.execute('recover_archived_read',{handle:'r0'})).utf8,'original 0');
});
test('acknowledgement requires exact recovery names and parameter schemas, allowing compact descriptions',async()=>{
 const session=createRecoverySession({measure_tokens}),page=await session.prepare(fixture(1));
 for(const change of ['missing','duplicate','parameters','description']){
  const input=request([{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]),wire=JSON.parse(input.prompt);
  if(change==='missing')wire.tools.pop();if(change==='duplicate')wire.tools.push(structuredClone(wire.tools[0]));
  if(change==='parameters')wire.tools[0].function.parameters.additionalProperties=true;
  if(change==='description')wire.tools[0].function.description='short';
  input.prompt=stable(wire);input.receipt.request_sha256=hash(stable(bodyForReceipt(input.prompt,input.receipt)));
  if(change==='description')assert.equal(session.acknowledge(input).acknowledged,true);
  else assert.throws(()=>session.acknowledge(input),/recovery-tool-schema-mismatch/);
 }
});

test('empty snapshot becomes populated without model refresh; latest changes do not invalidate active handles',async()=>{
 const session=createRecoverySession({measure_tokens});let page=await session.prepare({captures:[],receipts:[]});ack(session,page);
 page=await session.prepare(fixture(17));assert.equal(JSON.parse(page.model.text).total,17);ack(session,page);
 const first=JSON.parse(page.model.text).entries[0].handle,old=await session.execute('recover_archived_read',{handle:first}),snapshot=page.private.snapshot;
 page=await session.prepare(fixture(18));assert.equal(page.private.snapshot,snapshot);assert.equal(page.freshness.new_observations,1);ack(session,page);
 assert.deepEqual(await session.execute('recover_archived_read',{handle:first}),old);
});
test('freshness message is receipt-bound and retained archives cannot silently shrink',async()=>{
 const session=createRecoverySession({measure_tokens});let page=await session.prepare(fixture(17));
 assert.throws(()=>session.acknowledge(request([{role:'user',content:page.model.text}])),/freshness-not-own/);ack(session,page);
 await assert.rejects(session.prepare(fixture(1)),/archive-shrank/);await assert.rejects(session.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);
 page=await session.prepare(fixture(17));ack(session,page);assert.equal(page.freshness.new_observations,0);
});
test('new evidence outside the pinned snapshot cannot disappear on a later prepare',async()=>{
 const session=createRecoverySession({measure_tokens});let page=await session.prepare(fixture(1));ack(session,page);
 const pinned=page.private.snapshot;page=await session.prepare(fixture(2));assert.equal(page.private.snapshot,pinned);assert.equal(page.freshness.new_observations,1);ack(session,page);
 await assert.rejects(session.prepare(fixture(1)),/archive-shrank/);
 await assert.rejects(session.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);
 page=await session.prepare(fixture(2));assert.equal(page.freshness.available_observations,2);ack(session,page);
});
