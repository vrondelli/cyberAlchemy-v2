import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {attachObservationHandles,bindDelivery,bodyForReceipt,stable} from './delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const call={id:'search-1',type:'function',function:{name:'search',arguments:stable({query:'hello',path_prefix:'',offset:0,limit:2,revision:'base'})}};
 const output=attachObservationHandles(call,{ok:true,output:{observations:[1,4].map(start_line=>({path:'a.py',start_line,end_line:start_line,utf8:'hello',source_sha256:hash('file')})),next_offset:null}});
 const prompt=stable({messages:[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(output)}],tools:[]});
 const r={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,input_tokens:100,output_tokens:10};r.request_sha256=hash(stable(bodyForReceipt(prompt,r)));
 return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[r],output};
}
test('search observations receive distinct stable IDs that match confirmed delivery',()=>{
 const x=fixture(),r=bindDelivery(x);assert.equal(r.unmapped.length,0);
 assert.deepEqual(r.read_observations.map(o=>o.id),x.output.output.observations.map(o=>o.read_id));
 assert.equal(new Set(r.read_observations.map(o=>o.id)).size,2);
});
test('search without a successful receiving model request is not delivered',()=>{
 const x=fixture();x.receipts[0].status=500;assert.equal(bindDelivery(x).read_observations.length,0);
});
