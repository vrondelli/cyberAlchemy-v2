import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createBoundedExchangeArchive} from './bounded-archive-frontier-views-r1.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(){const utf8=Array.from({length:20},(_,i)=>`${i} ${'x'.repeat(100)}`).join('\n');return {messages:[{role:'system',content:'Investigate.'}],tools:[],assistant:{role:'assistant',content:'Inspect source',reasoning_content:'Original reasoning must survive rejection.',tool_calls:[{id:'read-1',type:'function',function:{name:'read_file',arguments:JSON.stringify({path:'a.txt',revision:'base',start_line:1,line_count:20})}}]},results:[{ok:true,output:{path:'a.txt',start_line:1,end_line:20,total_lines:20,source_revision:'base',source_sha256:hash(utf8),utf8,byte_count:Buffer.byteLength(utf8)}}]};}
test('raw assistant reasoning/results precede measurement; reduction and replay retain stable bytes',async()=>{
 const events=[],f=fixture();
 const archive=createBoundedExchangeArchive({limit:2000,persist:async e=>events.push(e),measure:async p=>{assert.equal(events[0].kind,'frontier-raw-exchange');return p.length;}});
 const first=await archive.admit(f);assert.equal(first.status,'admitted');assert.ok(first.outputs[0].deferred.omitted_units>0);assert.deepEqual(archive.rawExchange(first.archive_sha256),{assistant:f.assistant,results:f.results});
 const again=await archive.admit(f);assert.equal(again.replayed,true);assert.deepEqual(again.view,first.view);assert.equal(events.filter(e=>e.kind==='frontier-raw-exchange').length,1);
 first.view.messages[0].content='mutated caller copy';assert.notEqual(archive.stableView(first.archive_sha256).messages[0].content,'mutated caller copy');
 const bigger=await archive.admit({...f,messages:[{role:'system',content:'X'.repeat(3000)}]});assert.equal(bigger.status,'denied');assert.deepEqual(bigger.view,again.view);
});
test('mandatory overflow preserves reconstructable prompt and full raw bytes',async()=>{
 const events=[],f=fixture(),archive=createBoundedExchangeArchive({limit:1,persist:async e=>events.push(e),measure:async p=>p.length});const r=await archive.admit(f);assert.equal(r.status,'denied');assert.equal(archive.stableView(r.archive_sha256),null);assert.deepEqual(archive.rawExchange(r.archive_sha256).assistant,f.assistant);
 for(const e of events.filter(e=>e.kind==='frontier-projection-attempt')){assert.equal(hash(e.prompt),e.prompt_sha256);assert.equal(JSON.parse(e.prompt).messages.find(m=>m.role==='assistant').reasoning_content,f.assistant.reasoning_content);}
});
test('failed tool meanings survive; changed result under same call identity is rejected',async()=>{
 const f=fixture();f.results=[{ok:false,error:'permission-denied'}];const archive=createBoundedExchangeArchive({persist:async()=>{},measure:async()=>100});const r=await archive.admit(f);assert.deepEqual(r.outputs[0],f.results[0]);
 await assert.rejects(archive.admit({...f,results:[{ok:false,error:'different'}]}),/call-identity-reused/);
});
test('journal failures prevent measurement; probe exhaustion stops before another tokenizer call',async()=>{
 let measured=0;const f=fixture(),bad=createBoundedExchangeArchive({persist:async()=>{throw Error('disk-full');},measure:async()=>{measured++;return 100;}});await assert.rejects(bad.admit(f),/disk-full/);assert.equal(measured,0);
 const events=[],limited=createBoundedExchangeArchive({maximum_probes:2,persist:async e=>events.push(e),measure:async()=>{measured++;return 9000;}});await assert.rejects(limited.admit(f),/probe-budget-exhausted/);assert.equal(measured,2);assert.equal(events.filter(e=>e.kind==='frontier-raw-exchange').length,1);
});

test('omitted output resolves to exact immutable archive bytes and rejects wrong identities',async()=>{
 const events=[],f=fixture(),archive=createBoundedExchangeArchive({limit:2000,persist:async e=>events.push(e),measure:async p=>p.length});const r=await archive.admit(f),link=events.find(e=>e.kind==='frontier-output-archive-link');
 assert.equal(r.outputs[0].deferred.archive_sha256,link.output_sha256);
 const recovered=archive.archivedOutput(link);assert.deepEqual(recovered.result,f.results[0]);f.results[0].output.utf8='external mutation';assert.notEqual(archive.archivedOutput(link).result.output.utf8,'external mutation');
 assert.throws(()=>archive.archivedOutput({...link,output_sha256:'0'.repeat(64)}),/archived-output-digest/);
 assert.throws(()=>archive.archivedOutput({...link,tool_call_id:'different'}),/archived-call-not-found/);
});
