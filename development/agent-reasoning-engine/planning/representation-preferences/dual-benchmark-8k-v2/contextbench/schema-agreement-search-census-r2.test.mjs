// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {censusSearchCalls} from './schema-agreement-search-census-r2.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const args={query:'evidence',revision:'base',path_prefix:'',offset:0,limit:5};
function fixture(values){
 const calls=values.map((v,i)=>({id:'call-'+i,function:{name:'search',arguments:typeof v==='string'?v:JSON.stringify(v)}}));
 const receipt={kind:'model',dispatched:true,input_tokens:90,output_tokens:10,request_sha256:'request',status:200};
 const body={receipt_index:0,receipt_sha256:hash(receipt),request_sha256:'request',public_response:{message:{tool_calls:calls}}};
 return {receipts:[receipt],events:[{kind:'response-capture',response_capture:{...body,capture_sha256:hash(body)}},...calls.map(call=>({kind:'source-tool-result',call,output:{ok:false,issues:[]}}))]};
}
test('all malformed, invalid and default modes are retained with separate classifications',()=>{
 const input=fixture([{...args,mode:'ranked'},{...args,mode:'literal'},args,'{',null,[],{query:'x'},{...args,mode:'bad'}]);
 input.events[2].output={ok:true,output:{}};input.events[3].output={ok:true,output:{}};
 const r=censusSearchCalls(input);assert.equal(r.requested_search_calls,8);assert.equal(r.rejected_search_calls,6);assert.equal(r.ranked_rejection_rate,1);assert.equal(r.all_search_invalid_rate,.75);assert.equal(r.known_model_tokens,100);
 assert.deepEqual(r.classifications,{ranked:1,literal:1,'literal-default':1,'malformed-json':1,'invalid-shape':2,'missing-mode-invalid':1,'invalid-mode':1});
 assert.equal(r.counters_reconstructed,true);
});
test('malformed abort, missing response and unknown usage never produce eligible rates',()=>{
 const a=fixture(['{']);a.events.pop();const r=censusSearchCalls(a);assert.equal(r.classifications['malformed-json'],1);assert.equal(r.unresolved_search_calls,1);assert.equal(r.counters_reconstructed,false);assert.equal(r.all_search_invalid_rate,null);
 const b=fixture([]);b.events=[];assert.equal(censusSearchCalls(b).missing_model_responses,1);assert.equal(censusSearchCalls(b).known_model_tokens,100);
 const c=fixture([]);delete c.receipts[0].input_tokens;c.events=[];const q=censusSearchCalls(c);assert.equal(q.unknown_usage_receipts,1);assert.equal(q.mechanism_evaluable,false);
});
test('zero ranked use is inconclusive while literal denominator remains measurable',()=>{
 const r=censusSearchCalls(fixture([args]));assert.equal(r.ranked_rejection_rate,null);assert.equal(r.all_search_invalid_rate,1);assert.equal(r.mechanism_evaluable,false);
 const empty=censusSearchCalls(fixture([]));assert.equal(empty.all_search_invalid_rate,null);assert.equal(empty.ranked_rejection_rate,null);
});
test('duplicate and tampered captures, substituted calls and orphan outputs fail closed',()=>{
 for(const mutate of [x=>x.events.push(structuredClone(x.events[0])),x=>x.events[0].response_capture.receipt_index=9,x=>x.events[0].response_capture.public_response.message.tool_calls[0].function.arguments='{}',x=>x.events.push(structuredClone(x.events[1])),x=>x.events[1].call={...x.events[1].call,id:'other'},x=>x.receipts[0].output_tokens=1]){
  const x=structuredClone(fixture([{...args,mode:'ranked'}]));mutate(x);assert.throws(()=>censusSearchCalls(x));
 }
});
test('syntactically valid ranked structural rejection remains in ranked denominator',()=>{
 const r=censusSearchCalls(fixture([{...args,mode:'ranked',limit:10},{...args,mode:'ranked',path_prefix:'src'}]));assert.equal(r.ranked_requested_calls,2);assert.equal(r.ranked_rejected_calls,2);assert.ok(r.rows.every(x=>x.structural_valid===false));assert.equal(r.structural_disagreements,0);
});

test('incomplete receipts preserve every known input or output token',()=>{
 for(const [input_tokens,output_tokens,expected] of [[123,null,123],[null,47,47],[123,undefined,123],[undefined,47,47]]){
  const r=censusSearchCalls({events:[],receipts:[{kind:'model',dispatched:true,input_tokens,output_tokens}]});assert.equal(r.known_model_tokens,expected);assert.equal(r.unknown_usage_receipts,1);assert.equal(r.counters_reconstructed,false);assert.equal(r.all_search_invalid_rate,null);
 }
});
