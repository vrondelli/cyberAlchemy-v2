// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createRankedReadAdapter} from './ranked-read-acquisition-tool-r2.mjs';
import {bindRankedReadDelivery} from './ranked-read-delivery-r1.mjs';
import {encodeToolPayload} from './tool-payload-codec.mjs';
import {stable,bodyForReceipt,attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
async function fixture({encode=false,empty=false}={}){
 const args={query:'conceptual query absent from source',mode:'ranked',revision:'base',path_prefix:'',offset:0,limit:5};
 const call={id:'real-search-1',type:'function',function:{name:'search',arguments:stable(args)}};
 const source='alpha\nbeta\n',source_sha256=hash(source),base_commit='a'.repeat(40),index_digest='b'.repeat(64),path='source.txt';
 const expected={base_commit,index_digest,partial_index:false,files:new Map([[path,source_sha256]])},sources=new Map([[path,source]]);
 const hints={schema:'are.ranked-source-hints/v1',index_digest,query_digest:hash({query:args.query}),partial_index:false,omitted_query_terms:0,matching_windows:empty?0:1,hints:empty?[]:[{path,base_commit,content_sha256:source_sha256,start_line:1,end_line:2,score_units:10}],omitted_hints:0,unreadable_matching_lines:0,unreadable_path_fallbacks:0};
 const native=async()=>({ok:true,output:{path,base_commit,source_sha256,source_revision:'base',total_lines:2,start_line:1,end_line:2,utf8:'alpha\nbeta',byte_count:10}});
 const run=createRankedReadAdapter({native,source_hints:{expected,query:async()=>hints},snapshot:async()=>source});
 const result=await run(call,args),evidence={call,result,hints,expected,sources};
 const payload=encode?encodeToolPayload({tool:'search',result}).payload:result;
 const wire={messages:[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(payload)}],tools:[]};
 const prompt=stable(wire),receipt={kind:'model',dispatched:true,status:200,input_tokens:500,output_tokens:20,model:'test',output_cap:100,reasoning_effort:'low'};
 receipt.request_sha256=hash(bodyForReceipt(prompt,receipt));
 return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt],ranked_evidence:new Map([[call.id,evidence]]),wire,call,result};
}
test('ranked source lacking query is credited only by exact successful receipt',async()=>{
 const f=await fixture(),r=bindRankedReadDelivery(f);assert.equal(r.read_observations.length,1);assert.deepEqual(r.receipt_confirmed_ranked_read_ids,[r.read_observations[0].id]);assert.equal(r.token_accounting.known_total_tokens,520);assert.equal(r.unmapped.length,0);
 const again=bindRankedReadDelivery({...f,receipts:[...f.receipts,...f.receipts]});assert.equal(again.read_observations.length,1);assert.equal(again.receipt_confirmed_ranked_read_ids.length,1);assert.equal(again.token_accounting.known_total_tokens,1040);
});
test('archive-only, tokenizer-only, failed and undispatched calls grant zero credit',async()=>{
 const f=await fixture();for(const receipts of [[],[{...f.receipts[0],kind:'tokenizer'}],[{...f.receipts[0],status:500}],[{...f.receipts[0],dispatched:false}]]){
 const r=bindRankedReadDelivery({...f,receipts});assert.equal(r.read_observations.length,0);assert.equal(r.receipt_confirmed_ranked_read_ids.length,0);
 }
 const failed=bindRankedReadDelivery({...f,receipts:[{...f.receipts[0],status:500}]});assert.equal(failed.token_accounting.known_total_tokens,520);
});
test('missing provenance or changed execution record fails closed',async()=>{
 const f=await fixture();assert.throws(()=>bindRankedReadDelivery({...f,ranked_evidence:new Map()}),/ranked-evidence-call/);
 const e=f.ranked_evidence.get(f.call.id);e.call={...e.call,id:'other'};assert.throws(()=>bindRankedReadDelivery(f),/ranked-evidence-call/);
 const g=await fixture();g.ranked_evidence.get(g.call.id).result={ok:true,output:{}};assert.throws(()=>bindRankedReadDelivery(g),/ranked-evidence-result/);
});
test('wire modifications cannot use original receipt',async()=>{
 const f=await fixture(),wire=structuredClone(f.wire);wire.messages[1].content=wire.messages[1].content.replace('alpha','omega');const prompt=stable(wire);
 assert.throws(()=>bindRankedReadDelivery({...f,captures:[{prompt,prompt_sha256:hash(prompt)}]}),/receipt.capture-not-found/);
});
test('independent source snapshot and manifest verification applies during delivery',async()=>{
 const f=await fixture();f.ranked_evidence.get(f.call.id).sources.set('source.txt','forged');assert.throws(()=>bindRankedReadDelivery(f),/snapshot-hash/);
 const g=await fixture();g.ranked_evidence.get(g.call.id).expected.files.set('source.txt','c'.repeat(64));assert.throws(()=>bindRankedReadDelivery(g),/expected-source-binding/);
});
test('compact payload roundtrip preserves receipt bytes and source identity',async()=>{
 const f=await fixture({encode:true}),before=stable(f.captures),r=bindRankedReadDelivery(f);assert.equal(r.read_observations.length,1);assert.equal(stable(f.captures),before);
});
test('empty ranked output still requires provenance and grants no read',async()=>{
 const f=await fixture({empty:true}),r=bindRankedReadDelivery(f);assert.equal(r.read_observations.length,0);assert.equal(r.receipt_confirmed_ranked_read_ids.length,0);assert.throws(()=>bindRankedReadDelivery({...f,ranked_evidence:new Map()}),/ranked-evidence-call/);
});
test('literal search still enforces literal inclusion',async()=>{
 const f=await fixture(),call={...f.call,function:{...f.call.function,arguments:stable({query:'absent',revision:'base',path_prefix:'',offset:0,limit:1})}};
 const result=attachObservationHandles(call,{ok:true,output:{observations:f.result.output.observations}});
 const prompt=stable({messages:[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(result)}],tools:[]});
 const receipt={...f.receipts[0],request_sha256:hash(bodyForReceipt(prompt,f.receipts[0]))};
 assert.throws(()=>bindRankedReadDelivery({captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]}),/search.arguments-output-mismatch/);
});
