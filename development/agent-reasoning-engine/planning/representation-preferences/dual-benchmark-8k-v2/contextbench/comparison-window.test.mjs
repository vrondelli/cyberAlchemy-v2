import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileComparisonWindows} from './comparison-window.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {reasoningEvidence} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
function fixture({reasoning=false,cached=false,count=100}={}){
 const profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap:1024},messages=[{role:'user',content:'Repair'}],receipts=[],events=[];
 function append(messages,retained=0,occurrences=0){
  const prompt=stable({messages,tools:[]}),t={kind:'tokenizer',model:profile.model,dispatched:true,status:200,automatic_retries:0,request_sha256:hash({model:profile.model,messages,tools:[]}),input_tokens:count,retained_reasoning_reservation:retained,retained_reasoning_occurrences:occurrences};
  const r={...profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,reserved_input_tokens:count+512+retained,request_sha256:hash(bodyForReceipt(prompt,profile))};
  receipts.push(t,r);events.push({kind:'request-capture',capture:{prompt,prompt_sha256:hash(prompt)}});return r;
 }
 const first=append(messages);
 if(reasoning){const m={role:'assistant',content:'Inspect',reasoning_content:'Preserved reasoning'};first.retained_reasoning=reasoningEvidence(m,first);append([...messages,m],20,1);}
 if(cached)receipts.push(structuredClone(receipts.at(-1)));
 return {receipts,events,token_margin:512,output_cap:1024};
}
test('binds cached measurement and retains one check per physical model call',()=>{
 const r=reconcileComparisonWindows(fixture({cached:true}));assert.equal(r.requests.length,2);assert.equal(r.requests[1].tokenizer_receipt_index,0);assert.equal(r.requests[0].projected_tokens,1636);assert.equal(r.benchmark_cleared,false);
});
test('reconstructs retained reasoning from prior model evidence',()=>{
 const f=fixture({reasoning:true}),r=reconcileComparisonWindows(f);assert.equal(r.requests[1].retained_reasoning_tokens,20);assert.equal(r.requests[1].projected_tokens,1656);
 f.receipts[2].retained_reasoning_reservation=0;assert.throws(()=>reconcileComparisonWindows(f),/retained-reasoning/);
});
test('exact 8K boundary passes and one extra measured token rejects',()=>{
 assert.equal(reconcileComparisonWindows(fixture({count:6464})).requests[0].projected_tokens,8000);
 assert.throws(()=>reconcileComparisonWindows(fixture({count:6465})),/window-or-usage/);
});
test('missing, reordered, duplicated or altered measurement and usage reject',()=>{
 for(const mutate of [f=>f.receipts.shift(),f=>f.receipts.reverse(),f=>f.receipts.unshift(structuredClone(f.receipts[0])),f=>f.receipts[0].request_sha256='a'.repeat(64),f=>f.receipts[1].reserved_input_tokens--,f=>f.receipts[1].input_tokens=9000,f=>f.receipts[1].output_tokens=1025,f=>f.events[0].capture.prompt+=' ']){
  const f=fixture();mutate(f);assert.throws(()=>reconcileComparisonWindows(f));
 }
});
