import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {analyze} from './request-repetition.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const prompt=stable({messages:[{role:'user',content:'same context'}],tools:[]});
 const r={kind:'model',dispatched:true,status:200,input_tokens:10,output_tokens:2,model:'test',output_cap:20,reasoning_effort:'low'};
 r.request_sha256=hash(stable(bodyForReceipt(prompt,r)));
 return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[r,{...r}]};
}
test('distinct dispatched calls count; duplicate captures and unsubmitted prompts do not',()=>{
 const f=fixture();f.captures.push({...f.captures[0]});const prompt=stable({messages:[{role:'user',content:'not dispatched'}],tools:[]});f.captures.push({prompt,prompt_sha256:hash(prompt)});
 const a=analyze(f);assert.equal(a.calls,2);assert.equal(a.total_tokens,24);assert.equal(a.previously_presented_message_bytes,a.message_bytes/2);assert.equal(a.previously_presented_tools_bytes,a.tools_bytes/2);
});
test('tampering and unmatched requests fail closed',()=>{
 const f=fixture();f.captures[0].prompt+=' ';assert.throws(()=>analyze(f),/digest/);
 const g=fixture();g.receipts[0].request_sha256='0'.repeat(64);assert.throws(()=>analyze(g),/receipt-bound/);
});
test('unknown usage and failed dispatch cannot disappear from accounting',()=>{
 const f=fixture();delete f.receipts[0].output_tokens;assert.throws(()=>analyze(f),/unknown usage/);
 const g=fixture();g.receipts[0].status=500;assert.throws(()=>analyze(g),/separate accounting/);
 const h=fixture();h.receipts.push({kind:'model',dispatched:false});assert.equal(analyze(h).calls,2);
});
