import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createFreshDemandRecovery as createDemandRecovery} from './demand-recovery-fresh.mjs';
import {stable,bodyForReceipt,attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
// Synthetic sizing only, never evidence of provider tokens.
const measure_tokens=async s=>Math.ceil(Buffer.byteLength(s)/4);
function request(messages,tools=[]){
 const prompt=stable({messages,tools}),receipt={kind:'model',dispatched:true,status:200,model:'fixture',output_cap:2048,reasoning_effort:'low',input_tokens:10,output_tokens:2};
 receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));return {prompt,receipt};
}
function archive(count){
 const messages=[];
 for(let i=0;i<count;i++){
  const path='file'+i+'.txt',body='original '+i,call={id:'read'+i,type:'function',function:{name:'read_file',arguments:stable({path,start_line:1,line_count:1})}};
  const output=attachObservationHandles(call,{ok:true,output:{path,start_line:1,end_line:1,utf8:body,source_sha256:hash(body)}});
  messages.push({role:'assistant',content:'',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(output)});
 }
 const {prompt,receipt}=request(messages);return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]};
}
const ack=(s,p)=>s.acknowledge(request(p.messages,p.tools));
async function open(s,a){const p=await s.prepare(a);ack(s,p);await s.execute('open_recovery',{});return s.prepare(a);}
test('entry is cheap to prepare, detached, and cannot recover before acknowledged opening',async()=>{
 let calls=0;const s=createDemandRecovery({measure_tokens:async x=>{calls++;return measure_tokens(x);}}),a=archive(1);
 const p=await s.prepare(a);assert.equal(calls,0);assert.equal(p.mode,'entry');assert.equal(p.tools.length,1);
 await assert.rejects(s.execute('open_recovery',{}),/not-acknowledged/);
 const saved=structuredClone(p);p.tools[0].function.parameters.additionalProperties=true;p.page.model.text='mutated';ack(s,saved);
 await assert.rejects(s.execute('recover_archived_read',{handle:'r0'}),/not-exposed/);
 for(const args of [null,[],{extra:1}])await assert.rejects(s.execute('open_recovery',args),/arguments/);
 await s.execute('open_recovery',{});await assert.rejects(s.execute('open_recovery',{}),/already-staged/);
 const expanded=await s.prepare(a);assert.equal(expanded.mode,'expanded');assert.ok(calls>0);
 await assert.rejects(s.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);ack(s,expanded);
 assert.equal((await s.execute('recover_archived_read',{handle:'r0'})).utf8,'original 0');
});
test('failed receipts, changed schemas and embedded messages revoke acknowledgement',async()=>{
 const s=createDemandRecovery({measure_tokens}),p=await s.prepare(archive(1));
 for(const patch of [{kind:'tokenizer'},{dispatched:false},{status:500},{input_tokens:null}]){
  ack(s,p);const r=request(p.messages,p.tools);Object.assign(r.receipt,patch);
  assert.throws(()=>s.acknowledge(r),/unconfirmed/);await assert.rejects(s.execute('open_recovery',{}),/not-acknowledged/);
 }
 assert.throws(()=>s.acknowledge(request([{role:'assistant',content:p.page.model.text}],p.tools)),/own-message/);
 const bad=structuredClone(p.tools);bad[0].function.parameters.additionalProperties=true;
 assert.throws(()=>s.acknowledge(request([{role:'user',content:p.page.model.text}],bad)),/schema/);
});
test('all 37 archived reads remain recoverable through pages after context eviction',async()=>{
 const s=createDemandRecovery({measure_tokens}),a=archive(37),seen=new Set();let p=await open(s,a),first;
 while(true){
  ack(s,p);const entries=JSON.parse(p.page.model.text).entries;first??=entries[0].handle;
  for(const e of entries){const r=await s.execute('recover_archived_read',{handle:e.handle});seen.add(r.read_id);assert.match(r.utf8,/original/);}
  if(!p.page.next_cursor)break;
  await s.execute('list_recovery_page',{cursor:p.page.next_cursor});
  // The projected live context can be empty; retained archive is separate.
  p=await s.prepare(a);
 }
 assert.equal(seen.size,37);await assert.rejects(s.execute('recover_archived_read',{handle:first}));
 await s.execute('list_recovery_page',{cursor:null});p=await s.prepare(archive(38));ack(s,p);
 assert.equal(JSON.parse(p.page.model.text).total,38);assert.equal(p.mode,'expanded');
});
test('archive corruption fails before expanded acknowledgement, and can be repaired without losing staged open',async()=>{
 const s=createDemandRecovery({measure_tokens}),a=archive(1),p=await s.prepare(a);ack(s,p);await s.execute('open_recovery',{});
 const bad=structuredClone(a);bad.captures[0].prompt+=' ';
 await assert.rejects(s.prepare(bad),/digest/);await assert.rejects(s.execute('recover_archived_read',{handle:'r0'}),/not-acknowledged/);
 const q=await s.prepare(a);assert.equal(q.mode,'expanded');ack(s,q);assert.equal((await s.execute('recover_archived_read',{handle:'r0'})).utf8,'original 0');
});
