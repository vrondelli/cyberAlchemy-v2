import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createBoundedExchangeArchive} from './bounded-archive-frontier-views-r1.mjs';
import {recoverArchivedRead,attachObservationHandles} from './bounded-archive-frontier-recovery-r1.mjs';
import {bindCompactDelivery} from './bounded-archive-frontier-delivery-r1.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
async function fixture(search=false){
 const o={base_commit:'a'.repeat(40),byte_count:18,path:'a.txt',source_revision:'current',start_line:1,end_line:3,total_lines:3,utf8:'first\nsecond\nthird',source_sha256:hash('first\nsecond\nthird\n')};
 const call={id:'source',type:'function',function:{name:search?'search':'read_file',arguments:stable(search?{query:'second',path_prefix:'',revision:'current',offset:0,limit:1}:{path:'a.txt',revision:'current',start_line:1,line_count:3})}};
 const result={ok:true,output:search?{observations:[o]}:o};
 const archive=createBoundedExchangeArchive({persist:async()=>{},measure:async()=>1000});await archive.admit({messages:[],tools:[],assistant:{role:'assistant',tool_calls:[call]},results:[result]});
 const args={archive_sha256:hash(stable(result)),observation_index:0,path:'a.txt',revision:'current',start_line:2,line_count:1};return {archive,args,o};
}
test('read and search archives recover exact bounded original ranges independently of caller mutation',async()=>{
 for(const search of [false,true]){const f=await fixture(search);f.o.utf8='changed';const r=recoverArchivedRead(f);assert.equal(r.ok,true);assert.equal(r.output.utf8,'second');assert.equal(r.output.start_line,2);assert.equal(r.output.end_line,2);}
});
test('unknown archives, wrong metadata, unknown fields and out-of-range requests fail without fresh reads',async()=>{
 const f=await fixture();for(const patch of [{archive_sha256:'0'.repeat(64)},{path:'other'},{revision:'base'},{start_line:4},{line_count:101},{observation_index:1},{extra:true}])assert.equal(recoverArchivedRead({...f,args:{...f.args,...patch}}).ok,false);
});
test('recovered bytes require a successful exact receipt and matching recovery origin',async()=>{
 const f=await fixture(),call={id:'recovered',type:'function',function:{name:'recover_archived_read',arguments:stable(f.args)}},result=attachObservationHandles(call,recoverArchivedRead(f));
 function wire(output){const prompt=stable({messages:[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(output)}],tools:[]}),profile={model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low'};return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[{...profile,kind:'model',dispatched:true,status:200,input_tokens:20,output_tokens:5,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))}]};}
 const w=wire(result),bound=bindCompactDelivery(w);assert.equal(bound.read_observations[0].body,'second');assert.equal(bound.read_observations[0].id,result.output.read_id);
 w.receipts[0].status=500;assert.equal(bindCompactDelivery(w).read_observations.length,0);
 const forged=wire({...result,archive_origin:{...result.archive_origin,archive_sha256:'0'.repeat(64)}});assert.equal(bindCompactDelivery(forged).read_observations.length,0);assert.equal(bindCompactDelivery(forged).unmapped[0].reason,'recovery.origin-binding');
});
